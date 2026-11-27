# Microespecificaciones M6
Plan documental; no ejecución. Complementa PATCHSETS-M6.md, no lo sustituye.
## P27 — dag-runner
### Unidades de implementación
- P27.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P27.b: algoritmo puro: validate DAG → topological sort → hash inputs → execute stage → verify outputs.
- P27.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P27.d: fixtures positivos, negativos y replay: cycle; timeout; cache corruption; dependency failure.
- P27.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
stage receipts; staging manifest. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P28 — observability
### Unidades de implementación
- P28.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P28.b: algoritmo puro: allocate sequence → redact → append event → aggregate → finalize receipt.
- P28.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P28.d: fixtures positivos, negativos y replay: secret in error; missing terminal event; partial failure.
- P28.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
events.jsonl; manifest; metrics. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P29 — actions
### Unidades de implementación
- P29.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P29.b: algoritmo puro: checkout pinned commit → read-only build → artifact → separate approval → CAS promotion.
- P29.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P29.d: fixtures positivos, negativos y replay: untrusted PR; HEAD changed; concurrent run.
- P29.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
artifact; promotion receipt. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P30 — promotion
### Unidades de implementación
- P30.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P30.b: algoritmo puro: validate hashes → review revision → rights/scope → CAS pointer → rollback reference.
- P30.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P30.d: fixtures positivos, negativos y replay: stale review; pending rights; changed HEAD.
- P30.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
new pointer or denial. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P31 — sdk
### Unidades de implementación
- P31.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P31.b: algoritmo puro: load manifest via host → validate → authorize read → resolve refs → project response.
- P31.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P31.d: fixtures positivos, negativos y replay: missing authority; corrupt snapshot; browser filesystem.
- P31.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
typed read response; event envelope. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P32 — handoff
### Unidades de implementación
- P32.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P32.b: algoritmo puro: verify lockfile/build/tests → package allowlist → hash tarball → document compatibility.
- P32.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P32.d: fixtures positivos, negativos y replay: binary accidentally bundled; failing test; missing approval.
- P32.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
release candidate report; no installation. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.
