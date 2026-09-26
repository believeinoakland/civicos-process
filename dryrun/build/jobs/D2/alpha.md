# Job record: alpha (D2)

## QUESTION (N1), 2026-09-26 15:22Z

`sum(list) → number`: what does `sum` do when `list` holds something that is not a number?

**Best reading:** `sum(list)` returns the sum of the numbers in `list`, and `0` for an empty list; if any element is not a finite number (`typeof x !== 'number'` or not finite), it throws a `TypeError` naming the offending index, rather than coercing (`'1' + 2`) or skipping. This mirrors `add`'s R1 domain (finite numbers).

**Waiting on:** BOB's `ANSWER` and the service added to `build/requirements/alpha.md` on `tranche/D2`. Meanwhile: alpha's existing tests brought to full-compliance for R1 and R2.

## Own-module improvement, 2026-09-26 15:22Z

R1's test checked two samples; it now checks `add(a, b) === a + b` over every pair from a spread of finite numbers (signs, ±0, fractions, extremes). R2 was named by no test; it now has one (repeatable results, no stdout/stderr/console/fetch, no new globals). Both pass. Still waiting on BOB's `ANSWER` for `sum`.

## ANSWER received, 2026-09-26 15:25Z

BOB accepted the reading and added R3–R4 to alpha's requirements on `tranche/D2` (171731b); merged into this branch (afe5920).

## REPORT (N2), 2026-09-26 15:26Z

Adding `sum` to `alpha/src/index.mjs` makes beta's generated artifact `beta/dist/bundle.txt` stale: `node beta/scripts/bundle.mjs --verify` from `dryrun/` exits 0 before the change and prints `bundle: STALE` (exit 1) after. Not regenerated: it is beta's (mechanics §14); BOB regenerates it at layer close.

## COMPLETE, 2026-09-26 15:28Z

**Entries applied.**
- N1: `sum(list)` added to `alpha/src/index.mjs`, to R3–R4 as BOB wrote them (QUESTION and ANSWER above; `tranche/D2` 171731b merged).
- N2: beta's `beta/dist/bundle.txt` made stale by N1; reported to BOB, not regenerated (REPORT above).

**Own-module improvements.** R1's test now covers the finite domain, not two samples; R2 (purity) is now tested, for `add` and `sum` (repeatable results, input lists untouched, no stdout/stderr/console/fetch, no new globals). Every live id (R1–R4) is checked for full compliance at the interface: R3 against a left-fold over empty, singleton, mixed-sign and extreme lists; R4 for 16 kinds of non-finite-number element, at first, middle and last positions and with a later second bad element, checking the error is a `TypeError` whose message names the first bad index and no other number.

**Deferred.** Nothing.

**Other modules.** beta: generated artifact made stale (REPORT). Nothing else found.

**Tests and checks** (on 01d3345 plus this record):
- `node --test alpha/test/*.test.mjs`: tests 4, pass 4, fail 0.
- `node --test beta/test/*.test.mjs` (beta uses alpha): tests 1, pass 1, fail 0.
- `node checks/format.mjs dryrun`: 2 modules, 2 requirements files; 0 failures.
- `node checks/architecture.mjs dryrun alpha`: 2 product files, 1 relative imports; 0 failures.
- `node checks/coverage.mjs dryrun alpha`: 1 modules, 4 of 4 live requirement ids named by a test; 0 failures.
- `node checks/ownership.mjs dryrun alpha tranche/D2`: 3 files changed by alpha between tranche/D2 and HEAD; 0 failures.

**Metrics.** `--test-runs 6` (alpha's tests 4 runs, beta's 2); `--module-lines 14` (`alpha/src/`; its tests are 65 more).

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
f1d2a93e-e471-5e0b-b862-a513b68f4d2e,job,alpha,1570343,72656,44,9917,21,6,14
```
