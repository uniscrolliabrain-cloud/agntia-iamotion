# Auditoría de capacidades: que el manual pueda equivocarse

Fecha: 2026-11-28. Rama: `campaign/visual-excellence-integration`.

## El problema

El manual generado (`dist/knowledge/manual.generated.md`) responde a "¿qué sabe hacer este motor?" a partir de registros escritos a mano en `src/sdk/capability-registry.ts`. `scripts/build-living-skill.mjs` ya comprueba que el archivo fuente exista y que el símbolo sea una función exportada, pero se ejecuta a mano y no forma parte de ninguna verificación que pueda fallar en un cambio.

El riesgo concreto es este: si alguien renombra `sampleAestheticScene`, mueve `optical-layer.ts` o sube un registro a `tested` sin evidencia, el manual sigue afirmando exactamente lo mismo. Un documento que no puede estar mal no informa de nada.

## La pieza

`src/sdk/capability-audit.ts` — `auditCapabilities(registry, port)`.

Es deliberadamente independiente del medio: lee el sistema de archivos a través de un puerto y el entrypoint construido a través de una búsqueda, así que el módulo del SDK no importa builtins de Node ni el índice del paquete (lo que además sería circular). El puerto lo aporta quien audita: el CLI usa `node:fs` y `dist/index.js`; los tests usan dobles.

## Qué distingue un error de un aviso

| Código | Severidad | Qué detecta |
|---|---|---|
| `MISSING_SOURCE` | error | el archivo declarado ya no existe |
| `MISSING_SYMBOL` | error | el símbolo no está exportado por el entrypoint |
| `SYMBOL_NOT_CALLABLE` | error | el símbolo existe pero no es una función |
| `DUPLICATE_CAPABILITY` | error | dos registros con el mismo `id` |
| `MISSING_DEPENDENCY` | error | `requires` apunta a una capacidad no declarada |
| `CERTIFIED_WITHOUT_SOP` | error | certificación sin procedimiento |
| `SOURCE_OUTSIDE_SRC` | aviso | la fuente declarada no está bajo `src/` |
| `UNEVIDENCED_MATURITY` | aviso | declara `tested` o `certified` sin evidencia |

La separación importa: un símbolo perdido rompe a un consumidor y por eso es error; una madurez sin evidencia es una afirmación sin respaldo y por eso es aviso. El informe solo es `ok` cuando no hay errores.

Los hallazgos se ordenan por severidad, `id` y código, así que dos ejecuciones del mismo registro producen el mismo JSON.

## Ejecución

```bash
pnpm run verify:capabilities   # sale 0 si no hay errores, 1 si los hay
```

Estado hoy sobre este árbol:

```
12 capabilities · 0 errors · 0 warnings
```

Es decir: las doce capacidades declaradas existen, sus símbolos son funciones exportadas y ninguna se atribuye una madurez que no pueda sostener. La auditoría no encontró deuda; lo que aporta es que ahora la deuda no podría pasar inadvertida.

## Que la puerta muerda, probado

Un auditor que siempre pasa es indistinguible de uno que no mira. Dos pruebas usan el registro real que se publica:

- **`the shipped registry passes the audit against the built package`** — valida los doce registros contra `dist/index.js` y el disco.
- **`the audit bites: renaming one declared symbol fails the shipped registry`** — renombra el símbolo del primer registro y exige que la auditoría falle con `MISSING_SYMBOL` y que el resumen nombre esa capacidad.

La segunda es la que da valor a la primera.

## Límites

- No verifica que la capacidad **haga** lo que su descripción dice: comprueba que el símbolo exista, sea llamable y que la madurez declarada tenga evidencia. Una función vacía pasaría esta auditoría, y por eso las pruebas de comportamiento siguen siendo la otra mitad.
- No sustituye a `compileLivingSkill`: aquel valida dependencias, ciclos y el manifiesto del host; este audita la veracidad de las afirmaciones.
- El aviso `UNEVIDENCED_MATURITY` es intencionadamente no bloqueante mientras todos los registros estén en `implemented`; el día que uno suba a `tested`, el informe lo dirá.
