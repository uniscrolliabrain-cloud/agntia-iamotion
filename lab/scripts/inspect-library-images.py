"""Measure audited raster files offline using one bounded decoder process per asset."""

import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import hashlib
from importlib.metadata import version
import io
import math
import json
import os
from pathlib import Path
import re
import resource
import stat
import subprocess
import sys
import warnings
from xml.parsers import expat

MAX_BYTES = 95 * 1024 * 1024
MAX_PIXELS = 16_000_000
FORMATS = {".png": "PNG", ".jpg": "JPEG", ".webp": "WEBP", ".svg": "SVG"}
STORE = Path("library/assets/pending-review")


def checked_bytes(path):
    if any(not stat.S_ISDIR(directory.lstat().st_mode) for directory in reversed(path.parents)):
        raise ValueError("UNSAFE_ASSET_PATH")
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, "rb") as source:
        metadata = os.fstat(source.fileno())
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > MAX_BYTES:
            raise ValueError("ASSET_FILE_LIMIT")
        data = source.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("ASSET_FILE_LIMIT")
        return data


def measure(data, expected):
    from PIL import Image, UnidentifiedImageError

    Image.MAX_IMAGE_PIXELS = MAX_PIXELS
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        try:
            with Image.open(io.BytesIO(data), formats=[expected]) as image:
                width, height = image.size
                if width * height > MAX_PIXELS:
                    raise ValueError("IMAGE_PIXEL_LIMIT")
                if image.format != expected:
                    raise ValueError("MIME_MISMATCH")
                frames = getattr(image, "n_frames", 1)
                orientation = image.getexif().get(274)
                rgba = image.convert("RGBA")
                alpha_extrema = rgba.getchannel("A").getextrema()
                rgba.thumbnail((64, 64), Image.Resampling.BOX)
                get_pixels = getattr(rgba, "get_flattened_data", rgba.getdata)
                pixels = [pixel for pixel in get_pixels() if pixel[3] >= 128]
        except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
            raise ValueError("IMAGE_PIXEL_LIMIT") from exc
        except (OSError, UnidentifiedImageError) as exc:
            raise ValueError("DECODE_FAILED") from exc

    buckets = Counter(tuple((channel >> 5) * 32 + 16 for channel in pixel[:3]) for pixel in pixels)

    def linear(channel):
        channel /= 255
        return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4

    luminance = [
        0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) for r, g, b, _ in pixels
    ]
    return {
        "status": "measured", "basis": "measured", "format": expected, "width": width, "height": height,
        "frames": frames, "orientation": orientation, "containsTransparency": alpha_extrema[0] < 255,
        "palette": [{"rgb": list(rgb), "count": count} for rgb, count in
                    sorted(buckets.items(), key=lambda sample: (-sample[1], sample[0]))[:8]],
        "meanLuminance": round(sum(luminance) / len(luminance), 6) if luminance else None,
    }


def svg_metadata(data):
    if len(data) > 1024 * 1024:
        raise ValueError("SVG_METADATA_LIMIT")

    def forbid(*_):
        raise ValueError("SVG_EXTERNAL_XML_FORBIDDEN")

    root = None
    parser = expat.ParserCreate(namespace_separator=" ")

    def start(name, attributes):
        nonlocal root
        if root is None:
            if name != "http://www.w3.org/2000/svg svg":
                raise ValueError("MIME_MISMATCH")
            root = attributes

    parser.StartElementHandler = start
    parser.StartDoctypeDeclHandler = forbid
    parser.ExternalEntityRefHandler = forbid
    try:
        parser.Parse(data, True)
    except expat.ExpatError as exc:
        raise ValueError("DECODE_FAILED") from exc
    if root is None:
        raise ValueError("MIME_MISMATCH")

    def numeric_parts(value):
        parts = re.split(r"[,\s]+", value.strip())
        try:
            numbers = [float(part) for part in parts]
        except ValueError:
            return None
        return numbers if all(math.isfinite(number) for number in numbers) else None

    values = numeric_parts(root.get("viewBox", ""))
    dimensions = {}
    for field in ("width", "height"):
        measure = numeric_parts(root.get(field, "").removesuffix("px"))
        dimensions[field] = measure[0] if measure and len(measure) == 1 and measure[0] > 0 else None
    return {
        "status": "static-metadata", "basis": "source-spec", "format": "SVG", **dimensions,
        "viewBox": values if values and len(values) == 4 and min(values[2:]) > 0 else None,
    }


def worker(binary_id, extension, expected_bytes):
    resource.setrlimit(resource.RLIMIT_AS, (384 * 1024 * 1024,) * 2)
    resource.setrlimit(resource.RLIMIT_CPU, (3, 4))
    data = checked_bytes(STORE / (binary_id + extension))
    if len(data) != expected_bytes or hashlib.sha256(data).hexdigest() != binary_id:
        raise ValueError("ASSET_INTEGRITY_FAILED")
    if extension == ".svg":
        return svg_metadata(data)
    return measure(data, FORMATS[extension])


def inspect(asset):
    binary_id, extension, size = (asset[key] for key in ("id", "extension", "bytes"))
    if not re.fullmatch("[a-f0-9]{64}", binary_id) or extension not in FORMATS or not 0 < size <= MAX_BYTES:
        raise ValueError("INVALID_ASSET_RECORD")
    try:
        result = subprocess.run(
            [sys.executable, str(Path(__file__).resolve()), "--worker", binary_id, extension, str(size)],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=8, check=False,
        )
        details = json.loads(result.stdout) if result.returncode == 0 else {
            "status": "error", "code": "DECODER_EXIT"
        }
    except subprocess.TimeoutExpired:
        details = {"status": "error", "code": "DECODER_TIMEOUT"}
    return {"binaryId": binary_id, **details}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker", nargs=3, metavar=("HASH", "EXTENSION", "SIZE"))
    options = parser.parse_args()
    if options.worker:
        binary_id, extension, size = options.worker
        if not re.fullmatch("[a-f0-9]{64}", binary_id) or extension not in FORMATS:
            raise SystemExit("INVALID_ASSET_RECORD")
        try:
            result = worker(binary_id, extension, int(size))
        except (OSError, ValueError) as exc:
            code = str(exc)
            result = {"status": "error", "code": code if re.fullmatch("[A-Z_]+", code) else "DECODE_FAILED"}
        print(json.dumps(result))
        return 0

    raw = checked_bytes(Path("library/catalog/assets.json"))
    assets = sorted(json.loads(raw), key=lambda asset: asset["id"])
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(inspect, assets))
    counts = dict(Counter(record["status"] for record in results))
    print(json.dumps({
        "schemaVersion": 1, "inputHash": hashlib.sha256(raw).hexdigest(),
        "decoder": {"name": "Pillow", "version": version("Pillow")},
        "policy": {"maxPixels": MAX_PIXELS, "paletteSample": "first-frame RGBA, BOX fit 64, alpha >= 128",
                   "luminance": "assumed sRGB; ICC profiles are not applied"},
        "counts": counts, "records": results,
    }, indent=2))
    return 2 if counts.get("error") else 0


if __name__ == "__main__":
    sys.exit(main())
