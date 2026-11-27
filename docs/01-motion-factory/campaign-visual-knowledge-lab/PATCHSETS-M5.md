# M5 — Puertos embeddings y LLM
## P22 — EmbeddingsPort
embed({modelId,inputs:[{id,contentHash,text}],scope,signal}) -> {modelId,dimension,vectors,usage?}. Validar finitud, dimensión, cardinalidad e IDs; cache por scope/model/version/hash; batch y presupuesto; timeout/retry limitado. Sin proveedor: not_configured. Mock determinista solo tests, etiquetado mock. No enviar binarios ni datos privados.
## P23 — Híbrido
Índice vectorial separado por modelo y scope; cosine solo vectores válidos no nulos. RRF sum 1/(60+rank) con pesos configurables; no mezclar score bruto. Filtrar antes de recuperar. Comparar lexical/vector/hybrid sobre mismo test congelado. Fallback lexical explícito si vector no disponible.
## P24 — Prompt registry
src/llm/prompts/{catalog,brief,motion,reconstruction,review}.md con promptId, version, inputSchema, outputSchema, policy. Separar system/developer/data; contenido recuperado no es instrucción. Incluir evidence IDs, restricciones, incertidumbre, formato JSON y prohibición de inventar referencias. No incluir secretos ni contexto de otro scope.
## P25 — Proposal runner
lab/scripts/run-proposal.mjs: validar request -> retrieve -> build prompt -> provider port -> parse JSON estricto -> schema -> refs -> policy -> staging. Máximo una reparación inicial; presupuesto y timeout configurables. Guardar hash de prompt y respuesta, usage real si disponible; texto completo solo si público y autorizado. No ejecutar herramientas ni código devuelto. Propuesta no cambia catálogo aprobado.
## P26 — Configuración
setup/llm: variables de entorno documentadas, secrets futuros GitHub solo tras autorización, allowlist endpoint, modelo fijado, límites. No crear credenciales ni conectar. Host puede proporcionar propuesta sin proveedor local, mismo validador.
## Tests
Mock válido, JSON inválido, referencia inventada, prompt injection, timeout, 429, dimensión errónea, vector NaN, presupuesto agotado, proveedor ausente. Verificar cero llamadas externas en suite y cero promoción automática.
