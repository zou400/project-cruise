# Deepening 04 — Arrival, Weather, and Operational Truth Integration

Release target: `Project_Cruise_GitHub_Integration_v0.11.0-rc4`

## Purpose

Turn the result screen into an actionable arrival view without weakening the canonical v0.10.0 selection, learning, return-feedback, issue-report, or Google Maps behavior.

This deepening implements three connected presentation/runtime layers:

1. selected parking and walking endpoint display;
2. operational hard gates before ranking and before Maps handoff;
3. display-only arrival weather and deterministic supporting copy.

## User-facing result contract

The result view now prioritizes:

- selected parking name;
- estimated arrival time;
- parking operating window when known;
- walking endpoint when it exists;
- one short arrival sentence;
- arrival-area weather with an icon and three compact facts.

Development labels such as `SHADOW` and `順位未反映` are not rendered. Weather remains supporting information; the Hero image and destination remain the focal point.

## Operational data boundary

Source decisions imported exactly into this build:

- 15 U1-B canonical operational overlay decisions;
- 28 critical arrival anchors needed by the U1-B acceptance vectors;
- 22 implementation test vectors.

The upstream handoff references a 149-row exact anchor registry. Those complete source bytes are not mounted in this build workspace. The build therefore does **not** manufacture the missing rows.

Instead, the remaining canonical destinations receive display-only records derived from canonical parking text. These records:

- have no Place ID;
- have no coordinates;
- are never promoted to a verified driving anchor;
- cannot override an unresolved exact parking choice;
- exist only to avoid a blank parking card.

This boundary is recorded in `records/arrival-operational-audit.json`.

## Safety and routing rules

The operational runtime applies these rules before candidate scoring:

- unresolved parking choices fail closed;
- vehicle width constraints are hard gates;
- dated closures, facility hours, parking hours, and exit-lock margins are hard gates;
- a `walk_only_endpoint` is never inserted into a driving waypoint list;
- unresolved parking prevents publication of a replacement Maps URL;
- canonical data files remain unchanged.

The operational overlay can be disabled with:

```text
?pcOps=off
```

The arrival presentation can be disabled independently with:

```text
?pcArrival=off
```

## Weather contract

The weather adapter requests hourly arrival-time data from Open-Meteo when destination coordinates can be resolved. It uses:

- temperature;
- apparent temperature;
- precipitation probability;
- precipitation;
- weather code;
- visibility;
- wind speed;
- wind gusts.

Runtime behavior:

- weather never writes into ranking or learning;
- weather failure never blocks destination reveal or Maps handoff;
- cache key: `pcWeatherCacheV1`;
- cache TTL: 30 minutes;
- attribution: `Weather data by Open-Meteo.com`;
- kill switch: `?pcWeather=off`.

GitHub/manual demonstration states:

```text
?weatherDemoState=live
?weatherDemoState=caution
?weatherDemoState=avoid
```

These states are visual test fixtures only.

## Narrative contract

The arrival copy is deterministic and local in this RC. It may respond to broad weather state and destination category, but it does not invent numerical weather facts. Numeric facts shown in the card come only from the weather response or explicit demo fixtures.

## Event flow

```text
canonical route selection
  -> operational hard-gate check before ranking
  -> pc:route-shown
  -> selected parking / Maps URL resolution
  -> arrival weather request
  -> pc:arrival-weather
  -> Hero visual weather modifier
  -> pc:route-estimate
  -> arrival time, parking card, and weather refresh
```

## Verification

Automated checks completed in this workspace:

- canonical counts unchanged: 320 / 181 / 320 / 501;
- U1-B and lane vectors: 22 / 22 pass;
- no guessed Place IDs: 0;
- no guessed coordinates: 0;
- walk endpoints marked driving-eligible: 0;
- unresolved anchors marked default-for-Maps: 0;
- JavaScript syntax checks pass;
- UI, Hero Precision, and canonical audits pass.

The browser smoke script was upgraded to test the arrival and weather cards over a local HTTP server. Chromium navigation is blocked by the current managed execution environment, so browser execution remains a required GitHub Actions or local-machine gate.

## Files

- `data/operational/canonical-operational-overlay-u1b.v0.11.json`
- `data/operational/arrival-anchor-display.v0.11.json`
- `data/operational/implementation-test-vectors.v0.11.json`
- `assets/js/arrival/operational-core.js`
- `assets/js/arrival/arrival-runtime.js`
- `assets/js/weather/weather-runtime.js`
- `scripts/audit_arrival_integration.py`
- `tests/operational_core.test.js`
- `records/arrival-operational-audit.json`
- `records/operational-core-test.json`
