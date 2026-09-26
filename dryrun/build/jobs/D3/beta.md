# Job record: beta (D3)

**Status** · COMPLETE (2026-09-26, after BOB's CHANGE at 15:45Z). Job session `session_014VNyoK4tprbsgzVKycE9P3` (a **resumed** session, from 2026-09-26 ~15:39Z; the first session, `session_01TQpjjNikfAHshU4qPFuGqb`, ended mid-job after sending QUESTION 1 and BLOCKED N4), branch `job/D3/beta` (from `tranche/D3` at `bab815f`; `tranche/D3` merged at `caa0f42`). This record is the job's state: a session resuming this job reads it first.

## Read

`roles/JOB.md`; `PROCESS-MECHANICS.md` §6, §13, §14, §15; `dryrun/build/requirements/beta.md` (both parts); alpha's public part; `dryrun/build/layers.md` (layer 1: pure functions, no state); beta's code, script, generated bundle and tests; beta's entries N3–N5 in `dryrun/build/plan/current.md`; `dryrun/build/manifest.md`; `dryrun/CERTIFICATION.md`.

## Entries

| entry | state |
| --- | --- |
| N3 · `total` on `alpha.sum` | applied (after BOB's CHANGE: alpha merged at `b2dc984`) |
| N4 · `total([0.1, 0.2])` exactly `0.3` without changing R1 | dropped by BOB (recorded under "Deferred during D3" in the plan); nothing more to do |
| N5 · `alpha.add('1', 2)` REPORT | applied: REPORT 1 below, sent to BOB |

## Found in beta itself

- Only R1 was named by a test; R2 (the bundle script) and R3 (purity) were named by none. Fixed: `beta/test/beta.test.mjs` now tests R1 over 500+ lists (edge cases and a seeded spread of magnitudes), R2 on the committed bundle and in a sandbox copy (stale after a change to either source, fresh after a write, stale on any other content), and R3 (input unchanged, no state, nothing printed; the script writes only its own file, `--verify` writes nothing).

## Resumed session

BOB's answers, received by the resumed session (on `tranche/D3` at `caa0f42`, merged into this branch):
- ANSWER to QUESTION 1: R1's sum is left-to-right addition (ordinary floating-point addition, as `alpha.sum` computes it). beta's R1 and alpha's R3 now say so. My best reading stood; the R1 test already checked exactly that.
- BLOCKED N4: dropped. Nothing more on N4.
- New live requirement **R4** (added by BOB in `ebfa39f`): an element that is not a finite number is refused with a `TypeError`. It binds now, not only after N3, so `total` meets it today: it checks each element (`typeof` number and `Number.isFinite`) before adding it and throws a `TypeError` otherwise. When N3 moves `total` onto `alpha.sum`, alpha's R4 gives the same refusal and beta's own check can go.
- Tests brought in line: the R1 lists no longer hold `NaN` or infinities as elements (R4 now refuses them; an infinite *sum* from finite elements, e.g. `[MAX_VALUE, MAX_VALUE]`, stays in R1). A new R4 test checks every kind of non-finite-number element (NaN, ±Infinity, strings, null, undefined, booleans, BigInt, objects, arrays, functions, symbols, boxed numbers) at every position; it fails on the previous code and passes now. Bundle regenerated (`beta/dist/bundle.txt`, fresh).

## CHANGE (BOB, 15:45Z): alpha is on `tranche/D3` (`b2dc984`)

Merged `tranche/D3` at `b2dc984` (alpha's `sum`, R3–R4, its tests and its record; read whole).
- **N3** · `total(list)` now returns `alpha.sum(list)`. alpha's R3 is left-to-right addition with `add`, which is beta's R1, and alpha's R4 is the refusal beta's R4 names, so beta's own element check (added earlier in this session) is gone: alpha's does it. The R1 and R4 tests pass unchanged on the new code.
- **Bundle** · alpha's change made `beta/dist/bundle.txt` stale (alpha's REPORT 2; `--verify` printed `bundle: STALE` after the merge). Regenerated with `node beta/scripts/bundle.mjs`; fresh.
- **N5** · REPORT 1 below.

## REPORT 1 (N5; about alpha, sent to BOB)

`alpha.add('1', 2)` returns the **string `'12'`** (`typeof` `string`): JavaScript's `+` concatenates. Against alpha's R1 ("Returns `a + b` for two finite numbers"): **not a breach**. `'1'` is not a number, so R1 says nothing about this call, and the code does compute `a + b` literally. It is a flaw in what R1 leaves open, though: a caller that passes a numeric string gets a string back silently, not a number and not an error. It is also inconsistent with alpha's own R4, where `sum` refuses a non-finite-number element with a `TypeError` so that "a caller never gets a string concatenation" (alpha's Q1). beta is not exposed, since `total` goes through `sum`, which checks every element first. Suggestion (binds nothing): give `add` the same refusal as `sum`'s R4, as a new requirement on alpha.

Checks (resumed session, after R4): format 0 failures; architecture 0 failures; coverage 4 of 4 live ids named; ownership 0 failures. Tests: 6 of 6 pass.

## QUESTION 1 (to BOB; answered, above): what "the sum" in R1 means for floating-point numbers

R1 says `total` "returns the sum of the numbers". N4 glosses R1 as "the exact sum". The two readings differ, and not only at N4: `total([1e16, 1, 1])` is `1e16` by left-to-right addition (today's code, and alpha's `add`), but the exact sum `10000000000000002` is representable, so a correctly rounded sum returns that. **Best reading, on which I work meanwhile:** R1's sum is left-to-right IEEE addition, the value alpha's `add`/`sum` give, because N3 makes `total` use `alpha.sum` and the provider's requirements define the arithmetic. The R1 test checks that. If BOB means the correctly rounded exact sum, R1 needs that wording, and alpha's `sum` would need it too for N3 to hold.

## BLOCKED: N4 (dropped by BOB)

N4 cannot be met as written. The exact sum of the doubles `0.1` and `0.2` is `0.3000000000000000166533…`, which lies **exactly halfway** between the doubles `0.3` and `0.30000000000000004` (verified with exact integer arithmetic on the bit patterns). Round-to-nearest-even, the rounding of every JavaScript addition, picks `0.30000000000000004`.

1. **Compensated (Neumaier) summation**: `0.30000000000000004`. It computes the correctly rounded sum, which is that value. Fails N4.
2. **Exact summation** (each double as an integer multiple of 2⁻¹⁰⁷⁴, summed as BigInt, rounded once): ties-to-even gives `0.30000000000000004`. Breaking ties the other way (toward zero) gives `0.3` and is still *a* nearest double to the exact sum, but it is a rounding rule no other arithmetic in the product uses, it disagrees with left-to-right addition (my best reading of R1) on ordinary inputs, and after N3 `total` must take its value from `alpha.sum`, which will use JavaScript's own addition. Fails R1 on my reading, and N3.
3. **Decimal scaling** (scale by 10^k from the shortest decimal form, sum integers, divide): `0.3`, but it breaks R1 on either reading: `total([1e16, 1, 1])` gives `1e16`, and inputs with no short decimal form lose precision. Fails R1.

No implementation returns exactly `0.3` for `[0.1, 0.2]` while computing the sum of the numbers, on either reading. Options for BOB: drop N4 or defer it; or re-scope it (e.g. a separate rounding service with its own requirement). The rest of the job carries on.

## Completion

**Entries applied**
- N3 · `total` on `alpha.sum` (above).
- N4 · dropped by BOB; nothing done after the drop.
- N5 · REPORT 1 above, sent to BOB.

**Deferred** · Nothing.

**Found in other modules** · REPORT 1 (alpha: `add` concatenates a string argument, outside R1's domain; inconsistent with alpha's R4). alpha's REPORT 2 (beta's bundle stale) is resolved here: beta owns the bundle and it has been regenerated. My change to beta's source makes no other generated artifact stale (`legacy/dist/legacy.bundle.txt` is built from alpha's and legacy's source, not beta's).

**Tests** (from `dryrun/`)
- `node --test beta/test/*.test.mjs` · 6 tests: R1 (500+ lists vs a left-to-right fold, and 1..n for n ≤ 200), R2 ×2 (committed bundle exact; script in a sandbox: stale after a source change, fresh after a write, stale on any other content), R3 ×2 (`total` pure; the script writes only its own file), R4 (16 kinds of non-finite-number element in 5 positions each) · `# pass 6`, `# fail 0`.
- I provide no service that changed. alpha's and stats' tests, run as a cross-check: `# pass 5`, `# fail 0`. No layer tests (manifest).

**Checks** (from the process repository)
- `node checks/format.mjs dryrun` · `format: 4 modules, 3 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun beta` · `architecture: 4 product files, 2 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun beta` · `coverage: 1 modules, 4 of 4 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun beta tranche/D3` · OWNERSHIP_LINE

**Metrics** · the row below covers this resumed session only. The first session's transcript is not in this container, so its tokens are not counted here. As alpha's REPORT 3 notes, the `session` column is the local transcript id; the cloud session is `session_014VNyoK4tprbsgzVKycE9P3`.
