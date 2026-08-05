#!/usr/bin/env python3
"""Parallel atlas cutter for Pixel DND assets.

Reads a JSON job file, crops icon/sprite regions in parallel, converts them to
WebP, validates dimensions and alpha, and writes a manifest plus contact sheet.

Job format:
{
  "batch_key": "wh40k-batch-012",
  "source": "/path/to/atlas.png",
  "output_dir": "/path/to/output",
  "size": [32, 32],
  "quality": 88,
  "assets": [
    {"asset_key": "key", "title_ru": "Название", "category": "ui",
     "crop": [x, y, width, height], "creator_only": false}
  ]
}
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, ImageDraw


@dataclass(frozen=True)
class Task:
    source: str
    output_dir: str
    asset_key: str
    title_ru: str
    category: str
    crop: tuple[int, int, int, int]
    size: tuple[int, int]
    quality: int
    creator_only: bool


def _safe_key(value: str) -> str:
    allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    result = "".join(ch if ch in allowed else "_" for ch in value).strip("_")
    if not result:
        raise ValueError("asset_key became empty after sanitization")
    return result


def _process_one(task: Task) -> dict[str, Any]:
    src = Path(task.source)
    out_dir = Path(task.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    key = _safe_key(task.asset_key)
    x, y, w, h = task.crop
    if w <= 0 or h <= 0:
        raise ValueError(f"Invalid crop for {key}: {task.crop}")

    with Image.open(src) as im:
        im = im.convert("RGBA")
        if x < 0 or y < 0 or x + w > im.width or y + h > im.height:
            raise ValueError(
                f"Crop {task.crop} for {key} exceeds source {im.width}x{im.height}"
            )
        icon = im.crop((x, y, x + w, y + h))
        icon = ImageOps.contain(icon, task.size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", task.size, (0, 0, 0, 0))
        px = (task.size[0] - icon.width) // 2
        py = (task.size[1] - icon.height) // 2
        canvas.alpha_composite(icon, (px, py))

        out_path = out_dir / f"{key}.webp"
        canvas.save(
            out_path,
            "WEBP",
            quality=task.quality,
            method=6,
            lossless=False,
            exact=True,
        )

    raw = out_path.read_bytes()
    with Image.open(out_path) as check:
        width, height = check.size
        has_alpha = "A" in check.getbands()

    return {
        "asset_key": key,
        "title_ru": task.title_ru,
        "category": task.category,
        "creator_only": task.creator_only,
        "file": str(out_path),
        "mime_type": "image/webp",
        "width": width,
        "height": height,
        "bytes": len(raw),
        "has_alpha": has_alpha,
        "content_base64": base64.b64encode(raw).decode("ascii"),
    }


def _make_contact_sheet(results: list[dict[str, Any]], out_path: Path) -> None:
    thumb = 96
    label_h = 28
    cols = min(5, max(1, len(results)))
    rows = (len(results) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb, rows * (thumb + label_h)), (18, 18, 18))
    draw = ImageDraw.Draw(sheet)

    for i, item in enumerate(results):
        col, row = i % cols, i // cols
        x, y = col * thumb, row * (thumb + label_h)
        with Image.open(item["file"]) as im:
            preview = Image.new("RGBA", (thumb, thumb), (25, 25, 25, 255))
            enlarged = im.convert("RGBA").resize((72, 72), Image.Resampling.NEAREST)
            preview.alpha_composite(enlarged, ((thumb - 72) // 2, (thumb - 72) // 2))
            sheet.paste(preview.convert("RGB"), (x, y))
        draw.text((x + 4, y + thumb + 4), item["asset_key"][:14], fill=(230, 230, 230))

    sheet.save(out_path, "WEBP", quality=85, method=6)


def main() -> int:
    parser = argparse.ArgumentParser(description="Cut and optimize atlas assets in parallel")
    parser.add_argument("job", type=Path, help="JSON job file")
    parser.add_argument(
        "--workers",
        type=int,
        default=max(1, min(4, (os.cpu_count() or 2) - 1)),
        help="Parallel workers; default=min(4, CPU-1)",
    )
    args = parser.parse_args()

    if args.workers < 1:
        parser.error("--workers must be >= 1")

    job = json.loads(args.job.read_text(encoding="utf-8"))
    source = Path(job["source"])
    if not source.is_file():
        raise FileNotFoundError(source)

    output_dir = Path(job["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)
    size = tuple(job.get("size", [32, 32]))
    quality = int(job.get("quality", 88))
    assets = job.get("assets", [])
    if not assets:
        raise ValueError("Job contains no assets")

    tasks = [
        Task(
            source=str(source),
            output_dir=str(output_dir),
            asset_key=item["asset_key"],
            title_ru=item.get("title_ru", item["asset_key"]),
            category=item.get("category", "misc"),
            crop=tuple(item["crop"]),
            size=size,
            quality=quality,
            creator_only=bool(item.get("creator_only", False)),
        )
        for item in assets
    ]

    results: list[dict[str, Any]] = []
    errors: list[str] = []
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(_process_one, task): task.asset_key for task in tasks}
        for future in as_completed(futures):
            key = futures[future]
            try:
                results.append(future.result())
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{key}: {exc}")

    results.sort(key=lambda x: x["asset_key"])
    manifest = {
        "batch_key": job.get("batch_key", output_dir.name),
        "status": "active" if not errors else "partial",
        "generated_count": len(results),
        "failed_count": len(errors),
        "workers": args.workers,
        "assets": [
            {k: v for k, v in item.items() if k not in {"content_base64", "file"}}
            for item in results
        ],
        "errors": errors,
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    _make_contact_sheet(results, output_dir / "contact_sheet.webp")

    print(json.dumps({
        "batch_key": manifest["batch_key"],
        "workers": args.workers,
        "generated": len(results),
        "failed": len(errors),
        "output_dir": str(output_dir),
    }, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
