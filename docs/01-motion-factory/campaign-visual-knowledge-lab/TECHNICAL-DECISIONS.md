# Decisiones y conflictos detectados en tercera revisión
D01: UUID visual persistente no puede regenerarse en replay. Registro de asignaciones es input versionado; nuevos IDs se proponen en staging y solo se consolidan por revisión.
D02: current.json no garantiza atomicidad distribuida. En Git, promoción es commit con expected parent y push no-force; local rename solo dentro del mismo filesystem. Ledger y puntero deben entrar en mismo commit cuando corresponda.
D03: pending-review en repo público no es cuarentena. Antes de nuevos imports revisar alcance/derechos; no copiar privados. No prometer borrar historial mediante borrar archivo.
D04: claims de intención pueden entrar en índice de referencia autorizado, nunca en índice productivo como hechos observados. Separar read authorization, rights, visual approval, production grant.
D05: BM25 estadísticas por corpus autorizado, no corpus global privado; filtros antes de cálculo. Consultas sin juicios suficientes reportan métricas parciales.
D06: determinismo de contenido excluye timestamps, runId, latencia y provider output no determinista; replay LLM usa respuesta registrada autorizada, no nueva llamada.
D07: actual generador sobrescribe entities. Congelar snapshot antes de migrar y desactivar workflow escritor solo durante ejecución aprobada; documentación no lo cambia.
D08: Node ESM scripts actuales y TS SDK deben compartir contratos compilados; elegir build-first con Node22, no duplicar validadores. Lockfile y test runner pendientes.
D09: evidencia de fuente se fija por repo/commit/path/hash/span. Rutas relativas de manifiesto se resuelven contra directorio documentado, no basename.
D10: propuesta de movimiento no equivale a render; target part requiere capability real, no solo descripción.
D11: no mezclar embeddings de modelos/dimensiones; cache key incluye scope, model revision, preprocessing version y content hash.
D12: el laboratorio no sustituye autoridad host; mock grants solo fixtures, ningún proveedor real ni instalación sin autorización.
