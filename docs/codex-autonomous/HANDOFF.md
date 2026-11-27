# Continuidad de ejecución

Rama local `campaign/visual-knowledge-lab-execution` desde `e813901194bef2478bf300738273eadf38d9e5c8`. El [registro de ejecución](ledger.json) enumera P01–P52 y las 260 unidades. Los tres commits principales son `3fa751d` para auditoría y simulación de migración, `ca0f959` para contratos y `0cfd2ec` para el render y la demo. `c07fca0` verifica el cambio de la imagen renderizada en Chromium.

## Quinto tramo de ejecución

- P13–P14. UI Lab compila el timeline de «Flotar» al construir la demo. El sampler aplica el desplazamiento en la vista WebGL. Chromium verificó el clip de apertura, la flotación y el cambio a PNG con movimiento reducido. El sampler recibe tiempo explícito y el bundle de la vista contiene el timeline validado en el build.
- P18/P21–P26. El corpus sintético guarda JSONL, bajas, índice inverso y manifiesto por hash. Después de la lectura verificada, el flujo genera un briefing y una propuesta MotionSpec con un mock local. Se añadieron embeddings con ámbito, modelo y presupuesto, búsqueda híbrida con fallback léxico, y un registro de prompts versionados. El test de recuperación del pipeline abarca un juicio sintético. La evaluación humana del corpus real y la conexión al host quedan pendientes.
- P27–P30. El pipeline local ordena dependencias, verifica hashes de caché y registra eventos sin incluir errores originales. Verificó una ejecución de tres etapas y la reutilización de caché. El flujo de revisión de snapshots exigió autorización, revisión vigente y derechos en pruebas sintéticas. Los comandos del nuevo workflow de verificación se ejecutaron localmente. Su ejecución en GitHub Actions sigue sin verificarse.
- P31–P32. El SDK consulta metadatos con autorización del host, comprueba el ámbito y el hash del manifiesto, y aplica los derechos vigentes. El tarball de `0a5f1c8` pasó el control de contenido y se instaló en un proyecto temporal. Allí se verificaron las exportaciones, la autorización de metadatos sintéticos y el tiempo exacto de frames.
- P33–P34. Se añadieron un IR de capas con comprobación de ciclos y un reloj racional exacto, más formas acotadas y serialización SVG determinista. La muestra SVG pasó el parser XML local. El adaptador de comportamientos al IR y la integración de formas en el renderizador siguen pendientes.
- Pasaron 70 pruebas Node, tres Python, typecheck y build de UI Lab. El ledger registra 124 de 260 unidades verificadas. El build de UI Lab mantiene una advertencia de tamaño del chunk 3D.

Los recibos de este tramo están en `lab/staging/`. `rag-durable.json`, `proposal.json` y `pipeline.json` reproducen el flujo sintético. `browser-float.txt` registra el smoke test de Chromium. `long-turn-final/` contiene el tarball, el informe de contenido, el registro de instalación y la muestra SVG.

## Cuarto tramo de ejecución

- P13–P15. Doce primitivas producen tracks acotados. La composición serial y paralela usa milisegundos enteros para intervalos, admite repeticiones finitas autorizadas y rechaza la superposición de la misma propiedad sobre el mismo destino. El plan reproduce cuatro propuestas sobre tres casos sintéticos. Las 133 fichas reales quedan pendientes de identidades visuales revisadas. El runtime web y Blender todavía no consumen estos timelines.
- P16–P17. Los contratos validan jerarquía, geometría declarativa, materiales, hashes autorizados, revisión, fallback, transparencia y presupuestos. El builder del correo anterior usa su propia fixture. Falta conectar los contratos a renderizadores y validar los archivos resultantes.
- P18–P20. El compilador RAG separa observaciones y propuestas, conserva contradicciones, emite índice de evidencia y detecta cambios y bajas por ámbito. El índice léxico usa BM25 por título y texto. Los filtros de ámbito, idioma y base se aplican antes de calcular puntuaciones. El briefing mantiene referencias separadas de los activos que autoriza el llamador. El smoke test sintético cubre la cadena completa y la abstención fuera del ámbito.
- P21. El evaluador calcula Recall@5/10, MRR, nDCG@10 y abstención con denominadores explícitos. Rechaza identidades visuales que crucen validación y prueba. La aritmética se verificó con juicios sintéticos. Faltan juicios humanos, comparación con la línea base y latencia.
- Verificación con 50 pruebas Node, tres pruebas Python, typecheck y build de UI Lab. El ledger registra 81 unidades verificadas de 260. El objetivo de madurez mantiene sus propios criterios de aceptación.

## Tercer tramo de ejecución

- P07. El adaptador Git leyó 41 archivos fuente en `4979c06` y obtuvo cero referencias coincidentes. Dos informes fueron idénticos. Los casos positivos y negativos de JSX, HTML, CSS, globs, enlaces simbólicos y cambios del árbol de trabajo se verificaron en fixtures. El extractor cubre atributos HTML básicos y `url()` de declaraciones CSS. Quedan pendientes `srcset`, CSS embebido y la evaluación manual sobre fuentes autorizadas.
- P08. Las 133 fichas tienen contexto especificado mediante IDs de colecciones y workspaces. La taxonomía distingue aplicación, Mi Empresa y demo. El informe expresa intención de uso. La conexión con usos observados por workspace sigue pendiente.
- P09. Pillow 13.0.0 midió 387 ráster y el parser estático leyó 16 SVG. El informe reproduce los resultados byte a byte y registró cero errores. La paleta y luminancia se calculan en el primer fotograma con sRGB supuesto, sin aplicar perfiles ICC.
- P10. En 133 fichas se localizaron 3100 menciones positivas, 85 negativas y 86 ambiguas o inciertas, con offsets del texto original. La extracción es heurística y conserva la base de intención.
- P11. Las cuatro familias conservan paletas, materiales y propósitos separados. Los ocho ejemplos son candidatos. Las reglas de compatibilidad son direccionales, específicas al contexto y pendientes de revisión artística.
- P12. El informe de apariencia separa mediciones ráster, metadatos SVG e intención en 403 registros. Las partes observadas de esos binarios siguen desconocidas. Las pruebas sintéticas validan regiones, evidencia y ciclos de parentesco.
- P13. El contrato de comportamiento comprueba destino, capacidad declarada del renderizador, unidades, tiempos, loops y pose estática obligatoria. Quedan pendientes la composición de primitivas y la conexión al runtime. MotionSpec V1 conserva su API.
- Verificación de este tramo con 34 pruebas Node, tres pruebas de imágenes Python, typecheck y build de UI Lab. El ledger registra 54 de 260 unidades verificadas. Este recuento no es una puntuación de madurez.

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
| RAG | Auditoría, ontología, corpus sintético, recuperación y propuesta local | Corpus real revisado, evaluación humana y autorización del host |
| Compilador | MotionSpec V1, composición de behavior y reloj racional | Adaptar el timeline al IR y verificar entre renderizadores |
| Gráficos y tipografía | Formas validadas y exportación SVG local | Layout, fuentes, datos, captions y presentaciones |
| Blender | Receta sintética, builder local y tres formatos reales | Worker aislado general, validador, tolerancias y revisión |
| Living | Sampler local, clips, flotación y fallback verificados en Chromium | Runtime común, infografías, texto, controles, partículas y métricas |
| UI Lab | Prototipo de correo y prueba Chromium | Otras cinco demos, catálogo, inspector, timeline y regresión |
| Sensorial | Diseño documental | Autorización explícita de fase 2 |
| Integración | SDK local con autorización y derechos vigentes, tarball instalado en proyecto limpio | Harness multi-tenant real, idempotencia e integración con el padre |
| Producción | Workflow de verificación y recibos locales | CI remota, auditorías, SBOM, release candidate y despliegue autorizado |

La puntuación inicial y final de madurez sigue pendiente de un desglose verificable de los subchecks. Esta ejecución no certifica el umbral 80/100.

## Reanudar

Retomar P33.C/E y P34.E para adaptar los tracks al IR y generar manifests de formas. Continuar P35–P42 con layout, tipografía, sampler de composición y negociación real de renderizadores. Mantener abierta la evaluación humana P21.E y la integración fuera del sandbox. Mantener P05.E pendiente de identidades revisadas, P06.C/E pendiente de persistencia durable y P07.E pendiente de evidencia de uso revisada. Generar recibos en `lab/staging/` con audit:library, stage:library, export:ontology, reconcile:library y plan:claims. Ejecutar build antes de export:ontology y plan:claims. El registro incluye rutas y hashes. Las instrucciones de la demo están en [UI Lab](../../apps/ui-lab/src/README.md).

Para regresar a la línea base, usar la rama `main` en un checkout limpio. El plan no escribió punteros, snapshots públicos, revisiones ni activos. Los recibos y binarios generados están fuera de seguimiento Git.
