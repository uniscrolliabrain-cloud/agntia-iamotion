# Microespecificaciones M4
Plan documental; no ejecución. Complementa PATCHSETS-M4.md, no lo sustituye.
## P18 — rag-compiler
### Unidades de implementación
- P18.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P18.b: algoritmo puro: group claims by entity/facet/locale/basis → render template → canonical hash → diff.
- P18.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P18.d: fixtures positivos, negativos y replay: removed evidence; contradictory claims; unvalidated translation.
- P18.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
cards.jsonl; manifest; tombstones; reverse index. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P19 — lexical-index
### Unidades de implementación
- P19.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P19.b: algoritmo puro: tokenize → postings per field → authorized corpus stats → BM25 → diversify.
- P19.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P19.d: fixtures positivos, negativos y replay: empty query; scope leak; negative term; tie.
- P19.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
ranked hits; score breakdown. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P20 — brief-builder
### Unidades de implementación
- P20.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P20.b: algoritmo puro: filter hits → budget → evidence citations → constraints → host grants.
- P20.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P20.d: fixtures positivos, negativos y replay: no evidence; unauthorized asset; oversized context.
- P20.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
brief JSON; insufficient_context. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P21 — evaluation
### Unidades de implementación
- P21.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P21.b: algoritmo puro: load frozen judgments → run baseline/candidate → compute metrics → slice by family.
- P21.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P21.d: fixtures positivos, negativos y replay: unjudged result; split leakage; zero relevant items.
- P21.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
metrics.json; errors.jsonl. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.
