import { z } from 'zod';

const Id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,95}$/u);
const Grant = z.strictObject({
  scope: Id, bindingId: Id,
  allowedRecipes: z.array(Id).min(1).max(32),
  synthetic: z.boolean(),
});
const Frame = z.strictObject({
  schemaVersion: z.literal(1),
  scope: Id, bindingId: Id, recipeId: Id,
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  state: z.enum(['ready', 'running', 'paused']),
  synthetic: z.boolean(),
});
type Frame = z.infer<typeof Frame>;

export function createVisualBinding(granted: unknown) {
  const grant = Grant.parse(granted);
  const allowed = new Set(grant.allowedRecipes);
  let current: Frame | undefined;
  let pending: Frame | undefined;
  let disposed = false;
  return {
    accept(input: unknown) {
      if (disposed) return { ok: false, code: 'BINDING_DISPOSED' } as const;
      const parsed = Frame.safeParse(input);
      if (!parsed.success) return { ok: false, code: 'INVALID_BINDING_FRAME' } as const;
      const frame = parsed.data;
      if (frame.scope !== grant.scope || frame.bindingId !== grant.bindingId ||
          frame.synthetic !== grant.synthetic || !allowed.has(frame.recipeId)) {
        return { ok: false, code: 'BINDING_SCOPE_DENIED' } as const;
      }
      if (frame.revision <= (pending?.revision ?? current?.revision ?? 0)) {
        return { ok: false, code: 'BINDING_STALE_REVISION' } as const;
      }
      pending = frame;
      return { ok: true, revision: frame.revision } as const;
    },
    flush() {
      if (!pending || disposed) return undefined;
      current = pending;
      pending = undefined;
      return { ...current };
    },
    snapshot() {
      return current && { ...current };
    },
    dispose() {
      disposed = true;
      pending = undefined;
      current = undefined;
    },
  };
}
