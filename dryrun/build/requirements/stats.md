# stats — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15). Extracted from `legacy`; R1–R2 are not yet met (D3 entry).

## Public

### Purpose

Statistics over lists of numbers.

### Provides

**mean(list) → number**
- **R1** Returns the arithmetic mean of the numbers in `list`, computed as `alpha.sum(list) / list.length`, and `0` for an empty list.
- **R2** Refuses an element that is not a finite number as `alpha.sum` does.

## Private

### Uses

- `alpha.sum`.

### Invariants

- **R3** Pure: no state, no input or output.

### Satisfies

- The dry run (mechanics §15).
