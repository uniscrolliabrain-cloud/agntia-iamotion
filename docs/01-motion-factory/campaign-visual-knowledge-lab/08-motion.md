# 08-motion — Gramática de comportamiento
Estado: pendiente de ejecución.
## Objetivo y algoritmo
BehaviorSpec versionado: target, pivot, axes, keyframes, durationMs, easing, loop, trigger, state, reducedMotion, bounds. Primitivas breathe/float/drift/settle/focus/orbit/pulse/reveal/cascade/fold/emerge/dissolve. Diferenciar animación de imagen plana y partes reconstruidas; propuestas sin ejecución.
## Patchsets previstos
- P1: src/factory/behaviors/spec.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: knowledge/factory/behaviors/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: lab/scripts/propose-motion.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Rechazar targets inexistentes, amplitud/duración fuera de política, ciclos no acotados y ausencia de fallback; fixtures idle/hover/working.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
