# Plan de ejecución posterior
No ejecutar ahora. Crear rama campaign/visual-knowledge-lab-execution desde HEAD aprobado; conservar main. Macroturnos: M1 fases 01-04; M2 05-07; M3 08-09; M4 10-11; M5 12-13 con mocks; M6 14-15. Cada fase tiene patchsets independientes, tests, recibo y revisión. Si una fase depende de proveedor real, dejar port/mock y marcar bloqueada. No fusionar sin aprobación.
## Dependencias
01->02->03->04; 04->05,06; 05+06->07; 07->08,09; 04+05+06+07+08+09->10; 10->11; 11->12; 10+11->13; 12+13->14; 14->15. Observabilidad mínima desde 01, consolidación en 14.
## Entregable de macroturno
HEAD inicial/final, archivos, comandos, tests reales, métricas antes/después, riesgos, decisiones, blockers, siguiente gate. No reportar README como implementación. No tocar repo agente, Pages ni fase 2. No ejecutar renderers reales hasta campaña específica.
## Riesgos conocidos
Importador actual copia pendientes a repo público: revisar derechos y alcance antes de nuevas copias. Generador actual sobrescribe JSON de entidades: separar generated y reviewed antes de iterar. Catálogo actual snapshot sin regeneración: introducir pipeline reproducible. SDK aún sin build/lockfile probado. No inferir aprobación por existencia de binario.
