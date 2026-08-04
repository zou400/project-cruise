# Public GitHub cutover

1. Tag current `main` as `public-pre-cutover-v0.13.9-plus`.
2. Create branch `staging/pc-public-20260804-rc4`.
3. Replace repository contents with this package.
4. Open a pull request to `main`.
5. Require `Public Boundary CI` and `Reference Closure`.
6. Deploy the branch to a staging URL and run Post-Deploy Verification.
7. Merge without force-pushing.
8. Tag the merge as `public-pc-public-20260804-rc4`.
