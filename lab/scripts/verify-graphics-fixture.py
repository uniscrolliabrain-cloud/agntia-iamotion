"""Verify locally generated videos, captions, bounds and asset hashes."""

import hashlib
import json
from pathlib import Path
from xml.etree.ElementTree import parse

root = Path("lab/staging/graphics-fixture")
manifest = json.loads((root / "manifest.json").read_text())
output = []
for item in manifest["artifacts"]:
    name = item["id"]
    width, height = (item["viewport"][key] for key in ("width", "height"))
    project = (root / f"{name}-project.json").read_bytes()
    assert hashlib.sha256(project.removesuffix(b"\n")).hexdigest() == item["projectHash"]
    bounds = item["layout"]
    assert 36 <= bounds["x"] and bounds["x"] + bounds["width"] <= width - 36
    assert 36 <= bounds["y"] and bounds["y"] + bounds["height"] <= height - 36
    assert item["samples"][0]["opacity"] == 0 and item["samples"][-1]["opacity"] == 1
    assert item["samples"][0]["textOpacity"] == 0 and item["samples"][-1]["textOpacity"] == 1
    for frame in item["samples"]:
        path = root / name / f"frame-{frame['frame']:03d}.svg"
        assert hashlib.sha256(path.read_bytes()).hexdigest() == frame["sha256"]
    svg = parse(root / name / "frame-035.svg").getroot()
    text = svg.findall(".//{http://www.w3.org/2000/svg}text")
    assert text[0].text == manifest["title"]
    assert text[1].text == manifest["captions"][0]["text"]
    stream = json.loads((root / f"{name}-video.json").read_text())["streams"]
    video, caption = stream
    assert (video["width"], video["height"], video["r_frame_rate"], video["nb_frames"]) == (
        width, height, "24/1", "36")
    assert video["duration"] == caption["duration"] == "1.500000"
    assert caption["codec_type"] == "subtitle"
    ends = (root / f"{name}-captions.vtt").read_text().strip().splitlines()
    assert ends[-1] == manifest["captions"][0]["text"]
    assert ends[-2] == "00:00.000 --> 00:01.500"
    hashes = [line.rsplit(",", 1)[-1].strip() for line in
              (root / f"{name}-frame-hashes.txt").read_text().splitlines() if not line.startswith("#")]
    assert len(hashes) == 36 and hashes[0] != hashes[24]
    path = root / f"{name}.mp4"
    output.append({"id": name, "width": width, "height": height, "frames": len(hashes),
                   "captions": "exact", "audio": "none", "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
print(json.dumps({"status": "passed", "sampleKind": "synthetic", "renders": output}, indent=2))
