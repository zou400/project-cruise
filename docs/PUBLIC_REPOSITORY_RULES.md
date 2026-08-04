# Public Repository Rules

This repository is a deployment surface, not the Project Cruise source of truth.

## Allowed
- Public runtime HTML, CSS and JavaScript
- `data/*.public.json`
- Active Hero assets referenced by `data/hero-assets.public.json`
- Icons, web manifest and service worker
- CI validation scripts and public documentation

## Prohibited
- Canonical content packs
- Discovery and review queues
- Field-test raw logs
- Prompts, source images, rejected or experimental Hero assets
- Internal scoring, provenance, audit and migration registries
- API keys, tokens and `.env` files

Every pull request must pass `Public Boundary CI`. Deployment runs only after the same validation passes on `main`.
