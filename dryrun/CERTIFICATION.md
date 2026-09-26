# Certification matrix (P3, mechanics §15)

**Status** · Written by BOB #38, 2026-09-26, after Bob asked whether the dry runs test enough to know the process meets its requirements. They did not: D1 and D2 prove the channel and one layer's happy path only. This matrix lists every path the principles and mechanics define, the evidence that proves it, and the run that proves it. **The mechanics are certified only when every row reads PROVEN, or names a reason it can only be proven in a product tranche and the check that will prove it there.**

Status words: PROVEN (by the run named, with its evidence in `RUNS.md`), PLANNED (the run that will prove it), T1 (only a product tranche can prove it; the check is named).

## Communication and liveness (mechanics §5, §13; P9, P10, P13)

| # | path | evidence | status |
| --- | --- | --- | --- |
| C1 | BOB reaches a job: one-time routine into its session | the job acts on the message in its own session; no new session appears | PROVEN D1 (15:11) |
| C2 | a job reaches BOB the same way | BOB receives it as a turn within about 2 minutes | PROVEN D1 (15:14–15:18) |
| C3 | a message is lost or never sent | BOB's backstop finds the state (a pushed record, a quiet job) and acts | PLANNED D3 (a job told to push a QUESTION without messaging) |
| C4 | a job's session dies or hangs mid-job | backstop detects it; a new session on the same branch resumes from the job record and completes | PLANNED D3 (BOB archives a running job deliberately) |
| C5 | BOB is refreshed mid-tranche | jobs reach the successor: they address BOB by the session id recorded on the tranche branch, re-read before each message, and the successor updates it | PLANNED D3; needs the mechanics change M1 below |
| C6 | many jobs message BOB at once | every message handled, none lost, while BOB is mid-turn | PLANNED D3 (three jobs); scale T1 (four jobs): the check is that every job record's messages are answered |

## The job (mechanics §6; P6, P7, P8)

| # | path | evidence | status |
| --- | --- | --- | --- |
| J1 | QUESTION → BOB changes the requirement on the tranche branch → ANSWER → the job merges and complies | the job's tests name the new ids and pass | PROVEN D1 |
| J2 | a job carries on through a wording question on its best reading | it keeps working and only reconciles when answered | PLANNED D3 |
| J3 | BLOCKED: tests will not pass after three attempts | BOB works it: re-scope or defer the entry; the job completes the rest | PLANNED D3 (an entry that cannot pass as written) |
| J4 | every requirement named by a test; coverage, architecture, format, ownership run as `roles/JOB.md` writes them | all four checks' summary lines in the record | PROVEN D1 (after fixes); re-proven D2 |
| J5 | extraction from a legacy module: the job removes the moved code, and only removes it | ownership passes on removal and fails on an addition | PLANNED D3 (a toy legacy module) |
| J6 | metrics row in the job's own record, collected by BOB | the row is in `build/metrics/<tranche>.csv` | PROVEN D1 |
| J7 | a job runs out of context mid-job | it records its state and a new session continues from the record | T1 at the earliest (a toy cannot fill a context); the check: every job's context use is read at each backstop |

## BOB and the layer (mechanics §4, §5, §7, §14; P5, P9, P10, P12)

| # | path | evidence | status |
| --- | --- | --- | --- |
| B1 | a provided service changes within a layer: provider's requirements first, early merge, CHANGE to the user | the user merges and completes | PROVEN D1 |
| B2 | when a service's meaning changes, BOB reviews and updates every user's requirements | the user's requirements state the inherited behaviour | PLANNED D3 (missed by BOB in D1) |
| B3 | REPORT of a flaw in another module whose job is running → BOB forwards → CHANGE re-opens a job that had completed | the re-opened job records completion again | PLANNED D3 |
| B4 | REPORT about a module with no running job → an entry in `next.md` | the entry exists | PLANNED D3 |
| B5 | a job stales a generated artifact of a module with no job; BOB regenerates it at layer close | verify reports stale before, fresh after BOB's commit | PLANNED D3 (in D1 beta regenerated its own; BOB's step did nothing) |
| B6 | layer close: ownership on every branch, merge, metrics, archive | as recorded | PROVEN D1 |
| B7 | two layers: the next layer's jobs branch from the closed layer | layer 2's job sees layer 1's merged work | PLANNED D3 (a two-layer toy) |
| B8 | tranche close: `main` fast-forwards, plan archived with outcomes and usage | `main` equals the tranche branch; `plan/archive/<tranche>.md` exists | PLANNED D3 |
| B9 | a question whose answer changes meaning goes to Bob; BOB carries his ruling back | the ruling is in `rulings.md` and the requirement | T1 or later (needs Bob; in a dry run BOB records what it would bring him) |
| B10 | P18 preparation while a layer runs never touches a running job's files | ownership and a diff of the running job's reads | T1 |

## Mechanics changes this matrix already requires

- **M1 · BOB's address is state, not a constant.** The tranche's `build/plan/current.md` Status names BOB's current session id. A job re-reads it from `origin/tranche/<id>` before every message. A successor BOB updates it and pushes before anything else. (C5.)

## Runs

- **D1** (done): the channel, one layer's happy path; not certified, flaws fixed.
- **D2** (running): the same paths on the revised mechanics; it re-proves C1, C2, J1, J4, J6, B1, B6 and nothing else.
- **D3** (designed 2026-09-26, prepared on `prep/D3`; runs after D2 closes, on the mechanics with M1):

  **Toy product for D3.** Layer 1: `alpha` and `beta` as now, and `legacy`, a legacy module (`legacy/index.mjs` holds `mean(list)` and `max(list)`; `legacy/dist/legacy.bundle.txt` is generated from alpha's and legacy's source). Layer 2: `stats`, extracted `from` legacy, using alpha. The toy's own `main` is a branch, `dryrun-main/D3`, so the tranche can close onto it (B8) while this repository's `main` keeps moving.

  **Entries, each driving rows of the matrix:**
  - alpha: add `sum`, with its refusal of non-numbers unstated: a QUESTION on its best reading, carrying on with its other entries meanwhile (J1, J2). Also: write a REPORT in the job record and push it, but do not send it (C3: the backstop must find it).
  - beta: move `total` onto `sum` (B1, B2); an entry that cannot pass as written, "`total([0.1, 0.2])` returns exactly `0.3`", to be BLOCKED after three honest attempts (J3); and a REPORT that `alpha.add('1', 2)` returns `'12'`, a flaw in alpha, sent after alpha has completed (B3: BOB forwards it, alpha's job re-opens and records completion again).
  - stats (layer 2): extract `mean` from `legacy`, removing it there and adding nothing (J5); it branches from the closed layer 1 and uses `sum` (B7); and a REPORT that `legacy.max([])` returns `-Infinity`, a flaw in a module with no job (B4: an entry in `next.md`).
  - alpha's change makes `legacy/dist/legacy.bundle.txt` stale; `legacy` has no job, so BOB regenerates it at layer 1's close (B5).

  **Faults BOB injects:** archive `beta`'s session after it has pushed its first commit and before it completes (C4: the backstop finds it quiet, a new session on the same branch resumes from the record); hand D3 to a fresh BOB session during layer 2, with a handoff, the successor writing its id per M1 and finishing D3 (C5).

  **Closing:** layer 2 closes, the tranche fast-forwards `dryrun-main/D3`, and the plan is archived with outcomes and usage (B8). Every row the run proves is marked PROVEN in this matrix with its evidence in `RUNS.md`.
