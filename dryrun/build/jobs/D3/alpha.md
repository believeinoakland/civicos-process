# Job record: alpha, D3

**Status** · RUNNING. Waiting on BOB's `ANSWER` to Q1 (the requirements of `sum`) before implementing `sum`; everything else proceeds on the best reading below. `sum` is implemented and tested to that reading on `job/D3/alpha`; its tests name no requirement id yet, and I will align them (and the code, if the answer differs) with the ids BOB writes.

## Questions

**Q1** (N1, sent to BOB as `QUESTION`) · `sum(list) → number` is not yet in `build/requirements/alpha.md`, and its behaviour for an element that is not a number is unstated. **Best reading:** `sum(list)` returns the exact sum of the elements of `list` (an array), `0` for an empty list, and throws a `TypeError` when any element is not a finite number (a non-number, `NaN`, or `±Infinity`), so a caller never gets a string concatenation or a `NaN` back. This matches `stats` R2 ("refuses an element that is not a finite number as `alpha.sum` does"). Please add `sum`'s requirements (new ids; R1–R2 unchanged) to `alpha.md` on `tranche/D3`, and I implement against them.

## Reports

**REPORT 1** (N2; pushed here only, deliberately NOT sent to BOB) · `legacy/dist/legacy.bundle.txt` (owned by `legacy`, which has no job) is generated from `alpha/src/index.mjs` and `legacy/index.mjs`. My change to `alpha/src/index.mjs` (adding `sum`) makes it stale: `node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`. It needs `node legacy/scripts/bundle.mjs` from `dryrun/` when the layer closes (mechanics §14). I did not write it.

## Own-module improvements (P8)

- The R1 test sampled two pairs; it now checks `add(a, b)` against `a + b` (by `Object.is`) for every pair drawn from each class of finite number (signed zeros, subnormals, extremes, rounding fractions, integers past 2^53, and 200 seeded values).
- R2 had no test; one now checks, at the interface, that `add` writes nothing to stdout/stderr, adds no global, and returns the same results regardless of call history.
