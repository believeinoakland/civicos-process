# Lane: the process repair (PROCESS-REPAIR)

**Status** · Open. Chartered by BOB #333, 2026-10-28, on Bob's direction (bio K5791): "Don't start the next layer. The development process needs to be fixed first." Product work is stopped until this lane's fixes are certified (P3).

**Evidence (P20).** Every entry this lane writes carries `Evidence:` (a command run with its result, a file:line, or a test run with its totals); state as fact only what you read or ran.

## The job
Build and certify the plan of Bob's analysis "Civicsmith Merge Slowdown" (https://claude.ai/artifact/Rw9FsHdPS7muc68mDtKzVW; read it with the Artifact tool, `action: read`), with Bob's four answers (bio K5791, verbatim there):
1. Merging: "GitHub merge queue".
2. Walk screenshots: "R2, but cleaned up after a walk has been analyzed. These screenshots can't be allowed to build up!"
3. Generated bundles and sources: "Out of git".
4. Old history: "Leave it untouched".

## Work, in order
**Phase 1 (first aid), certified and handed to BOB on its own, first:**
- a. One `proc` command merges a list of COMPLETE jobs in one background run (upstream first, `modules.json` order), using the `.git/civicos-running.json` marker; a hook refuses hand-written wait loops (`pgrep`/`sleep`/`while` waits on a `proc` process).
- b. The Stop hook's state check: one fetch of the tranche and all its job branches together, no deepening; target under 3 s (today median 16 s, worst 600 s).
- c. The `create_session` call `proc` prints for a job (and BOB's own start) uses full history with large files left out (`clone_depth` high, `blob_limit_kb` set) instead of 50 commits; measure the start time before and after.
- d. Delete merged job, land and prep branches (bio's existing `prune-branches` workflow, or its equivalent); never the restore point `snapshot/pre-refactor-2026-09-25`, `study/constructs`, or a live tranche's branches.
- e. A new module's first job cannot complete: `proc job complete` runs tests and ownership from the module's `modules.json` row, empty for a new module (K1185), and the format check refuses a row naming files not yet on the tranche. BOB #332 worked around it by hand for registers (bio K5790). Give the tool the route (for example: the job's own COMPLETE fills its own empty row, and ownership accepts exactly that change).
- f. A predecessor BOB's background procedure kept merging after `proc takeover` (bio K5788-K5790, 18:52-18:54Z on 2026-10-28). Every writing `proc` command run by a BOB refuses when the plan's Status line names another BOB.

**Phase 2 (the merge queue):** a finished job opens a pull request into the tranche branch; a GitHub Actions workflow runs today's merge gate (ownership, the module's and its users' tests, the checks, the artifact check); GitHub's merge queue merges green ones in order; a red one goes back to its job. BOB stops merging. The per-merge line in `build/rulings.md` moves to the pull request and the job record. A layer closes when all its pull requests are merged. Settings only Bob can change (rulesets, the merge queue, Actions permissions) are named as one act each, with the steps written from GitHub's own page labels through `proc steps`.

**Phase 3 (slim the repository), before or with Phase 2, which needs it:** generated bundles and generated sources leave git: CI builds them, a release publishes them as release files, deploy takes them from the release (mechanics §14, bio's `build/situations/release.md` and `deploy-and-walk.md`). Walk screenshots go to R2 on Cloudflare account `20b533579290b9b93168345edd3b7f72` only; git keeps a small index (name, fingerprint, link); and each walk's screenshots are deleted from R2 once its analysis is recorded, by code, so they never build up. Finished tranches' records move to an archive. Old history stays untouched (no rewrite, no force-push).

**Phase 4:** a merge tests the changed module and its users; the "before" measurement is taken once per tranche commit; each tranche's footprint reports the analysis's targets (COMPLETE to merged p50 ≤ 10 min, p90 ≤ 20; gate ≤ 1 min; session ready ≤ 60 s; Stop check ≤ 3 s; checkout ≤ 150 MB).

## Read first, whole
This repository's `PROCESS-DESIGN.md`, `PROCESS-MECHANICS.md` (by a worker told the task if too large), `roles/BOB.md`, `roles/JOB.md`, `tools/proc.mjs`, `tools/hooks.mjs`, `checks/ownership.mjs`, `checks/format.mjs`; bio `build/manifest.md`, `build/rulings-active.md`, `build/situations/release.md`, `deploy-and-walk.md`, `job.md`; Bob's analysis.

## How the lane works
- Its record is this folder, on branch `lane/process-repair` of this repository; its code and dry runs are written on that branch (or branches off it). It never changes this repository's `main`, bio's `main`, a running job's branch, or the process BOB is using; each phase reaches use by BOB's merge once certified (P3, mechanics §15; a dry run recorded in `dryrun/RUNS.md`).
- Clone bio with `git clone --filter=blob:none` (never shallow) when you need it; branch `tranche/T53`.
- It reports to BOB in `HANDOFF.md` here (entries `P<n>`, newest last) and by `send_message` to the BOB named on bio's `build/plan/current.md` Status line when a phase is ready or it is blocked. A question for Bob goes to BOB with an explanation, options and a recommendation (P17); tool and mechanics text that changes no principle is decided by the lane, never asked of Bob (K5036).
- Standing safety rules (bio `CLAUDE.md`): never force-push, never rewrite `main`'s history, never delete the restore point, never print a secret, Cloudflare account `20b533579290b9b93168345edd3b7f72` only. A refused act is never worked around: record it in `HANDOFF.md`.
- Workers name model and effort (haiku at low for mechanical work, sonnet at medium for reading; never opus). Reading is whole, never scanned (P20).
- The lane hands over when its context passes half its window: `HANDOFF.md` names the next steps, and BOB starts PROCESS-REPAIR #n+1.
