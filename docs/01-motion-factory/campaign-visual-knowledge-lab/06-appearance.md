# 06-appearance — Anatomía y propiedades visuales
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Medir dimensiones, alpha, paleta cuantizada, distribución luminosa y aspecto con decoder aislado; no inferir material físico por color. Extraer intención de prompts con negación y alcance: 'no neon' no etiqueta neon positivo. Anotar partes, silueta, perspectiva, materiales, iluminación como hipótesis hasta revisión visual.
## Patchsets previstos
- P1: lab/scripts/inspect-images.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: library/entities/*/appearance.json — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Fixtures con transparencia, colores conocidos, negación y corruptos; métricas reproducibles; límites de memoria/píxeles.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
