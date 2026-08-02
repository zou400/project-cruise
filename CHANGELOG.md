# Changelog

## v0.11.0-rc5 — compact destination reveal

- Moved Destination Reveal into the selector right pane.
- Removed the duplicated full-width Hero below the selector.
- Kept destination name and reroll action together above the fold.

## v0.11.0-rc5 — Hero display reliability

- Added a real image layer for Hero rendering.
- Removed automatic save-data suppression from the normal URL.
- Increased load timeout and cache-busted Hero assets.
- Preserved exact Hero 30, reroll diversity and mobile decision dock.

## v0.11.0-rc5 — exact Hero 30 integrated

### Added

- Imported and SHA-256 verified all 30 exact Hero WebP assets.
- Reconnected the Hero Precision catalog to the exact generated source pack.
- Added a complete-replacement GitHub upload package.

## v0.11.0-rc1 — integration candidate

### Added

- Cinematic two-stage selection and Destination Reveal presentation.
- Data-driven Hero Precision profiles for 320 destinations and affinities for 501 results.
- Arrival weather display with cache, attribution and graceful failure.
- Parking/arrival presentation and operational hard-gate overlay.
- Bounded automatic reselection after preliminary or late operational invalidation.
- iPhone Safari safe-area, dynamic viewport, touch, keyboard and reduced-motion hardening.
- GitHub Actions validation, HTTP smoke tests and consolidated release audit.
- Cross-chat source-authority registry, deployment guide and release checklist.

### Changed

- Development tags and unclear `SHADOW`/ranking labels are removed from the normal result view.
- Arrival weather is headed by destination area.
- Parking name, arrival time and walking endpoint are prioritized.
- Weather remains presentation-only and cannot write recommendation or learning signals.

### Preserved

- 320 destinations.
- 181 canonical routes.
- 320 direct-destination candidates.
- 501 selectable results.
- Context Engine, reroll/local learning, Google Maps handoff, return feedback and issue reporting.
- Existing localStorage keys.

### External gates

- Exact upstream 30 Hero WebP assets were pending in rc1; they are integrated in rc3.
- GitHub Pages deployed-browser smoke is pending.
- iPhone Safari real-device QA is pending.
- Full exact 149-anchor registry and Spot v0.6 Wave 2 input set are not silently reconstructed.

### Rollback

Use the query switches documented in `DEPLOYMENT.md`, or redeploy canonical v0.10.0.
