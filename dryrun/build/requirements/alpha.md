# alpha — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15).

## Public

### Purpose

Arithmetic on numbers.

### Provides

**add(a, b) → number**
- **R1** Returns `a + b` for two finite numbers.

**sub(a, b) → number**
- **R3** Returns `a - b` for two finite numbers.

## Private

### Uses

None.

### Invariants

- **R2** Pure: no state, no input or output.

### Satisfies

- The dry run (mechanics §15).
