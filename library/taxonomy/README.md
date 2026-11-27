# Taxonomía visual canónica v0.1
Fase 1. Léxico controlado, extensible y bilingüe ES/EN; términos con ID estable, alias, definición, parentId y relaciones. No confundir intención del prompt con observación. Cada afirmación lleva evidenceRef, basis (observed/source-spec/path-inference/proposed), confidence (unknown/low/medium/high), reviewStatus. Desconocido es null, no inventar.
## Facetas
- identity: asset hash, visual entity ID, semantic slug, family, variants, version, lineage.
- subject: object, person/avatar, scene, symbol, abstract geometry, diagram, photograph, illustration, texture, logo; subjects and parts.
- business: domain, workspace, metaapp, task, capability, concept, operational state.
- ux: role (launcher, navigation, hero, editorial, empty-state, node, feedback, avatar, background), component, placement, size, crop, interaction state, source evidence.
- geometry: silhouette, topology, symmetry, primitives, volume, edges, depth, negative space, separable layers.
- material: ceramic, enamel, brass, glass, paper, wood, fabric, skin, unknown; finish, roughness, reflectivity (qualitative unless measured).
- color: palette, dominant/accent/background, contrast, temperature, measured vs intended.
- lighting: key/fill/rim, direction, softness, shadow, environment.
- composition: framing, perspective, camera, focal point, safe area, balance, aspect.
- style: family, art direction, realism, editorial/product/abstract, constraints, compatible families.
- motion: candidate behavior, target parts, pivot, axes, amplitude, duration, easing, loop, triggers, states, reduced-motion fallback; proposed not certified.
- reconstruction: 2D/2.5D/3D feasibility, segmentation, depth, geometry/material/camera hypotheses, Blender recipe candidate, required inputs.
- export: source/master/preview/runtime variants, dimensions, MIME, alpha, bytes, hash, budget, target renderer.
- semantic: titles, aliases, alt, captions, keywords, synonyms, positive/negative retrieval terms, multilingual descriptions.
- relationships: variant-of, derived-from, same-family, depicts, used-in, compatible-with, alternative-to, animates-as; evidence required.
- governance: provenance, rights, privacy, visual review, founder approval, permitted uses, restrictions, lifecycle.
- learning: prompt lineage, model if known, critiques, revisions, evaluation, reusable lessons.
## Entity folder (logical, one per stable visual ID)
identity.json; provenance.json; semantics.json; appearance.json; ux.json; motion.json; reconstruction.json; relations.json; governance.json; evidence.json; variants.json; rag/ (future generated cards, not authority). Binary references point to library/assets by hash. No copies. Multiple semantic cards may describe one binary; multiple binaries may represent one visual entity. Do not merge perceptually without review.
## Runtime mapping
assets -> resolver; semantics/relations -> retrieval and briefing; appearance/style -> art direction; motion -> BehaviorSpec/compiler; reconstruction -> Blender adapter; export -> renderer/jobs; ux -> host topology; governance -> authorization; learning -> knowledge/prompts. No phase 2 user profiles in public Git.
