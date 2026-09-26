# Job record: alpha (D2)

## QUESTION (N1), 2026-09-26 15:22Z

`sum(list) → number`: what does `sum` do when `list` holds something that is not a number?

**Best reading:** `sum(list)` returns the sum of the numbers in `list`, and `0` for an empty list; if any element is not a finite number (`typeof x !== 'number'` or not finite), it throws a `TypeError` naming the offending index, rather than coercing (`'1' + 2`) or skipping. This mirrors `add`'s R1 domain (finite numbers).

**Waiting on:** BOB's `ANSWER` and the service added to `build/requirements/alpha.md` on `tranche/D2`. Meanwhile: alpha's existing tests brought to full-compliance for R1 and R2.

## Own-module improvement, 2026-09-26 15:25Z

R1's test checked two samples; it now checks `add(a, b) === a + b` over every pair from a spread of finite numbers (signs, ±0, fractions, extremes). R2 was named by no test; it now has one (repeatable results, no stdout/stderr/console/fetch, no new globals). Both pass. Still waiting on BOB's `ANSWER` for `sum`.
