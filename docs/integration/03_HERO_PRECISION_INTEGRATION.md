# 03 — Hero Precision v1 integration

## Decision

Adopt the cross-chat Hero Precision result as a **presentation overlay**, not as a replacement for canonical v0.10.0 data.

## Upstream evidence

- Full package: `Project_Cruise_Hero_Precision_v0.10.4-rc3.zip`
- SHA-256: `7cd1f52c2641bd23eef6b80a7d59d45c1860546d57fea27707f20602a297e3a0`
- Patch SHA-256: `4a026b882325eb55dded3869269c1c143110437156b111c34c4abe5878c19ac3`
- Reported: 30 exact WebPs, 320 destination visual profiles, 501 route affinities, 12,024 selection-matrix cases, zero failures.

## Integrated now

- Hero Precision schema and deterministic runtime
- 320 destination visual profiles generated from the immutable canonical data
- 501 route affinity records with six candidates each
- four phases: day / twilight / night / rain
- six weather states: clear / cloudy / rain / fog / wind / unknown
- recent-image suppression through existing `pcHeroHistoryV1`
- exact-asset import gate and CSS fallback

## Important boundary

The upstream ZIP bytes and its 30 WebP binaries are not mounted in this workspace. No replacement images were generated. The generated profile and affinity JSON files are schema-compatible deterministic overlays and are explicitly marked as such. When exact upstream files become available, the import process must hash-verify and replace the compatible overlays without touching canonical `destinations.json`, `routes.json`, or `project-cruise.json`.

## Rollback

- `?pcVisual=off` disables image use.
- Removing the two `assets/js/hero/` script tags returns to the v0.11 category fallback.
- `?pcUi=classic` removes the entire presentation overlay.
