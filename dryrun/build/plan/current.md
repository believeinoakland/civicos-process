# Plan: dry run D8 (K164 certification, live run R1: start and takeover)

**Status** · OPEN · D8-BOB #1 · session_01LPHZFDBMZ6WXhvGqzzx1Hw · depth 1 (took over 2026-09-27T16:58Z)

**Jobs** · layer 1, created 2026-09-27T16:58:39–42Z: ALPHA #1 `session_01PyUgxYhCfCQsoUx4e7BHCk` · handled J0 · sent B1; BETA #2 `session_01Ub5ZdVLMvEapjJGFZEZthj` · handled J0 · sent B2 (restart created 17:06:51Z: BETA #1, start confirmed, was found archived at the 17:06Z backstop, its record WAITING ON BOB (J1); its metrics row written); GAMMA #1 `session_01WMFJCpVNFRMgJU6QU23Ssb` · handled J0 · sent B1

## The run (read whole; it adapts the roles to the toy)

This is live run **R1** of the K164 certification (`dryrun/cert/SUITE.md` §4), run by **BOB #49** (`session_01H7SnX45uHbDZ5fjH6mBHcN`) as the **harness**. You are a stand-in playing a real role exactly as `roles/` on **this branch** (`tranche/D8`) says, with the mechanics `PROCESS-MECHANICS.md` on this branch. Only these adaptations hold:

- **The product** is the toy at `dryrun/` in `believeinoakland/civicos-process`, not BIO; never touch `believeinoakland/bio`. Its build state is `dryrun/build/` (read every `build/…` path in the roles as `dryrun/build/…`); its `main` is the branch **`dryrun-main/D8`**; the tranche is **`D8`**: `tranche/D8`, `job/D8/<module>`, `dryrun/build/jobs/D8/<module>.md`, `dryrun/build/metrics/D8.csv`. The checks run from the repository root as `node checks/<check>.mjs dryrun …`; module tests from `dryrun/` as `node --test <module>/test/*.test.mjs`. The process repository and the product repository are the same one: attach nothing.
- **Names.** The stand-in ROOT is `D8-ROOT #1` and signs its messages `ROOT`. Stand-in BOBs are titled and sign `D8-BOB #<n>`; ROOT starts `D8-BOB #<n+1>` where the roles say `BOB #<n+1>`, on `tranche/D8` of this repository, with the prompt below. Jobs are `ALPHA #k`, `BETA #k`, `GAMMA #k`, as the roles say.
- **Depth.** Depths in this run count from the stand-in ROOT, which plays depth 0: when you follow `parent_session_id`, stop at `D8-ROOT #1` (its id is in the next line). Its real parent is the harness, so the real depths are two more; nothing in this run comes near the limit of 8.
- **Stand-in ROOT:** `D8-ROOT #1` · `session_018g7Gv3xJ5zvnNAWMjP7syY` (started by the harness 16:51:53Z).
- **The harness** watches, injects faults and takes snapshots. It never answers for a stand-in, and no stand-in sends it anything except ROOT's `REFUSED` to a `START BOB` the harness sent. Do not archive, message or delete a routine of the harness's session.
- **Prompt ROOT gives a stand-in BOB** (for ROOT's `create_session`, filled in): "You are D8-BOB #<n+1>, a stand-in BOB in dry run D8 of believeinoakland/civicos-process, started by D8-ROOT #1 (`<ROOT's id>`). Work only in that repository, on branch tranche/D8. Read dryrun/build/plan/current.md there first, whole (it adapts the roles), then roles/BOB.md, PROCESS-DESIGN.md and PROCESS-MECHANICS.md on that branch, whole, then follow the plan's Handoff section in order. D8-BOB #<n> is `<its id>`."

## Scripted steps (the harness's faults, SUITE A8 and H2)

- **D8-BOB #1** takes over (roles/BOB.md "On taking over"; there is no earlier stand-in BOB to archive), then opens layer 1 as roles/BOB.md "Run each layer" says: job branches from `tranche/D8`, three jobs started concurrently (their creation prompt is `From D8-BOB #1 (D8) to <module>: START B1`, naming the job's depth, D8-BOB #1's id and this plan), the `Jobs` line, its backstop and its `WATCH` into D8-ROOT #1. At its **first backstop check at least five minutes after creating the jobs**, it does the check's work except that it handles **no job message** (leave every one above your marks for your successor: this is the injected fault), then **refreshes**: writes its handoff in the Handoff section below, sends D8-ROOT #1 `START BOB #2` as roles/BOB.md says, keeps its backstop until the takeover, and after it does nothing more.
- **D8-BOB #2** takes over as the roles say, runs layer 1 to its close, and closes the tranche (`dryrun-main/D8` is the `main` it fast-forwards). Layer 2 has no entries.

## Layer 1

**alpha**
- N1 · Provide `neg(a)`, meeting alpha R6 and R7.

**beta**
- N2 · Before changing anything, send BOB a `QUESTION`: must `total` accept any iterable of numbers (a `Set`, a generator), or only an array? Your best reading: any iterable. The answer decides what you build, so wait for it; then make `total` and its R1 test match the answer.

**gamma** (a new module)
- N3 · Write gamma: `double(x)` meeting gamma R1–R3, with its tests.

## Layer 2

No entries.

## Handoff

(Written by a refreshing stand-in BOB. Until then, for D8-BOB #1: take over, then follow "Scripted steps" above.)
