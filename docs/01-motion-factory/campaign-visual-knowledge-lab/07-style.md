# 07-style — Familias y dirección artística
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Separar launcher cerámica, Mi Empresa editorial papel, formación fotográfica, automatizaciones nodos y familias por descubrir. Extraer restricciones positivas/negativas, compatibilidad contextual, excepciones. No homogeneizar branding ni mezclar landing y app sin revisión.
## Patchsets previstos
- P1: knowledge/factory/style-families/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: library/catalog/style-graph.json — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Comparar familias con ejemplos y contraejemplos; incompatibilidades explicadas; revisión artística humana.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
