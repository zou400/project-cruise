# Public Cutover Steps

## Precondition
- Keep a copy of the current `v0.13.9 plus` deployment.
- Do not delete `data.js` in the old branch until the new deployment passes remote verification.

## Apply
1. Create branch `migration/public-private-split`.
2. Replace repository contents with this ZIP, preserving `.git`.
3. Commit and open a Draft PR.
4. Require `Public Boundary CI` PASS.
5. Confirm counts: `377 destinations / 558 results`.
6. Merge and deploy Pages.
7. Verify release ID `PC-MIGRATION-BRIDGE-20260804-RC1` remotely.

## Rollback
Restore the pre-cutover commit or redeploy the backup artifact. No private canonical change is required.
