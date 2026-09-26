# Job record: alpha (D2)

## QUESTION (N1), 2026-09-26 15:22Z

`sum(list) → number`: what does `sum` do when `list` holds something that is not a number?

**Best reading:** `sum(list)` returns the sum of the numbers in `list`, and `0` for an empty list; if any element is not a finite number (`typeof x !== 'number'` or not finite), it throws a `TypeError` naming the offending index, rather than coercing (`'1' + 2`) or skipping. This mirrors `add`'s R1 domain (finite numbers).

**Waiting on:** BOB's `ANSWER` and the service added to `build/requirements/alpha.md` on `tranche/D2`. Meanwhile: alpha's existing tests brought to full-compliance for R1 and R2.

## Own-module improvement, 2026-09-26 15:25Z

R1's test checked two samples; it now checks `add(a, b) === a + b` over every pair from a spread of finite numbers (signs, ±0, fractions, extremes). R2 was named by no test; it now has one (repeatable results, no stdout/stderr/console/fetch, no new globals). Both pass. Still waiting on BOB's `ANSWER` for `sum`.

## ANSWER received, 2026-09-26 15:25Z

BOB accepted the reading and added R3–R4 to alpha's requirements on `tranche/D2` (171731b); merged into this branch (afe5920).

## REPORT (N2), 2026-09-26 15:28Z

Adding `sum` to `alpha/src/index.mjs` makes beta's generated artifact `beta/dist/bundle.txt` stale: `node beta/scripts/bundle.mjs --verify` from `dryrun/` exits 0 before the change and prints `bundle: STALE` (exit 1) after. Not regenerated: it is beta's (mechanics §14); BOB regenerates it at layer close.
