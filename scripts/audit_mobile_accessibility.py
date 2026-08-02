#!/usr/bin/env python3
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/css/cruise-v011.css").read_text(encoding="utf-8")
js = (ROOT / "assets/js/cruise-v011.js").read_text(encoding="utf-8")

ids = re.findall(r'\bid="([^"]+)"', html)
duplicates = sorted({value for value in ids if ids.count(value) > 1})
checks = {
    "viewport_fit_cover": "viewport-fit=cover" in html,
    "safe_area_css": "safe-area-inset-bottom" in css and "safe-area-inset-top" in css,
    "dynamic_viewport_units": "100dvh" in css and "100svh" in css,
    "touch_targets_44px": "min-height:44px" in css,
    "focus_visible": ":focus-visible" in css,
    "skip_link": 'class="pc-skip-link"' in html and 'id="main-content"' in html,
    "reduced_motion": "prefers-reduced-motion" in css,
    "reduced_data": "prefers-reduced-data" in css and 'params.get("pcData") === "low"' in js,
    "radio_semantics": 'role="radiogroup"' in html and 'role="radio"' in html and "syncChoiceGroup" in js,
    "dialog_focus_trap": "focusableElements" in js and 'event.key === "Escape"' in js,
    "dialog_keyboard_safe": "max-height:calc(100dvh" in css and "font-size:16px" in css,
    "map_touch_height": "48svh" in css,
    "long_title_wrap": "white-space:normal" in css and "overflow-wrap:anywhere" in css,
    "no_duplicate_ids": not duplicates,
    "about_expanded_state": 'aria-expanded="false"' in html and "aria-expanded" in js,
    "status_live_regions": html.count('role="status"') >= 4,
}
report = {
    "release": "v0.11.0-rc6",
    "deepening": 7,
    "target": ["iPhone Safari", "touch", "keyboard", "reduced motion", "low data"],
    "checks": checks,
    "duplicateIds": duplicates,
    "passed": all(checks.values()),
}
out = ROOT / "records/mobile-accessibility-audit.json"
out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(0 if report["passed"] else 1)
