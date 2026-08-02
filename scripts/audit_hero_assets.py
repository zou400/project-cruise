#!/usr/bin/env python3
"""Validate the exact Hero Precision asset drop without regenerating images.

Default mode is release-candidate friendly: missing assets are reported as PENDING
and the command exits successfully. Pass --require-complete to make missing or
invalid assets fail CI after the upstream package has been imported.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import struct
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/hero/hero-image-catalog.v1.json"
EXTERNAL = ROOT / "records/external-hero-package.json"
OUT = ROOT / "records/hero-asset-acceptance.json"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def webp_dimensions(path: Path) -> tuple[int | None, int | None, str | None]:
    """Read VP8/VP8L/VP8X dimensions using only the standard library."""
    data = path.read_bytes()
    if len(data) < 30 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        return None, None, "not-webp-riff"
    kind = data[12:16]
    try:
        if kind == b"VP8X" and len(data) >= 30:
            w = 1 + int.from_bytes(data[24:27], "little")
            h = 1 + int.from_bytes(data[27:30], "little")
            return w, h, None
        if kind == b"VP8L" and len(data) >= 25 and data[20] == 0x2F:
            bits = int.from_bytes(data[21:25], "little")
            w = (bits & 0x3FFF) + 1
            h = ((bits >> 14) & 0x3FFF) + 1
            return w, h, None
        if kind == b"VP8 " and len(data) >= 30:
            # Key-frame signature may occur after the frame tag.
            idx = data.find(b"\x9d\x01\x2a", 20, 40)
            if idx >= 0 and len(data) >= idx + 7:
                w = struct.unpack_from("<H", data, idx + 3)[0] & 0x3FFF
                h = struct.unpack_from("<H", data, idx + 5)[0] & 0x3FFF
                return w, h, None
        return None, None, f"unsupported-webp-chunk:{kind.decode('latin1', 'replace')}"
    except Exception as exc:  # defensive parser: report, never invent
        return None, None, f"dimension-parse-error:{exc}"


def inspect_zip(path: Path, expected_hash: str | None) -> dict:
    result = {
        "path": str(path),
        "exists": path.exists(),
        "sha256": None,
        "expectedSha256": expected_hash,
        "hashMatches": None,
        "webpMembers": [],
        "validZip": False,
        "error": None,
    }
    if not path.exists():
        return result
    result["sha256"] = sha256(path)
    result["hashMatches"] = result["sha256"] == expected_hash if expected_hash else None
    try:
        with zipfile.ZipFile(path) as zf:
            result["validZip"] = zf.testzip() is None
            result["webpMembers"] = sorted(n for n in zf.namelist() if n.lower().endswith(".webp"))
    except Exception as exc:
        result["error"] = str(exc)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--require-complete", action="store_true")
    parser.add_argument("--package", type=Path, help="Optional upstream full ZIP to verify")
    args = parser.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    external = json.loads(EXTERNAL.read_text(encoding="utf-8"))
    entries = catalog.get("entries", [])
    expected_paths = [ROOT / entry["assetPath"] for entry in entries]
    expected_names = [p.name for p in expected_paths]

    assets = []
    digests: dict[str, list[str]] = {}
    for entry, path in zip(entries, expected_paths):
        item = {
            "imageId": entry.get("imageId"),
            "assetPath": entry.get("assetPath"),
            "exists": path.exists(),
            "bytes": None,
            "sha256": None,
            "width": None,
            "height": None,
            "aspectRatio": None,
            "webpValid": False,
            "warning": None,
            "expectedSha256": entry.get("sha256"),
            "hashMatchesCatalog": None,
            "dimensionsMatchCatalog": None,
        }
        if path.exists():
            item["bytes"] = path.stat().st_size
            item["sha256"] = sha256(path)
            item["hashMatchesCatalog"] = item["sha256"] == entry.get("sha256") if entry.get("sha256") else None
            w, h, error = webp_dimensions(path)
            item["width"], item["height"] = w, h
            item["dimensionsMatchCatalog"] = (w == entry.get("width") and h == entry.get("height")) if entry.get("width") and entry.get("height") else None
            item["webpValid"] = error is None and bool(w and h)
            item["warning"] = error
            if w and h:
                item["aspectRatio"] = round(w / h, 4)
            digests.setdefault(item["sha256"], []).append(path.name)
        assets.append(item)

    asset_dir = ROOT / "assets/hero/precision"
    actual_webps = sorted(p.name for p in asset_dir.glob("*.webp"))
    missing = sorted(set(expected_names) - set(actual_webps))
    unexpected = sorted(set(actual_webps) - set(expected_names))
    invalid = [a["assetPath"] for a in assets if a["exists"] and not a["webpValid"]]
    duplicate_binary_groups = [names for names in digests.values() if len(names) > 1]
    hash_mismatches = [a["assetPath"] for a in assets if a["exists"] and a.get("hashMatchesCatalog") is False]
    dimension_mismatches = [a["assetPath"] for a in assets if a["exists"] and a.get("dimensionsMatchCatalog") is False]

    package_report = None
    if args.package:
        package_report = inspect_zip(args.package, external["fullPackage"].get("sha256"))

    complete = len(missing) == 0 and len(unexpected) == 0 and len(invalid) == 0
    checks = {
        "catalogHas30Entries": len(entries) == 30,
        "catalogImageIdsUnique": len({e.get('imageId') for e in entries}) == len(entries),
        "catalogAssetPathsUnique": len({e.get('assetPath') for e in entries}) == len(entries),
        "allCatalogPathsAreWebp": all(str(e.get("assetPath", "")).lower().endswith(".webp") for e in entries),
        "allCatalogPathsStayInPrecisionDirectory": all(str(e.get("assetPath", "")).startswith("assets/hero/precision/") for e in entries),
        "allExpectedAssetsPresent": len(missing) == 0,
        "noUnexpectedWebpAssets": len(unexpected) == 0,
        "allPresentAssetsAreValidWebp": len(invalid) == 0,
        "noDuplicateBinaries": len(duplicate_binary_groups) == 0,
        "allHashesMatchCatalog": len(hash_mismatches) == 0,
        "allDimensionsMatchCatalog": len(dimension_mismatches) == 0,
    }
    if package_report is not None:
        checks["upstreamPackageHashMatches"] = package_report.get("hashMatches") is True
        checks["upstreamPackageIsValidZip"] = package_report.get("validZip") is True
        checks["upstreamPackageContains30Webp"] = len(package_report.get("webpMembers", [])) == 30

    hard_contract_ok = all([
        checks["catalogHas30Entries"],
        checks["catalogImageIdsUnique"],
        checks["catalogAssetPathsUnique"],
        checks["allCatalogPathsAreWebp"],
        checks["allCatalogPathsStayInPrecisionDirectory"],
        checks["noUnexpectedWebpAssets"],
        checks["allPresentAssetsAreValidWebp"],
        checks["noDuplicateBinaries"],
        checks["allHashesMatchCatalog"],
        checks["allDimensionsMatchCatalog"],
    ])
    strict_ok = hard_contract_ok and complete
    if package_report is not None:
        strict_ok = strict_ok and all(checks[k] for k in (
            "upstreamPackageHashMatches", "upstreamPackageIsValidZip", "upstreamPackageContains30Webp"
        ))

    report = {
        "release": "v0.11.0-rc5",
        "deepening": 9,
        "mode": "strict" if args.require_complete else "pending-tolerant",
        "status": "accepted" if strict_ok else ("pending" if hard_contract_ok and not args.require_complete else "rejected"),
        "expectedAssetCount": len(entries),
        "presentAssetCount": len(actual_webps),
        "missing": missing,
        "unexpected": unexpected,
        "invalid": invalid,
        "duplicateBinaryGroups": duplicate_binary_groups,
        "hashMismatches": hash_mismatches,
        "dimensionMismatches": dimension_mismatches,
        "checks": checks,
        "assets": assets,
        "package": package_report,
        "hardContractPassed": hard_contract_ok,
        "complete": complete,
        "passed": strict_ok if args.require_complete else hard_contract_ok,
        "interpretation": {
            "pending": "The exact upstream WebP binaries have not all been imported; CSS fallback remains active.",
            "accepted": "All 30 catalog assets are present and structurally valid. Visual/manual review is still required before canonical promotion.",
            "rejected": "The mounted asset drop violates the catalog or binary contract and must not be promoted.",
        },
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
