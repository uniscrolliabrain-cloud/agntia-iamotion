# Contratos transversales propuestos
Todos versionados, validación estricta, límites explícitos. No son código ejecutado.
- BinaryRecord {schemaVersion:1,binaryId:sha256,mime,bytes,width?,height?,alpha?,sourceRefs[],storageRef,reviewStatus}. storageRef relativo a almacén autorizado, nunca URL arbitraria.
- VisualEntity {visualId,revision,slug,kind,familyIds[],binaryIds[],claimIds[],relationIds[],lifecycle}. visualId estable independiente de slug/hash; IDs asignados una vez y registrados; merge/split conserva alias y lineage.
- Evidence {evidenceId,kind,sourceCommit?,sourcePath?,sourceHash,span?,method,observedAt?}. fuente de prompt no demuestra apariencia; hash de contenido fija versión.
- Claim {claimId,visualId,facet,predicate,value,unit?,basis,evidenceIds[],confidence,reviewStatus,revision,supersedes?}. basis enum observed/measured/source-spec/path-inference/proposed; confidence ordinal no probabilidad calibrada. Valor desconocido null. Claims conflictivos no se borran.
- Relation {id,from,to,type,evidenceIds[],status}; variant-of/derived-from/same-family/depicts/used-in/compatible-with/alternative-to/animates-as. No transitividad implícita de compatibilidad.
- Review {id,targetId,targetRevision,decision,actorRef,reason,evidenceIds[],at}; revisión de una versión no autoriza otra. Aprobación visual distinta de derechos y uso productivo.
- RagCard {id,entityId,facet,revision,locale,scope,claimIds[],evidenceIds[],text,filters,contentHash,status}; id lógico estable, hash cambia con contenido; tombstone para retiradas.
- RetrievalRequest {query,locale,scope,facets?,familyIds?,limit}; scope otorgado por host, no por texto. RetrievalHit {cardId,score,rank,evidenceIds[],basis,reviewStatus}; score no certeza factual.
- BehaviorProposal {id,visualId,revision,targetPart,primitive,parameters,trigger,states,reducedMotion,requiredCapabilities,evidenceIds[],status:proposed}; sin ejecución.
- RunReceipt {runId,commit,scriptVersion,inputHashes,stageResults[],outputHashes,status,elapsedMs,errors[],warnings[],metrics}; separar timestamps de hashes de resultados deterministas.
## Invariantes
Identidad estable, evidencia trazable, aislamiento por scope, revisión explícita, no permisos derivados de similitud, no secretos, no efectos externos. Los contratos se comparten entre scripts y runtime; no duplicar Zod y JSON Schema manualmente sin test de equivalencia. Las rutas concretas y límites se fijan al ejecutar cada fase.
