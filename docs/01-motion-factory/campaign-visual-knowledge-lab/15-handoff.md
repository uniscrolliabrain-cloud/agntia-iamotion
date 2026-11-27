# 15-handoff — Consolidación y migración al runtime
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Mapear cada contrato al resolver, compiler, renderers, jobs y host authority. Exportar catálogo versionado separado del bundle; no cargar 403 imágenes en cliente. Mantener laboratorio como harness de evaluación; empaquetado futuro según cyber; no instalar agente ni activar Pages.
## Patchsets previstos
- P1: docs/01-motion-factory/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: src/sdk/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: tests/contracts/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Contrato de lectura y propuesta probado con fixtures; rollback y compatibilidad documentados; gate humano antes de cualquier conexión.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
