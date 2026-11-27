# 01 — Factoría audiovisual y comportamientos vivos

## Propósito
Crear vídeos, motion text, iconos, gráficos y visuales vivos para web, con futurismo elegante y sutil. Identidad AgntiaPro: cerámica, plastilina, geometría orgánica, profundidad, luz difusa y coreografía contenida. No es un editor de vídeo generalista.

## Árbol objetivo (propuesto, no implementado)
    src/
      api/
      contracts/
      compiler/
      live/
      film/
      blender/
      verification/
    primitives/
    behaviors/
    templates/
    presets/agntiapro/
    skills/
    examples/
    tests/

## Motores
- Live: SVG, CSS, Motion, Three.js, componentes React; máquinas de estados y exportación GLB.
- Film: tipografía cinética, microvídeos, timelines, composición y transparencia; evaluar HyperFrames, Chromium y FFmpeg.
- Blender: scripts Python headless, materiales procedurales, Geometry Nodes, cámaras, luces, renders y exportación glTF/GLB.
- Compilador común: MotionSpec y BehaviorSpec tipados con Zod, registro de activos, previews, versiones y validación. LLM propone especificaciones; ejecución controlada y reproducible. No ejecutar código arbitrario sin aislamiento.

## Gramática
Presencia: breathe, float, drift, settle. Materiales: soften, reflect, glow, deform. Cognición: focus, orbit, connect, pulse. Interacción: approach, attract, respond, release. Espacialidad: expand, fold, emerge, depth. Tipografía: reveal, assemble, morph, cascade. Cinematografía: dolly, parallax, rackFocus, pan. Transiciones: dissolve, continuity, sharedMorph.
Parámetros: intensidad, duración, frecuencia, amortiguación, aceleración, contexto, curvas, semilla y estados. Eventos reales del runtime pueden alimentar estados visuales mediante contratos, sin inventar actividad.

## Referencias a auditar
- https://github.com/motiondivision/motion
- https://github.com/heygen-com/hyperframes
- https://github.com/mrdoob/three.js
- https://github.com/blender/blender
- https://github.com/motion-canvas/motion-canvas
- https://github.com/pmndrs/react-three-fiber
- https://github.com/rive-app/rive-runtime
- https://github.com/airbnb/lottie-web
- https://github.com/theatre-js/theatre
- https://github.com/juliangarnier/anime
- https://github.com/remotion-dev/remotion
- https://github.com/motiondivision/ai-kit
- https://github.com/ANVEAI/motion-pack
- https://github.com/ppmpreetham/three-blender
- https://github.com/bardia-ardakanian/blender-headless-render
Selección provisional: verificar existencia, código, mantenimiento, licencias y dependencias antes de adoptar. Evitar motores redundantes.

## Catálogo inicial propuesto
50 activos: 12 iconos cerámicos vivos, 8 visuales cognitivos, 8 motion text, 6 ambientales, 6 transiciones espaciales, 4 logos, 6 microvídeos. Cada activo con fuente, especificación, preview, variantes, formatos y pruebas. Exportaciones SVG, GLB, WebM, MP4, PNG, React y CSS según corresponda.

## Orden de trabajo
1. Arqueología técnica y licencias.
2. Contratos y primitivas.
3. Vertical slice de icono vivo y motion text.
4. Blender headless y exportación web.
5. Composición audiovisual.
6. Catálogo, benchmarks y certificación.
7. Integración con ui-lab mediante activos versionados.

## Calidad
Movimiento reducido, contraste, pausa fuera de pantalla, presupuestos de CPU/GPU y memoria, fallback estático, pruebas visuales y temporales, seguridad de render y aislamiento de procesos. No alterar interfaces aprobadas sin autorización. El motor debe ser pequeño, no otro framework gigantesco.
