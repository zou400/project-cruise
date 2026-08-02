# 08 — Cross-chat reconciliation and release handoff

## Goal

This round converts work from the other Project Cruise rooms into an auditable release boundary. It does **not** treat every promising idea as production-ready data. Exact bytes and acceptance evidence take priority over conversation summaries.

## Authority order

1. Canonical v0.10.0 bytes.
2. Exact upstream bytes with known hashes.
3. Verified handoff contracts and schemas.
4. This repository's implementation and test evidence.
5. Design-only references.

A lower-authority source cannot silently overwrite a higher-authority source. All newer behavior is an overlay and must have a kill switch or a rollback path.

## Reconciled tracks

### Adopted

- Canonical 320 destinations, 181 canonical routes and 501 selectable results.
- Cinematic UI and Destination Reveal, including removal of development tags and iPhone Safari hardening.
- Hero Precision profile/affinity data and runtime selection contract.
- Arrival weather as presentation-only data.
- U1-B operational hard gates and bounded automatic reselection.
- Existing Context Engine, reroll learning, return feedback and legacy localStorage keys.

### Adopted with an external gate

- Visual Library 30: exact 30 upstream WebP files are still required.
- Hero Precision visuals: profile and affinity logic is present, but no substitute imagery is fabricated.
- Spot registry: critical U1-B anchors are present, while the full exact 149-anchor source remains external.

### Explicitly deferred

- Official weather-alert blocking. Current source authority supports display/advisory only.
- Spot v0.6 Wave 2 exact import, including its complete listed JSON set, D062/D063 expressway topology and 57 route URL rebuild.
- Any new recommendation-engine behavior for which exact newer bytes were not mounted.

## Non-negotiable boundaries

- Weather cannot change ranking, exclusions or learning in this release candidate.
- Place IDs, coordinates and entrances are never guessed.
- A walking endpoint is never inserted into a driving route.
- Generated Hero visuals remain labelled `体験イメージ`.
- An automated pass is not the same as canonical promotion.

## Source registry

The machine-readable decision record is:

`data/integration/source-authority-registry.v0.11.json`

It records the authority, mounted state, adopted scope, blocking gap and promotion decision for each track.

## Release handoff

The GitHub operator should use these documents in order:

1. `README.md`
2. `DEPLOYMENT.md`
3. `RELEASE_CHECKLIST.md`
4. `VALIDATION.md`
5. `CHANGELOG.md`

The RC should be pushed to `release/v0.11.0-rc3` first. Do not overwrite the production branch until all manual promotion gates have evidence.
