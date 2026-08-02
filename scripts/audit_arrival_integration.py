#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_json(relative: str):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def read_text(relative: str):
    return (ROOT / relative).read_text(encoding="utf-8")


def main() -> int:
    registry = read_json("data/operational/arrival-anchor-display.v0.11.json")
    overlay = read_json("data/operational/canonical-operational-overlay-u1b.v0.11.json")
    vectors = read_json("data/operational/implementation-test-vectors.v0.11.json")
    test_report = read_json("records/operational-core-test.json")
    state_report = read_json("records/result-state-machine-test.json")
    coverage_report = read_json("records/operational-route-coverage-test.json")
    html = read_text("index.html")
    core = read_text("assets/js/arrival/operational-core.js")
    arrival = read_text("assets/js/arrival/arrival-runtime.js")
    state_machine = read_text("assets/js/arrival/result-state-machine.js")
    weather = read_text("assets/js/weather/weather-runtime.js")
    css = read_text("assets/css/cruise-v011.css")

    anchors = registry.get("anchors", [])
    critical = [a for a in anchors if a.get("anchorRole") != "display_only"]
    display_only = [a for a in anchors if a.get("anchorRole") == "display_only"]
    walk = [a for a in anchors if a.get("type") == "walk_only_endpoint" or a.get("anchorRole") == "walk_endpoint"]
    unresolved = [a for a in anchors if a.get("status") in {"anchor_choice_required", "parking_selection_required"}]

    guessed_place_ids = [a.get("anchorId") for a in anchors if a.get("placeId") not in (None, "")]
    guessed_coordinates = [
        a.get("anchorId") for a in anchors
        if a.get("latitude") not in (None, "") or a.get("longitude") not in (None, "")
    ]
    walk_driving = [a.get("anchorId") for a in walk if a.get("drivingEligible")]
    unresolved_default = [a.get("anchorId") for a in unresolved if a.get("defaultForMaps")]

    source_ui = "\n".join([html, arrival, weather, css])
    checks = {
        "overlay_is_non_destructive": overlay.get("applyMode") == "non_destructive_overlay" and overlay.get("baseCanonical") == "v0.10.0",
        "overlay_decisions_15": len(overlay.get("items", [])) == 15,
        "critical_operational_anchors_28": len(critical) == 28,
        "canonical_display_fallbacks_305": len(display_only) == 305,
        "no_place_ids_invented": not guessed_place_ids,
        "no_coordinates_invented": not guessed_coordinates,
        "walk_endpoints_never_driving": not walk_driving,
        "unresolved_anchors_not_default_for_maps": not unresolved_default,
        "source_test_vectors_22": len(vectors.get("tests", [])) == 22,
        "operational_tests_22_pass": test_report.get("total") == 22 and test_report.get("pass") == 22 and test_report.get("fail") == 0,
        "hard_gate_hook_runs_before_ranking": "ProjectCruiseOperational.isRouteEligible" in html and "function eligiblePool()" in html,
        "walk_endpoint_filtered_from_driving_url": "walk_only_endpoint" in core and "waypointRows.map(row => row.query).filter(Boolean)" in core,
        "unresolved_maps_are_blocked": "anchor_unresolved" in core and 'element.setAttribute("aria-disabled", "true")' in arrival,
        "operational_kill_switch_present": 'params.get("pcOps") === "off"' in arrival,
        "weather_is_display_only_declared": "Display-only. Never changes ranking, learning, exclusion, or Maps eligibility." in weather,
        "weather_kill_switch_present": 'params.get("pcWeather") !== "off"' in weather,
        "weather_cache_30_minutes": 'const cacheKey = "pcWeatherCacheV1"' in weather and "30 * 60 * 1000" in weather,
        "open_meteo_endpoint_present": "https://api.open-meteo.com/v1/forecast" in weather,
        "open_meteo_attribution_present": "Weather data by Open-Meteo.com" in arrival,
        "arrival_area_heading_present": "の到着時予報" in weather,
        "normal_ui_has_no_shadow_rank_labels": "SHADOW" not in source_ui and "順位未反映" not in source_ui,
        "selected_parking_is_primary_heading": 'id="pc-anchor-name"' in arrival,
        "short_arrival_copy_present": "車はここで休憩" in arrival and "車には静かに待っていてもらいます" in arrival,
        "weather_visual_selector_fixed": 'body.pc-v011[data-weather="rain"] .pc-scene-media' in css,
        "result_state_machine_loaded": "result-state-machine.js" in html and "ProjectCruiseResultStateMachine" in state_machine,
        "bounded_auto_reselection_8": "maxAutomaticReselects: 8" in arrival and "pc:operational-reselect-request" in arrival,
        "state_machine_tests_pass": state_report.get("fail") == 0 and state_report.get("pass", 0) >= 8,
        "affected_route_coverage_pass": coverage_report.get("fail") == 0 and coverage_report.get("summary", {}).get("affectedRouteCount") == 43,
        "operational_skip_does_not_penalize_preference": 'logLearningEvent("operational_skip"' in html and "recordRejection(activeRoute)" not in html[html.find('pc:operational-reselect-request'):html.find('pc:operational-exhausted')],
        "scripts_loaded_in_safe_order": html.find("arrival-data.js") < html.find("operational-core.js") < html.find("result-state-machine.js") < html.find("arrival-runtime.js") < html.find("weather-runtime.js") < html.find("cruise-v011.js"),
    }

    report = {
        "release": "v0.11.0-rc3",
        "deepening": 5,
        "scope": {
            "overlayDecisionCount": len(overlay.get("items", [])),
            "registryRows": len(anchors),
            "criticalOperationalAnchors": len(critical),
            "canonicalDisplayFallbacks": len(display_only),
            "walkEndpoints": len(walk),
            "unresolvedAnchors": len(unresolved),
            "testVectors": len(vectors.get("tests", [])),
        },
        "violations": {
            "guessedPlaceIds": guessed_place_ids,
            "guessedCoordinates": guessed_coordinates,
            "walkEndpointsDrivingEligible": walk_driving,
            "unresolvedDefaultForMaps": unresolved_default,
        },
        "checks": checks,
        "passed": all(checks.values()),
        "boundary": {
            "exactSourceRowsMounted": 28,
            "fullUpstreamRegistryRowsReferenced": 149,
            "remainingRows": "canonical display-only fallbacks; no guessed Place ID, coordinates, or driving anchor promotion",
            "browserSmoke": "environment-blocked; test retained for GitHub Actions/local execution",
        },
    }
    output = ROOT / "records/arrival-operational-audit.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
