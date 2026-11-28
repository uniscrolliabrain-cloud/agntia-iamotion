"""Read cmap evidence from two locally installed font faces."""

import hashlib
import json
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path("/usr/share/fonts/truetype/dejavu")
license_path = Path("/usr/share/doc/fonts-dejavu-core/copyright")
license_bytes = license_path.read_bytes()
if b"License: bitstream-vera" not in license_bytes:
    raise SystemExit("Expected Debian DejaVu license")
license_hash = hashlib.sha256(license_bytes).hexdigest()
fonts = []
for style, filename in (
    ("regular", "DejaVuSans.ttf"),
    ("bold", "DejaVuSans-Bold.ttf"),
):
    path = root / filename
    with TTFont(path, lazy=True) as face:
        coverage = sorted(face.getBestCmap())
    fonts.append({
        "id": "dejavu-sans-" + style,
        "family": "DejaVu Sans",
        "style": style,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "licenseSha256": license_hash,
        "embedding": False,
        "coverage": coverage,
        "axes": [],
    })
print(json.dumps(fonts, ensure_ascii=False))
