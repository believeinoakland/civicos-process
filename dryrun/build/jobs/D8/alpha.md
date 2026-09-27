# Job record: alpha, D8

**Status** · session_01PyUgxYhCfCQsoUx4e7BHCk · depth 2 · COMPLETE · sent J2 · handled B1

## Questions

None: R6 and R7 are unambiguous.

## From ALPHA #1 (D8): REPORT J1

**REPORT 1** · Two generated artifacts (mechanics §14) are built from `alpha/src/index.mjs`, so adding `neg` makes both stale on `job/D8/alpha` (both `fresh` on `tranche/D8`). I wrote neither.
- `beta/dist/bundle.txt` (owned by `beta`): `node beta/scripts/bundle.mjs --verify` prints `bundle: STALE`, and so beta's test `R2 the committed bundle is exactly what the bundle script would write` fails on this branch (`# pass 5`, `# fail 1`; on `tranche/D8` `# fail 0`). Needs `node beta/scripts/bundle.mjs` from `dryrun/` after alpha merges; beta's job is open this layer, so it may simply regenerate after merging `tranche/D8`.
- `legacy/dist/legacy.bundle.txt` (owned by `legacy`, no job): `node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`. Needs `node legacy/scripts/bundle.mjs` from `dryrun/` when the layer closes.

## Completion

**Entries applied**
- N1 · `neg(a)` added to `alpha/src/index.mjs`: returns `-a` for a finite number (R6) and throws a `TypeError` for anything else, with nothing coerced (R7), using the same `finite` check as `add` and `sum`.

**Own-module improvements** · R2's purity test now covers `neg` too (no output, no new global, results independent of call history, a throwing call interleaved).

**Deferred** · Nothing.

**Found in other modules** · REPORT J1 above: `beta/dist/bundle.txt` and `legacy/dist/legacy.bundle.txt` are stale on this branch because alpha's source changed; not a flaw in either module's requirements. Not written by me.

**Tests** (from `dryrun/`)
- `node --test alpha/test/*.test.mjs` · 7 tests: R1, R5, R2, R3, R4, R6 (every finite value in each class, `Object.is(neg(a), -a)` including both zeros, and `neg(neg(a))` is `a`), R7 (16 kinds of non-finite value, including `'1'` and `1n`) · `# pass 7`, `# fail 0`.
- Users of alpha (I added a provided service): `node --test beta/test/*.test.mjs` · `# pass 5`, `# fail 1` (only `R2 the committed bundle is exactly what the bundle script would write`: the stale bundle of REPORT J1; `# fail 0` on `tranche/D8`); `node --test stats/test/*.test.mjs` · `# pass 9`, `# fail 0`; gamma has no tests on `tranche/D8` yet (its job writes them). No layer tests (manifest).

**Checks** (from the process repository)
- `node checks/format.mjs dryrun` · `format: 6 modules, 4 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun alpha` · `architecture: 2 product files, 1 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun alpha` · `coverage: 1 modules, 7 of 7 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun alpha tranche/D8` · `ownership: 3 files changed by alpha between tranche/D8 and HEAD; 0 failures`

Size (session_01PyUgxYhCfCQsoUx4e7BHCk): test runs 5, module lines 25

## From ALPHA #1 (D8): COMPLETE J2

N1 applied: `neg(a)` meets R6 and R7, tested (alpha `# pass 7`, `# fail 0`); format, architecture, coverage (7 of 7) and ownership all `0 failures`. Deferred: nothing. REPORT J1 stands: beta's and legacy's bundles need regenerating after alpha merges (beta's R2 test fails on this branch until then).
