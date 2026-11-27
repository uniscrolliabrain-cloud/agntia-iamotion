#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p lab/staging
run="$(mktemp -d "$PWD/lab/staging/ceramic-mail-XXXXXX")"
(
  umask 077
  export BLENDER_USER_CONFIG="$run/config" BLENDER_USER_EXTENSIONS="$run/extensions"
  timeout 75s blender --background --factory-startup --disable-autoexec --threads 2 \
    --python-exit-code 2 --python lab/scripts/build-ceramic-mail.py -- "$run"
) > "$run/blender.log" 2>&1 || { cat "$run/blender.log" >&2; exit 2; }
mkdir -p apps/ui-lab/public/ceramic-mail
cp "$run/ceramic-mail.glb" "$run/ceramic-mail.png" apps/ui-lab/public/ceramic-mail/
sha256sum "$run"/ceramic-mail.{blend,glb,png}
