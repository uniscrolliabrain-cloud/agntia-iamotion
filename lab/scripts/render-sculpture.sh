#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p lab/staging
run="$(mktemp -d "$PWD/lab/staging/sculpture-XXXXXX")"
pnpm build
node --input-type=module -e 'import {ceramicCalendar} from "./dist/factory/renderers/blender/sculpture.js"; console.log(JSON.stringify(ceramicCalendar()))' > "$run/recipe.json"
export BLENDER_USER_CONFIG="$run/config" BLENDER_USER_EXTENSIONS="$run/extensions"
timeout 240s blender --background --factory-startup --disable-autoexec --threads 2 --python-exit-code 2 --python lab/scripts/build-sculpture.py -- "$run" > "$run/blender.log" 2>&1 || { cat "$run/blender.log" >&2; exit 2; }
sha256sum "$run"/recipe.json "$run"/sculpture.{blend,glb,png}
