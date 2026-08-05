#!/usr/bin/env python3
"""Recover intact WH40K assets from the partially truncated Base64 archive.

The upload contains independently encoded archive segments. A small section is
missing, but most ZIP local records are intact. This script validates every
recovered file by decompression, size, and CRC before writing it into pixel-dnd.
"""

from __future__ import annotations

import base64
import binascii
import json
import re
import struct
import zlib
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = REPO_ROOT / "pixel-dnd-assets" / "upload-012-020"
SITE_ROOT = REPO_ROOT / "pixel-dnd"
REPORT_PATH = SITE_ROOT / "data" / "universes" / "warhammer40k" / "salvage-report-012-020.json"

LOCAL_SIG = b"PK\x03\x04"
CENTRAL_SIG = b"PK\x01\x02"


def natural_key(path: Path) -> tuple[object, ...]:
    parts = re.split(r"(\d+)", path.name)
    return tuple(int(part) if part.isdigit() else part for part in parts)


def read_u16(data: bytes, offset: int) -> int:
    return struct.unpack_from("<H", data, offset)[0]


def read_u32(data: bytes, offset: int) -> int:
    return struct.unpack_from("<I", data, offset)[0]


def plausible(name: str) -> bool:
    return name.startswith("assets/warhammer40k/production/") or name.startswith(
        "data/universes/warhammer40k/"
    )


def safe_target(name: str) -> Path:
    target = (SITE_ROOT / name).resolve()
    root = SITE_ROOT.resolve()
    if target != root and root not in target.parents:
        raise ValueError(f"Unsafe archive path: {name}")
    return target


def rebuild_partial_archive() -> tuple[bytes, list[dict[str, object]]]:
    chunks: list[dict[str, object]] = []
    decoded_parts: list[bytes] = []
    paths = sorted(UPLOAD_DIR.glob("chunk-*.b64"), key=natural_key)
    if len(paths) != 20:
        raise RuntimeError(f"Expected 20 chunk files, found {len(paths)}")

    for path in paths:
        encoded = "".join(path.read_text(encoding="utf-8").split())
        encoded += "=" * (-len(encoded) % 4)
        decoded = base64.b64decode(encoded, validate=False)
        decoded_parts.append(decoded)
        chunks.append(
            {
                "name": path.name,
                "encoded_chars": len(encoded.rstrip("=")),
                "decoded_bytes": len(decoded),
            }
        )

    return b"".join(decoded_parts), chunks


def scan_central_records(data: bytes) -> dict[str, dict[str, int | str]]:
    records: dict[str, dict[str, int | str]] = {}
    offset = 0
    while True:
        offset = data.find(CENTRAL_SIG, offset)
        if offset < 0:
            break
        try:
            name_len = read_u16(data, offset + 28)
            extra_len = read_u16(data, offset + 30)
            comment_len = read_u16(data, offset + 32)
            end = offset + 46 + name_len + extra_len + comment_len
            if not 0 < name_len <= 500 or end > len(data):
                offset += 1
                continue
            name = data[offset + 46 : offset + 46 + name_len].decode("utf-8")
            if plausible(name):
                records[name] = {
                    "name": name,
                    "position": offset,
                    "method": read_u16(data, offset + 10),
                    "crc32": read_u32(data, offset + 16),
                    "compressed_size": read_u32(data, offset + 20),
                    "uncompressed_size": read_u32(data, offset + 24),
                    "original_offset": read_u32(data, offset + 42),
                }
        except (UnicodeDecodeError, struct.error):
            pass
        offset += 1
    return records


def extract_intact_files(
    data: bytes, central: dict[str, dict[str, int | str]]
) -> tuple[dict[str, bytes], list[dict[str, object]]]:
    extracted: dict[str, bytes] = {}
    rejected: list[dict[str, object]] = []
    central_start = min(
        (int(record["position"]) for record in central.values()), default=len(data)
    )

    offset = 0
    while True:
        offset = data.find(LOCAL_SIG, offset, central_start)
        if offset < 0:
            break
        try:
            flags = read_u16(data, offset + 6)
            method = read_u16(data, offset + 8)
            local_crc = read_u32(data, offset + 14)
            compressed_size = read_u32(data, offset + 18)
            local_size = read_u32(data, offset + 22)
            name_len = read_u16(data, offset + 26)
            extra_len = read_u16(data, offset + 28)
            if flags & 0x08 or not 0 < name_len <= 300:
                offset += 1
                continue

            name_start = offset + 30
            data_start = name_start + name_len + extra_len
            data_end = data_start + compressed_size
            if data_end > central_start:
                offset += 1
                continue
            name = data[name_start : name_start + name_len].decode("utf-8")
            if not plausible(name):
                offset += 1
                continue

            packed = data[data_start:data_end]
            if method == 0:
                output = packed
            elif method == 8:
                output = zlib.decompress(packed, -zlib.MAX_WBITS)
            else:
                raise ValueError(f"Unsupported compression method {method}")

            expected = central.get(name)
            expected_size = (
                int(expected["uncompressed_size"]) if expected else local_size
            )
            expected_crc = int(expected["crc32"]) if expected else local_crc
            actual_crc = binascii.crc32(output) & 0xFFFFFFFF
            if len(output) != expected_size or actual_crc != expected_crc:
                raise ValueError(
                    f"Integrity mismatch size={len(output)}/{expected_size} "
                    f"crc={actual_crc}/{expected_crc}"
                )

            extracted[name] = output
            offset = data_end
        except (UnicodeDecodeError, struct.error, zlib.error, ValueError) as exc:
            rejected.append({"offset": offset, "error": str(exc)})
            offset += 1

    return extracted, rejected


def asset_file_for(asset: dict[str, object], names: set[str]) -> str | None:
    for key in ("file_path", "path", "url_path"):
        value = asset.get(key)
        if not isinstance(value, str):
            continue
        normalized = re.sub(r"^(?:supabase://game_assets/|pixel-dnd/|/+)", "", value)
        if normalized in names:
            return normalized
        suffix = "/" + normalized
        match = next((name for name in names if name.endswith(suffix)), None)
        if match:
            return match
    asset_key = asset.get("asset_key")
    if isinstance(asset_key, str):
        filename = f"{asset_key}.webp"
        return next(
            (name for name in names if name == filename or name.endswith("/" + filename)),
            None,
        )
    return None


def main() -> None:
    archive, chunks = rebuild_partial_archive()
    central = scan_central_records(archive)
    extracted, rejected = extract_intact_files(archive, central)

    for name, content in extracted.items():
        target = safe_target(name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    names = set(extracted)
    webps = sorted(name for name in names if name.endswith(".webp"))
    manifest_names = sorted(
        name
        for name in names
        if re.search(r"generated-batch-(?:01[2-9]|020)\.json$", name)
    )
    index_names = sorted(name for name in names if name.endswith("generated-index.json"))

    intended: list[dict[str, object]] = []
    for manifest_name in manifest_names:
        manifest = json.loads(extracted[manifest_name].decode("utf-8"))
        batch_key = manifest.get("batch_key") or manifest.get("batch_id")
        for asset in manifest.get("assets", []):
            intended.append(
                {
                    "batch_key": batch_key,
                    "asset_key": asset.get("asset_key"),
                    "file": asset_file_for(asset, names),
                }
            )

    missing_assets = [entry for entry in intended if entry["file"] is None]
    missing_central = [
        record
        for name, record in sorted(central.items())
        if name not in extracted
    ]
    report = {
        "status": "partial_recovery",
        "archive_bytes": len(archive),
        "chunks": chunks,
        "central_records_recovered": len(central),
        "files_recovered": len(extracted),
        "webps_recovered": len(webps),
        "manifests_recovered": len(manifest_names),
        "index_recovered": bool(index_names),
        "intended_assets": len(intended),
        "available_assets": len(intended) - len(missing_assets),
        "missing_assets": missing_assets,
        "missing_central_records": missing_central,
        "rejected_headers": rejected,
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    if len(webps) != 67:
        raise RuntimeError(f"Expected 67 validated WebP files, recovered {len(webps)}")
    if len(manifest_names) != 9:
        raise RuntimeError(f"Expected 9 manifests, recovered {len(manifest_names)}")
    if len(index_names) != 1:
        raise RuntimeError(f"Expected generated index, recovered {len(index_names)}")

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
