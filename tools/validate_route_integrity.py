#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

PROFILES = {
    "90": {"min": 70, "max": 100, "waypoint_min": 1, "waypoint_max": 2},
    "120": {"min": 100, "max": 140, "waypoint_min": 2, "waypoint_max": 3},
    "half": {"min": 180, "max": 300, "waypoint_min": 3, "waypoint_max": 5},
}


def duration_range(route: dict) -> tuple[int, int] | None:
    values = [int(v) for v in re.findall(r"\d+", str(route.get("duration") or ""))]
    if len(values) >= 2:
        return min(values[0], values[1]), max(values[0], values[1])
    if len(values) == 1:
        return values[0], values[0]
    value = route.get("drivingBudgetMinutes")
    if isinstance(value, (int, float)) and value > 0:
        return int(value), int(value)
    return None


def route_matches(route: dict, key: str, profile: dict) -> bool:
    buckets = route.get("timeBuckets") or [route.get("timeBucket")]
    if key not in buckets:
        return False
    waypoints = route.get("waypoints") or []
    if not profile["waypoint_min"] <= len(waypoints) <= profile["waypoint_max"]:
        return False
    value = duration_range(route)
    if value is None:
        return False
    low, high = value
    return max(low, profile["min"]) <= min(high, profile["max"])


def validate(root: Path) -> dict:
    issues: list[dict] = []
    metrics: dict = {}
    routes = json.loads((root / "data/routes.public.json").read_text(encoding="utf-8"))
    app = (root / "app.js").read_text(encoding="utf-8")
    index = (root / "index.html").read_text(encoding="utf-8")

    for key, profile in PROFILES.items():
        matching = [r for r in routes if route_matches(r, key, profile)]
        unique = {r.get("destination") for r in matching if r.get("destination")}
        metrics[f"{key}_eligible_routes"] = len(matching)
        metrics[f"{key}_eligible_destinations"] = len(unique)
        if len(unique) < 5:
            issues.append({
                "type": "insufficient_route_integrity_pool",
                "time_bucket": key,
                "eligible_routes": len(matching),
                "eligible_destinations": len(unique),
            })

    required_app_tokens = [
        "TIME_PROFILES",
        "routeAvailability",
        "directMinutes",
        "routeWaypoints",
        "route_integrity_v1",
        "https://www.google.com/maps/dir/?",
        "params.set('waypoints'",
        "destination:pointValue(origin)",
        "リアルタイム渋滞はGoogle Mapsで最終確認",
    ]
    for token in required_app_tokens:
        if token not in app:
            issues.append({"type": "missing_runtime_contract", "token": token})

    forbidden_app_patterns = {
        "trust_legacy_route_url": r"return\s+r\.googleMaps",
        "one_way_default_url": r"destination=\$\{encodeURIComponent\(r\.destination\)\}",
    }
    for name, pattern in forbidden_app_patterns.items():
        if re.search(pattern, app):
            issues.append({"type": name})

    required_index_tokens = [
        "帰宅までに使える時間を選ぶ",
        "往復90分",
        "往復2時間",
        "半日（帰宅まで）",
        "往復時間",
    ]
    for token in required_index_tokens:
        if token not in index:
            issues.append({"type": "missing_time_semantics", "token": token})

    return {"status": "PASS" if not issues else "FAIL", "issues": issues, "metrics": metrics}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--report", default="route-integrity-report.json")
    args = parser.parse_args()
    result = validate(Path(args.root).resolve())
    Path(args.report).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
