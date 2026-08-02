# Spot v0.13 integration status

This release integrates the v0.13 work as **staging data plus a feature-flagged selection policy**, not as 22 production destinations.

## Active in normal rc7

- breadth lane 20%
- category rotation lane 15%
- quality 35% / discovery 25% / wildcard 5%
- same-category and generic-commercial suppression
- rain-mode multiplier when `?pcRainMode=on` or the previous weather state is rain

## Staging only

- N016–N037 candidate records
- promotion A/B/C/D groups
- wide-vehicle verification queue
- source URLs and unresolved conditions

## Not done by design

- D321+ assignment
- `destinations.json` or `routes.json` additions
- guessed parking Place IDs or coordinates
- Maps links for unresolved staging candidates
- claims that Round 2/3 or Routes API validation are complete

## Rollback

`?pcBreadth=off&pcNewDestinations=off`
