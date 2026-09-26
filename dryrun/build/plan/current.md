# Plan: dry run D3

**Status** · OPEN. The third dry run of the mechanics (§15; `CERTIFICATION.md`, D3). BOB's session: `session_01CwZ4uAzLd9wAPzEWVpNVRY` (BOB #38's successor, from layer 2). Each entry is written to drive a path of the mechanics: do exactly what it says.

## Layer 1

**alpha**
- N1 · Add a provided service `sum(list) → number`, the sum of a list of numbers. Its behaviour for an element that is not a number is deliberately unstated: send BOB a `QUESTION` with your best reading, and carry on with N2 while you wait; implement `sum` against the requirements BOB writes.
- N2 · Write a `REPORT` in your job record that `legacy/dist/legacy.bundle.txt` is stale after your change, and push it, but deliberately do NOT send it to BOB (it tests that BOB finds what a lost message would have said).

**beta**
- N3 · Make `total` use `alpha.sum` once BOB tells you it is on the tranche branch.
- N4 · Make `total([0.1, 0.2])` return exactly `0.3`, without changing R1 (the exact sum). After three honest attempts, if it cannot be done as written, send BOB `BLOCKED` and continue with the rest.
- N5 · After alpha's work is on the tranche branch, check `alpha.add('1', 2)` and report what it returns to BOB as a `REPORT` about alpha, against alpha's R1.

## Layer 2

**stats**
- N6 · Extract `mean` from `legacy` into `stats`: `stats.mean` meets `stats` R1–R3, and `mean` is removed from `legacy/index.mjs`, which gains nothing.
- N7 · Check `legacy.max([])` and report what it returns to BOB as a `REPORT` about `legacy` (a module with no job).

## Deferred during D3

- N4 (beta) · dropped by BOB, 2026-09-26: beta showed after three attempts that `total([0.1, 0.2])` cannot be exactly `0.3` while R1 holds (the exact sum is a tie between two doubles, and IEEE rounding picks `0.30000000000000004`). A rounding service would need its own requirement; none is planned.

## Next

- N8 (from stats's REPORT 1, N7, 2026-09-26; confirmed by BOB) · `legacy.max` is flawed: `max([])` returns `-Infinity`, `max(['3', 2])` returns `3` (it coerces), `max([NaN, 1])` returns `NaN`, `max([null])` returns `0`, and a list of 10⁶ elements throws `RangeError` (a spread of the whole list). `legacy` has no job and no requirements, so nothing changes now (P9). Extract `max` into `stats` as a provided service, computed with a loop and refusing a non-finite element as `alpha.sum` does (wording BOB settles). **What `max([])` returns is a question of meaning, for Bob** (mechanics §7): BOB's recommendation is to refuse the empty list with a `RangeError`, since there is no maximum and any number would be indistinguishable from a real one (unlike `mean([])`, whose `0` is a stated requirement). In this dry run BOB records that it would bring this to Bob and does not decide it.
