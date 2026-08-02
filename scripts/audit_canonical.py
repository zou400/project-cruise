#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def load_json(name: str):
    with (ROOT / name).open(encoding='utf-8') as f:
        return json.load(f)


def main() -> int:
    destinations = load_json('destinations.json')
    routes = load_json('routes.json')
    master = load_json('project-cruise.json')
    html = (ROOT / 'index.html').read_text(encoding='utf-8')

    canonical = [r for r in routes if r.get('candidateSource') == 'canonical_route']
    direct = [r for r in routes if r.get('candidateSource') == 'destination_direct']
    d_ids = [d.get('id') for d in destinations]
    r_ids = [r.get('id') for r in canonical]
    all_candidate_ids = [r.get('id') for r in routes]

    checks = {
        'destinations_320': len(destinations) == 320,
        'canonical_routes_181': len(canonical) == 181,
        'direct_candidates_320': len(direct) == 320,
        'selectable_results_501': len(routes) == 501,
        'destination_ids_unique': len(d_ids) == len(set(d_ids)),
        'canonical_route_ids_unique': len(r_ids) == len(set(r_ids)),
        'candidate_ids_unique': len(all_candidate_ids) == len(set(all_candidate_ids)),
        'master_destinations_match': len(master.get('data', {}).get('destinations', [])) == 320,
        'master_routes_match': len(master.get('data', {}).get('routes', [])) == 501,
        'legacy_profile_key_present': 'pcSelectionProfileV1' in html,
        'legacy_route_stats_key_present': 'pcRouteStatsV1' in html,
        'maps_handoff_present': 'google.com/maps/dir/?api=1' in html,
        'return_feedback_present': 'pcPendingCruiseV1' in html,
        'issue_report_present': 'pcIssueReportsV1' in html,
        'leaflet_script_present': 'leaflet@1.9.4/dist/leaflet.js' in html,
        'canonical_data_script_present': 'window.PROJECT_CRUISE_CONFIG' in html and 'window.PROJECT_CRUISE_ROUTES' in html,
        'canonical_engine_script_present': 'function chooseDestinationCandidate' in html and 'function recordTripOutcome' in html,
        'ui_overlay_script_present': 'assets/js/cruise-v011.js' in html and 'assets/css/cruise-v011.css' in html
    }

    report = {
        'release': 'v0.11.0-rc5-build',
        'root': str(ROOT),
        'counts': {
            'destinations': len(destinations),
            'canonicalRoutes': len(canonical),
            'directCandidates': len(direct),
            'selectableResults': len(routes)
        },
        'checks': checks,
        'hashes': {
            'index.html': sha256(ROOT / 'index.html'),
            'destinations.json': sha256(ROOT / 'destinations.json'),
            'routes.json': sha256(ROOT / 'routes.json'),
            'project-cruise.json': sha256(ROOT / 'project-cruise.json')
        },
        'passed': all(checks.values())
    }
    out = ROOT / 'records' / 'baseline-audit.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
