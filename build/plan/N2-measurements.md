# N2 · measurements (SES-12; Bob, 30 Oct: "measure this tranche as we go through it")

Taken by the architecture session from git, GitHub and the sessions' records; never by a job. One block per layer, written at the layer's close; the baseline at the open.

## Baseline at the open (30 Oct 2026)

| measure | value | source |
| --- | --- | --- |
| process version pinned | the `main` commit `tranche` opens from (the plan's Status line) | git |
| commits on `main` on 30 Oct before the open | 154 (29 merged pull requests) | `git log origin/main --since 2026-10-30` |
| tool size | `tools/proc.mjs` 2,604 lines; `tools/lib.mjs` 463; `tools/hooks.mjs` 450; `checks/*.mjs` 2,686 | `wc -l` |
| suite | `node --test checks/test/*.test.mjs tools/test/*.test.mjs`: 255 `test(` calls | `grep -c` |
| old branches found at the open | 24 `tranche/D*`, 39 `job/D*/*`, 1 `fix/*`, none on `main`; the 24 kept as `carried/D*` and pruned by the new `prune.yml` | `git ls-remote` |
| the architecture session | neoProcess #20, depth 4, started 17:06Z | `get_session` |

## Per layer (written at each close)

| layer | opened | closed | jobs (sessions per job) | gate runs per merged job | restarts (process reasons) | commits: job code / records | tokens by role (cache read / write / output) | reading set per job at start (bytes) | overruns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Layer 1 · at its start (30 Oct 2026, 20:30Z; taken by BOB #2)

| measure | value | source |
| --- | --- | --- |
| the architecture session | BOB #2, depth 0, started by Bob at 20:24Z; BOB #1 left idle, not archived (Bob, 30 Oct), its usage unmeasured | `get_session`; Bob's start message |
| platform acts at the start | `create_pull_request` 2 of 2 passed; `create_session` 2 of 2 passed; `subscribe_pr_activity` 2 of 2 passed; no refusal in the turn | this session's tool results |
| job branches | both cut at `6bbe0d1`, before the bootstrap pass `37b78ac`; the `tranche` tip `a0f8c6f` merged into each by the architecture session before the start (no conflict), so each job's first-act pin check can pass | `git log origin/job/platform..origin/tranche`; the merge commits `e277c2a`, `50e806b` |
| pull requests | platform #127, record #128, drafts on `tranche`, opened 20:29Z | GitHub |
| reading set per job at start | platform 3,961 bytes (2 files, 9 code paths); record 5,182 bytes (3 files, 4 code paths); limit 40,960 | `readingSet` |
| sessions | PLATFORM #1 and RECORD #1 created 20:30Z on Opus; platform read WORKING and record STARTING at 20:31Z | `create_session`; `proc status` |
| gate runs at the opening tips | one per pull request, both `success`: #127 at 20:29:49Z to 20:29:56Z, #128 at 20:29:57Z to 20:30:08Z; the two whole-product reds of the checks at the tranche tip (ownership of `gate.yml` and `prune.yml`; coverage of platform and record, no tests yet) did not fail them | GitHub check runs |
| suite at the tranche tip with the plan edits | 285 tests, 285 pass | `node --test checks/test/*.test.mjs tools/test/*.test.mjs` |
| stop 1 (restart for a process reason, JOB-4) | gate red on both pull requests, 4 runs (#128 run 41125229336 at 20:42Z; #127 runs 41125538395, 41125591146, 41125660078 to 20:45Z): `the diff touches several modules: <module>, proc-legacy`; a stop declared by the architecture session at 20:5xZ, the fix `c9749e2` on `tranche` with a fixture test (suite 286 of 286), both jobs complete-allowed and told to merge `tranche`; no session restarted | the gate logs; `git log tranche` |
| layer 1 wall clock to 21:56Z (read from `state/E1`'s commits) | layer started 19:51 by BOB #1, sessions created 20:30 (after the handoff); first completions platform 20:47, record 20:52 (16 and 21 minutes of job work, a gate flaw and four questions inside them); then 65 minutes of review rounds: platform reviewed 4 times (gaps 7, 3, 1, then the round after its self-review), record twice (18, 5), each round a review of 3 to 6 minutes and a fix of 9 to 15 | `git log origin/state/E1` |
