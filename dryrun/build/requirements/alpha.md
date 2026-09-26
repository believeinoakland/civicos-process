# alpha — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15).

## Public

### Purpose

Arithmetic on numbers.

### Provides

**add(a, b) → number**
- **R1** Returns `a + b` for two finite numbers.

**sum(list) → number** (added by BOB during D3, answering alpha's QUESTION on N1)
- **R3** Returns the exact sum of the elements of `list`, and `0` for an empty list.
- **R4** Throws a `TypeError` when an element is not a finite number (a non-number, `NaN` or an infinity); nothing is coerced or skipped.

## Private

### Uses

None.

### Invariants

- **R2** Pure: no state, no input or output.

### Satisfies

- The dry run (mechanics §15).
