# beta — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15).

## Public

### Purpose

Totals of lists of numbers, and a generated bundle of its and alpha's source.

### Provides

**total(list) → number**
- **R1** Returns the sum of the numbers in `list`, added left to right (ordinary floating-point addition, as `alpha.sum` computes it), and `0` for an empty list. (Wording clarified by BOB during D3, answering beta's QUESTION 1.)
- **R5** `total([x])` returns a number equal (`===`) to `x` for every finite `x`. (D18, size gate scoped to reading sets.)
- **R4** An element that is not a finite number is refused with a `TypeError`, as `alpha.sum` refuses it (added by BOB during D3: `total` inherits it when N3 moves it onto `alpha.sum`).

**`node beta/scripts/bundle.mjs [--verify]`**
- **R2** Writes `beta/dist/bundle.txt` from alpha's and beta's source; with `--verify`, exits 1 and prints `bundle: STALE` unless the committed file is exactly what it would write.

## Private

### Uses

- `alpha.add` (and `alpha.sum` once it exists).

### Invariants

- **R3** Pure, apart from the bundle script's own file.

### Satisfies

- The dry run (mechanics §15).
