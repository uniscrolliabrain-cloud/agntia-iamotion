# Extensión granular P33–P44
Plan, no ejecución. Dependencias de P01–P32 existentes; no bloquear M1.
P33 contratos CompositionSpec/Layer/Timeline (src/factory/compiler/composition.ts): strict schemas, DAG, integer ticks; fixture ciclo y frame boundary.
P34 ShapeSpec (src/factory/graphics/shapes.ts): primitives, paths, masks y limits; fixture path incompatible -> fallback.
P35 layout (src/factory/graphics/layout.ts): constraints, safe area, breakpoints; fixture 9:16/16:9 y texto largo sin clip.
P36 FontRegistry (src/factory/typography/fonts.ts): hash, licencia, axes, coverage; fixture fuente ausente, eje fuera de rango.
P37 TextSpec/shaping port (src/factory/typography/text.ts): Unicode, bidi, grapheme/word/run; fixture é, emoji ZWJ, árabe, ligadura; no partir clusters. HarfBuzz candidato a evaluar.
P38 type grammar (src/factory/typography/behaviors.ts): 13 técnicas, capability, reduced motion; fixture texto accesible intacto.
P39 timeline sampler (src/factory/compiler/sample.ts): sample(t), easing, conflict, seek; fixture orden aleatorio produce mismos valores.
P40 data graphics (src/factory/graphics/data.ts): bind host typed data, units/domains; fixture valor falso/revision stale -> reject.
P41 audio/caption (src/factory/graphics/cues.ts): timing, mute, license; fixture overlap y caption truncado.
P42 renderer capability (src/factory/renderers/capabilities.ts): adapter negotiation, fallback, sandbox; fixture unsupported mask/axis/no network.
P43 RAG/prompt (knowledge/factory/motion-graphics/; src/llm/prompts/): compile cards, proposal schema, exact text checks; fixture LLM changes original number -> reject.
P44 benchmarks (lab/eval/motion-graphics/): golden templates and metrics; compare renderers under fixed environment; no claims of success yet.
Each patchset: A input/output strict schema B pure algorithm C IO adapter D positive/negative fixtures E receipt and wiring. Suggested new macroturns M7=P33–38, M8=P39–44 after relevant core dependencies. 
Golden suite: 1 logo opener 3s; 2 title reveal 2s; 3 editorial quote 6s; 4 lower third 5s; 5 animated KPI real/synthetic 4s; 6 process diagram 8s; 7 vertical explainer 15s; 8 responsive UI state transition; 9 bilingual mixed RTL/LTR; 10 reduced-motion version. Durations provisional, evaluate reading. Metrics exact text preservation, overflow, missing glyphs, semantic accuracy, safe area, caption alignment, frame timings, export bytes, fidelity, human ratings 0–5 with rationale. Hard veto factual error, inaccessible original text, rights violation, unsupported renderer. No assertion of world-class quality until comparison and human review.