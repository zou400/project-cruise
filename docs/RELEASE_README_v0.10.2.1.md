# Project Cruise Visual Reveal v0.10.2.1

This release preserves the canonical v0.10.0 destination, route, learning, map, feedback, and issue-reporting logic while replacing the weak result reveal with a dedicated cinematic layer.

## Implemented

- Full-width `MISSION UNLOCKED` reveal before route details
- Four local WebP visual fallbacks: airport, bay/bridge, industrial night, and urban architecture
- Automatic visual selection from destination/category text
- Split-frame composition inspired by cinematic key art, without reusing third-party artwork
- Destination title scaling for long Japanese and mixed Latin/Japanese names
- Primary departure action moved into the reveal layer
- Duplicate destination heading visually removed from the detail card
- Mobile one-column reveal with readable copy and full-width departure action
- `CRUISE ATLAS` map treatment: dark terrain tint, subdued road network, orange selected route, vignette, and world-layer badge
- Existing Google Maps departure links remain unchanged and open the native Google interface

## Visual policy

The included images are generated prototype fallbacks, not claims of exact destination appearance. The UI is ready for owned or licensed destination photography via `assets/visuals/manifest.json` and future destination overrides.

## Preserved

- 320 destinations
- 181 canonical completed routes
- 501 total result candidates
- Context Engine and candidate scoring
- Re-roll and device-local learning
- Google Maps departure links
- Return evaluation and issue reports

## Next

1. Add owned/licensed photography for the first 30 high-frequency destinations.
2. Add destination-specific overrides to the visual manifest.
3. Connect an on-demand Google Maps 3D/Aerial layer with 2D fallback.
4. Build Cruise Atlas for Tokyo Bay, Shuto Expressway, Kawasaki, and Yokohama exploration.
