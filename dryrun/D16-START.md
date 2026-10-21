# D16 · the cause job (J10): prepared, not run

Prepared for the dry run that will prove J10 (`CERTIFICATION.md`; mechanics §6a, P8). Nothing here has been run and no session exists. Setup follows `RUNS.md` (D3, D5, D15): tranche `tranche/D16` from `dryrun-main/D16`, a plan in `build/plan/current.md`, the START posted with `mail post --as bob --kind START --body-file build/plan/starts-D16/cause-K4273.txt` (§5.3 step 2), the session titled `CAUSE-K4273 #1`, the record `build/jobs/D16/cause-K4273.md`. Product root `dryrun`.

## The cause

**K4273 · a list that is not an array is taken as a list by some services and as a number by others.** `alpha.sum` loops with `for … of`, so any iterable is a list: `sum(new Set([1, 2]))` is `3`, and a non-iterable gives the engine's own message (`list is not iterable`), naming no service. `beta.total` is `sum`, so it does the same. A service of the toy should refuse a non-array the way it refuses a non-finite element: with a `TypeError` that names itself. One cause, two modules: alpha holds the root (`sum`), beta needs its own refusal so that its error names `total`, not `sum`.

## What the cause changes

Each change is a requirement line and a few lines of code and tests.

| module | requirement line (added to its Provides) | code | tests |
| --- | --- | --- | --- |
| alpha | **R6** `sum` throws a `TypeError` when `list` is not an array (an iterable that is not an array, `null`, `undefined`, a number, a string, an object); nothing is iterated. | one line at the top of `sum` in `alpha/src/index.mjs`: `if (!Array.isArray(list)) throw new TypeError(\`sum: not an array: ${String(list)}\`);` | `alpha/test/alpha.test.mjs`: a test named R6 over a `Set`, a string, `null`, `undefined`, a number, `{}`, an array-like |
| beta | **R5** `total` throws a `TypeError` naming `total` when `list` is not an array; nothing is iterated. | one line at the top of `total` in `beta/src/index.mjs`, same form with `total:`; then `beta/dist/bundle.txt` regenerated (`node beta/scripts/bundle.mjs`), since alpha's source changed too (beta owns it) | `beta/test/beta.test.mjs`: a test named R5 over the same values, the message naming `total` |

Neither change alters what an array gets: alpha R3, R4 and beta R1, R4 stand.

## Who uses what is changed

`alpha.sum` is used by `beta` (held) and `stats` (`mean`, requirement R1; `modules.json` `uses`). The tests to run, from `dryrun/`:

- `node --test alpha/test/*.test.mjs` and `node --test beta/test/*.test.mjs` (the held modules);
- `node --test stats/test/*.test.mjs` (the user of the changed service; its `mean` is called with arrays only, so it should stay green);
- `legacy` and `catalog` have no tests; `legacy/dist/legacy.bundle.txt` is stale after alpha's change (alpha is in its source): the job REPORTs it to BOB (legacy has no job), as D3's N2 did.

## Reading set (§17)

alpha: requirements 1.4 KB, code 0.7 KB, tests 4.5 KB. beta: requirements 1.1 KB, code 0.3 KB, tests 6.1 KB. Layer contract 0.5 KB. About 15 KB for both modules together, well under the limit: one cause job holds both (P8). Of `stats`, the job reads `mean` and its requirement R1-R2 (the services it uses, §6 step 2); its other tests are run, not read.

## The plan entry (`build/plan/current.md`, layer 1)

**cause K4273 (alpha, beta)**
- N1 · Fix cause K4273 in one job: alpha R6 and beta R5 as in `dryrun/D16-START.md`. BOB writes both requirement lines on the tranche branch before the START (a changed provided service, §7); the job meets them.

## The START body (`build/plan/starts-D16/cause-K4273.txt`)

```
START · CAUSE-K4273 #1 · tranche D16 · product dryrun

You are the cause job for K4273 and hold two modules: alpha and beta. Branch job/D16/cause-K4273; your record build/jobs/D16/cause-K4273.md (PROCESS-MECHANICS §6a). You are a module job for each of them (P8): read roles/JOB.md whole, then follow it for both.

Depth: <BOB's depth + 1>.
Reds you inherit: none.
Findings made before your start: none beyond the cause.

The cause. A list that is not an array is taken as a list by alpha.sum (any iterable) and so by beta.total; neither names itself in its error. The fix: alpha R6 and beta R5, both already on tranche/D16 in dryrun/build/requirements/alpha.md and beta.md. Meet them with a few lines in each module, and a test named for each id.

Read in full (§6 step 2), for each held module: its requirements (both parts), your entry N1, the layer contract (build/layers.md), its code and the tests that name R1, R3-R6 (alpha) or R1, R4, R5 (beta); of stats, which uses alpha.sum: stats/src/index.mjs mean and its requirement R1-R2. The reading set is about 15 KB. Everything else is run, not read.

Test before COMPLETE, on the tranche tip merged into your branch (§6a): from dryrun/, node --test alpha/test/*.test.mjs; node --test beta/test/*.test.mjs; and, because alpha.sum is used by stats, node --test stats/test/*.test.mjs. Regenerate beta/dist/bundle.txt (node beta/scripts/bundle.mjs) and verify it (--verify); it is beta's.

Checks (§8) over both modules: node checks/format.mjs dryrun; node checks/architecture.mjs dryrun; node checks/coverage.mjs dryrun alpha beta; node checks/ownership.mjs dryrun alpha,beta tranche/D16 job/D16/cause-K4273. You write only alpha's and beta's paths and tests and your record. legacy/dist/legacy.bundle.txt will be stale after your change and legacy has no job: send BOB a REPORT, do not regenerate it.

Record in your record: the entries applied, the tests of all three modules and their counts, the checks' summary lines, and the line "Size (<session id>): test runs <n>, module lines <n>" (§10). Then mail state COMPLETE and post COMPLETE. No other job holds alpha or beta while you run.
```

## What the run must show (J10)

1. BOB's ownership check, `node checks/ownership.mjs dryrun alpha,beta tranche/D16 job/D16/cause-K4273`, passes: 0 failures (the changed files are alpha's, beta's and the record `build/jobs/D16/cause-K4273.md`).
2. On a throwaway commit, never pushed: one line added to `stats/src/index.mjs` fails the same check, naming the file.
3. The record shows the alpha, beta and stats suites green, and the bundle verified.
4. The only record file is the cause's; no `alpha.md` or `beta.md` job record is needed.
