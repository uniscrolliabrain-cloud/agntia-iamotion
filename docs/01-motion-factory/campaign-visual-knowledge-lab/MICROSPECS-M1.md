# Microespecificaciones M1
Plan documental; no ejecución. Complementa PATCHSETS-M1.md, no lo sustituye.
## P01 — audit-baseline
### Unidades de implementación
- P01.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P01.b: algoritmo puro: readInventory → validate → index → streamVerify → report.
- P01.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P01.d: fixtures positivos, negativos y replay: missing binary; mismatch; unsafe SVG; LFS; duplicate source tuple.
- P01.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
audit.json; per-hash findings; exit 2 on integrity. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P02 — snapshot-store
### Unidades de implementación
- P02.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P02.b: algoritmo puro: canonicalize → hash manifest → stage → verify → compare-and-swap pointer.
- P02.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P02.d: fixtures positivos, negativos y replay: interrupted write; existing snapshot; concurrent HEAD; legacy preserved.
- P02.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
manifest.json; current.json; migration dry-run. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P03 — schema-registry
### Unidades de implementación
- P03.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P03.b: algoritmo puro: define Zod strict schemas → generate JSON Schema → validate fixtures → export.
- P03.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P03.d: fixtures positivos, negativos y replay: unknown keys; invalid UUID; nonfinite value; overlong arrays.
- P03.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
schema manifest; compatibility report. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P04 — ontology
### Unidades de implementación
- P04.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P04.b: algoritmo puro: load v1 → map IDs → validate DAG → build alias multimap → emit v2.
- P04.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P04.d: fixtures positivos, negativos y replay: cycle; ambiguous alias; deprecated replacement cycle.
- P04.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
terms.json; aliases.json; migration map. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P05 — reconcile
### Unidades de implementación
- P05.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P05.b: algoritmo puro: index hash and pinned path → compare → emit candidates → persist assigned IDs.
- P05.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P05.d: fixtures positivos, negativos y replay: hash/path disagreement; duplicate basename; unmatched card.
- P05.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
entity-map.json; conflicts.json; unresolved.json. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P06 — claim-ledger
### Unidades de implementación
- P06.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P06.b: algoritmo puro: normalize claims → attach evidence → validate → append review → project effective view.
- P06.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P06.d: fixtures positivos, negativos y replay: missing evidence; stale revision; conflicting approvals.
- P06.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
claims.jsonl; reviews.jsonl; coverage.json. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.
