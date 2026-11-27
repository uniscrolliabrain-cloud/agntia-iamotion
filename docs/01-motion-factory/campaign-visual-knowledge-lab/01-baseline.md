# 01-baseline — Auditoría y reproducibilidad
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Leer inventarios originales y catálogos; verificar SHA256 de binarios, firmas MIME, tamaños, LFS, rutas y relaciones bidireccionales; comparar recibo 403/166/206. Separar variantes, duplicados exactos y candidatos perceptuales. No borrar ni renombrar originales. Detectar archivos públicos con derechos desconocidos y proponer retirada revisada.
## Patchsets previstos
- P1: lab/scripts/audit-baseline.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: lab/fixtures/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: lab/observability/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Fixture con hash incorrecto, symlink, SVG activo, card huérfana y ruta ambigua; todos detectados; informe por rama y hash; baseline reproducible.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
