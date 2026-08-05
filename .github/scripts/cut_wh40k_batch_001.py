#!/usr/bin/env python3
"""Cut the eight remaining sheet-crop entries from WH40K batch 001."""

from __future__ import annotations

import io
import json
import urllib.request
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
SITE_ROOT = REPO_ROOT / "pixel-dnd"
MANIFEST_PATH = SITE_ROOT / "data/universes/warhammer40k/generated-batch-001.json"
OUTPUT_DIR = SITE_ROOT / "assets/warhammer40k/production"
REPORT_PATH = SITE_ROOT / "data/universes/warhammer40k/cut-report-batch-001.json"
UPSCALE = 3


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "academy-makarov-batch-001-cutter"})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise RuntimeError(f"Sheet download failed: HTTP {response.status}")
        return response.read()


def scaled_crop(crop: list[int], reference: tuple[int, int], actual: tuple[int, int]) -> tuple[int, int, int, int]:
    sx, sy = actual[0] / reference[0], actual[1] / reference[1]
    box = (
        max(0, round(crop[0] * sx)),
        max(0, round(crop[1] * sy)),
        min(actual[0], round(crop[2] * sx)),
        min(actual[1], round(crop[3] * sy)),
    )
    if box[2] <= box[0] or box[3] <= box[1]:
        raise ValueError(f"Invalid crop {crop} -> {box}")
    return box


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    sheet = manifest["sheet"]
    raw = download(sheet["url"])
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        image = image.convert("RGBA")
        actual = image.size
        reference = (sheet["source_width"], sheet["source_height"])
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        generated: list[dict[str, object]] = []

        for asset in manifest["assets"]:
            if asset.get("render_mode") != "sheet_crop":
                continue
            original_crop = list(asset["sheet_crop"])
            box = scaled_crop(original_crop, reference, actual)
            cut = image.crop(box)
            natural = cut.size
            output_size = (natural[0] * UPSCALE, natural[1] * UPSCALE)
            cut = cut.resize(output_size, Image.Resampling.NEAREST)
            target = OUTPUT_DIR / f"{asset['asset_key']}.webp"
            cut.save(target, format="WEBP", lossless=True, method=6)
            with Image.open(target) as check:
                check.load()
                if check.size != output_size:
                    raise RuntimeError(f"Validation failed for {asset['asset_key']}")

            asset["render_mode"] = "direct"
            asset["mime_type"] = "image/webp"
            asset["width"] = output_size[0]
            asset["height"] = output_size[1]
            asset["url"] = f"/assets/warhammer40k/production/{asset['asset_key']}.webp"
            asset["source"] = "cut-from-batch-001-sheet-preview"
            asset["original_sheet_crop"] = asset.pop("sheet_crop")
            generated.append({
                "asset_key": asset["asset_key"],
                "crop_box_on_preview": list(box),
                "natural_size": list(natural),
                "output_size": list(output_size),
                "bytes": target.stat().st_size,
            })

    manifest["storage"] = "mixed_direct_and_github_static_assets"
    manifest["cut_from_sheet"] = True
    manifest["sheet"]["actual_download_size"] = list(actual)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {
        "batch_key": manifest.get("batch_id", "wh40k-batch-001"),
        "source_url": sheet["url"],
        "source_reference_size": list(reference),
        "downloaded_size": list(actual),
        "upscale": UPSCALE,
        "generated_count": len(generated),
        "assets": generated,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if len(generated) != 8:
        raise RuntimeError(f"Expected 8 assets, generated {len(generated)}")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
