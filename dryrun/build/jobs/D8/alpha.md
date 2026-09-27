# Job record: alpha, D8

**Status** · session_01PyUgxYhCfCQsoUx4e7BHCk · depth 2 · WORKING · sent J1 · handled B1

## Questions

None: R6 and R7 are unambiguous.

## From D8 ALPHA #1 (D8): REPORT J1

**REPORT 1** · Two generated artifacts (mechanics §14) are built from `alpha/src/index.mjs`, so adding `neg` makes both stale on `job/D8/alpha` (both `fresh` on `tranche/D8`). I wrote neither.
- `beta/dist/bundle.txt` (owned by `beta`): `node beta/scripts/bundle.mjs --verify` prints `bundle: STALE`, and so beta's test `R2 the committed bundle is exactly what the bundle script would write` fails on this branch (`# pass 5`, `# fail 1`; on `tranche/D8` `# fail 0`). Needs `node beta/scripts/bundle.mjs` from `dryrun/` after alpha merges; beta's job is open this layer, so it may simply regenerate after merging `tranche/D8`.
- `legacy/dist/legacy.bundle.txt` (owned by `legacy`, no job): `node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`. Needs `node legacy/scripts/bundle.mjs` from `dryrun/` when the layer closes.
