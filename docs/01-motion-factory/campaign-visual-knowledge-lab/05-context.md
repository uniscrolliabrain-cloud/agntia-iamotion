# 05-context — Arqueología UX y empresarial
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Parsear imports estáticos, CSS url, HTML src y manifiestos; resolver rutas relativas y public; registrar patrones dinámicos sin fingir resolución. Clasificar app normal, Mi Empresa, ui-lab, legacy; pin commit y componente/línea. Extraer workspace, tarea, rol y estado.
## Patchsets previstos
- P1: lab/scripts/extract-usage.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: library/catalog/usage.json — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Fixtures de basename duplicado, glob, template literal, legacy y referencia rota; precisión manual sobre muestra estratificada.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
