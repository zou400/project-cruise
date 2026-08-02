# Project Cruise v0.11.0-rc7 — Final QA report

**Decision: HOLD**  
**Deepening: 9/10**

## Automated evidence

- Repository audit: PASS
- Visual QA contract: PASS
- Hero asset catalog/binary contract: PASS
- Exact Hero assets present: PASS (30/30)

## External promotion gates

- Exact upstream Hero WebP assets imported: PASS
- GitHub Pages browser smoke: HOLD
- iPhone Safari manual QA: HOLD

## Current interpretation

The mounted repository is internally testable and preserves the v0.10.0 canonical data contract. It must remain a release candidate until all three external promotion gates pass. Missing Hero assets use the intentional CSS cinematic fallback; they are not silently regenerated or replaced.

## Test entry points

- Application: `index.html`
- Visual asset/contact-sheet QA: `visual-qa.html`
- Automated suite: `npm test`
- Consolidated audit: `python3 scripts/audit_release_candidate.py`
- Hero asset acceptance, pending-tolerant: `python3 scripts/audit_hero_assets.py`
- Hero asset acceptance, strict: `python3 scripts/audit_hero_assets.py --require-complete`
- Browser smoke: `python3 tests/browser_smoke_cdp.py`

## Promotion rule

Promote only when this report changes to **PROMOTE**, the exact upstream package hash is verified, the deployed GitHub Pages commit passes browser smoke, and the iPhone Safari checklist is signed with device/OS/date/commit evidence.
