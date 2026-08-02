#!/usr/bin/env python3
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "records/final-qa-report.json"
OUT_MD = ROOT / "FINAL_QA_REPORT.md"

SOURCES = {
    "release": "records/release-candidate-audit.json",
    "heroAssets": "records/hero-asset-acceptance.json",
    "visualContract": "records/visual-qa-contract.json",
    "browser": "records/browser-smoke.json",
    "mobile": "records/mobile-accessibility-audit.json",
    "operational": "records/operational-core-test.json",
    "stateMachine": "records/result-state-machine-test.json",
    "heroPrecision": "records/hero-precision-audit.json",
}

def load(rel: str):
    p = ROOT / rel
    if not p.exists():
        return {"missing": True, "path": rel}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"invalid": True, "path": rel, "error": str(exc)}

records = {name: load(path) for name, path in SOURCES.items()}
release = records["release"]
hero = records["heroAssets"]
browser = records["browser"]

automated = bool(release.get("automatedPassed")) and bool(records["visualContract"].get("passed")) and bool(hero.get("hardContractPassed"))
external_gates = {
    "exactHeroWebpAssetsImported": bool(hero.get("complete")),
    "githubPagesBrowserSmoke": browser.get("passed") is True and browser.get("status") != "skipped",
    "iphoneSafariManualQA": False,
}
promotion_ready = automated and all(external_gates.values())
status = "PROMOTE" if promotion_ready else "HOLD"

summary = {
    "release": "v0.11.0-rc3",
    "deepening": 9,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "status": status,
    "automatedPassed": automated,
    "promotionReady": promotion_ready,
    "externalGates": external_gates,
    "records": records,
}
OUT_JSON.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

mark = lambda v: "PASS" if v else "HOLD"
md = f"""# Project Cruise v0.11.0-rc3 — Final QA report

**Decision: {status}**  
**Deepening: 9/10**

## Automated evidence

- Repository audit: {mark(bool(release.get('automatedPassed')))}
- Visual QA contract: {mark(bool(records['visualContract'].get('passed')))}
- Hero asset catalog/binary contract: {mark(bool(hero.get('hardContractPassed')))}
- Exact Hero assets present: {mark(bool(hero.get('complete')))} ({hero.get('presentAssetCount', 0)}/{hero.get('expectedAssetCount', 30)})

## External promotion gates

- Exact upstream Hero WebP assets imported: {mark(external_gates['exactHeroWebpAssetsImported'])}
- GitHub Pages browser smoke: {mark(external_gates['githubPagesBrowserSmoke'])}
- iPhone Safari manual QA: {mark(external_gates['iphoneSafariManualQA'])}

## Current interpretation

The mounted repository is internally testable and preserves the v0.10.0 canonical data contract. It must remain a release candidate until all three external promotion gates pass. Missing Hero assets use the intentional CSS cinematic fallback; they are not silently regenerated or replaced.

## Test entry points

- Application: `index.html`
- Visual asset/contact-sheet QA: `visual-qa.html`
- Automated suite: `npm test`
- Consolidated audit: `python3 scripts/audit_release_candidate.py`
- Hero asset acceptance, pending-tolerant: `python3 scripts/audit_hero_assets.py`
- Hero asset acceptance, strict: `python3 scripts/audit_hero_assets.py --require-complete`
- Browser smoke: `python3 tests/browser_smoke_cdp.py`

## Promotion rule

Promote only when this report changes to **PROMOTE**, the exact upstream package hash is verified, the deployed GitHub Pages commit passes browser smoke, and the iPhone Safari checklist is signed with device/OS/date/commit evidence.
"""
OUT_MD.write_text(md, encoding="utf-8")
print(json.dumps({"status": status, "promotionReady": promotion_ready, "out": [str(OUT_JSON), str(OUT_MD)]}, ensure_ascii=False, indent=2))
