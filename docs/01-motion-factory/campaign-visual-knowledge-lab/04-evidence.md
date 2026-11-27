# 04-evidence — Modelo de evidencia y revisión
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Claim: id, entityId, facet, predicate, value, basis, sourceRef, sourceHash, span, confidence, status, revision. Separar observed, measured, source-spec, path-inference, proposed. No convertir prompt en observación. Revisiones append-only, supersedes, conflictos coexistentes; approval por actor autorizado.
## Patchsets previstos
- P1: src/factory/assets/evidence.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: library/reviews/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: lab/scripts/validate-claims.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Rechazar claims sin fuente, referencias rotas, promoción automática y revisión obsoleta.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
