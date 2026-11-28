#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
root=lab/staging/studio-fixture
for layout in wide tall; do
  if [[ "$layout" == wide ]]; then
    dimensions=960:540
  else
    dimensions=540:960
  fi
  scale="scale=$dimensions:force_original_aspect_ratio=decrease,pad=$dimensions:(ow-iw)/2:(oh-ih)/2:color=0xe9dfef,setsar=1"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -loop 1 -framerate 24 -i "$root/$layout-0.png" \
    -loop 1 -framerate 24 -i "$root/$layout-1.png" \
    -loop 1 -framerate 24 -i "$root/$layout-2.png" \
    -filter_complex_threads 1 \
    -filter_complex "[0:v]trim=end_frame=100,setpts=PTS-STARTPTS,$scale[a];[1:v]trim=end_frame=100,setpts=PTS-STARTPTS,$scale[b];[2:v]trim=end_frame=100,setpts=PTS-STARTPTS,$scale[c];[a][b][c]concat=n=3:v=1:a=0,settb=1/24,setpts=N[out]" \
    -map '[out]' -fps_mode cfr -r 24 -video_track_timescale 24000 -an -c:v libx264 -threads 1 -pix_fmt yuv420p -movflags +faststart \
    -map_metadata -1 -map_chapters -1 "$root/presentation-$layout.mp4"
  ffprobe -v error -show_entries stream=width,height,codec_name,r_frame_rate,nb_frames,duration \
    -of json "$root/presentation-$layout.mp4" > "$root/presentation-$layout.json"
  ffmpeg -nostdin -hide_banner -loglevel error -i "$root/presentation-$layout.mp4" \
    -vf "select='eq(n,0)+eq(n,100)+eq(n,200)'" -fps_mode passthrough -f framemd5 -y "$root/presentation-$layout.frames"
done
python - "$root" <<'PY'
from pathlib import Path
import hashlib
import json
import sys

root = Path(sys.argv[1])
outputs = []
for layout, size in {"wide": (960, 540), "tall": (540, 960)}.items():
    target = root / f"presentation-{layout}.mp4"
    stream = json.loads((root / f"presentation-{layout}.json").read_text())["streams"][0]
    assert (stream["width"], stream["height"]) == size
    assert (stream["r_frame_rate"], stream["nb_frames"], stream["duration"]) == ("24/1", "300", "12.500000")
    samples = [line.rsplit(",", 1)[1].strip() for line in
              (root / f"presentation-{layout}.frames").read_text().splitlines() if not line.startswith("#")]
    assert len(samples) == len(set(samples)) == 3
    outputs.append({"layout": layout, "dimensions": size, "frames": 300, "durationSeconds": 12.5,
                    "sceneStartFrames": [0, 100, 200], "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
print(json.dumps({"status": "passed", "synthetic": True, "outputs": outputs}, indent=2))
PY
