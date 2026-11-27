# P45–P52 — procedural product extension
Additive; preserve previous 44 patchsets and 220 units. Proposed M9 after minimal P13/P33/P39/P42.
P45 field contracts src/factory/graphics/particles/spec.ts: A schema seed/domain/emitter/forces/budget B validate bounds C JSON adapter D invalid force/capacity/NaN E capability report.
P46 simulation particles/simulate.ts: A state arrays and tick contract B seeded spawn, integrate semi-implicit Euler, clamp acceleration, expire/recycle C checkpoint serialization D same seed/tick replay, overflow, lifetime E sample adapter.
P47 responsive field particles/layout.ts: A viewport/domain/quality B remap normalized positions, density cap, preserve IDs C resize observer adapter D zero viewport, portrait, resize churn E layout receipt.
P48 interaction particles/interaction.ts: A normalized pointer/event policy B falloff, bounded force, release C pointer adapter with cleanup D touch, cancellation, reduced motion E state graph integration.
P49 render particles/render.ts: A renderer port B batch draw/instancing plan C Canvas2D first, WebGL candidate D context loss, unsupported capability, dispose E static fallback and artifact manifest.
P50 procedural recipes graphics/recipes.ts: A versioned recipe union B compile to composition/field/behavior specs C registry loader D missing refs, unsupported renderer E RAG cards.
P51 performance/accessibility lab/eval/procedural/: A benchmark manifest B measure frame time p50/p95/p99, memory, particle count, visibility C browser harness D offscreen pause, resize, low quality, reduced motion E report real device results.
P52 host bindings sdk/visual-bindings.ts: A typed state/data bindings B validate scope/revision, coalesce updates C React adapter candidate D stale event, synthetic label, unauthorized data E no authority or LLM calls in runtime.
All paths proposed. No dependency installation, rendering or tests yet. M9 is planning extension, not automatic change to approved execution order.
