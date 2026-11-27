# Continuidad de ejecución

Rama local `campaign/visual-knowledge-lab-execution` desde `e813901194bef2478bf300738273eadf38d9e5c8`. El [registro de ejecución](ledger.json) enumera P01–P52 y las 260 unidades. Los tres commits principales son `3fa751d` para auditoría y simulación de migración, `ca0f959` para contratos y `0cfd2ec` para el render y la demo. `c07fca0` verifica el cambio de la imagen renderizada en Chromium.

## Segundo tramo de ejecución

- P02. El catálogo real quedó preparado en `lab/staging/library-snapshots/`, revisión esperada 0 y puntero inicial intacto. Las pruebas sintéticas cubren preparación concurrente, escritura parcial, corrupción, promoción con revisión y rollback. Cada transición publica un registro mediante enlace exclusivo. La promoción en este almacén local compara revisiones y registra una referencia de revisión. La autoridad del host sigue pendiente.
- P03. Validación independiente de seis JSON Schemas con python-jsonschema 4.26.0 y 21 casos. El orden entre los offsets de evidencia se comprueba en runtime.
- P04. El léxico bilingüe conserva 115 IDs V1 y añade dos de identidad. Los alias ambiguos y las referencias cíclicas tienen pruebas. El léxico V1 conserva sus usos actuales.
- P05. El informe reproducible abarca 403 binarios y 133 fichas. Encontró candidatos exactos para 107 fichas y dejó 26 sin candidato, con 133 referencias pendientes y 47 enlaces heredados sin correspondencia en la propuesta. Los conteos de referencias y enlaces incluyen múltiples elementos por ficha. Se preservaron los enlaces heredados y se dejó pendiente la asignación persistente de identidades revisadas.
- P06. Se prepararon las 206 afirmaciones históricas con 61 referencias de evidencia a las fichas y su base original. El registro de revisión en memoria exige autorización, evidencia y revisión vigente. Sigue pendiente la persistencia durable y el vínculo entre afirmaciones e identidades visuales revisadas.
- P07. El extractor sobre fixtures resuelve imports, JSX y globs finitos contra un árbol fijado. Conserva expresiones dinámicas sin resolver y evidencia de rutas legacy. Siguen pendientes HTML, CSS y el adaptador del árbol Git.
- Verificación final del tramo con 21 pruebas locales, typecheck y build de UI Lab. El paquete y los renders del tramo anterior se conservan como evidencia de ese tramo.

## Evidencia del primer tramo

- Auditoría local con 403 binarios verificados por hash, tamaño y firma, 133 fichas, 166 entidades clasificadas, 206 afirmaciones y 1117 tuplas de procedencia. Los 403 binarios tienen revisión de derechos pendiente. Hay 14 fichas sin enlace. El filtro SVG sirve para triaje.
- El plan de migración es reproducible byte a byte. El identificador propuesto es `cb13f950c05a7a077c43c9aebdcf3e07ab2b288c18da4b641f233ffb1f5e889b`. Quedan pendientes el almacén de snapshots, la actualización condicional del puntero y las pruebas de interrupción y rollback.
- Ocho pruebas locales pasaron. También pasaron la instalación offline con lockfile en el checkout, build, typecheck y build de UI Lab. Vite reportó que el chunk de la vista 3D supera 500 kB antes de gzip.
- Seis contratos estrictos generan JSON Schema y tienen pruebas de regresión para campos inesperados, rutas, IDs, revisiones, tamaños y compatibilidad con MotionSpec V1. El orden de offsets de evidencia se valida en runtime. Falta la prueba de equivalencia con un validador JSON Schema independiente.
- El tarball se instaló en un proyecto temporal. Se verificó la importación ESM y la validación de MotionSpec V1. La instalación limpia usó el registro público npm para resolver dependencias.
- Blender 4.3.2 generó un `.blend`, un GLB con partes editables y clips `idle`, `open` y `settle`, y un PNG RGBA de 420 × 420. Chromium cargó el GLB en WebGL, verificó que los píxeles del escenario cambian al lanzar `open` y mostró el PNG con movimiento reducido. La muestra es sintética. Quedan pendientes el validador glTF independiente, las mediciones, la evaluación de geometría y la revisión visual humana.

## Estado por área

| Área | Evidencia disponible | Pendiente |
| --- | --- | --- |
| Infraestructura | Lockfile, instalación, compilación, tipos, ocho pruebas y paquete local | CI remota, rollback, matriz de instalación y observabilidad |
| RAG | Auditoría, contratos de evidencia y catálogo previo | Ontología migrada, corpus, recuperación evaluada y conexión con propuestas |
| Compilador | Compatibilidad con MotionSpec V1 | IR, DAG, timeline racional, negociación y pruebas entre renderizadores |
| Gráficos y tipografía | Sin nueva evidencia de ejecución | Layout, fuentes, datos, captions y presentaciones |
| Blender | Receta sintética, builder local y tres formatos reales | Worker aislado general, validador, tolerancias y revisión |
| Living | Control local de clips y fallback | Runtime común, infografías, texto, controles, partículas y métricas |
| UI Lab | Prototipo de correo y prueba Chromium | Otras cinco demos, catálogo, inspector, timeline y regresión |
| Sensorial | Diseño documental | Autorización explícita de fase 2 |
| Integración | Tarball e importación desde proyecto limpio | Harness multi-tenant, autoridad, idempotencia e integración con el padre |
| Producción | Workflow de verificación y recibos locales | CI remota, auditorías, SBOM, release candidate y despliegue autorizado |

La puntuación inicial y final de madurez sigue pendiente de un desglose verificable de los subchecks. Esta ejecución no certifica el umbral 80/100.

## Reanudar

Retomar P07 con el adaptador de árboles Git, HTML y CSS. Mantener P05.E pendiente de identidades revisadas y P06.C/E pendiente de persistencia durable. Generar recibos en `lab/staging/` con audit:library, stage:library, export:ontology, reconcile:library y plan:claims. Ejecutar build antes de export:ontology y plan:claims. El registro incluye rutas y hashes. Las instrucciones de la demo están en [UI Lab](../../apps/ui-lab/src/README.md).

Para regresar a la línea base, usar la rama `main` en un checkout limpio. El plan no escribió punteros, snapshots públicos, revisiones ni activos. Los recibos y binarios generados están fuera de seguimiento Git.
