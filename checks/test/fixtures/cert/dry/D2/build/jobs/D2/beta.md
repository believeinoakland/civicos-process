# Job record: beta in D2

**Status** · COMPLETE, 2026-09-26 ~15:35Z. Staying available until BOB archives the session.

## Entries

- **N3** · Applied. Part 1: R1's tests for `total` as it stood, passing against the `alpha.add` loop. Part 2, after BOB's `CHANGE` (15:31:30Z, alpha on `tranche/D2` at f5e700f, merged): `total` is now `alpha.sum(list)`. R4 now holds and is tested.

## Changes from BOB

- 15:25Z `CHANGE`: beta's R4 (a non-finite element is refused with a `TypeError` naming its index, as `alpha.sum` R4 does). Merged `tranche/D2` (171731b); read beta's requirements and alpha's public part again, whole. Implemented and tested with N3's second half, as BOB directed.
- 15:31:30Z `CHANGE`: alpha complete and merged into `tranche/D2` (f5e700f). Merged; read `alpha/src/index.mjs` whole; completed N3.

## Found and fixed in beta

- Only R1 was named by a test; R2 and R3 had none. Added `R2` (the bundle script, run in a temporary copy of the sources so a test never writes the committed bundle: write, determinism, `--verify` fresh, stale on any byte difference, stale after either source changes, stale when the file is missing, `--verify` writes nothing) and `R3` (`total` leaves its input unchanged, repeatable, works on a frozen list).
- `bundle.mjs --verify` crashed (ENOENT, exit 1 without `bundle: STALE`) when `beta/dist/bundle.txt` was missing, contrary to R2. Fixed: a missing file is stale.
- `beta/dist/bundle.txt` (beta's own artifact) was stale after alpha's `sum` and beta's change; regenerated with `node beta/scripts/bundle.mjs`, verified fresh. BOB's regeneration at layer close should find no change.

## Deferred

- None.

## Found elsewhere (for BOB)

- beta's requirements, private **Uses**, still read "`alpha.add` (and `alpha.sum` once it exists)". beta now uses only `alpha.sum`; the line should read `alpha.sum`. Requirements are BOB's to write; no behaviour depends on it.
- Nothing in alpha: `alpha.sum` met alpha's R3–R4 in every case beta's R1 and R4 tests put to it.

## Tests and checks (final)

- `node --test beta/test/*.test.mjs`: `# pass 4`, `# fail 0` (R1, R2, R3, R4)
- `node --test alpha/test/*.test.mjs` (the used module, after merge): `# pass 4`, `# fail 0`
- `node beta/scripts/bundle.mjs --verify`: `bundle: fresh`
- `node checks/format.mjs dryrun`: `format: 2 modules, 2 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun beta`: `architecture: 4 product files, 2 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun beta`: `coverage: 1 modules, 4 of 4 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun beta tranche/D2`: `ownership: 5 files changed by beta between tranche/D2 and HEAD; 0 failures`

**Metrics.** `--test-runs 5` (beta's tests 4 runs, alpha's 1); `--module-lines 18` (`beta/src/` 6, `beta/scripts/` 12; tests 96 more; `beta/dist/` generated, not counted).

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
e1d7098d-a0c3-5f97-bac7-84b536d2f598,job,beta,1618202,60035,42,10531,20,5,18
```
