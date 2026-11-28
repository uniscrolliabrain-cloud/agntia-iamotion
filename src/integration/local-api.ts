import { Hono } from 'hono';
import { z } from 'zod';
import { integrationStatus, requireAuthority, type HostAuthority, type HostContext } from './host.js';
import { readVisualAsset, type VisualManifestReader } from '../sdk/visual-library.js';

const Id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,95}$/u);
const Identity = z.strictObject({ tenantId: Id, actorId: Id, correlationId: Id });
const Event = z.strictObject({ schemaVersion: z.literal(1), streamId: Id,
  idempotencyKey: Id, expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  state: z.enum(['ready', 'running', 'paused']), synthetic: z.literal(true),
});
type Event = z.infer<typeof Event>;

async function parseBody(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json' ||
      !request.body) return { ok: false } as const;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let data = '';
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return { ok: false } as const;
      }
      data += decoder.decode(next.value, { stream: true });
    }
    return { ok: true, body: JSON.parse(data + decoder.decode()) as unknown } as const;
  } catch {
    return { ok: false } as const;
  } finally {
    reader.releaseLock();
  }
}

export interface LocalVisualAPI {
  identify(request: Request): Promise<unknown>;
  authority?: HostAuthority;
  reader: VisualManifestReader;
}

export function createLocalVisualApi(ports: LocalVisualAPI) {
  const app = new Hono();
  type Receipt = { revision: number; state: Event['state']; streamId: string; synthetic: true };
  const revisions = new Map<string, number>();
  const accepted = new Map<string, { canonical: string; receipt: Receipt }>();
  async function identify(request: Request) {
    try {
      const identity = Identity.safeParse(await ports.identify(request));
      return identity.success ? identity.data : undefined;
    } catch {
      return undefined;
    }
  }
  async function permitted(context: HostContext, capability: 'motion.status' | 'motion.preview.request') {
    try {
      await requireAuthority(ports.authority, context, capability);
      return true;
    } catch {
      return false;
    }
  }

  app.get('/v1/status', async (c) => {
    const identity = await identify(c.req.raw);
    if (!identity || !await permitted(identity, 'motion.status')) return c.json({ status: 'denied' }, 403);
    return c.json({ schemaVersion: 1, ...integrationStatus, localOnly: true });
  });
  app.post('/v1/assets/resolve', async (c) => {
    const identity = await identify(c.req.raw);
    if (!identity) return c.json({ status: 'denied' }, 403);
    const input = await parseBody(c.req.raw);
    if (!input.ok) return c.json({ status: 'invalid_request' }, 400);
    const result = await readVisualAsset(input.body, identity, ports.authority, ports.reader);
    const status = { available: 200, denied: 403, invalid_request: 400, not_available: 404,
      manifest_integrity_failed: 502, storage_error: 502 } as const;
    return c.json(result, status[result.status]);
  });
  app.post('/v1/visual-events', async (c) => {
    const identity = await identify(c.req.raw);
    if (!identity || !await permitted(identity, 'motion.preview.request')) return c.json({ status: 'denied' }, 403);
    const input = await parseBody(c.req.raw);
    if (!input.ok) return c.json({ status: 'invalid_request' }, 400);
    const parsed = Event.safeParse(input.body);
    if (!parsed.success) return c.json({ status: 'invalid_event' }, 400);
    const event = parsed.data;
    const stream = JSON.stringify([identity.tenantId, event.streamId]);
    const key = JSON.stringify([identity.tenantId, identity.actorId, event.streamId, event.idempotencyKey]);
    const canonical = JSON.stringify(event);
    const previous = accepted.get(key);
    if (previous) {
      if (previous.canonical !== canonical) return c.json({ status: 'idempotency_conflict' }, 409);
      return c.json({ status: 'replayed', receipt: previous.receipt }, 200);
    }
    const revision = revisions.get(stream) ?? 0;
    if (revision !== event.expectedRevision) return c.json({ status: 'stale_revision' }, 409);
    if (accepted.size >= 2048) return c.json({ status: 'capacity_exceeded' }, 503);
    const receipt: Receipt = { revision: revision + 1, state: event.state, streamId: event.streamId, synthetic: true };
    accepted.set(key, { canonical, receipt });
    revisions.set(stream, receipt.revision);
    return c.json({ status: 'accepted', receipt }, 201);
  });
  return app;
}
