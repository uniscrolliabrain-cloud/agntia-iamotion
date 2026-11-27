# Prompt registry design
All prompts versioned, output strict JSON, retrieved content delimited as untrusted data. No provider configured.
P-CATALOG: given source evidence and ontology, propose claims with basis, evidence IDs, polarity, uncertainty. Never claim observation from prompt. Return unknowns and conflicts.
P-BRIEF: given user intent and retrieval hits, select references, constraints, missing context, target format. No permissions granted.
P-MOTION: given entity, parts and renderer capabilities, propose BehaviorSpec candidates, prerequisites, reduced-motion fallback and rationale. No independent part animation without evidence.
P-RECONSTRUCT: given appearance and measured data, propose declarative geometry/material/camera recipe with uncertainty and required views. No executable Python.
P-REVIEW: compare proposal against schema, evidence, style and policy; output issues severity/code/path/evidence and suggested corrections. Cannot approve itself.
## Shared envelope
{promptId,version,requestId,scope,inputHash,evidenceIds,allowedIds,outputSchemaVersion,budget}. Output {status,proposals,unknowns,conflicts,evidenceIds}. Provider adapter returns unknown; validator owns interpretation. Repair once only if budget allows; no retry on policy denial. Log hashes, not private text. Host authority remains separate.
