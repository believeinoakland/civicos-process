# D1 · alpha — job record

**Status** · STARTED by BOB #38, 2026-09-26. Job session: sum implemented; REPORT sent (N2).

## Questions

- **Q1 (N1)** · What does `sum(list)` do when `list` contains something that is not a number? Best reading: it throws a `TypeError` naming the offending element's index, rather than coercing or skipping it; for an empty list it returns `0`; it otherwise returns the sum of the numbers (as repeated `add`). **Answered** by BOB (ANSWER N1): reading accepted, written as R3 and R4 on `tranche/D1` (8108669); merged into this branch.

## Reports

- **REPORT (N2)** · alpha's change to `alpha/src/index.mjs` makes beta's generated artifact `beta/dist/bundle.txt` stale: `node beta/scripts/bundle.mjs --verify` prints `bundle: STALE` (exit 1) on this branch. Not regenerated: it is beta's (mechanics §14).
- **REPORT (tool)** · `node checks/ownership.mjs dryrun alpha tranche/D1`, as `roles/JOB.md` step 6 writes it, crashes with a git stack trace (`ambiguous argument 'tranche/D1...HEAD'`) in a job's checkout, which has only `origin/tranche/D1`. It passes with `origin/tranche/D1`. Suggest the check fall back to `origin/<base>` or report the missing ref as one failure line; or step 6 name `origin/tranche/T<n>`.
