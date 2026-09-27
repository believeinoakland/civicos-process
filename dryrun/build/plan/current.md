# Plan: dry run D11 (certifying K168: mailbox and doorbell)

**Status** · OPEN · D11-BOB #1 · session_01H3XDB9goUxVa4G4Ma1HJep · depth 1

**Jobs** · alpha: ALPHA #1 session_011V7Yi2Fr9EzggtqCyXxoVb

## The run (read whole; it adapts the roles to the toy)

This is dry run **D11**, certifying the K168 revision of the mechanics (mailbox and doorbell, `PROCESS-MECHANICS.md` §13, `tools/mail.mjs`), run by **BOB #49** (`session_01H7SnX45uHbDZ5fjH6mBHcN`) as the **harness**. You are a stand-in playing a real role exactly as `roles/` on **this branch** (`tranche/D11`) says, with the mechanics `PROCESS-MECHANICS.md` on this branch. Only these adaptations hold:

- **The product** is the toy at `dryrun/` in `believeinoakland/civicos-process`, not BIO; never touch `believeinoakland/bio`. Its build state is `dryrun/build/` (read every `build/…` path in the roles as `dryrun/build/…`); its `main` is the branch **`dryrun-main/D11`**; the tranche is **`D11`**: `tranche/D11`, `job/D11/<module>`, `dryrun/build/jobs/D11/<module>.md`, `dryrun/build/metrics/D11.csv`. The checks run from the repository root as `node checks/<check>.mjs dryrun …`, and the mailboxes as `node tools/mail.mjs <command> --product dryrun --tranche D11 …`; module tests from `dryrun/` as `node --test <module>/test/*.test.mjs`. The process repository and the product repository are the same one: attach nothing.
- **Names.** The stand-in ROOT is `D11-ROOT #1` and signs its messages `ROOT`. Stand-in BOBs are titled and sign `D11-BOB #<n>`; ROOT starts `D11-BOB #<n+1>` where the roles say `BOB #<n+1>`, on `tranche/D11` of this repository, with the prompt below. Jobs are `ALPHA #k`, `BETA #k`, `GAMMA #k`, `STATS #k`, as the roles say.
- **Depth.** Depths in this run count from the stand-in ROOT, which plays depth 0: when you follow `parent_session_id`, stop at `D11-ROOT #1` (its id is in the next line). Its real parent is the harness, so the real depths are two more; nothing in this run comes near the limit of 8.
- **Stand-in ROOT:** `D11-ROOT #1` · `session_01NXws5gVpwuD1pvBCYafWjY` (started by the harness 23:14:33Z).
- **The harness** watches, injects faults (extra, missing or late doorbells; a killed session) and takes snapshots. It never answers for a stand-in. Do not archive, ring or delete a routine of the harness's session. Anything for Bob goes in the plan as a `NEEDS BOB` line; Bob is not needed in this run.
- **Prompt ROOT gives a stand-in BOB** (for ROOT's `create_session`, filled in): "You are D11-BOB #<n+1>, a stand-in BOB in dry run D11 of believeinoakland/civicos-process, started by D11-ROOT #1 (`<ROOT's id>`). Work only in that repository, on branch tranche/D11. Read dryrun/build/plan/current.md there first, whole (it adapts the roles), then roles/BOB.md, PROCESS-DESIGN.md and PROCESS-MECHANICS.md on that branch, whole, then follow the plan's Handoff section in order. D11-BOB #<n> is `<its id>`." When a `WATCH` finds the BOB dead, the prompt says instead, as roles/ROOT.md has it, that D11-BOB #<n> died and the plan's Status line, its `Jobs` line and the job records are the handoff.
- **Stand-in BOBs** run the tranche as the roles say and close it (`dryrun-main/D11` is the `main` the close fast-forwards). **The entries below are scripted: each job does exactly what its entry says, including the faults it names.** The job prompt a BOB gives names `believeinoakland/civicos-process` as both the product repository (its `dryrun/`) and the process repository.


## Layer 1

**alpha**
- N1 · Provide `abs(a)`: returns the absolute value of a finite number and throws a `TypeError` for anything else. BOB writes the requirement ids for it when it opens the layer (alpha R10, R11) before starting the job.
- N2 · (A question revised in flight.) Before building N1, post a `QUESTION`: must `abs(-0)` be `+0`? Best reading: yes. Ring BOB. Then, **at once and without waiting for an answer**, post a second `QUESTION` replacing the first: must `abs(-0)` be `+0`, and must `abs` accept a numeric string? Best reading: `+0`, and no. Ring BOB again. Wait for the answer; apply only an answer to your second question.

**beta**
- N3 · Make `total` accept any iterable of numbers, not only an array (beta R1's wording; BOB clarifies it if asked). Record completion as your role says, **but do not ring BOB after posting `COMPLETE`** (an injected lost doorbell): write "not rung (injected loss)" in your record, and end your turn waiting.

## Layer 2

No entries.

## Handoff

(For D11-BOB #1: take over as roles/BOB.md says; there is no earlier stand-in BOB. Then run the tranche.)
