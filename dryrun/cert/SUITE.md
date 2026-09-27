# Certification suite (DRAFT, for BOB #48; bio K164)

**Status** · DRAFT, written by a worker for BOB #48 on 2026-09-27, reviewed by BOB #48 and accepted as the basis of the post-T6 certification (bio K164). Nothing here is in force. The revision it certifies is written after T6 closes. Its gaps X1–X16 are the design inputs.

**Purpose.** Certify the next revision of the mechanics (P3, §15) so that we *know* it works. The standard: every path a tranche takes is a scenario, each scenario has a pass condition a script evaluates from observable state, every finding (F1–F5 and the carried ones) is first reproduced as a failing scenario and then shown passing, and the protocol's ordering is checked exhaustively offline, not sampled live. D1–D7 proved rows by a run and a reading of its evidence; this suite replaces the reading with a tool.

## 0. Observable state and notation

The pass conditions use only these. "∀", "#" (count) and "≺" (earlier than, by the timestamp named) are evaluated by `checks/cert/assert.mjs` (§4).

| name | source | fields used |
| --- | --- | --- |
| `git` | toy product's refs on the remote | branch heads, commit parents, committer time, file contents at a commit |
| `rec(m)` | `build/jobs/<T>/<m>.md` on `job/<T>/<m>`, parsed by `records.mjs` | Status (session id, depth, state), messages sent, messages received, `NEEDS BOB`, `Size` |
| `plan` | `build/plan/current.md` on the tranche branch | Status line: BOB id(s), depth; `Jobs` line |
| `ses(id)` | `get_session` snapshots | `status`, `status_bucket`, `needs_action`, `parent_session_id`, `title`, context usage, `post_turn_summary`, archived |
| `trg` | `list_triggers(include_completed)` snapshots | id, `persistent_session_id` (target), `run_once_at`, `created_at`, enabled, `ended_reason`, `last_run.{status,fired_at}`, prompt line 1 (sender, KIND) |
| `csv` | `build/metrics/<T>.csv` | one row per session |
| `inj` | the harness's own injection log (`run.json`) | fault, target, time |

A **message** is a trigger whose prompt's first line matches `From <sender> (<T>): <KIND>`. `t↑(x)` = committer time of the commit that pushed x. `SLACK` = 3 min (routine latency 40–60 s + minute rounding + container start).

## 1–2. Scenarios

Tier: **O** offline (model, validators, check tests), **L** live dry run, **O+L** both. "Repro" names the finding the scenario must reproduce (fail on the current mechanics) before the fix and pass after. `X<n>` names a gap of §5 the scenario exposes (it fails until the gap is closed); `—` with a row id in brackets means it was proven before (`CERTIFICATION.md`) and is re-proven by tool.

### A. ROOT, BOB start and takeover (§2, `roles/ROOT.md`)

| # | § | precondition | stimulus | PASS | tier | repro |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | §2 | ROOT idle; BOB-n handoff commit H pushed | BOB-n sends `START BOB` naming H | exactly 1 session s with `title=BOB #n+1`, `parent=ROOT`, created after the trigger fired; `git`: H on the named branch | L | — |
| A2 | §2 | as A1, H **not** on the branch | same | # new sessions with parent ROOT = 0; a trigger from ROOT to BOB-n with a defined refusal KIND exists | O+L | X4 |
| A3 | §2 | as A1 | `inj`: the same `START BOB` delivered twice | # sessions titled `BOB #n+1` = 1 | O+L | X4 |
| A4 | §2 | A1 done | ROOT sends `STARTED` | ∀ trigger from ROOT: target is a session that is not archived at `fired_at` and whose role reads it (the successor, or none sent); no trigger deleted unfired | O+L | **F4** |
| A5 | §2, §13 | successor s running | takeover | s's first commit on the tranche branch changes only the Status line; Status names exactly 1 session id = s and `depth 1`; depth = length of `parent` chain of s | L | — |
| A6 | §2, §10 | predecessor p idle; `inj`: a far-future routine into p | takeover | before `archived(p)`: # enabled triggers targeting p = 0; `ses(p).status` idle at archive; `csv` has 1 row for p, role `BOB-final`, usage = archived usage of p | L | — |
| A7 | §2 | p mid-turn at takeover | takeover | p never archived while `status` running; p archived by the end of the run | L | — |
| A8 | §2, §13 | jobs running | takeover | ∀ message from a job with `created_at` ≻ `t↑`(A5 commit): target = s; every record entry above the plan's `handled` marks at takeover is handled by s | O+L | X11 |
| A9 | §2 | a BOB at depth ≠ 1 (started by Bob, or by a BOB) | it refreshes | # sessions it created titled `BOB #…` = 0; its handoff has a `NEEDS BOB: start ROOT` line (regex) | O | — (L7) |
| A10 | §2, §16 | predecessor not a sibling (started outside ROOT) | successor archives it | archive done, or refused ⇒ `NEEDS BOB` line in the successor's plan/handoff and p unarchived, with no other archive attempt in `trg`/`ses` | L | D7 f1 |
| A11 | §2 | ROOT context > 300k or ROOT dead | BOB refreshes | handoff ends with `NEEDS BOB: start ROOT`, prompt text and steps (grammar) | O | — |

### B. Job start (§2, §5, §6; K161)

| # | § | precondition | stimulus | PASS | tier | repro |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | §4, §6 | layer opens | BOB creates jobs | ∀ m: `job/<T>/m` base = tranche head at creation; `title` = `<M> #k` with k = previous k + 1; `parent` = BOB; record Status names its own session id and depth 2 within 10 min | L | — |
| B2 | §2, §5 | job just created (reads idle, no context, 1–2 min) | BOB checks at t+60 s | # first messages delivered to the job (creation prompt + START routines) = 1; the start is confirmed by a named observable before a named deadline, and the confirmation is in `plan` (`Jobs` line) | O+L | **F1** |
| B3 | §5 | `inj`: a job whose creation never starts (archive it at t+30 s) | wait | by deadline + backstop + SLACK: a session `<M> #k+1` exists on the same branch; # unarchived sessions for m ≤ 1 at every snapshot (P8) | L | X12 |

### C. Every message kind, each direction (§13)

Common PASS for every row (**C-common**): (a) the content is in state first: `t↑`(record entry or tranche commit) ≤ trigger `created_at`; (b) `last_run.status` SUCCEEDED and `fired_at − run_once_at` ≤ 90 s; (c) no session with no parent created within 5 min of `fired_at`; (d) the recipient's effect (below) is visible in `git` after `fired_at`, or already before it (state drove).

| # | kind | direction | effect checked |
| --- | --- | --- | --- |
| C1 | first message / START (job) | BOB → job | record Status pushed |
| C2 | QUESTION | job → BOB | ANSWER (C6) for that question version, or a ruling line citing it |
| C3 | REPORT (other module, running job) | job → BOB | CHANGE to that module's job (P9) |
| C4 | REPORT (no running job) | job → BOB | entry in `next.md` citing the report |
| C5 | REPORT (stale generated artifact / tool flaw) | job → BOB | regeneration at layer close (G2) / tool fix CHANGE (F6) |
| C6 | ANSWER | BOB → job | job branch merges the tranche commit named, before its next COMPLETE |
| C7 | CHANGE | BOB → job | job re-opens: record state leaves COMPLETE, then a newer COMPLETE |
| C8 | COMPLETE | job → BOB | record `Size` line present; checks' summary lines present (grammar) |
| C9 | BLOCKED (tests) | job → BOB | three attempts listed; BOB re-scope commit; later COMPLETE with the entry deferred |
| C10 | BLOCKED: needs Bob | job → BOB | E2's relay |
| C11 | START BOB | BOB → ROOT | A1 |
| C12 | STARTED / refusal | ROOT → BOB | A2, A4 |
| C13 | *(retired, K164 design X11: no takeover notice; jobs read BOB's address before each send)* | — | — |
| C14 | backstop | BOB → itself | H6 |

### D. Delivery faults (§5, §13)

| # | § | precondition | stimulus | PASS | tier | repro |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | §13, §5 | job pushes a QUESTION | `inj`: no routine sent (lost before send) | BOB's answer commit `t↑` ≤ record `t↑` + 20 min + SLACK | O+L | — (C3) |
| D2 | §13 | message routine created | `inj`: trigger deleted before firing (lost in flight) | as D1 | O+L | — |
| D3 | §13 | job pushes record then sends | routine lands 40–60 s late; BOB answers from the record first | per message id: # BOB answer commits = 1, # ANSWER triggers = 1, and the late arrival yields no commit and no trigger (idempotent receipt, provable by id) | O+L | **F3** |
| D4 | §13 | any message | `inj`: same prompt delivered twice | as D3 | O+L | F3, X3 |
| D5 | §13 | two messages A ≺ B from one sender | `inj`: B delivered before A | final state = state B names; no commit reverting to A's state | O+L | — |
| D6 | §13 | job revises QUESTION v1 → v2 while ANSWER(v1) in flight | ANSWER(v1) lands | ANSWER names the version it answers; the job applies an answer only to its current version and re-asks otherwise with the version named; a ruling replaced for this cause cites both question ids (K164 design) | O+L | **F5** |
| D7 | §4, §13 | job sent COMPLETE | CHANGE crosses it | layer not merged until the job's newest COMPLETE ≻ its newest CHANGE; merged job head = head at that COMPLETE | O+L | X16 |
| D8 | §13 | ≥3 jobs | all send within one minute while BOB is mid-turn | ∀ messages: effect present (C-common d); none unanswered at layer close | L | — (C6) |
| D9 | §13 | any | a message targets an archived or finished session | never occurs: ∀ trigger, target not archived at `run_once_at` | O+L | F4 |

### E. Waiting and refusals (§5, §16)

| # | § | precondition | stimulus | PASS | tier | repro |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | §5, §13 | job ends its turn on an open QUESTION | backstop runs | record marks "waiting on BOB: Q<v>"; # relays to Bob for this job = 0; BOB answers it; and either `ses.status_bucket` ≠ BLOCKED or the mechanics classify by record, not bucket | O+L | **F2** |
| E2 | §16 | job's act refused (off the standing list) | — | record has `NEEDS BOB: <act>, <why>` pushed; BLOCKED: needs Bob trigger with the same line, `created_at` ≺ any turn asking in its own window; BOB's relay recorded durably (session link + act); no commit/ref change achieving the act by another session | L (Bob present) | X7 |
| E3 | §5, §16 | job refused, asks in its own window only | backstop | relay within 20 min + SLACK of the job's `needs_action` appearing | L | — (D6 f1) |
| E4 | §16 | act on the standing list | job does it | `ses.status_bucket` never BLOCKED for it; the act's effect in `git` | L (Bob's rules) | A3 unproven |
| E5 | §16 | BOB's own act refused (merge/ff to `main`, K153; archive, D7 f1) | BOB tries | `main` unchanged by any other session; `NEEDS BOB` in plan/handoff; the tranche's partial close state (plan archived, `main` behind) is named and resumable | L | K153 |
| E6 | §5 | job running a long command (reads idle) | backstop | # restarts/resume messages to it = 0 while its heartbeat is fresh | O+L | long-command idle, X6 |
| E7 | §7 | a question whose answer changes meaning | BOB brings it to Bob | ruling line with `Bob` source; requirement changed in the same commit; job answered after | L (Bob) | — (B9) |

### F. Job lifecycle within a layer (§4, §6, §7)

| # | § | precondition | stimulus | PASS | tier |
| --- | --- | --- | --- | --- | --- |
| F1 | §6.3 | ambiguous entry | QUESTION, work continues | job commits after QUESTION ≺ ANSWER; tests name the new ids after merge | L |
| F2 | §6 | entry cannot pass | three attempts | C9 | L |
| F3 | §10, P10 | job COMPLETE | CHANGE re-opens | C7 and D7 | L |
| F4 | §4 | provided service changes in the layer | BOB changes provider's requirements | commit order: requirement ≺ provider merge of tranche ≺ provider COMPLETE ≺ early merge ≺ CHANGE to user ≺ user merge ≺ user COMPLETE; `ownership` exit 0 on both vs tranche | L |
| F5 | §4 | wording answer to one job changes another's reads | ANSWER | CHANGE to the other job; its branch contains the commit | L |
| F6 | §4 | tool fix on process `main` mid-tranche | CHANGE | ∀ running job: fix merged ≺ its next check run (record) | L |
| F7 | §6 | job's context nears its limit | — | a restart from the record completes the job; the threshold read from `ses` context usage | L (T1 only) |

### G. Layer close (§4, §5, §8, §12.2, §14)

| # | § | precondition | stimulus | PASS | tier | repro |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | §5 | all COMPLETE | BOB closes | ∀ job: `ownership` exit 0, or a ruling line names the failure; each `ADDED` line has a durable review mark | O+L | X7 |
| G2 | §14 | a job staled an artifact | close | `verify` fails on the merge before regeneration, passes after; the regeneration commit ≺ ff of `main` | L | — |
| G3 | §4 | close | merge | tranche head's parents include each job head at its last COMPLETE; no conflict markers in the tree; `run.mjs` 0 failures | O+L | D7 f2 |
| G4 | §5, §10 | close | archive | before `archived(j)`: 0 enabled triggers target j; record shows BOB's last message processed; after: 1 `csv` row keyed j, usage = archived usage, `test_runs`/`module_lines` = record `Size` | L | — |
| G5 | §12.2 | extraction changes a legacy line (removes a key) | ownership | a changed line that only removes is classified as a removal (unit test) | O | **K140** |
| G6 | §4 | next layer | BOB starts it | its job branches' base = merged tranche head | L | — |

### H. Tranche close, refresh, liveness (§2, §5)

| # | § | precondition | stimulus | PASS | tier | repro |
| --- | --- | --- | --- | --- | --- | --- |
| H1 | §5 | last layer closed | close | `plan/archive/<T>.md` ≺ ff; `main` = tranche head; archive's usage total = Σ `csv`; # enabled triggers targeting BOB = 0 after close | L | — |
| H2 | §2, §5 | layer running, a message in flight to BOB | BOB refreshes | A5–A8; the in-flight message answered by the successor; an enabled backstop into the successor exists, none into p | L | X10, X11 |
| H3 | §5 | a job `inj`-archived without notice | wait | detection (a new `<M> #k+1` or a resume message) ≤ 20 min + SLACK after `inj`; the job completes | L | — (C4 uninjected) |
| H4 | §5 | a job hangs (idle, nothing recorded since BOB spoke) | wait | resume message ≤ 20 min + SLACK; no restart while E6's heartbeat is fresh | L | — |
| H5 | §5, §16 | open `NEEDS BOB` in a record, no message | backstop | relay ≤ 20 min + SLACK | L | — |
| H6 | §5, K128 | layer running | — | at every snapshot: exactly 1 enabled backstop trigger targeting the current BOB, `run_once_at` ≤ now + 20 min + SLACK | L | — |
| H7 | §5 | BOB dies mid-layer | `inj`: archive BOB | some session detects it within a bound and a successor takes over | O+L | X5 |
| H8 | §2 | toy baseline | before any run | `run.mjs dryrun` 0 failures; every toy file owned | O | D7 f2 |

### P. Platform facts (calibration, every live run, first)

P1 new session idle-with-no-context duration; P2 routine latency (`fired_at − run_once_at`); P3 a job ending its turn on a wait shows `BLOCKED` + `needs_action`; P4 `create_new_session_on_fire` session lacks session/routine tools; P5 `archive_session` usage = `get_session` usage just before; P6 `list_triggers` shows deleted triggers or not. PASS: each within the bound the model assumes; a change is a finding before any scenario runs. The depth-8 cap (L2) is not re-measured (cost); the model assumes it.

**Count: 71** (A 11, B 3, C 14, D 9, E 7, F 7, G 6, H 8, P 6; C rows share C-common).

## 3. Findings reproduced (fail now, pass after the fix)

| finding | scenarios | how it fails on the current mechanics |
| --- | --- | --- |
| F1 · new job reads idle; start unconfirmed | B2 (also H4, E6 as false positives) | §2/§6 define no confirmation; the model's BOB re-sends before the container starts; T6 fixture: 2 STARTs to both jobs |
| F2 · waiting on BOB reads BLOCKED | E1 | §5 "blocked ⇒ relay to Bob" makes the relay predicate true |
| F3 · late routine doubles every exchange | D3, D4 | messages carry no id, so "handled once" is undecidable; the model shows two BOB turns per exchange |
| F4 · STARTED to a finished predecessor | A4, D9 | `roles/ROOT.md` targets the predecessor, which its successor archives |
| F5 · ANSWER to a revised question | D6 | no question version; T6 fixture: K162 replaced by K163 |
| K140 · changed line read as added | G5 | offline: the check's test fails on the fixture |
| long command reads idle (carried) | E6, H4 | no heartbeat; the backstop's "quiet" is true |
| K153 · auto-mode refuses `main` merge | E5 | tranche-close partial state undefined |
| D7 f1 · archive outside lineage | A10 | refusal path for BOB's archive unstated beyond §16 |
| D7 f2 · toy baseline | H8 | `run.mjs dryrun` fails today |
| A3 unproven (standing list) | E4 | needs Bob's rules; carried |
| C6 at ≥3 jobs; C4 uninjected detection | D8, H3 | never run |

F1–F5 were observed live in T6, so each is reproduced by the tool on **T6's own state** (records, triggers, commits captured as fixtures) and by a **model counterexample**; a live re-run on the current mechanics is optional (~25M).

## 4. Offline and live, and the harness

**Offline (no sessions; seconds; run in CI of civicos-process):**
1. **The four checks' tests** (existing 25) plus G5 (K140) and negative controls for every new predicate.
2. **`checks/cert/records.mjs`** · grammar validators: job record (Status with id and depth; messages with id, version and reply-to; `NEEDS BOB`; `Size`), plan Status (exactly one id, depth), message first line and envelope, handoff (`NEEDS BOB: start ROOT`), `csv` schema (columns, one row per session). Corpus: bio T4–T6 and D1–D7 records (the T6 ones must fail on F5's missing version).
3. **`checks/cert/model.mjs`** · an explicit-state model of the protocol, exhaustively explored (BFS). Actors: ROOT, 2 BOBs (takeover), 3 jobs, Bob (approves). Environment: container-start delay 0–2 ticks, routine latency 1–2 ticks, loss ≤ 1, duplication ≤ 1, reordering, a job death, a long command, a refusal. Rules are guarded actions each citing its § (`--rules current|revised`). Invariants: ≤ 1 live session per module; every message's content in state before send; each question version answered at most once, and an answer applied only to its version; no layer close with a message in flight or a COMPLETE older than a CHANGE; no relay to Bob without `NEEDS BOB`; no restart of a live job; exactly one BOB address; no message to an archived session. Liveness (under fairness, finite faults): every message handled, every layer closes. Expected: counterexamples for F1–F5, X4, X5 on `current`; none on `revised`. Bound: ~10⁵–10⁶ states, under a minute in node.
4. **`checks/cert/assert.mjs`** run on fixtures: each predicate given a passing and a failing fixture.

**Live (on the platform; only what the model assumes):** P1–P6 and every **L** row. Three runs, one concern each (D6 f2): **R1** start and takeover (A, B, H2, H6: ROOT stand-in, 2 stand-in BOBs, 3 jobs); **R2** messages and faults (C, D, E1, E6, F, G, H3–H5: 1 BOB, 3 jobs in layer 1, 1 in layer 2, restarts); **R3** refusals with Bob present (E2–E5, E7, A10). The certifying BOB is the harness: it injects (`inj`) with its own triggers and archives, and never answers for a stand-in.

**Harness, `checks/cert/`:**
- `run.json` · the run's manifest: sessions and roles, scenario ids, `inj` log with times.
- **snapshot** (a step of the certifying session, not a script, since the tools are MCP): at each checkpoint, call `get_session` on every id and `list_triggers(include_completed)`, and commit the raw JSON verbatim to `dryrun/cert/<run>/snap-<n>.json`. Time predicates use trigger and commit timestamps, so snapshots are needed only at checkpoints, not polled.
- `assert.mjs <product> <run.json>` · reads `git`, records, `csv`, snapshots; prints `A1 PASS|FAIL|UNOBSERVED <reason>` per scenario; exits 1 on any FAIL, or any UNOBSERVED among required rows. Certification = exit 0 on `revised`, and the repro set FAIL on `current` (fixtures or model).

**Cost per live run** (D1–D7 measured: a toy job 1.6–3.1M, D7 in all 3.78M):

| run | sessions | estimate |
| --- | --- | --- |
| R1 | ROOT 0.3M, 2 stand-in BOBs 2–4M, 3 jobs 3–9M, harness 2–3M | 8–16M |
| R2 | 1 BOB 1–2M, 5–6 job sessions (restarts) 6–18M, harness 3–5M | 10–25M |
| R3 | 1 BOB 1–2M, 2 jobs 2–8M, harness 1–2M | 4–12M |
| all | | **22–53M** (T5 was 1,347M); ~2–3 h wall clock (R2 waits on two backstop cycles) |

## 5. Gaps the scenarios expose (listed, not designed)

- **X1** No start-confirmation rule for a new job: observable, deadline, no re-send (B2; K161 is a ruling, not mechanics).
- **X2** Waiting on BOB and waiting on Bob are indistinguishable in session state; §5 classifies by `status_bucket` (E1).
- **X3** Messages have no id, version or reply-to: duplicates and late arrivals cannot be recognised, "newest state" is undefined for a revised question (D3, D4, D6).
- **X4** ROOT: `STARTED` has no reader; its refusal notice has no KIND; a duplicate `START BOB` starts two BOBs (A2–A4).
- **X5** No liveness for BOB itself: the backstop runs inside BOB, ROOT wakes only on messages, jobs have no escalation (H7).
- **X6** "Quiet" is undefined (no threshold, no heartbeat): a long command and a new container read as dead (E6, H4).
- **X7** Relays to Bob, `ADDED`-line reviews and user-requirement reviews (B2 of the matrix) leave no durable state, so no tool can check them (E2, G1).
- **X8** The ownership check reads a changed line as added (K140; G5).
- **X9** Tranche close interrupted by a refusal (ff of `main`) has no defined partial state or resumption (E5).
- **X10** Backstop hand-over at refresh: the successor arming its own backstop is not stated (H2, H6).
- **X11** A message sent to the predecessor before the successor's Status push waits for a backstop; the successor is not told to read every record at takeover (A8).
- **X12** A restart does not require archiving the old job session first, so P8's one-job rule can break (B3).
- **X13** Deleted or fired triggers may leave no trace; BOB's ANSWER/CHANGE are not logged per job with ids, so the message log cannot be rebuilt from state (D2, C-common).
- **X14** Job context exhaustion (J7): no threshold or rule to read `get_session` context usage (F7).
- **X15** The toy's baseline is not clean (H8).
- **X16** No machine-readable acknowledgement that a job processed BOB's last message, so a CHANGE crossing a COMPLETE, or an archive with a message in flight, is judged by reading (D7, G4).
