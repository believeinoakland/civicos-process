# gamma — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15), new in D8.

## Public

### Purpose

Scaling of numbers.

### Provides

**double(x) → number**
- **R1** Returns `alpha.add(x, x)` for a finite number `x`.
- **R2** Throws a `TypeError` when `x` is not a finite number, as `alpha.add` does; nothing is coerced.

**triple(x) → number** (added for dry run D9)
- **R4** Returns `3 * x` for a number `x`, computed with `alpha.add`.

## Private

### Uses

- `alpha.add`.

### Invariants

- **R3** Pure: no state, no input or output.

### Satisfies

- The dry run (mechanics §15).
