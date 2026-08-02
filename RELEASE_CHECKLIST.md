# Project Cruise v0.11.0-rc3 — Release checklist

## Build identity

- [ ] Branch: `release/v0.11.0-rc3`
- [ ] Commit SHA recorded: `________________`
- [ ] GitHub Pages URL recorded: `________________`
- [ ] Test date/time (JST): `________________`
- [ ] Tester/device: `________________`

## Automated gates

- [ ] `npm test` passes from a clean checkout.
- [ ] `python3 scripts/audit_release_candidate.py` passes.
- [ ] GitHub Actions `Validate Project Cruise RC` passes.
- [ ] Validation artifact is downloaded or retained.
- [ ] 320 destinations / 181 canonical routes / 501 results remain unchanged.

## Hero and visual gates

- [ ] Exact upstream 30 WebP files are present in `assets/hero/precision/`.
- [ ] All 30 catalog IDs resolve without 404.
- [ ] `体験イメージ` disclosure is visible.
- [ ] Day, twilight, night and rain phases are checked.
- [ ] Clear, cloudy, rain, fog and wind visual states are checked.
- [ ] Consecutive rerolls do not visibly repeat the same Hero excessively.
- [ ] `?pcVisual=off` leaves the service usable.

## iPhone Safari

- [ ] Portrait mode, fresh load.
- [ ] Landscape mode.
- [ ] Dynamic Island/notch and home indicator do not cover controls.
- [ ] Safari address-bar expansion/collapse does not break layout.
- [ ] All primary targets are easy to tap.
- [ ] Long destination and parking names wrap cleanly.
- [ ] Dialog focus, close button and page return behave correctly.
- [ ] Reduced Motion is respected.
- [ ] Low Data test with `?pcData=low` remains usable.

## Functional flow

- [ ] Location allowed.
- [ ] Location denied/fallback.
- [ ] 90-minute selection.
- [ ] 2-hour selection.
- [ ] Half-day selection.
- [ ] Reroll and local learning continue working.
- [ ] Google Maps opens a driving-safe destination.
- [ ] Walking-only endpoint is not a driving waypoint.
- [ ] Return feedback is saved.
- [ ] Issue report works.
- [ ] Existing localStorage data remains compatible.

## Weather

- [ ] Arrival-area heading is correct.
- [ ] Forecast failure does not block recommendation or Maps.
- [ ] Source attribution is visible for live forecast data.
- [ ] Weather never changes ranking or learning.
- [ ] `?pcWeather=off` works.
- [ ] Demo fixtures are not mistaken for live data.

## Operational truth

- [ ] Known closed/unavailable destinations are skipped before display.
- [ ] Late road-estimate invalidation triggers bounded reselection.
- [ ] Operational skip does not write a user rejection signal.
- [ ] Unresolved parking does not expose a public Maps departure link.
- [ ] `?pcOps=off` restores canonical behavior for diagnosis.

## Promotion decision

- [ ] All blocking items above are complete.
- [ ] No unresolved P0/P1 defects.
- [ ] Final RC ZIP SHA-256 recorded: `________________`
- [ ] Canonical promotion approved by: `________________`

Until every blocking box is checked, status remains **RC / HOLD**, not canonical production.
