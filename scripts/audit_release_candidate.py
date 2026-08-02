#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECORDS = ROOT / "records"
RECORDS.mkdir(exist_ok=True)


def run_json(name: str, command: list[str]) -> dict:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    record = {
        "name": name,
        "command": command,
        "returnCode": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
    }
    try:
        record["parsed"] = json.loads(proc.stdout)
    except Exception:
        record["parsed"] = None
    return record


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def main() -> int:
    commands = [
        ("canonical", [sys.executable, "scripts/audit_canonical.py", str(ROOT)]),
        ("ui_contract", [sys.executable, "scripts/audit_ui_contract.py", str(ROOT)]),
        ("hero_precision", [sys.executable, "scripts/audit_hero_precision.py", str(ROOT)]),
        ("hero_asset_acceptance", [sys.executable, "scripts/audit_hero_assets.py"]),
        ("visual_qa_contract", [sys.executable, "tests/visual_qa_contract.py"]),
        ("arrival_operational", [sys.executable, "scripts/audit_arrival_integration.py", str(ROOT)]),
        ("operational_core", ["node", "tests/operational_core.test.js"]),
        ("result_state_machine", ["node", "tests/result_state_machine.test.js"]),
        ("operational_selection", ["node", "tests/operational_selection_integration.test.js"]),
        ("mobile_accessibility", [sys.executable, "scripts/audit_mobile_accessibility.py", str(ROOT)]),
        ("release_documentation", [sys.executable, "scripts/audit_release_documentation.py"]),
        ("http_smoke", [sys.executable, "tests/http_smoke.py"]),
    ]
    results = [run_json(name, command) for name, command in commands]
    automated_pass = all(
        row["returnCode"] == 0 and (row["parsed"] is None or row["parsed"].get("passed", True))
        for row in results
    )

    required_files = [
        "index.html",
        "visual-qa.html",
        "project-cruise.json",
        "destinations.json",
        "routes.json",
        "assets/css/cruise-v011.css",
        "assets/js/cruise-v011.js",
        "assets/js/arrival/operational-core.js",
        "assets/js/arrival/result-state-machine.js",
        "assets/js/arrival/arrival-runtime.js",
        "assets/js/weather/weather-runtime.js",
        "integration-manifest.json",
        "package.json",
        ".github/workflows/validate.yml",
        "scripts/audit_hero_assets.py",
        "scripts/generate_release_qa_report.py",
        "tests/visual_qa_contract.py",
        "records/iphone-safari-qa.template.json",
        "docs/integration/06_RELEASE_REPRODUCIBILITY_AND_CI.md",
        "docs/integration/07_IPHONE_SAFARI_ACCESSIBILITY_PERFORMANCE.md",
        "docs/integration/08_CROSS_CHAT_RECONCILIATION_AND_RELEASE_HANDOFF.md",
        "docs/integration/09_VISUAL_QA_ASSET_ACCEPTANCE_AND_FINAL_REPORT.md",
        "DEPLOYMENT.md",
        "RELEASE_CHECKLIST.md",
        "CHANGELOG.md",
        "data/integration/source-authority-registry.v0.11.json",
    ]
    missing = [rel for rel in required_files if not (ROOT / rel).exists()]
    hashes = {rel: sha256(ROOT / rel) for rel in required_files if (ROOT / rel).exists()}

    hero_record = load_json(RECORDS / "hero-asset-acceptance.json")
    browser_record = load_json(RECORDS / "browser-smoke.json")
    iphone_record = load_json(RECORDS / "iphone-safari-qa.json")
    external_gates = {
        "exactHeroWebpAssetsImported": hero_record.get("complete") is True and hero_record.get("status") == "accepted",
        "githubPagesBrowserSmoke": browser_record.get("passed") is True and browser_record.get("status") != "skipped",
        "iphoneSafariManualQA": iphone_record.get("passed") is True and iphone_record.get("signed") is True,
    }
    report = {
        "release": "v0.11.0-rc4",
        "deepening": 9,
        "automatedPassed": automated_pass and not missing,
        "promotionReady": automated_pass and not missing and all(external_gates.values()),
        "missingRequiredFiles": missing,
        "automatedChecks": results,
        "externalPromotionGates": external_gates,
        "browserEvidence": {
            "status": browser_record.get("status", "not-run"),
            "passed": browser_record.get("passed"),
            "screenshotsPresent": [
                rel for rel in ("records/ui-smoke-desktop.png", "records/ui-smoke-mobile.png")
                if (ROOT / rel).exists()
            ],
        },
        "hashes": hashes,
        "interpretation": {
            "automatedPassed": "The repository is internally reproducible and all mounted-data tests pass.",
            "promotionReady": "False until exact upstream Hero WebP assets, a non-skipped deployed/browser smoke, and signed iPhone Safari manual QA are complete.",
        },
    }
    out = RECORDS / "release-candidate-audit.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "release": report["release"],
        "deepening": report["deepening"],
        "automatedPassed": report["automatedPassed"],
        "promotionReady": report["promotionReady"],
        "missingRequiredFiles": missing,
        "externalPromotionGates": external_gates,
        "browserEvidence": report["browserEvidence"],
        "record": str(out.relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))
    return 0 if report["automatedPassed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
