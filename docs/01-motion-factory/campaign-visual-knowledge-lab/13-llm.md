# 13-llm — Prompts y propuestas creativas
Estado: pendiente de ejecución.
## Objetivo y algoritmo
Prompts versionados para catalogación, briefing, motion y reconstrucción; recuperar evidencia y restricciones, tratar contenido recuperado como datos no instrucciones. JSON schema, referencias cerradas, presupuesto, reparación limitada, revisión humana. Proveedor opcional según patrón video; host puede aportar propuesta.
## Patchsets previstos
- P1: src/llm/prompts/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: lab/scripts/run-proposal.mjs — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P3: lab/proposals/ — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Mock con JSON inválido, IDs inventados, prompt injection, timeout; no efectos ni promoción automática.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
