# Wiring y ownership
Plan, no implementación. Una fuente de verdad por dato.
| Productor | Contrato | Consumidor | Fallo |
|---|---|---|---|
| inventory | BinaryRecord | audit, resolver | quarantine |
| ontology | Term | claim validator, retrieval | reject unknown |
| reconcile | VisualEntity | all facets | conflict |
| usage extractor | Evidence/Claim | UX cards | unresolved |
| image inspector | measured Claim | appearance cards | unknown |
| prompt parser | source-spec Claim | style cards | uncertain |
| motion rules | BehaviorProposal | compiler future | proposed only |
| recipe builder | ReconstructionRecipe | Blender future | proposed only |
| rag compiler | RagCard | lexical/vector retrieval | invalid card excluded |
| retrieval | RetrievalHit | brief builder | insufficient_context |
| brief builder | ProposalInput | LLM port | not_configured |
| LLM port | unknown | schema/ref/policy validation | reject |
| review ledger | Review | promotion | stale revision |
| lab executor | RunReceipt | observability | failed receipt |
| host authority | grant | SDK/resolver | deny |
## Import direction
schemas <- pure algorithms <- IO adapters <- lab CLI. SDK imports contracts and pure reader, never CLI. UI lab consumes public synthetic snapshots only. No factory import from sensory intelligence. No filesystem path accepted from LLM. Existing src/index.ts exports retained until migration tests. Existing library/cards remain evidence, not overwritten. Existing entities snapshot read-only until migration. JSON schema generated from canonical schema and checked in CI.
