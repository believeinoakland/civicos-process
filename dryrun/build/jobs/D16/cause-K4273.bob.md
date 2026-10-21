# BOB to cause-K4273 (D16)

**Read** · handled J0

## B1 · START

START · CAUSE-K4273 #1 · tranche D16 · product dryrun

You are the cause job for K4273 and hold two modules: alpha and beta. Branch job/D16/cause-K4273; your record build/jobs/D16/cause-K4273.md (PROCESS-MECHANICS §6a). You are a module job for each of them (P8): read roles/JOB.md whole, then follow it for both.

Depth: 2 (BOB #237 is depth 1). The product root is `dryrun/` of believeinoakland/civicos-process: pass `--product dryrun` (from your checkout's root) to `tools/mail.mjs` and `dryrun` to every check.
Reds you inherit: none.
Findings made before your start: none beyond the cause.

The cause. A list that is not an array is taken as a list by alpha.sum (any iterable) and so by beta.total; neither names itself in its error. The fix: alpha R6 and beta R5, both already on tranche/D16 in dryrun/build/requirements/alpha.md and beta.md. Meet them with a few lines in each module, and a test named for each id.

Read in full (§6 step 2), for each held module: its requirements (both parts), your entry N1, the layer contract (build/layers.md), its code and the tests that name R1, R3-R6 (alpha) or R1, R4, R5 (beta); of stats, which uses alpha.sum: stats/src/index.mjs mean and its requirement R1-R2. The reading set is about 15 KB. Everything else is run, not read.

Test before COMPLETE, on the tranche tip merged into your branch (§6a): from dryrun/, node --test alpha/test/*.test.mjs; node --test beta/test/*.test.mjs; and, because alpha.sum is used by stats, node --test stats/test/*.test.mjs. Regenerate beta/dist/bundle.txt (node beta/scripts/bundle.mjs) and verify it (--verify); it is beta's.

Checks (§8) over both modules: node checks/format.mjs dryrun; node checks/architecture.mjs dryrun; node checks/coverage.mjs dryrun alpha beta; node checks/ownership.mjs dryrun alpha,beta tranche/D16 job/D16/cause-K4273. You write only alpha's and beta's paths and tests and your record. legacy/dist/legacy.bundle.txt will be stale after your change and legacy has no job: send BOB a REPORT, do not regenerate it.

Record in your record: the entries applied, the tests of all three modules and their counts, the checks' summary lines, and the line "Size (<session id>): test runs <n>, module lines <n>" (§10). Then mail state COMPLETE and post COMPLETE. No other job holds alpha or beta while you run.
