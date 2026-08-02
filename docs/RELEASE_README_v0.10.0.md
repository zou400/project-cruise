# Project Cruise v29 Integration

## Deliverables

- `v0.9.4-v29/index.html`
  - Existing v0.9.4 Learning Loop retained
  - DB v29 integrated
  - 320 destinations
  - 181 canonical routes
  - 501 selectable results
- `v0.10.0/index.html`
  - Same 320/181/501 data foundation
  - Destination Value, Context Fit, and Route Readiness separated internally
  - Route roles added (`verified_route`, `final_destination`, `rain_destination`, `waypoint`, `experimental_destination`)
  - User-facing proposal character labels added
  - Decision time and reroll count added to learning events
  - Existing localStorage learning keys retained for migration compatibility
- `../data/v29-master.json`
  - Reconstructed 320-destination and 181-route master JSON
- `integration-report.json`
  - Source, integration, reconstruction, and coverage summary

## Reconstructed records

The v29 public JSON contained 41 of the 45 destinations added after D275. The following four omitted records were reconstructed from their ID positions, R153-R181 references, and official facility information:

- D277: 浦安市交通公園
- D278: 浦安市運動公園
- D295: 横浜市歴史博物館・大塚歳勝土遺跡
- D299: 横浜市電保存館

Official sources:

- https://www.city.urayasu.lg.jp/shisetsu/kouen/1005633.html
- https://www.city.urayasu.lg.jp/shisetsu/kouen/1005631.html
- https://www.rekihaku.city.yokohama.jp/
- https://www.shiden.yokohama/

## GitHub Pages test flow

1. Create a branch from the currently published v0.9.4 branch.
2. Upload `v0.9.4-v29/index.html` as the branch-root `index.html`.
3. Test the intermediate integration without changing the main/public branch.
4. Create a second branch from that verified integration branch.
5. Upload `v0.10.0/index.html` as the branch-root `index.html`.
6. Test all three time buckets, rerolls, Maps transition, and return feedback.
7. Change GitHub Pages to the selected verified branch only after the checks pass.

Suggested branch names:

- `integration-v29-v0.9.4`
- `release-v0.10.0`

## Verification completed

- 320 unique destination IDs
- 181 unique canonical route IDs
- 501 unique selectable result IDs
- Inline JavaScript syntax validated
- All time buckets exercised in a DOM runtime
- 12-draw diversity smoke test passed for all time buckets
- Existing profile/stat localStorage values preserved in v0.10.0
- v0.10.0 learning event includes route role and three-axis evaluation
- Maps event includes decision seconds and reroll count
