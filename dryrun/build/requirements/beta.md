# beta — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15).

## Public

### Purpose

Totals of lists of numbers, and a generated bundle of its and alpha's source.

### Provides

**total(list) → number**
- **R1** Returns the sum of the numbers in `list`, and `0` for an empty list.
- **R4** An element that is not a finite number is refused with a `TypeError` naming its index, as `alpha.sum` refuses it (added by BOB during D2: `total` inherits it when N3 moves it onto `alpha.sum`).

**`node beta/scripts/bundle.mjs [--verify]`**
- **R2** Writes `beta/dist/bundle.txt` from alpha's and beta's source; with `--verify`, exits 1 and prints `bundle: STALE` unless the committed file is exactly what it would write.

## Private

### Uses

- `alpha.sum`.

### Invariants

- **R3** Pure, apart from the bundle script's own file.

### Satisfies

- The dry run (mechanics §15).
