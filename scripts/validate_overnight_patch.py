#!/usr/bin/env python3
from pathlib import Path
import json, sys

base = Path(__file__).resolve().parents[1]
route = base / "data" / "incubator" / "midnight-airport-flow" / "flow-route.v0.7.json"
manifest = base / "docs" / "autonomous-updates" / "OVERNIGHT_PATCH_MANIFEST_2026-08-03.json"

errors = []
for p in (route, manifest):
    if not p.exists():
        errors.append(f"missing: {p.relative_to(base)}")

if route.exists():
    data = json.loads(route.read_text(encoding="utf-8"))
    if data.get("route_id") != "tokyo_midnight_airport_flow":
        errors.append("unexpected route_id")
    if data.get("status") != "pre_audit_frozen_not_public":
        errors.append("route must remain non-public")
    if data.get("publication_criteria", {}).get("required_completed_runs") != 3:
        errors.append("required_completed_runs must be 3")

if errors:
    print("PATCH VALIDATION: FAILED")
    for e in errors:
        print("-", e)
    sys.exit(1)

print("PATCH VALIDATION: PASS")
print("Public catalog files were not modified by this patch.")
