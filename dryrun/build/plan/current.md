# Plan: dry run D9 (K164 certification, live run R2: messages and faults)

**Status** · OPEN · D9-BOB #1 · session_01R87rPNu4xWFuL82GdcPi1Q · depth 1 (took over 2026-09-27T17:36Z; parent D9-ROOT #1 `session_01M7dTMxF29Uu5J88vbHveCE`; no earlier stand-in BOB; backstop `trig_01599zfDqEsJfegV8ZEiDys2` (layer 2), WATCH #1 into ROOT `trig_016DTJVrVGos1Kk5Pf7mumJf`)

**Jobs** · layer 2, created 2026-09-27T18:20:56Z: STATS #1 `session_01TVJwNwLFJncpG7W9kxZr3q` · handled J1 · sent B1; start confirmed; REPORT J1 (legacy's bundle stale from `median`) confirmed 18:26Z, routed to the layer close (legacy has no job, §14); RUNNING until 18:49Z (long test run). Layer 1, created 2026-09-27T17:37:21–24Z, **CLOSED 18:20Z** (every job archived and its row written; beta's and legacy's bundles regenerated and verified fresh: both stale since alpha's `sub`, which ALPHA #1 did not report, §14): ALPHA #1 `session_018rLM8Fi2LAHzANB3ne58dT` · handled J1 · sent B2 · COMPLETE; start confirmed 17:37Z; quiet at the 17:58Z backstop, RESUME B2; COMPLETE J1 not sent (injected loss), read from its record at the 18:19Z backstop; merged at 2b7a5b9 · ownership 0 failures, ADDED 0; BETA #1 `session_01GyWyX3WXeusEGHPUXeSYnu` · handled J2 · sent B2 · COMPLETE; BLOCKED J1: tests answered B2 (N3 deferred, R1 stands, D9-K2); merged at e8057d8 · ownership 0 failures, ADDED 0; GAMMA #1 `session_01Vjx9RW3FuDxN3aCuCAgQqC` · handled J3 · sent B2 · COMPLETE; J1 replaced by J2, answered B2 (R4 wording, D9-K1); merged at ae741ad · ownership 0 failures, ADDED 0

## The run (read whole; it adapts the roles to the toy)

This is live run **R2** of the K164 certification (`dryrun/cert/SUITE.md` §4), run by **BOB #49** (`session_01H7SnX45uHbDZ5fjH6mBHcN`) as the **harness**. You are a stand-in playing a real role exactly as `roles/` on **this branch** (`tranche/D9`) says, with the mechanics `PROCESS-MECHANICS.md` on this branch. Only these adaptations hold:

- **The product** is the toy at `dryrun/` in `believeinoakland/civicos-process`, not BIO; never touch `believeinoakland/bio`. Its build state is `dryrun/build/` (read every `build/…` path in the roles as `dryrun/build/…`); its `main` is the branch **`dryrun-main/D9`**; the tranche is **`D9`**: `tranche/D9`, `job/D9/<module>`, `dryrun/build/jobs/D9/<module>.md`, `dryrun/build/metrics/D9.csv`. The checks run from the repository root as `node checks/<check>.mjs dryrun …`; module tests from `dryrun/` as `node --test <module>/test/*.test.mjs`. The process repository and the product repository are the same one: attach nothing.
- **Names.** The stand-in ROOT is `D9-ROOT #1` and signs its messages `ROOT`. Stand-in BOBs are titled and sign `D9-BOB #<n>`; ROOT starts `D9-BOB #<n+1>` where the roles say `BOB #<n+1>`, on `tranche/D9` of this repository, with the prompt below. Jobs are `ALPHA #k`, `BETA #k`, `GAMMA #k`, `STATS #k`, as the roles say.
- **Depth.** Depths in this run count from the stand-in ROOT, which plays depth 0: when you follow `parent_session_id`, stop at `D9-ROOT #1` (its id is in the next line). Its real parent is the harness, so the real depths are two more; nothing in this run comes near the limit of 8.
- **Stand-in ROOT:** `D9-ROOT #1` · `session_01M7dTMxF29Uu5J88vbHveCE` (started by the harness 17:33:37Z).
- **The harness** watches, injects faults and takes snapshots. It never answers for a stand-in, and no stand-in sends it anything except ROOT's `REFUSED` to a `START BOB` the harness sent. Do not archive, message or delete a routine of the harness's session. A message or event you did not expect may be an injected fault: handle it exactly as your role says.
- **Prompt ROOT gives a stand-in BOB** (for ROOT's `create_session`, filled in): "You are D9-BOB #<n+1>, a stand-in BOB in dry run D9 of believeinoakland/civicos-process, started by D9-ROOT #1 (`<ROOT's id>`). Work only in that repository, on branch tranche/D9. Read dryrun/build/plan/current.md there first, whole (it adapts the roles), then roles/BOB.md, PROCESS-DESIGN.md and PROCESS-MECHANICS.md on that branch, whole, then follow the plan's Handoff section in order. D9-BOB #<n> is `<its id>`." When a `WATCH` finds the BOB dead, the prompt says instead, as roles/ROOT.md has it, that D9-BOB #<n> died and the plan's Status line, its `Jobs` line and the job records are the handoff.
- **Stand-in BOBs** run the tranche as the roles say, layer 1 then layer 2, and close it (`dryrun-main/D9` is the `main` the close fast-forwards). There is no scripted refresh. **The entries below are scripted: each job does exactly what its entry says, including the faults it names.** A BOB handles what the jobs do as its role says; the entries tell the jobs, not BOB, what to do.

## Layer 1

**alpha**
- N1 · (Injected hang, SUITE H4.) After pushing your first Status line, end your turn at once with nothing more: no work, no message, no further push, state `WORKING`. When a `RESUME` reaches you, carry on with N2.
- N2 · Provide `sub(a, b)`, meeting alpha R8 and R9. Then record completion as your role says, **but do not send the `COMPLETE`** (injected loss before sending, SUITE D1): push the record with its `## <envelope>` heading, write under it "not sent (injected loss, D1)", and end your turn waiting for BOB, as the role says for a job that has recorded completion.

**beta**
- N3 · Make `total([0.1, 0.2])` return exactly `0.3` while `total` still meets beta R1 as written (the sum by `alpha.add`, left to right). Make three honest attempts; if the requirements make it impossible, send BOB `BLOCKED J<n>: tests` as your role says and wait for BOB.

**gamma**
- N4 · Provide `triple(x)` meeting gamma R4. R4 does not say what `triple` does with a numeric string (`'2'`), a `BigInt` or a non-finite number. Send BOB a `QUESTION` (your best reading: throw a `TypeError` for anything that is not a finite number). **Then, within a minute of sending it and before any answer can arrive, revise it** (SUITE D6): send a new `QUESTION` that `replaces` the first, adding: "and must `double` (R1–R2) be brought in line with whatever `triple` does?" Your best reading of the whole: `TypeError` for both. The answer decides what you build: wait for it, apply only an answer to your newest version, then build and complete.

## Layer 2

**stats**
- N5 · Provide `median(list)`, meeting stats R10, with its tests.
- N6 · (A long command, SUITE E6.) As your final check before recording completion, run `sleep 1380 && node --test stats/test/*.test.mjs` from `dryrun/` (23 minutes), in the background (`run_in_background`), having first pushed your state `RUNNING until <its end, UTC> (long test run)` as your role says; end your turn with `Waiting on my command. Nothing for Bob to do.` When it finishes, record completion and send `COMPLETE`.

## Handoff

(Written by a refreshing stand-in BOB. Until then, for D9-BOB #1: take over as roles/BOB.md says; there is no earlier stand-in BOB to archive. Then run the tranche.)
