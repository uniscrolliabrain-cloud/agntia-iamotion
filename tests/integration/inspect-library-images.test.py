"""Synthetic image fixtures for the local inspection pipeline."""

from importlib.util import module_from_spec, spec_from_file_location
from io import BytesIO
from pathlib import Path
import unittest

from PIL import Image

script = Path(__file__).resolve().parents[2] / "lab/scripts/inspect-library-images.py"
spec = spec_from_file_location("inspect_library_images", script)
inspector = module_from_spec(spec)
spec.loader.exec_module(inspector)


class Inspection(unittest.TestCase):
    def test_deterministic_transparent_palette_and_luminance(self):
        image = Image.new("RGBA", (2, 1))
        image.putdata([(255, 0, 0, 255), (0, 0, 0, 0)])
        data = BytesIO()
        image.save(data, "PNG")
        result = inspector.measure(data.getvalue(), "PNG")
        self.assertEqual((result["width"], result["height"]), (2, 1))
        self.assertTrue(result["containsTransparency"])
        self.assertEqual(result["palette"], [{"rgb": [240, 16, 16], "count": 1}])
        self.assertEqual(result["meanLuminance"], 0.2126)

    def test_invalid_image_is_reported(self):
        with self.assertRaisesRegex(ValueError, "DECODE_FAILED"):
            inspector.measure(b"invalid binary", "PNG")

    def test_svg_uses_only_static_metadata(self):
        measured = inspector.svg_metadata(
            b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64px" height="100%"/>')
        self.assertEqual(measured["status"], "static-metadata")
        self.assertEqual(measured["viewBox"], [0, 0, 64, 32])
        self.assertEqual(measured["width"], 64)
        self.assertIsNone(measured["height"])


if __name__ == "__main__":
    unittest.main()
