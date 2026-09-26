# stats — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15). Extracted from `legacy`: `mean` in D3; `max` and `min` in D4, where R4–R7 are not yet met (entry N9).

## Public

### Purpose

Statistics over lists of numbers.

### Provides

**mean(list) → number**
- **R1** Returns the arithmetic mean of the numbers in `list`, computed as `alpha.sum(list) / list.length`, and `0` for an empty list.
- **R2** Refuses an element that is not a finite number as `alpha.sum` does.

**max(list) → number**
- **R4** Returns the largest number in a non-empty `list`.
- **R5** Refuses an empty `list` with a `RangeError` (D3's N8: `legacy.max([])` returned `-Infinity`).

**min(list) → number**
- **R6** Returns the smallest number in a non-empty `list`.
- **R7** Refuses an empty `list` with a `RangeError`.

## Private

### Uses

- `alpha.sum`.

### Invariants

- **R3** Pure: no state, no input or output.

### Satisfies

- The dry run (mechanics §15).
