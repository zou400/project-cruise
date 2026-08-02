# 09 — Visual QA, exact-asset acceptance, and final report

## Purpose

Deepening 09 adds the pre-deployment visual evidence path without weakening the exact-upstream asset policy.

## Added entry points

- `visual-qa.html`: a GitHub Pages-compatible 30-slot contact sheet.
- `scripts/audit_hero_assets.py`: catalog, filename, WebP structure, duplicate-binary and optional upstream ZIP hash validation.
- `tests/visual_qa_contract.py`: static contract test for the visual QA surface and CI integration.
- `scripts/generate_release_qa_report.py`: consolidated HOLD/PROMOTE report generator.
- GitHub Actions browser-smoke job: runs the real application through Chromium CDP and uploads screenshots/evidence.

## Asset acceptance modes

Pending-tolerant mode is appropriate while exact assets are not mounted:

```bash
python3 scripts/audit_hero_assets.py
```

It passes only the catalog/contract layer and records missing binaries as `pending`.

Strict mode is required after the 30 upstream files are imported:

```bash
python3 scripts/audit_hero_assets.py --require-complete
```

To verify the upstream full package hash before extraction:

```bash
python3 scripts/audit_hero_assets.py \
  --package /path/to/Project_Cruise_Hero_Precision_v0.10.4-rc3.zip \
  --require-complete
```

The known full-package SHA-256 is stored in `records/external-hero-package.json`. No image is regenerated, renamed, or substituted by this repository.

## Human visual review

Open `visual-qa.html` from the same origin as the application and inspect all 30 cards for:

1. semantic match with category and phase;
2. usable 16:9 crop on desktop and mobile;
3. title legibility over bright areas;
4. no embedded third-party marks or misleading place claims;
5. no near-duplicate binary or accidental placeholder;
6. disclosure remains `体験イメージ`.

Then exercise the fixture links for day, twilight, night, rain, classic UI, disabled overlays and low-data mode.

## Browser evidence

`tests/browser_smoke_cdp.py` intentionally returns `skipped` in managed environments that block localhost Chromium navigation. GitHub Actions runs the same test in a normal runner, and uploads:

- `records/browser-smoke.json`
- `records/ui-smoke-desktop.png`
- `records/ui-smoke-mobile.png`

A screenshot of a block page is not a passing browser smoke result.

## Promotion rule

`FINAL_QA_REPORT.md` remains **HOLD** until:

- all 30 exact assets pass strict acceptance;
- deployed GitHub Pages browser smoke passes for the tested commit;
- iPhone Safari manual QA is signed with device, OS, date and commit SHA.

## Stale screenshot protection

The browser-smoke script deletes any prior `ui-smoke-*.png` files before navigation. A blocked or skipped run therefore cannot inherit screenshots from an older passing run. The previous managed-environment block screenshots are archived only under `records/reference/blocked-environment/` and are explicitly non-passing evidence.

The manual iPhone gate uses `records/iphone-safari-qa.template.json`. Copy it to `records/iphone-safari-qa.json`, fill device/OS/date/commit evidence, and set both `passed` and `signed` only after the checklist is complete.
