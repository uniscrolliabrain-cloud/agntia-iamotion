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
