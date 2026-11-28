import { z } from 'zod';

const Id = z.string().regex(/^[a-zA-Z0-9_.:-]{1,96}$/u);
const DataRequest = z.strictObject({
  scope: Id, id: Id, revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
const Snapshot = z.strictObject({
  schemaVersion: z.literal(1), id: Id, revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  scope: Id, source: Id, synthetic: z.boolean(), unit: z.string().min(1).max(32),
  rows: z.array(z.strictObject({ id: Id, label: z.string().min(1).max(160),
    value: z.number().min(0).max(1e12) })).min(1).max(100),
});
const Domain = z.strictObject({ min: z.literal(0), max: z.number().positive().max(1e12) });

export interface GraphicsDatasetReader {
  read(input: { scope: string; id: string; revision: number }): Promise<unknown>;
}

export async function prepareBarChart(request: { scope: string; id: string; revision: number },
  authorizedScopes: ReadonlySet<string>, reader: GraphicsDatasetReader, domainInput: unknown) {
  if (!DataRequest.safeParse(request).success) return { ok: false, code: 'INVALID_DATA_REQUEST' } as const;
  if (!authorizedScopes.has(request.scope)) return { ok: false, code: 'DATA_SCOPE_DENIED' } as const;
  const domain = Domain.safeParse(domainInput);
  if (!domain.success) return { ok: false, code: 'INVALID_BAR_DOMAIN' } as const;
  let result: unknown;
  try {
    result = await reader.read({ ...request });
  } catch {
    return { ok: false, code: 'DATA_READ_FAILED' } as const;
  }
  const parsed = Snapshot.safeParse(result);
  if (!parsed.success) return { ok: false, code: 'INVALID_DATA_SNAPSHOT' } as const;
  const { scope, id, revision, source, unit, synthetic, rows } = parsed.data;
  if (scope !== request.scope || id !== request.id) return { ok: false, code: 'DATA_SCOPE_MISMATCH' } as const;
  if (revision !== request.revision) return { ok: false, code: 'STALE_DATA_REVISION' } as const;
  if (new Set(rows.map((row) => row.id)).size !== rows.length) return { ok: false, code: 'DUPLICATE_DATA_ID' } as const;
  if (rows.some((row) => row.value > domain.data.max)) return { ok: false, code: 'VALUE_OUTSIDE_BAR_DOMAIN' } as const;
  return { ok: true, source, revision, unit, synthetic,
    table: rows,
    marks: rows.map((row) => ({ id: row.id, proportion: row.value / domain.data.max })) } as const;
}
