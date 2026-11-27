# M2 — Contexto, anatomía y estilos
Depende de M1. No requiere LLM.
## P07 — Grafo de usos
lab/scripts/extract-usage.mjs: consumir árbol Git fijado; parsear TS/JS/JSX con AST, CSS con parser, HTML con parser; resolver imports relativos, aliases Vite, public roots y glob finito. Emitir UsageEvidence {visualId?,binaryId?,repo,commit,path,line,column,expression,method,resolution,workspace?,metaapp?,legacyStatus}. resolution exact/candidate/unresolved. No convertir coincidencia basename en uso confirmado. Para templates dinámicos, registrar expresión y dominio finito demostrado por código; si no, unresolved.
## P08 — Contexto empresarial
library/taxonomy/business.json: dominios, capacidades, tareas, workspaces, estados; IDs separados de etiquetas. Mapear launcher, Mi Empresa, formación, automatizaciones mediante manifiestos y rutas. Mantener app normal, metaapp Mi Empresa y demo como contextos distintos. No inferir producción por presencia en ui-lab. Registrar referencias legacy sin eliminarlas.
## P09 — Inspección técnica
lab/scripts/inspect-images.mjs: decoder aislado con límite de píxeles, bytes y tiempo; MIME real, dimensiones, alpha, orientación, frames; paleta cuantizada determinista y luminancia. No enviar imágenes fuera. SVG se analiza estáticamente sin ejecutar. Resultados measured con versión del decoder. Corruptos generan error por activo y no detienen el informe completo.
## P10 — Extracción léxica de prompts
Tokenizar Unicode, preservar offsets originales, longest-match aliases. Segmentar cláusulas y distinguir positive/negative/uncertain. Ejemplo 'cerámica marfil, evitar neón y oro brillante' produce intención positiva ceramic/ivory y restricciones negativas neon/glossy-gold. No inferir que el binario contiene esos materiales. Las cláusulas ambiguas pasan a revisión. Separar prompt global de familia y sujeto particular.
## P11 — Familias
knowledge/factory/style-families/{launcher-ceramic,company-editorial,formation-photo,automation-nodes}.md y manifest JSON. Cada familia: purpose, palette intent, materials intent, composition, lighting, forbidden, approvedExamples, exceptions, sourceRefs. No afirmar aprobación de familias sin evidencia. Crear grafo de compatibilidad contextual; no aplicar estilo de landing a app normal automáticamente.
## P12 — Anatomía
appearance.json distingue measured, intended, observed y proposed. Part {partId,label,region?,parentPartId?,separable?,evidenceIds}; region normalizada 0..1 solo si medida o anotada. Silueta, profundidad, geometría oculta y material físico quedan unknown hasta evidencia. Las hipótesis se guardan aparte.
## Tests
Import estático exacto, alias Vite, glob, template no resoluble, ruta legacy, imagen corrupta, alpha conocido, paleta sintética, negación bilingüe, prompt contradictorio. Revisar muestra estratificada por familia; reportar precisión de usos confirmados y cobertura por faceta, no solo número de tags. Rollback: snapshot previo, sin tocar fuente.
