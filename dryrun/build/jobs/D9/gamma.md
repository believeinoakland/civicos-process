# Job record: gamma, D9

**Status** · session_01Vjx9RW3FuDxN3aCuCAgQqC · depth 2 · COMPLETE · sent J3 · handled B2

## From GAMMA #1 (D9): QUESTION J1

On entry N4 (gamma R4, `triple(x)`). R4 says `triple` "returns `3 * x` for a number `x`, computed with `alpha.add`", but not what it does with a numeric string (`'2'`), a `BigInt` (`2n`) or a non-finite number (`NaN`, `±Infinity`, which are of type number, so R4's "a number" seems to cover them, yet `alpha.add` refuses them, alpha R5).

My best reading: `triple` throws a `TypeError` for anything that is not a finite number, coercing nothing, as `double` does (R2) and as `alpha.add` does; for a finite `x` it returns `alpha.add(alpha.add(x, x), x)`, which equals `3 * x` exactly (doubling is exact, so the one rounding is that of `3 * x`; an overflow is `±Infinity` as in `3 * x`).

## From GAMMA #1 (D9): QUESTION J2 replaces J1

On entry N4 (gamma R4, `triple(x)`), revising J1 before its answer. R4 says `triple` "returns `3 * x` for a number `x`, computed with `alpha.add`", but not what it does with a numeric string (`'2'`), a `BigInt` (`2n`) or a non-finite number (`NaN`, `±Infinity`, which are of type number, so R4's "a number" seems to cover them, yet `alpha.add` refuses them, alpha R5). And must `double` (R1–R2) be brought in line with whatever `triple` does?

My best reading of the whole: a `TypeError` for both. `triple` throws a `TypeError` for anything that is not a finite number, coercing nothing, as `double` already does (R2) and as `alpha.add` does, so `double` needs no change; for a finite `x`, `triple` returns `alpha.add(alpha.add(x, x), x)`, which equals `3 * x` exactly (doubling is exact, so the one rounding is that of `3 * x`; an overflow is `±Infinity` as in `3 * x`).

The answer decides what I build, so I wait for it; I apply only an answer to J2.

## ANSWER B2 re J2: applied

B2 answers J2, my newest version (J1 was replaced; no answer to it came). My reading holds; ruling D9-K1 clarified R4's wording on tranche/D9 (b3ff2ad), merged into this branch before building.

## Entries applied

- **N4** · `triple(x)` in `gamma/src/index.mjs`, meeting R4 as clarified: for a finite `x` it returns `alpha.add(alpha.add(x, x), x)`, which is exactly `3 * x` (`x + x` is exact, so the one rounding is that of `3 * x`). When `x + x` overflows (`|x| > MAX_VALUE / 2`), `3 * x` overflows to the same signed infinity, and `alpha.add` would refuse that infinity as an argument (alpha R5), so `triple` returns it; my first build did not, and its tests caught it. Anything that is not a finite number throws alpha's `TypeError`, coercing nothing. `double` needs no change (B2). Tests in `gamma/test/gamma.test.mjs`, at the interface:
  - R4 (value): `triple(x)` is `3 * x` by `Object.is` for every class of finite number (the same set as R1's: signed zeros, subnormals, extremes, integers around 2^53, rounding fractions, 500 seeded values), and `alpha.add(alpha.add(x, x), x)` wherever the doubling is finite; overflow between `MAX_VALUE / 3` and `MAX_VALUE / 2` as `3 * x` has it.
  - R4 (refusal): every non-finite-number value R2 tests, plus `'2'` and `2n`, throws a `TypeError`; so does no argument.
  - R3 extended to `triple`: no dependence on call history, no output, no global added.

## Deferred

Nothing.

## Found in other modules

Nothing.

## Tests and checks

- `node --test gamma/test/*.test.mjs` (from `dryrun/`): `# tests 5`, `# pass 5`, `# fail 0` (a first run failed 2 on the overflow above, fixed in the module).
- Also run, unchanged: alpha `# pass 7 # fail 0`, beta `# pass 6 # fail 0`, stats `# pass 9 # fail 0`. No layer tests (manifest). `triple` is a new service with no users.
- `node checks/format.mjs dryrun`: `format: 6 modules, 4 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun gamma`: `architecture: 2 product files, 3 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun gamma`: `coverage: 1 modules, 4 of 4 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun gamma tranche/D9`: `ownership: 3 files changed by gamma between tranche/D9 and HEAD; 0 failures`

Size (session_01Vjx9RW3FuDxN3aCuCAgQqC): test runs 6, module lines 15

## From GAMMA #1 (D9): COMPLETE J3

N4 applied: `triple(x)` meets R4 as clarified by D9-K1 (B2 re J2), with its tests; `double` unchanged. All gamma tests pass (5 of 5); format, architecture, coverage and ownership pass with 0 failures. Nothing deferred, nothing found in other modules. Record: dryrun/build/jobs/D9/gamma.md on job/D9/gamma.
