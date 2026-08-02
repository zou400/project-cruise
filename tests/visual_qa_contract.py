#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / "visual-qa.html").read_text(encoding="utf-8")
catalog = json.loads((ROOT / "data/hero/hero-image-catalog.v1.json").read_text(encoding="utf-8"))
script = (ROOT / "scripts/audit_hero_assets.py").read_text(encoding="utf-8")
workflow = (ROOT / ".github/workflows/validate.yml").read_text(encoding="utf-8")

checks = {
    "visualQaPagePresent": bool(page),
    "visualQaLoadsCatalog": "data/hero/hero-image-catalog.v1.json" in page,
    "visualQaHasCategoryFilter": 'id="category-filter"' in page,
    "visualQaHasPhaseFilter": 'id="phase-filter"' in page,
    "visualQaShowsMissingState": "MISSING" in page,
    "visualQaLinksApplicationFixtures": "heroPhase=rain" in page and "pcData=low" in page,
    "catalogHas30Entries": len(catalog.get("entries", [])) == 30,
    "acceptanceScriptSupportsStrictMode": "--require-complete" in script,
    "acceptanceScriptChecksPackageHash": "upstreamPackageHashMatches" in script,
    "githubWorkflowRunsBrowserSmoke": "browser_smoke_cdp.py" in workflow,
    "githubWorkflowUploadsScreenshots": "ui-smoke-*.png" in workflow,
}
report = {
    "release": "v0.11.0-rc4",
    "deepening": 9,
    "checks": checks,
    "passed": all(checks.values()),
}
(ROOT / "records/visual-qa-contract.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(0 if report["passed"] else 1)
