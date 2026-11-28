#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
fixture=lab/staging/graphics-fixture
mkdir -p "$fixture/font-cache"
cat > "$fixture/fontconfig.xml" <<'CONFIG'
<fontconfig>
  <dir>/usr/share/fonts/truetype/dejavu</dir>
  <cachedir prefix="cwd">lab/staging/graphics-fixture/font-cache</cachedir>
</fontconfig>
CONFIG
export FONTCONFIG_FILE="$PWD/$fixture/fontconfig.xml"
test "$(fc-match -f '%{file}' 'DejaVu Sans:style=Book')" = /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
test "$(fc-match -f '%{file}' 'DejaVu Sans:style=Bold')" = /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
ffmpeg -version > "$fixture/ffmpeg-version.txt"
for layout in landscape portrait; do
  ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -c:v librsvg \
    -framerate 24 -start_number 0 -i "$fixture/$layout/frame-%03d.svg" \
    -i "$fixture/captions.vtt" -map 0:v -map 1:s -map_metadata -1 -map_chapters -1 \
    -c:v libx264 -preset medium -pix_fmt yuv420p -threads 1 -c:s mov_text \
    -movflags +faststart "$fixture/$layout.mp4"
  ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,nb_frames,r_frame_rate,duration \
    -of json "$fixture/$layout.mp4" > "$fixture/$layout-video.json"
  ffmpeg -nostdin -hide_banner -loglevel error -i "$fixture/$layout.mp4" -map 0:s:0 \
    -c:s webvtt -y "$fixture/$layout-captions.vtt"
  ffmpeg -nostdin -hide_banner -loglevel error -i "$fixture/$layout.mp4"     -map 0:v -f framemd5 -y "$fixture/$layout-frame-hashes.txt"
done
