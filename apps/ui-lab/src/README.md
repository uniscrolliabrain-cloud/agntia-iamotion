# UI Lab

El prototipo local de correo cerámico carga un GLB sintético y ofrece los clips de reposo, apertura y asentamiento. La vista estática usa un PNG generado por la misma receta.

Desde la raíz, con Blender 4.3 disponible:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run render:ceramic-mail
pnpm run build:demo
pnpm exec vite preview apps/ui-lab --base /agntia-iamotion/ --host 127.0.0.1
```

La vista se sirve en `http://127.0.0.1:4173/agntia-iamotion/`. Los artefactos del render se guardan en `lab/staging/`. El script copia el GLB y el PNG a la carpeta local de recursos de UI Lab.

Para verificar la carga, la acción de apertura y el modo de movimiento reducido en un Chromium local con depuración remota habilitada en el puerto 9222:

```sh
node lab/scripts/smoke-ceramic-mail-browser.mjs
```

## Gráficos y partículas

`particles.html` se construye junto a la vista WebGL con `pnpm run build:demo`. El botón controla una simulación sembrada. La vista pausa el reloj fuera del viewport y conserva un cuadro estático con movimiento reducido.

Para reproducir los dos vídeos y la vista accesible del gráfico, usar el entorno local con DejaVu Sans, fontTools, Fontconfig y FFmpeg con librsvg y libx264:

```sh
pnpm run build
pnpm render:graphics
pnpm encode:graphics
pnpm verify:graphics
```

Los MP4, subtítulos, SVG, manifiestos y el HTML se escriben en `lab/staging/graphics-fixture/`. El HTML presenta valores sintéticos mediante un gráfico adaptable y una tabla. Los MP4 son versiones silenciosas con subtítulos seleccionables.

## Estudio y revisión

`studio.html` reúne la infografía, el texto bilingüe, el botón nativo y la presentación de tres escenas con navegación y búsqueda por fotograma. Los controles, los valores y el estado corresponden a fixtures sintéticos.

`pnpm run render:ceramic-mail` guarda un póster lavanda, un PNG con transparencia, un GLB animable y la escena editable de Blender. Construir la demo después de renderizar para que el estudio use esos archivos locales.

`lab/scripts/smoke-studio-browser.mjs` verifica la navegación, el teclado, la preferencia de movimiento reducido y la composición de las tres escenas. Después de capturar las escenas en Chromium, `pnpm encode:studio` genera los dos MP4 con cortes de escena fijos.
