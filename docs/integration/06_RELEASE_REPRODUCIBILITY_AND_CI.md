# 06 — Release Reproducibility and CI Gates

## Goal

The integration package must be testable after upload without relying on this ChatGPT workspace. The repository therefore includes a dependency-free validation path using Node.js 20 and Python 3.12.

## Local validation

```bash
npm test
python3 scripts/audit_release_candidate.py
```

`npm test` checks JavaScript syntax and runs the operational, state-machine, and 501-result selection tests.

The Python release audit then reruns all canonical, UI, Hero Precision, arrival, and operational checks and writes a consolidated record to:

`records/release-candidate-audit.json`

## GitHub Actions

`.github/workflows/validate.yml` runs on pushes, pull requests, and manual dispatch. It uploads the JSON evidence even when a step fails.

The workflow does not deploy or mutate the repository. Deployment should be a separate workflow after the release candidate passes manual gates.

## Gate interpretation

There are two independent statuses:

- **automatedPassed** — all mounted data and code checks pass.
- **promotionReady** — automated checks pass and all external/manual gates are complete.

The package intentionally reports `promotionReady: false` while any of these remain outstanding:

1. exact upstream 30 Hero WebP assets imported and hash-verified;
2. GitHub Pages browser smoke completed;
3. iPhone Safari manual QA completed.

This distinction prevents an internally valid ZIP from being mistaken for the next canonical production release.

## No-secret policy

The current weather adapter uses Open-Meteo without an API key. No secret is required for this RC. Future commercial providers must use GitHub repository secrets and must never place keys in `index.html`, JavaScript, JSON, screenshots, or ZIPs.
