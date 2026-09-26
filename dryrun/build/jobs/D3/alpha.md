# Job record: alpha, D3

**Status** · COMPLETE again after CHANGE 2 (R5), 2026-09-26. Q2 is open with BOB. It does not block anything: `sum` follows its best reading.

## Questions

**Q1** (N1, sent to BOB as `QUESTION`) · `sum(list) → number` is not yet in `build/requirements/alpha.md`, and its behaviour for an element that is not a number is unstated. **Best reading:** `sum(list)` returns the exact sum of the elements of `list` (an array), `0` for an empty list, and throws a `TypeError` when any element is not a finite number (a non-number, `NaN`, or `±Infinity`), so a caller never gets a string concatenation or a `NaN` back. This matches `stats` R2 ("refuses an element that is not a finite number as `alpha.sum` does"). Please add `sum`'s requirements (new ids; R1–R2 unchanged) to `alpha.md` on `tranche/D3`, and I implement against them.

**Answer** · Reading accepted: `sum` is R3 (left to right with `add`, `0` for an empty list) and R4 (`TypeError` for an element that is not a finite number; nothing coerced or skipped).

## Reports

**REPORT 1** (N2; pushed here only, deliberately NOT sent to BOB) · `legacy/dist/legacy.bundle.txt` (owned by `legacy`, which has no job) is generated from `alpha/src/index.mjs` and `legacy/index.mjs`. My change to `alpha/src/index.mjs` (adding `sum`) makes it stale: `node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`. It needs `node legacy/scripts/bundle.mjs` from `dryrun/` when the layer closes (mechanics §14). I did not write it.

## Own-module improvements (P8)

- The R1 test sampled two pairs; it now checks `add(a, b)` against `a + b` (by `Object.is`) for every pair drawn from each class of finite number (signed zeros, subnormals, extremes, rounding fractions, integers past 2^53, and 200 seeded values).
- R2 had no test; one now checks, at the interface, that `add` writes nothing to stdout/stderr, adds no global, and returns the same results regardless of call history.

**REPORT 2** (sent to BOB as `REPORT`) · `beta/dist/bundle.txt` (owned by `beta`) is generated from alpha's and beta's source, so my change to `alpha/src/index.mjs` makes it stale too: `node beta/scripts/bundle.mjs --verify` prints `bundle: STALE` on this branch and `bundle: fresh` on `tranche/D3`. It needs `node beta/scripts/bundle.mjs` from `dryrun/` when the layer closes (mechanics §14). I did not write it.

**REPORT 3** (process tool; sent to BOB inside the `REPORT` message with REPORT 2) · `metrics/record.mjs` writes the local transcript id (`f9faa1ad-0bd8-5b51-8f2f-f3578bfbae57`) in the `session` column, not the cloud session id (`session_01L4X4oJNsSi3ES9jNP9q2eh`). Without this mapping, the row can't be matched to the session BOB archives.

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

## CHANGE 1 (BOB, 15:41 UTC): R3 wording, caa0f42

R3 now says left-to-right addition with `add`, not an exact or correctly rounded sum. I had already merged caa0f42 before my first `COMPLETE`, and both `sum` and the R3 test (a left-to-right fold with `add`, and `sum([0.1, 0.2]) === 0.30000000000000004`) already match it. Nothing needed changing. Re-run: alpha tests `# pass 4`, `# fail 0`; coverage `4 of 4 live requirement ids named by a test; 0 failures`. There are no new commits on `tranche/D3`. COMPLETE again.

## CHANGE 2 (BOB, 15:50 UTC): R5, a709075. Re-opens the job.

Merged `tranche/D3` (a709075). **R5 met:** `add` now checks both arguments and throws a `TypeError` for anything that is not a finite number, with nothing coerced. `add('1', 2)` now throws where it used to return `'12'`. `sum` checks each element with the same helper. Test `R5 …` covers 16 kinds of non-finite value in either argument position, and in both at once. `R4` uses the same list of kinds.

**Q2** (sent to BOB as `QUESTION`; it does not block anything) · With R5 in force, R3's "added left to right with `add`" is ambiguous in one case. Every element is finite, but the running total overflows, e.g. `sum([MAX_VALUE, MAX_VALUE, 1])`. Calling `add(Infinity, 1)` literally would throw a `TypeError`, although R4 names only non-finite *elements*. **Best reading (implemented and tested in R3):** the running total is carried as ordinary floating-point addition carries it, so the example returns `Infinity`. That matches R1, where `add(MAX_VALUE, MAX_VALUE)` is `Infinity`, and R3's own "ordinary floating-point addition". If BOB rules the other way, `sum` should throw instead, and one R3 assertion changes.

**Re-run** (from `dryrun/`): alpha `# pass 5`, `# fail 0`; beta `# pass 1`, `# fail 0`; stats `# pass 1`, `# fail 0`. Checks: format `0 failures`; architecture `0 failures`; coverage `5 of 5 live requirement ids named by a test; 0 failures`; ownership `ownership: 3 files changed by alpha between tranche/D3 and HEAD; 0 failures`. Generated artifacts are unchanged: REPORT 1 and REPORT 2 still apply, and both bundles are regenerated at layer close.

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
f9faa1ad-0bd8-5b51-8f2f-f3578bfbae57,job,alpha,3377961,106035,76,20617,36,9,20
```
