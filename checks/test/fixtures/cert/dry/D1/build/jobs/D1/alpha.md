# D1 · alpha — job record

**Status** · COMPLETE, 2026-09-26.

## Questions

- **Q1 (N1)** · What does `sum(list)` do when `list` contains something that is not a number? Best reading: it throws a `TypeError` naming the offending element's index, rather than coercing or skipping it; for an empty list it returns `0`; it otherwise returns the sum of the numbers (as repeated `add`). **Answered** by BOB (ANSWER N1): reading accepted, written as R3 and R4 on `tranche/D1` (8108669); merged into this branch.

## Reports

- **REPORT (N2)** · alpha's change to `alpha/src/index.mjs` makes beta's generated artifact `beta/dist/bundle.txt` stale: `node beta/scripts/bundle.mjs --verify` prints `bundle: STALE` (exit 1) on this branch. Not regenerated: it is beta's (mechanics §14).
- **REPORT (tool)** · `node checks/ownership.mjs dryrun alpha tranche/D1`, as `roles/JOB.md` step 6 writes it, crashes with a git stack trace (`ambiguous argument 'tranche/D1...HEAD'`) in a job's checkout, which has only `origin/tranche/D1`. It passes with `origin/tranche/D1`. Suggest the check fall back to `origin/<base>` or report the missing ref as one failure line; or step 6 name `origin/tranche/T<n>`.

## Completion

- **Entries applied** · N1: `sum(list)` added to `alpha/src/index.mjs` per R3 and R4 (built on `add`); nothing coerced or skipped. N2: REPORT sent (above); `beta/dist/bundle.txt` left to beta/BOB.
- **Improvements in this module** · R1's test now checks every pair from a set of finite numbers (edge values included) rather than two samples; R2 (purity) was named by no test and now has one.
- **Deferred** · None.
- **Found in other modules** · beta: `beta/dist/bundle.txt` is stale against R2 of beta after this change (REPORT N2). Process tool: `checks/ownership.mjs` crashes on a base ref that exists only as `origin/…` (REPORT above).
- **Channel** · BOB's ANSWER arrived by a scheduled trigger, not a PR comment; REPORT and COMPLETE were sent to BOB by `create_trigger` into BOB's session, as BOB's ANSWER instructed.

### Tests and checks (from `dryrun/`, then from the process repository)

- `node --test alpha/test/*.test.mjs` · `# tests 4`, `# pass 4`, `# fail 0`
- `node --test beta/test/*.test.mjs` (uses alpha; unchanged service `add`) · `# pass 1`, `# fail 0`
- `node beta/scripts/bundle.mjs --verify` · `bundle: STALE` (reported, N2)
- `node checks/format.mjs dryrun` · format: 2 modules, 2 requirements files; 0 failures
- `node checks/architecture.mjs dryrun alpha` · architecture: 2 product files, 1 relative imports (0 naming no tracked file, not judged); 0 failures
- `node checks/coverage.mjs dryrun alpha` · coverage: 1 modules, 4 of 4 live requirement ids named by a test; 0 failures
- `node checks/ownership.mjs dryrun alpha origin/tranche/D1` · ownership: 3 files changed by alpha between origin/tranche/D1 and HEAD; 0 failures (with `tranche/D1`: crash, reported)

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
6aad1e65-d6f3-527d-ac3f-24fd6da7931e,job,alpha,1734064,85520,41,8206,21,1,17
```
