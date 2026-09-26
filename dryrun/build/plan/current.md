# Plan: dry run D3

**Status** · OPEN. The third dry run of the mechanics (§15; `CERTIFICATION.md`, D3). BOB's session: `session_01DskKyz9F8BW9BtAVJNqBFG`. Each entry is written to drive a path of the mechanics: do exactly what it says.

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
