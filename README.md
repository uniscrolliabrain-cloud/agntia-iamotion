# Agntia IAMotion

Motor de identidad visual dinámica para AgntiaPro. Hono, pnpm, TypeScript. LLM propone, sistema dispone.

Dos dominios igualmente importantes, separados en diseño y ejecución:

1. [Factoría audiovisual y comportamientos vivos](docs/01-motion-factory/README.md) — única fase activa.
2. [Inteligencia estética y orquestación multisensorial](docs/02-sensory-intelligence/README.md) — visión reservada para después de certificar la primera.

No implementar la segunda fase anticipadamente. La experiencia real con activos, contratos y renderizadores de la primera informará su diseño. No duplicar kernel ni Cognition de AgntiaPro. Este repositorio es público: nunca almacenar datos privados de clientes, credenciales ni telemetría personal aquí.

Estado: implementación de fase 1 integrada en main; certificación y pruebas pendientes de verificación.


## Rama canónica y política de integración

`main` es la única rama activa y fuente de verdad. Las campañas `campaign/agntia-aesthetic-engineering` y `campaign/visual-knowledge-lab-execution` quedaron integradas íntegramente en `153e732d52353aa0b9c9f256300cc76a267b9741` y están archivadas mediante avisos en sus README. No desarrollar ni reintegrar esas ramas. Toda nueva campaña debe partir de main y finalizar con su trabajo útil integrado y verificado en main. No usar force-push ni descartar trabajo ajeno. Distinguir publicación de certificación mediante pruebas.
