# M4 — RAG y recuperación
## P18 — Compilador de fichas
lab/scripts/compile-rag.mjs consume snapshot aprobado para lectura y claims con estado explícito. Una ficha por visualId/facet/locale/basis-group; ID estable rag:<visualId>:<facet>:<locale>:<group>. Campos revision, scope, title, text, claimIds, evidenceIds, filters, contentHash, status. Plantillas ES/EN, conservar idioma original si traducción no validada. No concatenar prompts largos indiscriminadamente. Propuestas separadas de hechos. Orden canónico, JSONL, manifest, tombstones, reverse index evidence->cards. Si cambia claim, regenerar solo fichas dependientes.
## P19 — Índice léxico
src/factory/assets/retrieval.ts: índice invertido por campo, tokenización Unicode, aliases controlados, BM25 con IDF y longitud media por campo. Filtros de scope y estado antes de ranking. Pesos iniciales title4/alias3/ux2/body1; k1=1.2,b=.75; parámetros versionados. Negación en query como filtro solo cuando explícita y fiable. Diversificar por visualId; desempate ID; devolver score y evidencia, no probabilidad.
## P20 — Briefing
Adaptar proposal-context.ts a RetrievalHit y separar referenceIds de approvedAssetIds. El host aporta permisos; ninguna búsqueda concede autorización. Contexto con presupuesto de caracteres/tokens, selección por relevancia y diversidad, citas internas, restricciones negativas y desconocidos. Si no hay evidencia suficiente, devolver insufficient_context.
## P21 — Evaluación
lab/eval/{queries,judgments,splits}.json: consultas ES/EN, familias, negativos, ambiguos, sin respuesta; relevancia 0..3 humana. Split por visualId, no binario. Comparar baseline actual con BM25; Recall@5/10, MRR, nDCG@10, abstención, latencia y cobertura. Congelar test antes de tuning; reportar tamaño y denominadores. No inventar etiquetas.
## Tests
Fichas reproducibles, cambio incremental, tombstone, evidencia rota, scope ajeno, query vacía, acentos, alias, negación, empate, variantes repetidas. Gate: cero fugas, cero claims sin evidencia, métricas reales antes de aceptar.
