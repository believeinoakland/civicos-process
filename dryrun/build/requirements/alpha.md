# alpha — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15).

## Public

### Purpose

Arithmetic on numbers.

### Provides

**add(a, b) → number**
- **R1** Returns `a + b` for two finite numbers.

- **R5** `add` throws a `TypeError` when either argument is not a finite number, as `sum` does (R4); nothing is coerced. (Added by BOB during D3, confirming beta's REPORT 1: `add('1', 2)` returned `'12'`. In the real product this change of meaning goes to Bob, P17; in the dry run BOB records that it would have brought it to him, with the recommendation to add the refusal.)

**sum(list) → number** (added by BOB during D3, answering alpha's QUESTION on N1)
- **R3** Returns the elements of `list` added left to right with `add` (ordinary floating-point addition, not a correctly rounded or exact sum), and `0` for an empty list. The running total is carried as ordinary addition carries it, so a total that overflows is `Infinity` (R4 and R5 judge the elements, never the running total). (Clarified by BOB during D3, answering alpha's Q2.) (Wording clarified by BOB during D3 after beta's QUESTION 1: "exact" was ambiguous.)
- **R4** Throws a `TypeError` when an element is not a finite number (a non-number, `NaN` or an infinity); nothing is coerced or skipped.

**neg(a) → number** (added for dry run D8)
- **R6** Returns `-a` for a finite number `a`.
- **R7** Throws a `TypeError` when `a` is not a finite number; nothing is coerced.

**sub(a, b) → number** (added for dry run D9)
- **R8** Returns `a - b` for two finite numbers.
- **R9** Throws a `TypeError` when either argument is not a finite number; nothing is coerced.

## Private

### Uses

None.

### Invariants

- **R2** Pure: no state, no input or output.

### Satisfies

- The dry run (mechanics §15).
