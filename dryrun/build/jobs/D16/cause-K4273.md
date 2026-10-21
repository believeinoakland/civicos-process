# cause-K4273 (D16)

**Status** · session_01BBKYVgFYctzkDXCb1x6UG2 · depth 2 · WORKING · handled B0

## Completion record (N1, D16)

**Entries applied.** N1 (cause K4273): alpha R6 and beta R5, met.
- `alpha.sum` (`dryrun/alpha/src/index.mjs`) throws a `TypeError` when `list` is not an array, before it iterates. R6 test: "R6 sum throws a TypeError when list is not an array, iterating nothing".
- `beta.total` (`dryrun/beta/src/index.mjs`) throws a `TypeError` naming `total` for the same case, before it delegates to `sum`, so the message names `total` and not `sum`. R5 test: "R5 total throws a TypeError naming total when list is not an array, iterating nothing".
- `beta/dist/bundle.txt` regenerated with `node beta/scripts/bundle.mjs`; `--verify` reports `bundle: fresh`.

**Deferred.** Nothing.

**Found in another module.** `legacy/dist/legacy.bundle.txt` (legacy, no job) is now stale: `node legacy/scripts/bundle.mjs --verify` reports `legacy bundle: STALE`. Not regenerated (no job holds legacy). Reported to BOB in a REPORT.

**Tip merge.** `tranche/D16` (a919d51) merged into this branch before the work; it changed no module file.

**Tests** (from `dryrun/`, on the merged tip):
- `node --test alpha/test/*.test.mjs`: 6 pass, 0 fail.
- `node --test beta/test/*.test.mjs`: 7 pass, 0 fail.
- `node --test stats/test/*.test.mjs` (stats uses `alpha.sum`): 9 pass, 0 fail.

**Checks** (from the process repository root):
- `node checks/format.mjs dryrun`: format: 5 modules, 3 requirements files; 0 failures
- `node checks/architecture.mjs dryrun alpha`: architecture: 2 product files, 1 relative imports (0 naming no tracked file, not judged); 0 failures
- `node checks/architecture.mjs dryrun beta`: architecture: 4 product files, 2 relative imports (0 naming no tracked file, not judged); 0 failures
- `node checks/coverage.mjs dryrun alpha beta`: coverage: 2 modules, 11 of 11 live requirement ids named by a test; 0 failures
- `node checks/ownership.mjs dryrun alpha,beta tranche/D16 job/D16/cause-K4273`: ownership: 6 files changed by alpha,beta between tranche/D16 and job/D16/cause-K4273; 0 failures
- `node checks/words.mjs dryrun`: words: 5 modules, 140 string literals read, 0 words; 0 failures

Size (session_01BBKYVgFYctzkDXCb1x6UG2): test runs 5, module lines 30
