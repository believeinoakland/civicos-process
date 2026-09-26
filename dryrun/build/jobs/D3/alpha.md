# Job record: alpha, D3

**Status** · COMPLETE (2026-09-26). Q1 answered by BOB (`ANSWER`, 15:40 UTC; requirements at `tranche/D3` ebfa39f, wording caa0f42), merged into this branch.

## Questions

**Q1** (N1, sent to BOB as `QUESTION`) · `sum(list) → number` is not yet in `build/requirements/alpha.md`, and its behaviour for an element that is not a number is unstated. **Best reading:** `sum(list)` returns the exact sum of the elements of `list` (an array), `0` for an empty list, and throws a `TypeError` when any element is not a finite number (a non-number, `NaN`, or `±Infinity`), so a caller never gets a string concatenation or a `NaN` back. This matches `stats` R2 ("refuses an element that is not a finite number as `alpha.sum` does"). Please add `sum`'s requirements (new ids; R1–R2 unchanged) to `alpha.md` on `tranche/D3`, and I implement against them.

**Answer** · Reading accepted: `sum` is R3 (left to right with `add`, `0` for an empty list) and R4 (`TypeError` for an element that is not a finite number; nothing coerced or skipped).

## Reports

**REPORT 1** (N2; pushed here only, deliberately NOT sent to BOB) · `legacy/dist/legacy.bundle.txt` (owned by `legacy`, which has no job) is generated from `alpha/src/index.mjs` and `legacy/index.mjs`. My change to `alpha/src/index.mjs` (adding `sum`) makes it stale: `node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`. It needs `node legacy/scripts/bundle.mjs` from `dryrun/` when the layer closes (mechanics §14). I did not write it.

## Own-module improvements (P8)

- The R1 test sampled two pairs; it now checks `add(a, b)` against `a + b` (by `Object.is`) for every pair drawn from each class of finite number (signed zeros, subnormals, extremes, rounding fractions, integers past 2^53, and 200 seeded values).
- R2 had no test; one now checks, at the interface, that `add` writes nothing to stdout/stderr, adds no global, and returns the same results regardless of call history.

**REPORT 2** (sent to BOB as `REPORT`) · `beta/dist/bundle.txt` (owned by `beta`) is generated from alpha's and beta's source, so my change to `alpha/src/index.mjs` makes it stale too: `node beta/scripts/bundle.mjs --verify` prints `bundle: STALE` on this branch and `bundle: fresh` on `tranche/D3`. It needs `node beta/scripts/bundle.mjs` from `dryrun/` when the layer closes (mechanics §14). I did not write it.

## Completion

**Entries applied**
- N1 · `sum(list)` added to `alpha/src/index.mjs`, meeting R3 and R4 as BOB wrote them (the code already matched the accepted reading; only its comment changed after the merge).
- N2 · REPORT 1 above, pushed here and deliberately not sent to BOB.

**Deferred** · Nothing.

**Found in other modules** · REPORT 1 (`legacy/dist/legacy.bundle.txt` stale, not sent per N2) and REPORT 2 (`beta/dist/bundle.txt` stale, sent). Neither is a flaw in that module's requirements: both are generated artifacts my change to alpha's source made stale.

**Tests** (from `dryrun/`)
- `node --test alpha/test/*.test.mjs` · 4 tests: R1 (every pair from each class of finite number), R2 (`add` and `sum`: no output, no new global, results independent of call history, argument unchanged), R3 (every prefix of the value classes, both orders, compared to a left-to-right fold with `add`, plus order-sensitive cases), R4 (16 kinds of non-finite-number element in 5 positions each) · `# pass 4`, `# fail 0`.
- Users of `sum`/`add` (I added a provided service): `node --test beta/test/*.test.mjs` · `# pass 1`, `# fail 0`; `node --test stats/test/*.test.mjs` · `# pass 1`, `# fail 0`. No layer tests (manifest).

**Checks** (from the process repository)
- `node checks/format.mjs dryrun` · `format: 4 modules, 3 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun alpha` · `architecture: 2 product files, 1 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun alpha` · `coverage: 1 modules, 4 of 4 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun alpha tranche/D3` · `ownership: 3 files changed by alpha between tranche/D3 and HEAD; 0 failures`

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
f9faa1ad-0bd8-5b51-8f2f-f3578bfbae57,job,alpha,1708868,81839,44,12071,21,5,14
```
