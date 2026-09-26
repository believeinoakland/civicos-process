# Dry runs (PROCESS-MECHANICS §15)

One entry per run: the revision certified, what each path did, and the verdict.

## D1 · 2026-09-26 · the revision after T1 (bio C14)

Paths to prove, each by its artifact: (1) each job opens a draft pull request into `tranche/D1` and subscribes; BOB subscribes; (2) a `QUESTION` comment wakes BOB; (3) BOB's requirement change on the tranche branch and `ANSWER` wake the job, which merges and continues; (4) a `REPORT` of a stale generated artifact; (5) `COMPLETE` wakes BOB; (6) the early merge and a `CHANGE` wake the using job, which merges and completes; (7) each job's metrics row lands in its own record and its ownership check passes; (8) BOB regenerates and verifies the generated artifact at layer close, collects the metrics, comments `CLOSE`; (9) the backstop check-in finds a quiet job.

Result, 2026-09-26 15:25Z: **NOT CERTIFIED: the run found flaws, each now fixed; a clean second run (D2) certifies.** What each path did:

1. **Pull request as the channel: FAILED.** Both jobs commented on time (15:01, 15:02); neither comment woke BOB (every session posts as the same GitHub account). Replaced by (2).
2. **Channel: firing a standing routine: FAILED** (it started a new, empty session instead of reaching the named one; both strays archived, nothing written). **A one-time routine into the named session at the next whole minute: WORKS both ways**, as the old process measured (bio ORCHESTRATION.md): BOB to alpha and beta delivered at 15:11 as turns in their sessions; alpha and beta to BOB delivered at 15:14–15:18, about 2 minutes after scheduling.
3. **QUESTION → requirement change on the tranche branch → ANSWER → merge: WORKS** (alpha merged 8f0c844, implemented `sum` to R3–R4).
4. **REPORT of a stale generated artifact: WORKS** (alpha, N2).
5. **COMPLETE: WORKS** (alpha 15:15, beta 15:18).
6. **Early merge and CHANGE: WORKS** (alpha into the tranche at 673df14; beta merged and completed N3).
7. **Metrics in the job's own record: WORKS**, after a fix (the recorder resolved `--record` from the working directory). **Ownership check: WORKS**, after two fixes (it knew only `T<n>` job records; it needed `origin/<base>` in a job's checkout).
8. **Layer close: WORKS.** Ownership clean; merge clean; `beta/dist/bundle.txt` regenerated with no change and verified fresh; metrics collected in `build/metrics/D1.csv` (alpha 1,828,000 tokens processed, beta 2,618,000, each counted when it recorded; its session's final totals were higher); both job sessions archived. No `CLOSE` message was sent: archiving ends the job, so the mechanics now say so and drop `CLOSE`.
9. **Backstop check: not exercised** (no job went quiet); the channel made it unnecessary this run.

Also found: the manifest's test command failed on the jobs' Node 22 (fixed: name the test files); beta noted that `total` now inherits `sum`'s refusal of non-numbers, which beta's R1 does not state. BOB should have reviewed the user's requirements when the provider's meaning changed (mechanics §7 says so); a lapse of BOB's, not a gap in the mechanics.

## D2 · 2026-09-26 · the revision after D1

The same toy tranche, from the toy's starting state on `main`, on the mechanics as revised after D1 (the channel of §13, archiving in place of `CLOSE`, the tool fixes). Paths to prove: (1) BOB to a job and a job to BOB by one-time routines, both ways; (2) QUESTION, requirement change, ANSWER, merge; (3) REPORT of a stale generated artifact; (4) COMPLETE; (5) early merge and CHANGE; (6) metrics in the job record and ownership, run exactly as `roles/JOB.md` writes them; (7) layer close.

Result, 2026-09-26 15:35Z: **every path of this run worked as written, with no fix to the process.** QUESTION 15:23 → requirement change and ANSWER 15:25 → alpha merged and implemented; alpha's REPORT (stale bundle) 15:27; COMPLETE 15:28; early merge (f5e700f) and CHANGE 15:31; beta COMPLETE 15:33; layer close clean (ownership, merge, bundle fresh, 8 tests, format, architecture, coverage 8 of 8); metrics collected (`build/metrics/D2.csv` on `tranche/D2`: alpha 1,653,000 tokens processed at recording, beta 1,739,000). Messages arrived 1–2 minutes after scheduling. BOB reviewed the user's requirements when the provider's meaning changed (B2), which BOB had missed in D1. The jobs' first messages were minimal: `roles/JOB.md` was enough. Beta fixed two flaws in its own module (untested R2–R3; `--verify` crashing on a missing bundle) and pointed out stale wording in its requirements' Uses, which BOB corrected at the close. D2 proves only its own rows of `CERTIFICATION.md`; D3 proves the rest.

BOB's own slip after D2, recorded because it is the kind of fault the process must survive: merging the D3 preparation into `main` hit a conflict, and BOB's command committed and pushed it with conflict markers in `dryrun/build/modules.json` (0738700). The format check caught it at once (the file did not parse); it was resolved forward in the next commit, with no history rewritten. BOB's commands that merge now stop on the first failure (`set -e`) and look for markers in the files before committing.

## D3 · 2026-09-26 · the rows D1 and D2 did not reach

The plan in `build/plan/current.md` (D3) and the design in `CERTIFICATION.md`. The toy's `main` is the branch `dryrun-main/D3`.

Result: pending.
