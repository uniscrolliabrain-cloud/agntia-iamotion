# Evaluación y gates
Baseline: 403 binarios, 166 clasificados, 206 claims. Cobertura léxica 41.19%; no es exactitud. 119/133 tarjetas enlazadas. Medir por separado cobertura binaria, conceptual, faceta, evidencia y revisión.
## Dataset
Muestra estratificada por familia, rama, tipo y estado; incluir desconocidos, negativos, duplicados, legacy, consultas ES/EN y composiciones ambiguas. Etiquetas humanas con relevancia 0-3 y justificación. Separar train/dev/test por visualId para evitar fuga de variantes. Congelar test antes de ajustar pesos.
## Métricas
Recall@k = relevantes recuperados / relevantes totales; MRR = media de inverso del primer rango relevante; nDCG@k con relevancia graduada; precision@k; tasa de abstención; cobertura por faceta; claims sin evidencia; errores de reconciliación; latencia p50/p95; coste real si proveedor. Reportar denominadores, tamaño muestra y fallos. No confundir ausencia de etiquetas con irrelevancia.
## Gates obligatorios
G-A integridad: cero referencias rotas no declaradas, cero IDs duplicados, cero claims sin evidencia. G-B seguridad: cero promoción automática, cero acceso fuera de scope, cero secretos. G-C reproducibilidad: mismos inputs/versiones -> mismos hashes de contenido. G-D calidad: comparar baseline y candidato con test congelado; no aceptar regresión no explicada; umbrales de relevancia se fijan con usuario tras medir baseline. G-E integración: mock host y proveedor ausente; no efectos. G-F revisión: aprobación explícita antes de publicar activos o conectar proveedores.
## Matriz negativa
Hash corrupto, path traversal, symlink, SVG activo, LFS pointer, JSON inválido, alias ambiguo, negación, claim contradictorio, ID inventado, prompt injection, timeout, dimensión vectorial errónea, presupuesto agotado, HEAD cambiado, fallo parcial, reintento, tombstone, revisión obsoleta. Cada caso tiene resultado esperado fail-closed o candidato pendiente.
