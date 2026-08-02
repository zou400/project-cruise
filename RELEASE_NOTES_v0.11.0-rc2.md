# Project Cruise v0.11.0-rc2

## Changes

- Added a persistent destination switcher that keeps the current destination name and `次の一本` button in the same viewport.
- Added a hard no-repeat window of up to 24 recently shown destinations, with gradual fallback only when the eligible pool becomes too small.
- Rebalanced selection lanes from 70/25/5 to 52/38/10 to expose more of the eligible destination pool.
- Reduced modal interruption during rapid rerolls; the reason prompt now waits for an idle pause after every eighth reroll.
- Added session progress display such as `このセッション 7 / 150地点`.

## Preserved

- 320 destinations, 181 canonical routes and 501 selectable results.
- Operational hard gates, Google Maps handoff, arrival weather and local learning.
