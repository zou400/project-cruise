# Project Cruise v0.11.0-rc1 — GitHub Pages deployment

## Recommended branch

Create and test on:

`release/v0.11.0-rc1`

Do not replace the current production branch during the first test.

## Upload scope

Upload the **entire repository root**, not only `index.html`. The runtime also needs:

- `assets/`
- `data/`
- `project-cruise.json`
- `destinations.json`
- `routes.json`

The exact 30 Hero WebP files, when obtained, belong in:

`assets/hero/precision/`

Keep their upstream filenames. Do not rename or regenerate them to satisfy the catalog.

## Local verification before push

```bash
npm test
python3 scripts/audit_release_candidate.py
python3 -m http.server 8080
```

Open `http://localhost:8080/` and verify the normal flow before pushing.

## GitHub Pages steps

1. Push this folder to `release/v0.11.0-rc1`.
2. Open the repository's **Actions** tab and confirm `Validate Project Cruise RC` passes.
3. In **Settings → Pages**, publish from the test branch root, or use the repository's existing Pages deployment method.
4. Open the deployed HTTPS URL on desktop and iPhone Safari.
5. Record the URL, commit SHA, test date and device in `RELEASE_CHECKLIST.md`.

## Required test URLs

Use the normal URL first, then exercise the controlled kill switches and fixtures:

```text
?pcUi=classic
?pcVisual=off
?pcWeather=off
?pcOps=off
?pcArrival=off
?pcData=low
?heroPhase=day
?heroPhase=twilight
?heroPhase=night
?heroPhase=rain
?heroWeather=clear
?heroWeather=cloudy
?heroWeather=rain
?heroWeather=fog
?heroWeather=wind
?weatherDemoState=live
?weatherDemoState=caution
?weatherDemoState=avoid
```

Fixture parameters are for visual QA only. They are not live weather or production evidence.

## First-pass functional route

1. Allow location, then repeat once with location denied.
2. Select each of the three time buckets.
3. Open a recommendation and wait for the road estimate.
4. Confirm the arrival weather card updates without changing the selected route.
5. Confirm a resolved result opens the intended Google Maps driving destination.
6. Confirm walking-only endpoints are shown as text and do not appear in driving waypoints.
7. Reroll several times and check that operational skips do not look like user rejections.
8. Complete return feedback and submit a test issue report.
9. Reload and verify existing learning state remains readable.

## Rollback

Immediate query-string isolation:

- UI: `?pcUi=classic`
- visuals: `?pcVisual=off`
- weather: `?pcWeather=off`
- operational overlay: `?pcOps=off`
- arrival presentation: `?pcArrival=off`

Repository rollback: redeploy the previous canonical v0.10.0 commit or branch. Canonical JSON files were not structurally rewritten by the overlays.

## Promotion rule

Promote this RC only when all are true:

- exact 30 Hero WebP files are imported and visually audited;
- GitHub Pages browser smoke passes on the deployed commit;
- iPhone Safari manual QA passes;
- `npm test` and the consolidated audit still pass after the asset import.
