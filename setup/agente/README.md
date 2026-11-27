# Instalación artesanal — NO ejecutar todavía
Referencia real: agente/docs/implementation/cognition-v2/C14/REPORT-W0-W6.md y package.json: @agntia/ciberseguridad se consume mediante file:vendor/agntia-ciberseguridad-0.1.0-alpha.2.tgz. Copiar patrón, no dominio cyber.
1. Fijar SHA de motion, generar lockfile, probar, compilar y empaquetar pnpm pack; registrar SHA256 y licencia.
2. Tras aprobación, copiar tarball a vendor/ del padre y declarar @agntia/motion como file:vendor/<artefacto>.tgz; actualizar lockfile.
3. Propuesta de árbol padre: apps/server/src/engine/motion/{contracts,sdk-adapter,event-relay}.ts; pruebas de contrato; UI consume vistas aprobadas. No crear estos archivos en padre todavía.
4. Host resuelve tenant/actor/grants; capacidades cerradas, aprobación de efectos, outbox/ACK durable y dedupe antes de ACK. No montar router ni relay por defecto.
5. Rollback: desactivar wiring y retirar dependencia cuando no haya consumidores.
Estado: setup solamente, sin instalación ni conexión.
