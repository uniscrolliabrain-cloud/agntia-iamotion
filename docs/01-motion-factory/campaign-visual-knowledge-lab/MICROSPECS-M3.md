# Microespecificaciones M3
Plan documental; no ejecución. Complementa PATCHSETS-M3.md, no lo sustituye.
## P13 — behavior-schema
### Unidades de implementación
- P13.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P13.b: algoritmo puro: parse tracks → validate units/times → target lookup → renderer capabilities → policy.
- P13.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P13.d: fixtures positivos, negativos y replay: NaN; missing target; unordered keyframes; no fallback.
- P13.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
validated spec or typed rejection. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P14 — behavior-grammar
### Unidades de implementación
- P14.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P14.b: algoritmo puro: expand primitive → normalize timeline → compose serial/parallel → detect conflicts.
- P14.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P14.d: fixtures positivos, negativos y replay: overlapping same property; unbounded loop; unsupported fold.
- P14.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
normalized candidate timeline. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P15 — motion-candidates
### Unidades de implementación
- P15.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P15.b: algoritmo puro: select UX rule → check capabilities → emit rationale/prerequisites → rank.
- P15.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P15.d: fixtures positivos, negativos y replay: flat image with independent part; unknown role.
- P15.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
proposals.jsonl; abstentions. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P16 — reconstruction
### Unidades de implementación
- P16.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P16.b: algoritmo puro: parse declarative recipe → validate DAG → units → material/camera limits → prerequisites.
- P16.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P16.d: fixtures positivos, negativos y replay: cycle; arbitrary code; unknown geometry.
- P16.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
recipe candidate; missing views. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.

## P17 — export-contract
### Unidades de implementación
- P17.a: contrato de entrada/salida y errores discriminados; validar antes de IO.
- P17.b: algoritmo puro: validate format/renderer → dimensions/fps/alpha → budget → fallback.
- P17.c: adaptador de lectura/escritura con rutas contenidas, staging y límites; no efectos externos.
- P17.d: fixtures positivos, negativos y replay: MP4 alpha unsupported; excessive size; unsafe SVG.
- P17.e: integración con etapa anterior, recibo, revisión y rollback.
### Salidas verificables
export plan or rejection. Registrar inputHash, versión, counts y error codes. Orden estable por ID; no timestamps dentro del hash de contenido. No promover si falla validación.
### Definition of done
Contrato estricto, tests unitarios y de integración ejecutados, resultado reproducible, evidencia de casos negativos, comparación baseline y ausencia de cambios fuera de ownership. Si una dependencia no existe, mock explícito o bloqueo, nunca éxito simulado.
