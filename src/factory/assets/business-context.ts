import { z } from 'zod';

const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).max(120);
const Workspace = z.strictObject({
  id: Id, label: z.string().min(1).max(160), context: z.enum(['application', 'metaapp', 'demo']),
});
const Collection = z.strictObject({
  id: Id, workspaceId: Id, domainId: Id, capabilityId: Id, roleId: Id,
});
const Taxonomy = z.strictObject({
  schemaVersion: z.literal(1), workspaces: z.array(Workspace).max(256), collections: z.array(Collection).max(1024),
});

export interface ContextCard {
  id: string;
  collection: string;
}
export interface ContextUsage {
  path: string;
  workspaceId?: string;
  resolution: 'exact' | 'candidate' | 'unresolved';
}

export class BusinessContext {
  readonly #workspaces: Map<string, z.infer<typeof Workspace>>;
  readonly #collections: Map<string, z.infer<typeof Collection>>;

  constructor(input: unknown) {
    const taxonomy = Taxonomy.parse(input);
    this.#workspaces = new Map(taxonomy.workspaces.map((entry) => [entry.id, entry]));
    this.#collections = new Map(taxonomy.collections.map((entry) => [entry.id, entry]));
    if (this.#workspaces.size !== taxonomy.workspaces.length ||
        this.#collections.size !== taxonomy.collections.length) throw new Error('DUPLICATE_CONTEXT_ID');
    for (const { workspaceId } of this.#collections.values()) {
      if (!this.#workspaces.has(workspaceId)) throw new Error('UNKNOWN_CONTEXT_WORKSPACE');
    }
  }

  classifyCard({ id, collection }: ContextCard) {
    const mapped = this.#collections.get(collection);
    const workspace = mapped && this.#workspaces.get(mapped.workspaceId);
    if (!mapped || !workspace) return { id, collection, status: 'unresolved' } as const;
    const { workspaceId, domainId, capabilityId, roleId } = mapped;
    return { id, collection, status: 'specified', basis: 'source-spec',
      context: workspace.context, workspaceId, domainId, capabilityId, roleId } as const;
  }

  classifyUsage<T extends ContextUsage>(usage: T) {
    const workspace = usage.workspaceId ? this.#workspaces.get(usage.workspaceId) : undefined;
    const legacy = /(?:^|\/)legacy(?:\/|$)/u.test(usage.path);
    return {
      evidence: usage,
      context: workspace?.context ?? 'unresolved',
      lifecycle: legacy ? 'legacy' : 'unknown',
      useConfirmed: Boolean(workspace) && usage.resolution === 'exact',
      productionUse: null,
    } as const;
  }
}
