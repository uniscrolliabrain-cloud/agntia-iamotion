# Continuidad de ejecución

Rama local `campaign/visual-knowledge-lab-execution` desde `e813901194bef2478bf300738273eadf38d9e5c8`. El [registro de ejecución](ledger.json) enumera P01–P52 y las 260 unidades. Los tres commits principales son `3fa751d` para auditoría y simulación de migración, `ca0f959` para contratos y `0cfd2ec` para el render y la demo. `c07fca0` verifica el cambio de la imagen renderizada en Chromium.

## Séptimo tramo de ejecución

- El fundador rechazó la calidad visual de los ejemplos previos. La comparación local usa la miniatura de correo del launcher `6a1165b1c960943d34b5716288068cb19b4f6cfa830f34b3b7f4b5dfeba8b21a` como referencia. La nueva malla separa los pliegues, la solapa, el sello abombado y su aro. Blender produjo un póster lavanda, un PNG transparente, el GLB y una escena editable con iluminación. Chromium verificó la apertura del nuevo GLB, la flotación y el fallback. El render y la nueva dirección tipográfica siguen pendientes de aceptación visual.
- El estudio local añade una infografía de tres nodos, texto español y árabe, un botón nativo con controles de profundidad, radio y luz, y una presentación con búsqueda por fotograma y dos formatos. Chromium verificó los valores exactos, el teclado, el movimiento reducido y seis composiciones de escena. FFmpeg generó dos MP4 reproducibles de 300 fotogramas a 24 fps con tres cortes de escena.
- Las técnicas gráficas se recuperan del corpus sintético y alimentan una propuesta validada. Los bloqueos de texto y valores evitan alterar el contenido. Las tres recetas Canvas se seleccionan mediante un binding acotado por ámbito y revisión. El host local Hono verificó aislamiento, repetición idempotente y rechazo de conflictos.
- Pasaron 89 pruebas Node, tres Python, typecheck y build de UI Lab. El SDK se instaló en un proyecto temporal y el control de paquete rechazó una fixture que contenía un binario. El registro devolvió cero avisos para las dos dependencias de ejecución al consultar el audit. Los derechos de activos y la ejecución de CI remota tienen sus propios criterios.
- El ledger registra 199 de 260 unidades verificadas. La aceptación de dirección de arte, las mediciones en dispositivos y la madurez de 80/100 siguen abiertas.

Los archivos de revisión están en `lab/staging/studio-fixture/`, incluyendo `style-review.html`, capturas y MP4. El tarball y sus recibos están en `lab/staging/release-studio/`. La auditoría de la línea base se repitió desde `e813901` usando las dependencias del entorno actual en un checkout temporal. Eso confirma build, declaraciones, MotionSpec V1, búsqueda léxica y autoridad denegada por defecto. La puntuación de madurez todavía requiere el desglose por gate.

## Sexto tramo de ejecución

- P33–P39. Los tracks se enlazan a capas por ID y convierten milisegundos a ticks exactos. El sampler respeta intervalos semiabiertos y usa el mismo evaluador de keyframes que la demo anterior. Se añadieron áreas seguras, breakpoints de layout, graphemes intactos y fade de texto completo con fallback legible. DejaVu Sans regular y bold se verificaron por hash, cobertura cmap y evidencia de licencia. Quedan pendientes el port de shaping avanzado, los métodos de easing restantes y el layout de texto medido en todas las orientaciones.
- P40–P44. El gráfico usa una revisión de datos sintéticos con valores exactos 42, 28 y 16 y una escala desde cero. Chromium comprobó la tabla y ambos layouts sin desbordamiento horizontal. FFmpeg generó dos MP4 silenciosos de 1,5 segundos, 36 frames a 24 fps, en 960 × 540 y 540 × 960. Las dos codificaciones produjeron los mismos hashes. El verificador comprobó texto, duraciones, subtítulos extraídos, hashes de SVG, cambio de píxeles y bounds. La evaluación humana, el diseño de presentaciones y el adaptador de audio siguen pendientes.
- P45–P49/P51. El campo de partículas usa posiciones enteras, semilla, límite de capacidad, fuerzas acotadas y checkpoint reproducible. La demo Canvas2D usa dos niveles de densidad, puntero normalizado y pausa fuera del viewport. Chromium verificó 180 y 96 partículas según el ancho, cancelación del puntero y vista estática con movimiento reducido. El intervalo p95 de 16,8 ms se observó en 90 frames de un Chromium headless del sandbox. Faltan pruebas en dispositivos, memoria, recetas adicionales y bindings del host.
- Verificación con 83 pruebas Node, tres Python, typecheck y build de UI Lab. El ledger registra 184 de 260 unidades verificadas. Vite mantiene la advertencia de tamaño del bundle 3D y avisos de anotaciones en Zod. Los vídeos y la vista accesible están en `lab/staging/graphics-fixture/` junto a los recibos.

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
| Compilador | MotionSpec V1, tracks enlazados al IR y reloj racional | Pruebas de equivalencia para casos avanzados entre renderizadores |
| Gráficos y tipografía | Layout, fuentes locales verificadas, SVG y dos MP4 con captions | Shaping avanzado, semántica completa del timeline y presentaciones |
| Blender | Receta sintética, builder local y tres formatos reales | Worker aislado general, validador, tolerancias y revisión |
| Living | Sampler, clips y partículas Canvas2D verificados en Chromium | Más recetas, métricas en dispositivos, infografías conectadas al host |
| UI Lab | Prototipos de correo y partículas, dos layouts de gráfico y recibos de Chromium | Demos restantes, catálogo, inspector, timeline y regresión |
| Sensorial | Diseño documental | Autorización explícita de fase 2 |
| Integración | SDK local con autorización y derechos vigentes, tarball instalado en proyecto limpio | Harness multi-tenant real, idempotencia e integración con el padre |
| Producción | Workflow de verificación y recibos locales | CI remota, auditorías, SBOM, release candidate y despliegue autorizado |

La puntuación inicial y final de madurez sigue pendiente de un desglose verificable de los subchecks. Esta ejecución no certifica el umbral 80/100.

## Reanudar

Retomar la revisión visual contra las referencias del launcher y cerrar los puntos pendientes de P44, P50–P52 y P51. Mantener separados los resultados de navegador en sandbox y la evaluación en dispositivos reales. Mantener abierta la evaluación humana P21.E y la integración fuera del sandbox. Mantener P05.E pendiente de identidades revisadas, P06.C/E pendiente de persistencia durable y P07.E pendiente de evidencia de uso revisada. Generar recibos en `lab/staging/` con audit:library, stage:library, export:ontology, reconcile:library y plan:claims. Ejecutar build antes de export:ontology y plan:claims. El registro incluye rutas y hashes. Las instrucciones de la demo están en [UI Lab](../../apps/ui-lab/src/README.md).

Para regresar a la línea base, usar la rama `main` en un checkout limpio. El plan no escribió punteros, snapshots públicos, revisiones ni activos. Los recibos y binarios generados están fuera de seguimiento Git.
