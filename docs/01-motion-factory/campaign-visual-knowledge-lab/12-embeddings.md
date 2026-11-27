# 12-embeddings — Puerto embeddings y búsqueda híbrida
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Proveedor opcional, modelId/version/dimensión, hash de contenido, namespace, batch/retry/rate/cost limits. Índices separados por modelo y scope; RRF lexical/vector, evaluación comparativa; sin proveedor devolver not_configured. No enviar imágenes sin permiso.
## Patchsets previstos
- P1: src/llm/embeddings-port.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: lab/scripts/embed.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: setup/llm/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Mock determinista, dimensión incorrecta, timeout, duplicado y ausencia de configuración; ningún secreto en Git.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
