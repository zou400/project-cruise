# Project Cruise Public Runtime

Release: `PC-PUBLIC-20260804-RC4`  
Version: `3.6.0`

This is the first formal public release candidate generated from a fully converged active canonical.

- 377 destinations
- 558 route results
- 18 published Hero asset files
- 0 public-only destinations
- 0 public-only routes
- 0 unresolved route references
- Canonical release: `PC-CANONICAL-BATCH-BC-20260804-RC1`
- Canonical tree SHA256: `7ffb126036090aec9a6de9874f31c9cc00edbb0ae3da0a01864d06777eb487c9`

## Deploy
1. Upload this package to a feature branch of the public repository.
2. Confirm `Public Boundary CI` and `Reference Closure` pass.
3. Deploy to staging or merge to `main`.
4. Run post-deploy verification against `data/release-attestation.json`.
5. Keep the previous public ZIP available until verification and rollback rehearsal pass.

Never add canonical, discovery, review, audit, prompt, raw field-test, rejected Hero, or generation-history files here.
