#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'assets/css/cruise-v011.css').read_text(encoding='utf-8')
    js = (ROOT / 'assets/js/cruise-v011.js').read_text(encoding='utf-8')

    required_ids = {
        'origin-current', 'origin-preset', 'origin-status', 'draw', 'result',
        'destination', 'title', 'intent', 'caution', 'gmap', 'redraw',
        'report-issue', 'map-link', 'map', 'about-toggle'
    }
    found_ids = set(re.findall(r'\bid=["\']([^"\']+)', html))

    checks = {
        'canonical_interaction_ids_preserved': required_ids.issubset(found_ids),
        'ui_css_loaded_after_canonical_style': html.find('assets/css/cruise-v011.css') > html.find('</style>'),
        'ui_script_loaded_after_canonical_engine': html.rfind('assets/js/cruise-v011.js') > html.find('function chooseDestinationCandidate'),
        'route_shown_event_present': 'pc:route-shown' in html,
        'route_estimate_event_present': 'pc:route-estimate' in html,
        'classic_ui_kill_switch_present': 'pcUi") === "classic"' in js,
        'visual_kill_switch_present': 'pcVisual") === "off"' in js,
        'visual_history_key_preserved': 'pcHeroHistoryV1' in js,
        'experience_image_disclosure_present': '体験イメージ' in js,
        'development_result_tags_hidden': '.result-top{display:none!important}' in css,
        'responsive_breakpoints_present': '@media(max-width:900px)' in css and '@media(max-width:560px)' in css,
        'reduced_motion_supported': 'prefers-reduced-motion' in css,
        'canonical_data_not_externalized': 'window.PROJECT_CRUISE_ROUTES' in html and 'window.PROJECT_CRUISE_DESTINATIONS' in html,
        'no_remote_new_ui_dependency': not re.search(r'https?://', js),
    }

    report = {
        'release': 'v0.11.0-rc5',
        'track': 'ui-component-and-event-contract',
        'checks': checks,
        'missingCanonicalIds': sorted(required_ids - found_ids),
        'hashes': {
            'index.html': sha256(ROOT / 'index.html'),
            'assets/css/cruise-v011.css': sha256(ROOT / 'assets/css/cruise-v011.css'),
            'assets/js/cruise-v011.js': sha256(ROOT / 'assets/js/cruise-v011.js')
        },
        'passed': all(checks.values())
    }
    out = ROOT / 'records/ui-contract-audit.json'
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
