# 10-rag — Compilación de fichas RAG
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Fichas por entidad y faceta: identity, semantic, ux, appearance, style, motion, reconstruction, governance. IDs estables, revision, evidenceIds, scope, contentHash, text ES/EN, metadata filters. Separar propuestas de hechos; chunking por unidad semántica, no cortar evidencias; JSONL y manifest deterministas.
## Patchsets previstos
- P1: library/rag/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: lab/scripts/compile-rag.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: src/factory/assets/rag-contract.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Cada chunk trazable a claims; ningún secreto ni tenant privado; cambios incrementales y tombstones; snapshot reproducible.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
