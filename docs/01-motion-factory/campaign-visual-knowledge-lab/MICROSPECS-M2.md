# Microespecificaciones M2
Plan documental; no ejecución. Complementa PATCHSETS-M2.md, no lo sustituye.
## P07 — usage-extractor
### Unidades de implementación
- P07.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P07.b: algoritmo puro: parse AST → resolve import/public/glob → classify exact/candidate/unresolved.
- P07.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P07.d: fixtures positivos, negativos y replay: dynamic template unknown; duplicate basename; legacy path.
- P07.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
usage.jsonl; unresolved expressions. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P08 — business-context
### Unidades de implementación
- P08.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P08.b: algoritmo puro: load manifests → map workspace IDs → attach usage evidence → distinguish demo/production.
- P08.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P08.d: fixtures positivos, negativos y replay: unknown workspace; same label across metaapps.
- P08.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
business taxonomy; context claims. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P09 — image-inspector
### Unidades de implementación
- P09.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P09.b: algoritmo puro: sniff MIME → enforce pixel limits → decode isolated → measure alpha/palette/luminance.
- P09.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P09.d: fixtures positivos, negativos y replay: corrupt image; oversized dimensions; SVG external reference.
- P09.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
measured claims; decoder version; per-asset errors. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P10 — prompt-parser
### Unidades de implementación
- P10.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P10.b: algoritmo puro: segment clauses → longest alias match → polarity → original offsets → claims.
- P10.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P10.d: fixtures positivos, negativos y replay: negation; exception; mixed language; repeated term.
- P10.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
intent claims; uncertain spans. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P11 — style-families
### Unidades de implementación
- P11.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P11.b: algoritmo puro: extract shared prompt constraints → identify family → compare exceptions → propose relations.
- P11.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P11.d: fixtures positivos, negativos y replay: contradictory palette; unapproved family; landing/app mismatch.
- P11.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
family manifest; compatibility proposals. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P12 — part-anatomy
### Unidades de implementación
- P12.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P12.b: algoritmo puro: load observed annotations → validate normalized region → validate parent DAG → capability flags.
- P12.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P12.d: fixtures positivos, negativos y replay: missing region; parent cycle; inferred hidden geometry.
- P12.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
parts.json; unknowns; capability evidence. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.
