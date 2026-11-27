# 09-reconstruction — Reconstrucción Blender y exportación
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Recipe declarativa: geometría primitiva, capas, materiales, cámara, luces, escala, restricciones, incertidumbre. Distinguir 2D, 2.5D y 3D; una imagen no determina geometría oculta. No Python libre; futuro adaptador allowlist. ExportSpec para PNG/WebP/GLB/WebM con presupuestos.
## Patchsets previstos
- P1: src/factory/renderers/blender/recipe.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: knowledge/factory/reconstruction/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Recetas sintéticas válidas y rechazadas; no afirmar render ni reconstrucción ejecutados; checklist de fidelidad visual.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
