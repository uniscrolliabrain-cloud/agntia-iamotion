# 03-identity — Identidad conceptual y variantes
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Separar binaryId=SHA256 de visualId estable; conservar 403 carpetas actuales como registros de evidencia; crear agrupaciones conceptuales propuestas por manifiesto y revisión, nunca por similitud sola. Resolver 14 tarjetas huérfanas por ruta exacta y commit; registrar conflictos y candidatos.
## Patchsets previstos
- P1: library/entities/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: library/catalog/entity-map.json — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: lab/scripts/reconcile-entities.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Cada binario tiene identidad; ninguna agrupación automática ambigua; relaciones inversas consistentes; replay idéntico.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
