from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
js = (root / "assets/js/cruise-v011.js").read_text(encoding="utf-8")
css = (root / "assets/css/cruise-v011.css").read_text(encoding="utf-8")
checks = {
    "hardNoRepeatWindow24": "SESSION_NO_REPEAT_LIMIT=24" in html,
    "qualityLaneRebalanced": 'roll<.52?"quality":roll<.90?"discovery":"wildcard"' in html,
    "currentDestinationBlocked": 'blocked.add(currentKey)' in html,
    "lanePoolSupplemented": 'const supplement=candidates.filter' in html,
    "rerollPromptIdleDelay": 'setTimeout(openRerollModal,1800)' in html,
    "persistentDecisionDock": 'pc-decision-dock' in js and 'pc-decision-dock' in css,
    "dockMirrorsDestination": 'pc-decision-destination' in js,
    "dockTriggersExistingReroll": 'redraw.click()' in js,
    "sessionProgressShown": 'sessionDestinations.size' in js,
    "safeAreaDock": 'safe-area-inset-bottom' in css,
}
result = {"release": "v0.11.0-rc6", "checks": checks, "passed": all(checks.values())}
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(0 if result["passed"] else 1)
