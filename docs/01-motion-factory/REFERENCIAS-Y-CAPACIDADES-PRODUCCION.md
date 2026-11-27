# Motion Factory — referencias y capacidades objetivo
Estado: diseño, no certificación de producción. Fase 1 exclusivamente; la inteligencia sensorial adaptativa pertenece a fase 2.

## Repositorios y decisiones
| Repositorio | Conceptos a estudiar | Integración candidata |
|---|---|---|
| [Motion](https://github.com/motiondivision/motion) | springs, gestos, layout, transiciones, presencia | runtime web |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | composición HTML/CSS/JS, timeline, render por frames | render audiovisual |
| [Blender](https://github.com/blender/blender) | Python headless, materiales, iluminación, geometry nodes, cámaras | worker aislado |
| [Three.js](https://github.com/mrdoob/three.js) | escena 3D, GLTF, shaders, iluminación | runtime web 3D |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | coreografía, generadores, timeline, texto y gráficos | estudiar/adaptar conceptos |
| [Anime.js](https://github.com/juliangarnier/anime) | secuencias, stagger, easing, SVG | alternativa ligera |
| [Theatre.js](https://github.com/theatre-js/theatre) | keyframes, edición y coreografía espacial | referencia |
| [Rive](https://github.com/rive-app/rive-runtime) | máquinas de estados y activos interactivos | referencia/compatibilidad |
| [Lottie](https://github.com/airbnb/lottie-web) | reproducción de animación vectorial | compatibilidad |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | integración declarativa React/Three | adaptador cliente candidato |
| [Remotion](https://github.com/remotion-dev/remotion) | composición audiovisual React y render por frames | referencia, revisar licencia comercial |
| [Revideo](https://github.com/redotvideo/revideo) | composición programática de vídeo | referencia |
| [Manim](https://github.com/ManimCommunity/manim) | geometría, texto matemático y transformaciones | referencia |
| [three-blender](https://github.com/ppmeetham/three-blender) | puente Blender a web | referencia por verificar |
| [blender-headless-render](https://github.com/bardia-ardakanian/blender-headless-render) | render automatizado | referencia por verificar |
| [Motion AI kit](https://github.com/motiondivision/ai-kit) | instrucciones para agentes de diseño | estudiar, distinguir Motion+ |
| [Motion Pack](https://github.com/ANVEAI/motion-pack) | skills de composición | referencia por verificar |
| [glTF Transform](https://github.com/donmccurdy/glTF-Transform) | optimización GLB | pipeline candidato |
| [glTF Validator](https://github.com/KhronosGroup/glTF-Validator) | validación de activos | pipeline candidato |
| [meshoptimizer](https://github.com/zeux/meshoptimizer) | compresión y optimización de geometría | pipeline candidato |
| [model-viewer](https://github.com/google/model-viewer) | visualización web de modelos | referencia |
| [Blender MCP](https://github.com/ahujasid/blender-mcp) | interfaz agente a escena | referencia, no autoridad de ejecución |
| [Editly](https://github.com/mifi/editly) | composición declarativa de vídeo | referencia |
No se afirma haber auditado código, fijado versiones ni aprobado licencias. Antes de incorporar código: comprobar existencia, licencia y dependencias transitivas, compatibilidad comercial, seguridad, mantenimiento, benchmarks y atribución. Conceptos no equivalen a copiar código. Preferir adaptadores pequeños; no instalar todos estos repos.

## Capacidad objetivo una vez consolidado e instalado en agente
- Biblioteca única: imágenes, iconos, avatares, ilustraciones y variantes con procedencia, metadata RAG, prompts, derechos, usos en componentes, nombres semánticos y hashes.
- Crear iconos vivos con estados idle, hover, focus, working, success, error; SVG/CSS/React y GLB según necesidad.
- Motion text: reveal, cascade, morph, stagger, tipografía cinética, títulos y subtítulos.
- Motion graphics: geometría, grafos, partículas contenidas, visualización de estados y datos reales; no inventar datos.
- Blender: escenas procedurales, cerámica, esmalte, metal, iluminación, cámaras, render PNG/WebP, secuencias y export GLB.
- Microvídeos y composiciones transparentes WebM, MP4 y secuencias; render reproducible por frame, FFmpeg, audio opcional.
- Comportamientos reutilizables: breathe, float, drift, settle, focus, orbit, pulse, expand, fold, emerge, parallax, dissolve y shared transitions.
- Dirección artística coherente con las familias existentes, no reemplazar UX aprobada; preservar landing, componentes y navegación.
- Previsualizar y certificar en apps/ui-lab; integrar después en app normal y Mi Empresa, sin convertir demos en producción.
- Hono/pnpm/TypeScript: API y SDK tipados, Zod MotionSpec/BehaviorSpec/RenderJob/AssetManifest; jobs asíncronos, artefactos versionados, límites, idempotencia y errores explícitos.
- LLM propone especificaciones; compilador valida y ejecuta adaptadores permitidos; kernel de agente conserva autoridad, permisos y auditoría. El cliente consume assets y comportamientos aprobados, no código arbitrario generado por LLM.
- Integración por paquete/adaptador versionado, manifiesto y URLs de activos; evitar acoplar Blender o Chromium al bundle React. Workers separados, almacenamiento de artefactos y caché por hash.
- Accesibilidad: reduced motion, fallback estático, pausa fuera de viewport, límites de FPS/memoria, ausencia de flashes peligrosos; pruebas móvil/escritorio y presupuesto por workspace.

## Criterios de producción
Inventario y auditoría visual completos; contratos y adaptadores probados; licencia aprobada; render reproducible dentro de tolerancias; validación de formatos y seguridad; pruebas de integración en agente y ui-lab; mediciones de rendimiento y accesibilidad; rollback y observabilidad. No afirmar disponibilidad hasta evidencia de instalación, build, pruebas y despliegue autorizado.

## Fuera de fase 1
DJ mixer multisensorial, cascada adaptativa por tenant/usuario, grabación de partituras UX, RAG de hábitos, formación especializada y fine-tuning: documentados en fase 2, no dependencias para entregar fase 1.
