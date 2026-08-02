#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    'README.md', 'DEPLOYMENT.md', 'RELEASE_CHECKLIST.md', 'VALIDATION.md', 'CHANGELOG.md',
    'docs/integration/08_CROSS_CHAT_RECONCILIATION_AND_RELEASE_HANDOFF.md',
    'data/integration/source-authority-registry.v0.11.json'
]
missing = [p for p in required if not (ROOT / p).is_file()]
registry_path = ROOT / 'data/integration/source-authority-registry.v0.11.json'
registry = json.loads(registry_path.read_text(encoding='utf-8')) if registry_path.exists() else {}
tracks = registry.get('tracks', [])
ids = {row.get('id') for row in tracks}
expected_ids = {
    'canonical-v0.10.0','cinematic-ui','visual-library-30','hero-precision-v1',
    'weather-arrival-display','official-weather-alerts','spot-operational-v0.11-u1b',
    'spot-operational-v0.6-wave2','recommendation-learning-engine','qa-release-evidence'
}
checks = {
    'requiredDocumentsPresent': not missing,
    'allExpectedTracksRecorded': expected_ids.issubset(ids),
    'canonicalPromotionHeld': registry.get('promotionDecision', {}).get('canonicalPromotion') == 'HOLD',
    'noSilentPromotionPolicy': registry.get('policy', {}).get('noSilentPromotion') is True,
    'overlayFirstPolicy': registry.get('policy', {}).get('overlayFirst') is True,
}
report = {
    'release': 'v0.11.0-rc6',
    'deepening': 8,
    'required': required,
    'missing': missing,
    'trackCount': len(tracks),
    'checks': checks,
    'passed': all(checks.values())
}
(ROOT/'records/release-documentation-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(0 if report['passed'] else 1)
