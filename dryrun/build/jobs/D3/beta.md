# Job record: beta (D3)

**Status** · IN PROGRESS. Job session `session_01TQpjjNikfAHshU4qPFuGqb`, branch `job/D3/beta` (from `tranche/D3` at `bab815f`). This record is the job's state: a session resuming this job reads it first.

## Read

`roles/JOB.md`; `PROCESS-MECHANICS.md` §6, §13, §14, §15; `dryrun/build/requirements/beta.md` (both parts); alpha's public part; `dryrun/build/layers.md` (layer 1: pure functions, no state); beta's code, script, generated bundle and tests; beta's entries N3–N5 in `dryrun/build/plan/current.md`; `dryrun/build/manifest.md`; `dryrun/CERTIFICATION.md`.

## Entries

| entry | state |
| --- | --- |
| N3 · `total` on `alpha.sum` | waiting: alpha's `sum` is not yet on `tranche/D3` |
| N4 · `total([0.1, 0.2])` exactly `0.3` without changing R1 | BLOCKED after three attempts (below); sent to BOB, waiting on BOB's ruling |
| N5 · `alpha.add('1', 2)` REPORT | waiting: alpha's work is not yet on `tranche/D3` |

## Found in beta itself

- Only R1 was named by a test; R2 (the bundle script) and R3 (purity) were named by none. Fixed: `beta/test/beta.test.mjs` now tests R1 over 500+ lists (edge cases and a seeded spread of magnitudes), R2 on the committed bundle and in a sandbox copy (stale after a change to either source, fresh after a write, stale on any other content), and R3 (input unchanged, no state, nothing printed; the script writes only its own file, `--verify` writes nothing).

## QUESTION 1 (to BOB): what "the sum" in R1 means for floating-point numbers

R1 says `total` "returns the sum of the numbers". N4 glosses R1 as "the exact sum". The two readings differ, and not only at N4: `total([1e16, 1, 1])` is `1e16` by left-to-right addition (today's code, and alpha's `add`), but the exact sum `10000000000000002` is representable, so a correctly rounded sum returns that. **Best reading, on which I work meanwhile:** R1's sum is left-to-right IEEE addition, the value alpha's `add`/`sum` give, because N3 makes `total` use `alpha.sum` and the provider's requirements define the arithmetic. The R1 test checks that. If BOB means the correctly rounded exact sum, R1 needs that wording, and alpha's `sum` would need it too for N3 to hold.

## BLOCKED: N4

N4 cannot be met as written. The exact sum of the doubles `0.1` and `0.2` is `0.3000000000000000166533…`, which lies **exactly halfway** between the doubles `0.3` and `0.30000000000000004` (verified with exact integer arithmetic on the bit patterns). Round-to-nearest-even, the rounding of every JavaScript addition, picks `0.30000000000000004`.

1. **Compensated (Neumaier) summation**: `0.30000000000000004`. It computes the correctly rounded sum, which is that value. Fails N4.
2. **Exact summation** (each double as an integer multiple of 2⁻¹⁰⁷⁴, summed as BigInt, rounded once): ties-to-even gives `0.30000000000000004`. Breaking ties the other way (toward zero) gives `0.3` and is still *a* nearest double to the exact sum, but it is a rounding rule no other arithmetic in the product uses, it disagrees with left-to-right addition (my best reading of R1) on ordinary inputs, and after N3 `total` must take its value from `alpha.sum`, which will use JavaScript's own addition. Fails R1 on my reading, and N3.
3. **Decimal scaling** (scale by 10^k from the shortest decimal form, sum integers, divide): `0.3`, but it breaks R1 on either reading: `total([1e16, 1, 1])` gives `1e16`, and inputs with no short decimal form lose precision. Fails R1.

No implementation returns exactly `0.3` for `[0.1, 0.2]` while computing the sum of the numbers, on either reading. Options for BOB: drop N4 or defer it; or re-scope it (e.g. a separate rounding service with its own requirement). The rest of the job carries on.
