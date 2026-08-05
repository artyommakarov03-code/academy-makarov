#!/usr/bin/env python3
"""Cut WH40K batch 002 preview sheet into ten standalone WebP assets."""

from __future__ import annotations

import io
import json
import urllib.request
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
SITE_ROOT = REPO_ROOT / "pixel-dnd"
MANIFEST_PATH = SITE_ROOT / "data/universes/warhammer40k/generated-batch-002.json"
OUTPUT_DIR = SITE_ROOT / "assets/warhammer40k/production"
REPORT_PATH = SITE_ROOT / "data/universes/warhammer40k/cut-report-batch-002.json"
UPSCALE = 4


def download(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "academy-makarov-batch-002-cutter"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise RuntimeError(f"Sheet download failed: HTTP {response.status}")
        return response.read()


def scale_crop(
    crop: list[int], source_size: tuple[int, int], actual_size: tuple[int, int]
) -> tuple[int, int, int, int]:
    sx = actual_size[0] / source_size[0]
    sy = actual_size[1] / source_size[1]
    left = max(0, round(crop[0] * sx))
    top = max(0, round(crop[1] * sy))
    right = min(actual_size[0], round(crop[2] * sx))
    bottom = min(actual_size[1], round(crop[3] * sy))
    if right <= left or bottom <= top:
        raise ValueError(f"Invalid scaled crop: {crop} -> {(left, top, right, bottom)}")
    return left, top, right, bottom


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    sheet = manifest["sheet"]
    sheet_bytes = download(sheet["url"])
    with Image.open(io.BytesIO(sheet_bytes)) as source:
        source.load()
        source = source.convert("RGBA")
        actual_size = source.size
        source_size = (sheet["source_width"], sheet["source_height"])
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        report_assets: list[dict[str, object]] = []
        for asset in manifest["assets"]:
            crop_box = scale_crop(asset["sheet_crop"], source_size, actual_size)
            cut = source.crop(crop_box)
            natural_size = cut.size
            output_size = (natural_size[0] * UPSCALE, natural_size[1] * UPSCALE)
            cut = cut.resize(output_size, Image.Resampling.NEAREST)

            output_path = OUTPUT_DIR / f"{asset['asset_key']}.webp"
            cut.save(output_path, format="WEBP", lossless=True, method=6)
            with Image.open(output_path) as check:
                check.load()
                if check.size != output_size:
                    raise RuntimeError(f"Validation failed for {asset['asset_key']}")

            asset["render_mode"] = "direct"
            asset["mime_type"] = "image/webp"
            asset["width"] = output_size[0]
            asset["height"] = output_size[1]
            asset["url"] = f"/assets/warhammer40k/production/{asset['asset_key']}.webp"
            asset["source"] = "cut-from-batch-002-sheet-preview"
            asset["original_sheet_crop"] = asset.pop("sheet_crop")

            report_assets.append(
                {
                    "asset_key": asset["asset_key"],
                    "crop_box_on_preview": list(crop_box),
                    "natural_size": list(natural_size),
                    "output_size": list(output_size),
                    "bytes": output_path.stat().st_size,
                }
            )

    manifest["storage"] = "github_static_assets"
    manifest["cut_from_sheet"] = True
    manifest["sheet"]["actual_download_size"] = list(actual_size)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    report = {
        "batch_key": manifest.get("batch_id", "wh40k-batch-002"),
        "source_url": sheet["url"],
        "source_reference_size": list(source_size),
        "downloaded_size": list(actual_size),
        "upscale": UPSCALE,
        "generated_count": len(report_assets),
        "assets": report_assets,
    }
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    if len(report_assets) != 10:
        raise RuntimeError(f"Expected 10 assets, generated {len(report_assets)}")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
