# Diez áreas y scoring auditable
Baseline histórico subjetivo: RAG15, compiler10, motion graphics5, Blender3, living3, UI Lab2, sensory5, integración0, producción0. Son nueve áreas estrictamente inferiores a30; infraestructura30 se incluye como décima por estar en el umbral. No inventar décima distinta. Recalcular baseline.
Cada área: cinco gates de 20 puntos, cada gate cuatro subchecks de 5 puntos definidos antes de implementar (contrato, implementación, prueba positiva, prueba negativa/evidencia según gate). Solo puntuar subcheck con archivo+comando+resultado verificable; hard veto seguridad/datos/derechos impide certificar. 80 requiere cuatro gates completos equivalentes y ningún veto; no sustituir gates externos por mocks sin etiqueta.
A infraestructura: reproducible install/lock; build/types; tests/CI; observability/rollback; package clean install.
B RAG: evidence/ontology; corpus reproducible; retrieval scope/quality; proposal wiring; human eval and optional provider.
C compiler: schemas/version; DAG/timeline; behavior/layout; capability/validation; cross-render tests.
D graphics/type: shapes/layout; fonts/shaping; motion grammar; data/captions; actual presentation render.
E Blender: recipes; isolated worker; .blend/GLB/PNG; browser clips/fallback; measured review.
F living: icons/buttons/text; infographics; particles/forces; responsive/accessibility; perf/lifecycle.
G UI Lab: catalog; six runnable demos; property inspector; timeline/preview; regression and usability review.
H sensory: contracts/policy; mixer; sequencer/replay; scoped profiles; evaluation/consent. Authorization gate; report actual vs local readiness.
I integration: SDK; host authority; event/idempotency; mock host/tarball; actual parent install and integration tests (blocked until approval).
J production: CI reproducibility; security/licensing; performance/accessibility; release candidate rollback; actual deployment/monitoring (blocked until approval).
Report score per area and blocked subchecks. No average hiding weak area. 80 local readiness may be achievable for I/J without deployment if first four gates complete; label separately, actual production remains zero until deployed. Sensory implementation forbidden until explicit scope change. Human visual review cannot be fabricated. World-class claim requires independent comparison and review.
