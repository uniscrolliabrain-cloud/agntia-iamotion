# 14-lab — Ejecutor provisional y observabilidad
Estado: pendiente de ejecución.
## Objetivo y algoritmo
DAG audit->ontology->entities->claims->rag->eval->proposal opcional. Run manifest con commit, hashes, versiones, etapas, duración, counts, errores, coste si disponible. Staging atómico, locks, replay, idempotencia, no sobrescribir revisiones; workflows manuales, permisos mínimos, sin auto-publicación de propuestas.
## Patchsets previstos
- P1: lab/scripts/run.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: lab/observability/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: setup/github-actions/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Simular fallo intermedio, concurrencia, reintento, salida parcial y replay; recibos de éxito/fallo; sin secretos.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
