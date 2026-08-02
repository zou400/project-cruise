# Project Cruise v0.11.0-rc4 — Baseline and Promotion Policy

## Decision

The final GitHub test package will be built as **v0.11.0-rc4**.

This version number intentionally separates the integrated release candidate from the fragmented v0.10.1–v0.10.4 experiments. The canonical data baseline remains v0.10.0 until the RC passes all gates.

## Immutable baseline

- 320 destinations: D001–D320
- 181 canonical routes: R001–R181
- 320 direct destination candidates: P-D001–P-D320
- 501 selectable results total
- Existing local learning keys remain compatible
- `project-cruise.json` remains the canonical data master

## Architecture rule

New operational truth, arrival anchors, weather, narratives, and visual metadata are added as **overlays**. They must not destructively rewrite the canonical records during the RC phase.

This gives the test build two safety switches:

1. feature-specific disable switches;
2. complete overlay disable, restoring v0.10.0 behavior.

## Promotion ladder

1. `canonical-v0.10.0`: trusted data and behavior baseline.
2. `integration-v0.11.0-rc4`: GitHub Pages test candidate.
3. `integration-v0.11.0`: only after automated regression and iPhone Safari manual QA.
4. canonical promotion: only after the user accepts the tested build.

## Feature decisions

### Cinematic UI
Adopt, but refactor the result screen around a cinematic hero and a compact information hierarchy. Development badges are removed from the normal user view.

### Visual Library 30
Adopt with a visible `体験イメージ` disclosure. Images support atmosphere; they are not represented as documentary photos of each destination.

### Weather
Adopt as display-only. It may explain the arrival scene but must not change ranking, learning, exclusion, or warning-based blocking in this RC.

### Weather Narrative
Adopt the deterministic local engine first. AI copy is optional and must fail closed to local text without delaying the result.

### Spot operational truth
Adopt as a reversible overlay. Hard gates are evaluated before score adjustments. Arrival anchors are selected independently from display POIs.

### Learning
Preserve existing behavior and keys. Weather signals remain excluded from learning in this RC.

## UI decisions from the annotated review

- remove small tag rows above the hero and result details;
- enlarge the meaningful destination scene instead of showing internal status labels;
- show an arrival-area weather heading;
- remove `順位未反映` and `SHADOW` from the standard user-facing weather card;
- use compact weather icons and progressive disclosure for detailed metrics;
- show the selected parking lot name clearly;
- replace technical parking prose with a short, useful, lightly witty arrival line;
- preserve Google Maps departure, reroll, return feedback, and issue report.
