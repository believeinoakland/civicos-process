# Job record: beta in D2

**Status** · WAITING on BOB's `CHANGE` saying alpha's `sum` is on `tranche/D2` (N3's second half). Everything that does not need `sum` is done.

## Entries

- **N3** · Part 1 done: R1's tests for `total` as it stands (`beta/test/beta.test.mjs`, test `R1 …`), passing against the `alpha.add` loop. Part 2 (switch `total` to `alpha.sum`) waits on BOB's `CHANGE`.

## Found and fixed in beta

- Only R1 was named by a test; R2 and R3 had none. Added `R2` (the bundle script, run in a temporary copy of the sources so the committed bundle is never written by a test: write, determinism, `--verify` fresh, stale on any byte difference, stale after either source changes, stale when the file is missing, `--verify` writes nothing) and `R3` (`total` leaves its input unchanged, repeatable, works on a frozen list).
- `bundle.mjs --verify` crashed (ENOENT, exit 1 without `bundle: STALE`) when `beta/dist/bundle.txt` was missing, contrary to R2. Fixed: a missing file is stale.

## Tests and checks (before `sum`)

- `node --test beta/test/*.test.mjs`: `# pass 3`, `# fail 0`
- `node beta/scripts/bundle.mjs --verify`: `bundle: fresh`
- `node checks/format.mjs dryrun`: `format: 2 modules, 2 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun beta`: `architecture: 4 product files, 2 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun beta`: `coverage: 1 modules, 3 of 3 live requirement ids named by a test; 0 failures`
