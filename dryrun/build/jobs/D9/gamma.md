# Job record: gamma, D9

**Status** · session_01Vjx9RW3FuDxN3aCuCAgQqC · depth 2 · WORKING · sent J1 · handled B1

## From GAMMA #1 (D9): QUESTION J1

On entry N4 (gamma R4, `triple(x)`). R4 says `triple` "returns `3 * x` for a number `x`, computed with `alpha.add`", but not what it does with a numeric string (`'2'`), a `BigInt` (`2n`) or a non-finite number (`NaN`, `±Infinity`, which are of type number, so R4's "a number" seems to cover them, yet `alpha.add` refuses them, alpha R5).

My best reading: `triple` throws a `TypeError` for anything that is not a finite number, coercing nothing, as `double` does (R2) and as `alpha.add` does; for a finite `x` it returns `alpha.add(alpha.add(x, x), x)`, which equals `3 * x` exactly (doubling is exact, so the one rounding is that of `3 * x`; an overflow is `±Infinity` as in `3 * x`).
