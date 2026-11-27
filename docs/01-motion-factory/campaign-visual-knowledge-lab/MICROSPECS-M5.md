# Microespecificaciones M5
Plan documental; no ejecución. Complementa PATCHSETS-M5.md, no lo sustituye.
## P22 — embedding-port
### Unidades de implementación
- P22.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P22.b: algoritmo puro: authorize scope → cache lookup → batch → validate response → persist authorized cache.
- P22.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P22.d: fixtures positivos, negativos y replay: wrong dimension; NaN; timeout; provider absent.
- P22.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
vectors or typed failure; usage. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P23 — hybrid
### Unidades de implementación
- P23.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P23.b: algoritmo puro: retrieve lexical/vector separately → filter → RRF → group visual IDs.
- P23.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P23.d: fixtures positivos, negativos y replay: different model index; zero vector; unavailable provider.
- P23.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
ranked hits; fallback reason. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P24 — prompt-registry
### Unidades de implementación
- P24.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P24.b: algoritmo puro: load version → validate input → delimit evidence → enforce budget → hash.
- P24.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P24.d: fixtures positivos, negativos y replay: unknown version; injected instruction; secret.
- P24.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
prompt envelope; schema ref. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P25 — proposal-runner
### Unidades de implementación
- P25.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P25.b: algoritmo puro: retrieve → prompt → provider → strict parse → refs → policy → stage.
- P25.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P25.d: fixtures positivos, negativos y replay: invented ID; malformed JSON; budget; timeout.
- P25.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
proposal or rejection; receipt. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P26 — provider-config
### Unidades de implementación
- P26.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P26.b: algoritmo puro: parse env → validate endpoint/model → explicit enable flag → instantiate port.
- P26.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P26.d: fixtures positivos, negativos y replay: missing secret; nonallowlisted endpoint; disabled.
- P26.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
not_configured or provider port. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.
