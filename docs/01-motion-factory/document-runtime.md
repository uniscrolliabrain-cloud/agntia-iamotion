# Del documento a los fotogramas: runtime de composición

Fecha: 2026-11-28. Rama: `campaign/visual-excellence-integration`.

## El hueco que había

El laboratorio de autoría de M03 (`src/sdk/motion-document.ts`) permite editar un `MotionDocument`: valida la revisión, mueve y redimensiona capas, deshace y rehace. Lo que no había era **nadie que ejecutara ese documento**. Existían los compiladores y los muestreadores (`compileAestheticScene`, `sampleAestheticScene`, `compileCinematicSequence`, `sampleCinematicFrame`), pero ninguna función aceptaba un `MotionDocument` como entrada y devolvía fotogramas.

Para un consumidor eso significa que el paquete describía movimiento que no podía reproducir. Este documento describe la pieza que falta y cómo se verifica.

## La pieza

`src/factory/composition/document-runtime.ts` — cuatro funciones:

```ts
compileMotionDocument(document, { policy, features, lockedText }) // → CompiledMotion
sampleMotion(compiled, timeMs)                                    // → MotionSample
sampleMotionFrame(compiled, frame)                                // → MotionSample (solo film)
describeMotion(compiled)                                          // → resumen para recibos
```

No implementa matemática de animación propia. Para escena delega en `compileAestheticScene`/`sampleAestheticScene`; para película en `compileCinematicSequence`/`sampleCinematicFrame`. Se mantiene **un muestreador por medio** (P39) y **no aparece un segundo runtime** que haya que mantener sincronizado (P13).

## Dos reglas que hacen la muestra reproducible

1. **El tiempo es un argumento, nunca una lectura de reloj.** `sampleMotion` no llama a `Date.now()`. Dos llamadas con el mismo instante devuelven muestras idénticas, verificado con `deepEqual`.
2. **El tiempo se cuantiza a milisegundos enteros y se recorta a la duración.** `250` y `250.4` son la misma muestra; `-10` es `0`; `5000` sobre una composición de `1000` es `1000`. Sin extrapolación.

Para película el fotograma se deriva de su propia tasa: `frameCount = ceil(durationMs × fps / 1000)`, y el fotograma mostrado en un instante es el último cuyo inicio no lo supera. La serie es monótona y nunca desborda el último fotograma.

## Qué se rechaza, y con qué error

| Entrada | Resultado |
|---|---|
| `NaN`, `±Infinity` | `INVALID_MOTION_TIME` (no se convierte en cero en silencio) |
| Capacidad no declarada en `features` | `AESTHETIC_CAPABILITY_UNAVAILABLE` (falla cerrado) |
| Capa que excede la composición | `INVALID_AESTHETIC_INTERVAL` |
| `sampleMotionFrame` sobre una escena | `MOTION_KIND_MISMATCH` |
| Fotograma no entero o negativo | `INVALID_MOTION_FRAME` |

## Instalación externa, probada de verdad

`pnpm run verify:install` (`lab/scripts/verify-install-tarball.mjs`) hace el recorrido completo:

1. `npm pack --ignore-scripts` sobre el paquete real.
2. Extrae el tarball en el `node_modules/@agntia/motion` de un consumidor temporal, con las dependencias de runtime declaradas enlazadas como las daría npm.
3. Recorre el mapa `exports` y comprueba que cada destino existe dentro del tarball.
4. Ejecuta un consumidor que **solo conoce el nombre del paquete**: importa `@agntia/motion/composition`, compila un documento, muestrea dos veces el mismo instante y compara; también carga la entrada raíz.

Resultado de la última ejecución sobre esta rama:

```
tarball   agntia-motion-0.0.1-alpha.0.tgz
bytes     97054                                                (rama publicada)
exports   ./composition, ./sdk/motion-document, .  (todos presentes)
consumer  compiled a document by package name ✓
consumer  samples are deterministic ✓
consumer  root entrypoint loads ✓
```

El script imprime además el `sha256` del tarball de esa ejecución. No se copia aquí porque el empaquetado incluye marcas de tiempo: el mismo árbol produce hashes distintos en ejecuciones distintas, y un número fijo en un documento sería una cifra que envejece mal.

Lo que este gate **no** prueba: que npm pueda descargar el paquete desde un registro. El paquete sigue con `"private": true` y publicar no está autorizado, así que el script no contacta ningún registro. Lo verificado es el artefacto y su resolución: contenido del tarball, mapa `exports`, grafo de dependencias y ejecución real desde fuera del repositorio.

## Mapa de exports

```json
"exports": {
  ".": "./dist/index.js",
  "./composition": "./dist/factory/composition/document-runtime.js",
  "./sdk/motion-document": "./dist/sdk/motion-document.js",
  "./package.json": "./package.json"
}
```

`files` sigue siendo `["dist"]`: el tarball no lleva fuentes ni tests.

## Estado

| Elemento | Estado |
|---|---|
| Compilar documento → plan (escena y película) | implementado y probado |
| Muestreo determinista y recortado | implementado y probado |
| Rechazo de entradas inválidas y capacidades ausentes | implementado y probado |
| Instalación desde tarball por nombre de paquete | verificado (modo extracción, sin registro) |
| Publicación en un registro | no autorizada, no ejecutada |
| Paridad de renderizadores (Blender/FFmpeg) | bloqueada: no hay binarios en este entorno |

Diez pruebas en `tests/motion-document-runtime.test.mjs` cubren la tabla anterior. En la rama publicada el total es 142 tests, 142 pasan, typecheck 0, build 0. La rama convergida local suma 144 tests y 166 exportaciones en la entrada raíz porque además incorpora los módulos espaciales de la línea estética.
