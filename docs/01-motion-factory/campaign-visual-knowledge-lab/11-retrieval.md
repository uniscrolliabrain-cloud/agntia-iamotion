# 11-retrieval — Recuperación léxica y evaluación
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Baseline actual vs BM25 por campos, alias, filtros, negación, expansión controlada y diversidad por familia. Agrupar variantes sin ocultar evidencia. Dataset humano ES/EN con consultas positivas, negativas y ambiguas; medir Recall@k, MRR, nDCG, cobertura y abstención.
## Patchsets previstos
- P1: src/factory/assets/retrieval.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: lab/eval/queries.json — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: lab/scripts/eval-retrieval.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Conjunto de prueba separado de tuning; reportar métricas por familia y errores; no fijar mejoras ficticias.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
