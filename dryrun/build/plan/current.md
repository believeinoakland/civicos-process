# Plan: dry run D7

**Status** · OPEN. The dry run certifying the K154 revision (mechanics §2, §5, §6, §13: session depth; `CERTIFICATION.md` L1–L6). BOB: `D7-BOB #2 · session_01CVr6oZgfM2ey4n26azCpE1 · depth 1`. Each entry is written to drive a path of the mechanics: do exactly what it says.

## Layer 1

**alpha**
- N1 · Provide `mul(a, b)`, meeting alpha R3, with a test naming R3. Record your size line (mechanics §10).
- N2 · Before you send COMPLETE, read your own depth: call `get_session` (claude-code-remote) with no session id, then follow `parent_session_id` with `get_session` until a session has none; count the links. Record in your job record the chain (session ids, root last), your depth, and whether it equals the depth BOB's first message gave you.

## Handoff · D7-BOB #2 to D7-BOB #3

- **Depth.** D7-BOB #2 (`session_01CVr6oZgfM2ey4n26azCpE1`) is at depth 1: its parent is `session_01ST5gn8EypNUyWbHPtjrbRM` (BOB #47, playing ROOT), which has none.
- **Job.** ALPHA #2, `session_01ManYyUbFq3sKEucLdTy1nU`, started by D7-BOB #2 from `job/D7/alpha`. The job recorded depth **2** (chain ALPHA #2 → D7-BOB #2 → BOB #47), equal to the depth given in its first message.
- **COMPLETE** arrived 2026-09-27T14:02:55Z by **routine** (one-time trigger `trig_01EPYMbZCRcir6YmNEk7jvR7`, "alpha D7 COMPLETE"), naming record commit `7b08f2d`. The 14:20 backstop was not needed.
- **CHANGE 1** from BOB #47 (ROOT design) arrived 14:01:57Z by routine; step 5 followed it.
- **Merge.** `job/D7/alpha` merged into `tranche/D7` at `fcca882` (`--no-ff`).
- **Checks** (on `job/D7/alpha` at `7b08f2d`):
  - `node --test dryrun/alpha/test/`: fails on Node v22.22.2 (`Cannot find module .../dryrun/alpha/test`; a directory argument is not accepted): a flaw in the command form, as the job reported. `node --test dryrun/alpha/test/*.test.mjs`: `tests 3, pass 3, fail 0`.
  - `ownership: 3 files changed by alpha between origin/tranche/D7 and origin/job/D7/alpha; 0 failures`
  - `format: 4 modules, 3 requirements files; 0 failures`
  - `architecture: 12 product files, 3 relative imports (0 naming no tracked file, not judged); 1 failure` (`d6/plant-hook.sh`: owned by no module)
  - `coverage: 3 modules, 4 of 9 live requirement ids named by a test; 2 failures` (beta R2 R3; stats R1 R2 R3)
  - All three `run.mjs` failures were already present on `tranche/D7` at `b18750f` before the merge (coverage then had 3 failures, alpha's included); the job removed alpha's. None is in alpha. D7-BOB #2 merged despite the literal "0 failures" gate, resolving it as BOB (§7): the gate cannot be met by an alpha job. Open for BOB #47: the step's test command form, and whether the dry-run's `run.mjs` baseline should be cleaned or the gate scoped to the module.

**Open for D7-BOB #3:** archive ALPHA #2 is NOT yours; archive D7-BOB #2 (mechanics §2) and write its row into `dryrun/build/metrics/D7.csv` from `archive_session`'s usage.
