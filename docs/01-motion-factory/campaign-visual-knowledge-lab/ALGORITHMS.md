# Algoritmos de referencia
## A1 normalización léxica
Unicode NFKC para entrada, casefold aproximado, NFD sin diacríticos para índice auxiliar; conservar original. Tokenizar Unicode; aliases multi-palabra longest-match; distinguir idioma y faceta. Negación local por cláusula: detectar no/sin/avoid/without; marcar alcance incierto para revisión. No extraer términos de instrucciones negativas como afirmaciones positivas. Guardar offsets originales, no offsets normalizados.
## A2 reconciliación
Indexar por SHA256 y (repo,commit,path). Enlace exacto hash > ruta fijada a commit > candidato ambiguo. Si hash y ruta discrepan, conflicto, no elegir automáticamente. Agrupar variantes solo con manifiesto explícito o revisión. Complejidad O(n+m+links) con mapas.
## A3 extracción UX
AST para imports/JSX y literales; CSS parser para url; resolver base public y aliases del bundler; glob expandido contra árbol fijado. Templates dinámicos solo con conjunto finito demostrado. Evidencia incluye archivo, línea, expresión, método y commit. Clasificar legacy por ruta y referencias, no por antigüedad sola.
## A4 recuperación
BM25 por campo con k1=1.2,b=0.75 como punto inicial a evaluar; pesos iniciales title 4, alias 3, ux 2, body 1. IDF log(1+(N-df+0.5)/(df+0.5)). Filtrar scope y estados antes de ranking. RRF futuro sum 1/(60+rank), sin mezclar scores crudos. Tie-break por ID. Diversificar por visualId, conservar variantes como evidencia. Abstenerse si no hay coincidencia suficiente; calibrar umbral con conjunto de validación.
## A5 compilación RAG
Orden canónico por visualId/facet/locale; agrupar claims compatibles, separar contradicciones y propuestas. Renderizar texto con plantillas, no inventar atributos. Hash SHA256 de JSON canónico UTF8; actualizar solo cambios y emitir tombstones. Índice de evidencia inverso para invalidación.
## A6 propuestas
Retrieve -> assemble prompt con límites -> provider port -> parse JSON -> schema -> validate refs -> policy -> staging -> review. Máximo un intento de reparación inicialmente, presupuesto configurable. No ejecutar código de respuesta ni herramientas sugeridas por contenido recuperado.
## A7 ejecución
DAG topológico, hash de entradas + versión de etapa como cache key. Staging por runId; validación antes de publicación; atomic rename local, commit Git con compare-and-swap esperado. Lock por scope; si HEAD cambió, detener y replanificar. No sobrescribir revisiones. Fallos generan recibo incluso sin artefacto final.
