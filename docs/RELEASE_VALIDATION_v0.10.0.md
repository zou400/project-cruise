# Validation Report

Validation date: 2026-07-31

## Data integrity

- Destination records: 320
- Unique destination IDs: 320
- Missing destination IDs from D001-D320: 0
- Canonical route records: 181
- Unique canonical route IDs: 181
- Missing route IDs from R001-R181: 0
- Direct destination results: 320
- Total selectable results: 501
- Unique result IDs: 501

The master retains 17 duplicate destination names that already existed under different IDs in the 275-destination source. Selection continues to group identical normalized names, matching v0.9.4 behavior.

## Code checks

- v0.9.4-v29 inline JavaScript syntax: passed
- v0.10.0 inline JavaScript syntax: passed
- Runtime initialization in a DOM environment: passed
- Uncaught runtime errors during selection smoke test: 0

## Selection smoke test

Twelve draws were run for each time bucket in both releases.

- v0.9.4-v29: 12/12 distinct destinations in 90 minutes, 2 hours, and half-day
- v0.10.0: 11-12/12 distinct destinations across the three buckets
- Newly reconstructed destinations appeared in the eligible pool
- Route-character label rendered in v0.10.0
- Three-axis values were written to v0.10.0 learning events

## Learning compatibility

- Existing `pcSelectionProfileV1` value preserved
- Existing `pcRouteStatsV1` value preserved
- Existing localStorage key names retained
- Pending cruise record uses `pageVersion: v0.10.0`
- Maps event includes `decisionSeconds` and `rerollCount`

## Known data-model note

Some curated route waypoints and nine route goals do not have an exact standalone destination-name record. This condition already existed in the 152-route source. Route display and Google Maps generation use the route record directly, while destination-level enrichment falls back to route metadata.
