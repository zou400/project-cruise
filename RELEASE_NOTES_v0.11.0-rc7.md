# Project Cruise v0.11.0-rc7 — Spot v0.13 Staging Integration

## Added

- Spot Chat v0.13 source-derived staging package under `data/staging/spot-chat-v0.13/`.
- 22 non-production destination candidates and wide-vehicle compatibility records.
- Feature-flagged breadth and category-rotation selection lanes.
- Staging-only QA page: `spot-staging-v013.html`.
- Automated 18-case Spot v0.13 policy acceptance test.

## Runtime behavior

- `pcBreadth` defaults ON in this RC and changes selection among the existing 501 results only.
- `?pcBreadth=off` restores the rc6 lane distribution.
- New N016–N037 staging candidates are NOT added to `destinations.json`, `routes.json`, Google Maps handoff, or learning history.
- `?pcNewDestinations=preview` shows a staging badge linking to the QA page; it does not promote candidates.

## Safety boundary

The source package is exploration round 1/3. Routes API distance confirmation, legal arrival anchors, unresolved parking dimensions, Round 2 and Round 3 remain external gates before D321+ assignment or production selection.
