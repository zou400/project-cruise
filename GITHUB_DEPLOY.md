# GitHub deployment

## Recommended safe test

1. Create a branch named `visual-reveal-v0.10.2.1` from the currently published branch.
2. Upload the contents of this folder to the repository root. `index.html` must remain at the root.
3. Commit with: `Add Visual Reveal and Cruise Atlas v0.10.2.1`.
4. Open the branch deployment or GitHub Pages preview.
5. Test desktop and iPhone Safari before merging to the published branch.

## Required smoke test

- Page loads and reports 320 destinations and 501 results.
- Current location and preset origin buttons both respond.
- 90 min, 2 hour, and half-day modes each draw a result.
- Mission reveal image changes between airport, bridge/waterfront, industrial, and city candidates.
- A long destination such as `HANEDA INNOVATION CITY 足湯スカイデッキ` wraps without horizontal overflow.
- `このCruiseを受ける` opens Google Maps with the origin, destination, and waypoints.
- Cruise Atlas loads a route or displays the existing graceful failure message.
- Re-roll reason, return evaluation, issue report, and learning export still work.

## Google Maps design boundary

The in-page Cruise Atlas is styled by Project Cruise. The separate Google Maps page opened for navigation uses Google's native interface and cannot inherit the Project Cruise theme.

## Rollback

Do not delete the current published branch. If any production issue appears, switch GitHub Pages back to the previous branch or revert this single release commit.
