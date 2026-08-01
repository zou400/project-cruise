# Release notes — Project Cruise v0.10.3

## Release theme

`Cinematic Polish`: 写真・色・余白・CTAを一つの世界観へ揃え、「検索」ではなく「今夜の一本が解放される」体験を強化しました。

## Preserved without data changes

- 320 destinations
- 181 canonical completed routes
- 320 direct destination candidates
- 501 selectable results
- Context Engine
- Re-roll and device-local learning
- Google Maps departure links
- Return evaluation and issue reporting

## Added

- Four original 1672×941 cinematic category visuals
- Single-layer hero composition
- Black / white / coral-red visual system
- iPhone safe-area action bar
- Google Maps `maps3d` on-demand integration with 2D fallback
- AUTO / CINEMATIC / MIDNIGHT NOIR
- TRACE / STANDARD / DEEP
- Optional arrival-weather and narrative endpoint
- Decision Confidence and learning schemaVersion 5
- Local Leaflet assets

## Learning correction

A generic re-roll now affects only the current session's diversity. It no longer writes every unselected trait into long-term dislike data. Only an explicit re-roll reason or explicit negative trip outcome creates strong negative preference evidence. Time overrun and not going remain operational outcomes, not taste judgments.

## Next

1. Deploy v0.10.3 to a preview branch and run iPhone Safari QA.
2. Enable a restricted Google Maps browser key and verify 3D coverage for Tokyo Bay, Kawasaki, and Yokohama.
3. Connect the commercial weather proxy and destination-specific narrative service.
4. Add owned or licensed photography overrides for the first 30 high-frequency destinations.
