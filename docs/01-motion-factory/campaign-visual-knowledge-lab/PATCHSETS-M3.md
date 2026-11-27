# M3 — Motion y reconstrucción
## P13 — BehaviorSpec
src/factory/behaviors/spec.ts: {version,behaviorId,visualId,target:{kind,partId?},primitive,trigger,state,tracks[],durationMs,loop,reducedMotion,bounds,evidenceIds,status}. Track {property,unit,keyframes:[{t,value,easing}]}; t normalizado 0..1 estrictamente creciente, valores finitos, propiedades allowlist transform/opacity; sin CSS libre. Loop solo para idle autorizado; fallback estático obligatorio. Validar target existente y capacidad del renderer. Presupuestos iniciales configurables, no universales: duración 100..60000ms, máximo 32 tracks, 128 keyframes/track.
## P14 — Gramática
Primitivas breathe (escala suave), float (traslación), drift (desplazamiento lento), settle (retorno), focus (énfasis), orbit (rotación alrededor de pivote), pulse (pulso), reveal (aparición), cascade (desfase), fold/emerge (requieren geometría/capas), dissolve (opacidad). Composición serial/paralela con detección de conflicto de propiedad y prioridad explícita. No atribuir emoción garantizada. Idle no interfiere con lectura ni acción; reduced motion sustituye por estado estático.
## P15 — Propuestas por entidad
lab/scripts/propose-motion.mjs: reglas deterministas por UX role y capabilities; imagen plana admite transform global, no movimiento independiente de partes sin segmentación. Cada candidato incluye rationale, evidenceIds, prerequisites, incompatibilities y status proposed. Ejemplo correo: float global; sello independiente solo tras reconstrucción. No renderizar ni aprobar.
## P16 — ReconstructionRecipe
src/factory/renderers/blender/recipe.ts: version, visualId, mode 2d/2.5d/3d, parts, primitiveGeometry, materialIntent, camera, lights, scale, constraints, uncertainty, requiredInputs. IDs de piezas únicos, DAG sin ciclos, unidades explícitas, sin código Python ni rutas externas. Geometría oculta no inferida como hecho. Adaptador futuro traduce allowlist a Blender; worker aislado.
## P17 — ExportSpec
Formato, width/height, fps si vídeo, duration, alpha, colorSpace, byteBudget, renderer, sourceRevision. WebP/PNG para estático, SVG solo sanitizado, GLB para 3D, WebM/MP4 según compatibilidad. No declarar transparencia MP4 genérica. Validar presupuesto y fallback. No producir archivos aún.
## Tests
Keyframes desordenados, NaN, target ausente, conflicto paralelo, loop no autorizado, reduced motion ausente, receta cíclica, propiedad desconocida, presupuesto excedido. Golden fixtures de sobre, nodo workflow y foto editorial; propuestas diferenciadas por soporte real. Ningún test implica render real.
