# M6 — Laboratorio y migración
## P27 — Orquestador
lab/scripts/run.mjs DAG de etapas audit/ontology/entities/claims/rag/eval/proposal opcional. Cada etapa declara inputs, outputs, version, dependencies, timeout; cache key hash canónico. RunId único, staging separado, lock por scope. No ejecutar shell interpolado. Fallo bloquea dependientes, conserva diagnóstico.
## P28 — Observabilidad
lab/observability/runs/<runId>/manifest.json y events.jsonl. Eventos run.started, stage.started, stage.completed, stage.failed, run.completed, run.failed; correlationId, sequence, timestamp, duration, counts, input/output hashes, errorCode, providerUsage opcional. No secretos ni prompts privados. Recibo de fallo mediante finally y workflow if:always; logs con retención limitada. Métricas agregadas por snapshot, no confundir cache hit con ejecución nueva.
## P29 — Actions
Workflow manual inicialmente, permisos contents:read, artifact de staging, aprobación separada para promoción con contents:write. Pin actions por SHA al implementar; lock concurrency; timeout; no pull_request_target con código no confiable. Comparar HEAD esperado antes de commit, no force push. No activar Pages ni proveedores. Revisar workflow existente que escribe entidades directamente antes de migrarlo.
## P30 — Revisión y promoción
Validar manifest, hashes, derechos, scope, revisión humana y expectedRevision. Promover snapshot por puntero atómico; no sobrescribir ledger. Rollback puntero previo. Publicación de activos requiere permiso separado; pendiente no significa privado en Git público.
## P31 — SDK
Exportar contratos y lector de catálogo, no incluir todos los binarios en paquete. Loader explícito por host, no acceso filesystem implícito desde browser. Hono router futuro server-only, autoridad host, eventos versionados y dedupe. Tests mock de autorización. Mantener lab como harness, sustituir executor por jobs runtime sin cambiar IDs.
## P32 — Handoff
Documentar árbol final, contratos, fixtures, métricas, comandos, lockfile, build y límites. Empaquetado tgz y SHA futuro según patrón ciberseguridad; no instalar en agente. Fase 2 permanece documental. Gate final humano.
## Tests
Fallo parcial, replay, concurrencia, HEAD cambiado, artefacto corrupto, cache invalidado, rollback, secreto en log, scope ajeno, proveedor ausente. Evidencia de cada etapa y salida no publicada si falla.
