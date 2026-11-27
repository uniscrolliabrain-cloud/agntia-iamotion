# 02-ontology — Ontología y léxico bilingüe
Estado: pendiente de ejecución.
## Objetivo y algoritmo
IDs inmutables facet.term, definiciones ES/EN, alias normalizados, parentId y relaciones tipadas; distinguir términos polisémicos por faceta; unidades y rangos para propiedades físicas. Añadir identity y separar governance/learning. Detectar ciclos, colisiones y términos obsoletos; versionar migraciones.
## Patchsets previstos
- P1: library/taxonomy/{facets,terms,aliases,relations}.json — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
- P2: src/factory/assets/ontology.ts — crear o modificar tras inspeccionar HEAD; conservar contratos existentes y documentar migración.
## Secuencia
1. Capturar baseline y hashes de entradas; inspeccionar archivos reales y dependencias.
2. Definir contrato y fixtures antes de implementar; documentar casos desconocidos y errores.
3. Implementar algoritmo puro y adaptador de IO separado; generar propuestas en staging.
4. Validar integridad, ejecutar pruebas y comparar con baseline; revisión explícita antes de promoción.
## Aceptación
Validar DAG, alias ambiguos explícitos, traducciones y migración v1; ninguna pérdida de IDs.
## Evidencia y rollback
Registrar commit, comandos, resultados, hashes, cobertura, limitaciones y decisiones. Si falla un gate, detener promoción, conservar evidencia y restaurar snapshot anterior; no eliminar fuentes ni revisiones humanas. No proveedores externos ni producción sin autorización.
