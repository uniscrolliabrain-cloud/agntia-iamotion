import { z } from 'zod';
import { requireAuthority, type HostAuthority, type HostContext } from '../integration/host.js';
import { sha256Text } from '../llm/bounded.js';

const Hash = z.string().regex(/^[a-f0-9]{64}$/u);
const WorkspaceId = z.string().regex(/^[a-zA-Z0-9_-]{1,96}$/u);
const Entry = z.strictObject({
  binaryId: Hash,
  mime: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  bytes: z.number().int().min(1).max(95 * 1024 * 1024),
  rights: z.enum(['approved', 'pending', 'withdrawn']),
});
const Manifest = z.strictObject({
  schemaVersion: z.literal(1),
  tenantId: WorkspaceId,
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  assets: z.array(Entry).max(10000),
});
const Request = z.strictObject({ snapshotId: Hash, binaryId: Hash });

export interface VisualManifestReader {
  isAssetReadable(input: Readonly<{ tenantId: string; binaryId: string }>): Promise<boolean>;
  readManifest(input: Readonly<{ tenantId: string; snapshotId: string }>): Promise<unknown>;
}

function canonicalManifest(input: unknown) {
  const manifest = Manifest.parse(input);
  const seen = new Set(manifest.assets.map(({ binaryId }) => binaryId));
  if (seen.size !== manifest.assets.length) throw new Error('DUPLICATE_SDK_ASSET');
  return { ...manifest, assets: [...manifest.assets].sort((a, b) =>
    a.binaryId < b.binaryId ? -1 : a.binaryId > b.binaryId ? 1 : 0) };
}

export function visualManifestId(input: unknown) {
  return sha256Text(JSON.stringify(canonicalManifest(input)));
}

export async function readVisualAsset(
  request: unknown, context: HostContext, authority: HostAuthority | undefined, reader: VisualManifestReader,
) {
  const parsed = Request.safeParse(request);
  if (!parsed.success || !WorkspaceId.safeParse(context.tenantId).success) {
    return { status: 'invalid_request' } as const;
  }
  try {
    await requireAuthority(authority, context, 'motion.assets.read');
  } catch {
    return { status: 'denied' } as const;
  }
  const { snapshotId, binaryId } = parsed.data;
  let raw: unknown;
  try {
    raw = await reader.readManifest({ tenantId: context.tenantId, snapshotId });
  } catch {
    return { status: 'storage_error' } as const;
  }
  let manifest: ReturnType<typeof canonicalManifest>;
  try {
    manifest = canonicalManifest(raw);
    if (manifest.tenantId !== context.tenantId || await sha256Text(JSON.stringify(manifest)) !== snapshotId) {
      return { status: 'manifest_integrity_failed' } as const;
    }
  } catch {
    return { status: 'manifest_integrity_failed' } as const;
  }
  const record = manifest.assets.find((asset) => asset.binaryId === binaryId && asset.rights === 'approved');
  if (!record) return { status: 'not_available' } as const;
  try {
    if (!await reader.isAssetReadable({ tenantId: context.tenantId, binaryId })) {
      return { status: 'not_available' } as const;
    }
  } catch {
    return { status: 'storage_error' } as const;
  }
  return { status: 'available', snapshotId, revision: manifest.revision,
    asset: { binaryId, mime: record.mime, bytes: record.bytes } } as const;
}
