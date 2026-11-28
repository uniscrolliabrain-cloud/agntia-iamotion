import { z } from 'zod';
import { boundedCall, sha256Text } from './bounded.js';

const Id = z.string().regex(/^[a-zA-Z0-9_.:/-]{1,192}$/u);
const Item = z.strictObject({
  id: Id, contentHash: z.string().regex(/^[a-f0-9]{64}$/u), text: z.string().min(1).max(32000),
});
const Input = z.strictObject({
  scope: Id, inputs: z.array(Item).min(1).max(64),
});
const Config = z.strictObject({
  modelId: Id, modelVersion: Id, dimension: z.number().int().min(1).max(4096),
  maxBatch: z.number().int().min(1).max(64),
  maxCharacters: z.number().int().min(1).max(128000),
  timeoutMs: z.number().int().min(1).max(30000),
});
type Item = z.infer<typeof Item>;

export interface EmbeddingsPort {
  embed(request: Readonly<{
    scope: string; modelId: string; modelVersion: string; inputs: readonly Item[]; signal: AbortSignal;
  }>): Promise<unknown>;
}

export function unitVector(value: readonly number[], dimension: number): number[] | undefined {
  if (value.length !== dimension || dimension < 1 || !value.every(Number.isFinite)) return;
  const norm = Math.hypot(...value);
  if (!Number.isFinite(norm) || norm === 0) return;
  return value.map((coordinate) => coordinate / norm);
}

export class EmbeddingsClient {
  readonly #settings;
  readonly #port;
  readonly #cache = new Map<string, readonly number[]>();

  constructor(settings: unknown, port?: EmbeddingsPort) {
    this.#settings = Config.parse(settings);
    this.#port = port;
  }

  async embed(input: unknown, authorizedScopes: ReadonlySet<string>, signal?: AbortSignal) {
    const parsed = Input.safeParse(input);
    if (!parsed.success) return { status: 'invalid_input' } as const;
    const { scope, inputs } = parsed.data;
    if (!authorizedScopes.has(scope)) return { status: 'scope_denied' } as const;
    if (!this.#port) return { status: 'not_configured' } as const;
    if (signal?.aborted) return { status: 'aborted' } as const;
    const { modelId, modelVersion, dimension, maxBatch, maxCharacters, timeoutMs } = this.#settings;
    if (inputs.length > maxBatch || inputs.reduce((sum, item) => sum + item.text.length, 0) > maxCharacters) {
      return { status: 'budget_exceeded' } as const;
    }
    if (new Set(inputs.map(({ id }) => id)).size !== inputs.length) return { status: 'invalid_input' } as const;
    const hashes = await Promise.all(inputs.map(({ text }) => sha256Text(text)));
    if (hashes.some((hash, index) => hash !== inputs[index].contentHash)) return { status: 'invalid_input' } as const;
    if (signal?.aborted) return { status: 'aborted' } as const;
    const key = (item: Item) => JSON.stringify([scope, modelId, modelVersion, item.contentHash]);
    const vectors = new Map<string, readonly number[]>();
    const pending = inputs.filter((item) => {
      const cached = this.#cache.get(key(item));
      if (cached) vectors.set(item.id, cached);
      return !cached;
    });
    if (pending.length) {
      const port = this.#port;
      const call = await boundedCall((abort) => port.embed({
        scope, modelId, modelVersion, inputs: structuredClone(pending), signal: abort,
      }), timeoutMs, signal);
      if (!call.ok) return { status: call.code } as const;
      const output = z.strictObject({
        modelId: z.literal(modelId), modelVersion: z.literal(modelVersion), dimension: z.literal(dimension),
        vectors: z.array(z.strictObject({ id: Id, values: z.array(z.number()).length(dimension) }))
          .length(pending.length),
      }).safeParse(call.value);
      if (!output.success) return { status: 'invalid_response' } as const;
      const byId = new Map(output.data.vectors.map(({ id, values }) => [id, values]));
      const staged = [];
      for (const item of pending) {
        const values = byId.get(item.id);
        const normalized = values && unitVector(values, dimension);
        if (!normalized) return { status: 'invalid_response' } as const;
        staged.push({ item, normalized });
      }
      for (const { item, normalized } of staged) {
        this.#cache.set(key(item), normalized);
        if (this.#cache.size > 1024) this.#cache.delete(this.#cache.keys().next().value!);
        vectors.set(item.id, normalized);
      }
    }
    return { status: 'ok', modelId, modelVersion, dimension,
      vectors: inputs.map(({ id }) => ({ id, values: [...vectors.get(id)!] })) } as const;
  }
}
