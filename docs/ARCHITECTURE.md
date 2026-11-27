# Arquitectura canónica de Agntia IAMotion
Dos dominios de igual importancia, fases independientes. Fase 1 activa, fase 2 exclusivamente documental. Setup sin conexiones ni despliegue.
## Árbol y ownership
- library/: única biblioteca de activos, inventario, tarjetas, hashes y revisión.
- src/contracts.ts: entrada pública inicial; ampliar contratos versionados sin romper SDK.
- src/factory/: compiler, behaviors, renderers/web, renderers/blender, renderers/video, assets, jobs, art-direction.
- src/llm/: puerto opcional y prompts; anfitrión puede proponer directamente.
- src/sdk/: futura superficie instalable server-only.
- src/integration/: autoridad host y eventos; sin kernel paralelo.
- apps/ui-lab/: estudio estático futuro.
- knowledge/factory/: conocimiento artístico curado, público.
- setup/: instalación artesanal, LLM y Pages desactivados.
- tests/: contratos, integración y fixtures.
- docs/02-sensory-intelligence/: segunda fase, sin imports desde fase 1.
## Flujo objetivo
Briefing -> propuesta MotionSpec -> autorización de referencias -> compilación determinista -> preview -> revisión -> job de render -> validación -> activo certificado -> SDK/vistas del padre.
Humanos y agentes editan el mismo plan versionado; conflictos de revisión no se sobrescriben. No shell ni URL arbitraria. Workers aislados. Sin claves no se simula IA.
## Segunda fase
Ocho canales: color, movimiento, espacialidad, luminosidad, sonido, háptica, ritmo, densidad. Cascada identidad global > tenant > usuario > contexto operativo > composición > componente, con accesibilidad y política como límites no anulables. Mixer y Experience Sequencer graban curvas/eventos, no necesariamente vídeo. Perfiles Deep Focus, Creative Flow, Executive, Learning, Recovery, Collaboration, Celebration. RAG universal/plataforma/tenant/usuario con aislamiento real fuera de Git público. Prompts y evidencia científica, propuestas, validación, feedback voluntario, dataset curado y anonimizado, eventual fine-tuning. Sin inferir emociones ni optimizar permanencia. Contratos futuros SensorySpec, ExperienceSpec, ThemeCascade, InterfaceTopology, SensoryPolicy, ExperienceRecording. Cognition y memorias generales siguen en agente.
## Gates
G0 inventario y scaffold; G1 contratos y biblioteca certificada; G2 compilador y comportamientos web; G3 Blender/video; G4 estudio y demo; G5 SDK empaquetado y pruebas de integración; G6 autorización de instalación y producción. Fase 2 se rediseña con evidencia de fase 1. Ningún gate se declara aprobado por existir un README.
