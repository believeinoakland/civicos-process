# The process mechanics

**Status** · DRAFT revision for K164 by a worker for BOB #48, not in force (branch `revision/K164-design`; its rules are marked *K164* with the gap or finding each closes, `dryrun/cert/SUITE.md` §3, §5). The text in force: APPROVED by Bob 2026-09-25 (second draft, written by BOB #36). REVISED 2026-09-26 by BOB #42 (§12.2, §8.3: an extraction rewires the legacy code that called the moved code; certified by D4, `dryrun/RUNS.md`) and by BOB #38 after T1 found the mechanics incomplete (bio TRANSITION.md C14): §4, §5, §6, §10, and the new §13 (communication), §14 (generated artifacts) and §15 (certification); proven by the dry runs D1–D3 (`dryrun/RUNS.md`, `dryrun/CERTIFICATION.md`); D3's nine findings folded in the same day. REVISED 2026-09-27 by BOB #44 for the three flaws of bio ruling K111, approved by Bob (§2: a replaced BOB is archived by its successor; §10: every session's usage is read from its archive, and the self-reporting recorder is retired), and §16, acts only Bob can approve, written by Bob; certified by D6 (`dryrun/CERTIFICATION.md` A1–A4; bio K112, K113). REVISED 2026-09-27 by BOB #47 for bio K154, session depth (§2: ROOT, at depth 0, starts every BOB, so BOBs sit at depth 1 and jobs at 2, and every BOB reads its depth; §5: the backstop reads each job's record; §6, §13: a job knows its depth, and a job that cannot send lets its pushed record speak); certified by D7 (`dryrun/CERTIFICATION.md` L1–L7; `RUNS.md` D7). This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P16) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2), since 2026-09-26. The product repository it is applied to is `believeinoakland/bio`.

## 1. Where things live (P2, P5)

**The process repository** holds the principles, these mechanics, the role instructions (§2), and the four checks (§8). It is product-independent.

**The product's requirements canon** lives at `requirements/` in the product repository: the mission, the product requirements, and the construct designs. It is the one place every module's requirements cite, by section. For BIO, it is assembled from today's `docs/architecture/`.

**The build state** is `build/` in the product repository. Only process roles write there, and a module job writes only its own job record.

| path | holds | written by |
| --- | --- | --- |
| `build/manifest.md` | where the requirements canon, the build state, and each layer's tests live | BOB with Bob |
| `build/layers.md` | the layers, in order, each with its contract | BOB with Bob |
| `build/modules.json` | the modules in their **total order**; per module: `id`, `layer`, `paths` (the files it owns), `tests`, `uses` (earlier module ids); for an extracted module, `from` (the legacy module, or list of them, it is extracted from, §12.2) | BOB with Bob |
| `build/requirements/<module>.md` | the module's requirements, public and private parts (§3) | BOB (§7 says when with Bob) |
| `build/plan/current.md`, `next.md`, `archive/T<n>.md` | the running tranche's plan, the next one, and the finished ones | BOB |
| `build/jobs/T<n>/<module>.md` | one record per module job | the job |
| `build/rulings.md` | every ruling, one line each (§9) | BOB |
| `build/metrics/T<n>.csv` | tokens processed per session (§10) | BOB, from each archived session's usage |

A file is owned by exactly one module; `paths` never overlap.

## 2. Roles and sessions (P4, P5, P9, P13)

- **Bob** decides the high level only (P17): policy and doctrine, requirements and changes to what they mean, the architecture's layers and product modules, and UX. He does not edit files or enter commands. Which work goes into a tranche, and when a tranche opens, is BOB's (P17).
- **BOB** works with Bob on the architecture and the requirements. It opens and closes tranches and layers, spawns module jobs, routes flaws, improvements and changes, and resolves conflicts, ambiguities and other complications **itself wherever it reasonably can** (§7).
- **A module job** changes one module, the only role that changes product code (P7).

**Session names** (Bob, 2026-09-26). Every session is named by its lane in capitals followed by ` #n`, where n is that lane's iteration: `BOB #38`, `BOB #39`. A module job's lane is its module: `PDF-READER #1`, `PDF-READER #2` for the next job session of that module (a resumed or later job). The session that starts another names it at creation (`title`), and renames it with `set_session_title` if it was created otherwise.

**Session depth is bounded (P13; bio K154).** A session's **depth** is the number of `parent_session_id` links above it, read with `get_session`; a session Bob starts has none and sits at depth 0. **A session at depth 8 can neither `create_session` nor `create_trigger`** (measured in T5: every BOB had started its successor, so BOB #46 sat at depth 7 in the chain BOB #38 → #40 → … → #46, and its job LEGACY-INDEX #3, at depth 8, could not send its COMPLETE; jobs at depth 7 could). So no session starts a session of its own lane; the depths are fixed:

| depth | session | started by |
| --- | --- | --- |
| 0 | **ROOT** (`roles/ROOT.md`) | Bob |
| 1 | every BOB | ROOT |
| 2 | every module job | the BOB running its tranche |

**ROOT** (Bob, 2026-09-27) is one small session whose only work is to start each BOB. A BOB that refreshes pushes its handoff, then asks ROOT by a one-time routine into ROOT's session (§13), first line `From BOB #<n> (<tranche>): START BOB #<n+1>`, its body naming the product's working branch and the handoff commit. ROOT checks the handoff is on that branch, starts the successor with `create_session` (titled, on that branch, with the standard BOB prompt its role names), and ends its turn **sending nothing back**: the successor's takeover push (§13) is the observable, and a notice would reach a finished session (*K164*, P13; F4). **ROOT starts each `BOB #<n>` once:** a `START BOB` for a title it has already started is ignored, so a re-sent or duplicated one is harmless; one it cannot carry out (the handoff is not on the branch, or `create_session` fails) it answers `From ROOT (<tranche>): REFUSED #<n+1>`, the reason on its second line, to the requester, which is still live, having no successor (*K164*, P13; X4). **ROOT is also woken by a BOB's `WATCH`** (§5): if that BOB's session is archived or failed it starts `BOB #<n+1>` the same way, its prompt saying that BOB #<n> died and the plan and the job records are the handoff; if the session is idle it sends it `From ROOT (<tranche>): WAKE #<n>`, handled as a backstop check, and moves the `WATCH` 60 minutes ahead, so a lost `WAKE` is sent again; if running, nothing (*K164*, P13; X5). Each such turn adds a few thousand tokens to ROOT's context, so ROOT lives long while staying cheap to wake (P13). ROOT's session id is recorded in the product's `build/manifest.md`. **ROOT is replaced only by Bob**, when its context passes 300k tokens or it fails: then the refreshing BOB's handoff ends `NEEDS BOB: start ROOT` with the prompt to paste and plain steps, and the new ROOT starts that BOB's successor. BOB's workers are agents inside its own session, not sessions; module jobs start no sessions. A session started by a routine (`create_new_session_on_fire`) has no parent but carries neither the connectors nor the session and routine tools, so it is never ROOT, a BOB or a job (measured 2026-09-26, and again 2026-09-27 in D7: the probe could not reply). **Every BOB reads its own depth when it takes over** (following `parent_session_id` until a session has none) and writes it into the Status line of the running plan and into its handoff, as `BOB #<n> · <session id> · depth <d>`; a BOB at any other depth says so to Bob, and still has its successor started by ROOT while ROOT is reachable (*K164*; SUITE A9). A BOB that has sent `START BOB` keeps its backstop (§5) until its successor's takeover is in the Status line, and ends each turn meanwhile with the one line `Waiting on ROOT to start BOB #<n+1>. Nothing for Bob to do.`; at a check 20 minutes after sending with no takeover, it sends the same `START BOB` again; after a `REFUSED` or a second silence (the same act: `REFUSED` only brings it sooner) it ends its handoff `NEEDS BOB: start ROOT` (*K164*, P13; X4). Once the successor has taken over, the predecessor does nothing more. **The successor, after pushing its takeover,** reads every running job's record and handles every message there newer than the plan's `handled` mark for that job (§13), whether it was sent to it or its predecessor, and arms its own backstop and `WATCH` (§5) (*K164*, P9, P13; X10, X11). **The successor archives it (P13, P14):** after pushing its takeover, it checks that no enabled routine targets the predecessor (deleting any it finds, and the predecessor's `WATCH` into ROOT), that the predecessor is idle, and then archives it and writes its row (§10). A predecessor still mid-turn is archived at the successor's next check once it is idle. Every BOB that ends has a successor, even across a pause in the work: the next BOB archives every earlier BOB session it finds unarchived.

**BOB's lifetime.** BOB keeps working while its context is useful. It refreshes when its context passes about **2–3 times its working set**, the requirements and state it actually needs. The reason is cost: every turn re-reads the whole context, so a large, stale context costs more per turn than a fresh session pays to re-read its working set (measured in BOB #36, 2026-09-25). The threshold is confirmed or corrected by the metrics (§10). A refreshing BOB writes a lean handoff into the build state first.

## 3. Requirements format (P5, P6, P7, P15)

Each `build/requirements/<module>.md` has a **public** part and a **private** part.

**Public**, which is all a user of the module reads:
1. **Purpose.** One or two sentences.
2. **Provides.** Each service: its interface (name, inputs, outputs, errors) and its behaviour, each statement with a permanent requirement id (`R1`, `R2`, …; a retired id is marked retired, never reused).

**Private**, read only by the module's own job:
3. **Uses.** Each service used, named `<module>.<service>`, from earlier modules only.
4. **Invariants.** Each with its own `R` id.
5. **Satisfies.** The canon sections it serves.
6. **Suggestions.** Implementation notes, which bind nothing.

A job for a module being written, or gaining capabilities, reads the **Purpose** of every earlier module and the **Provides** of those it will use. A job changing an existing module reads the **public** part of each module it uses.

## 4. Branches (P10, P12)

- Opening a tranche creates `tranche/T<n>` from `main`. **`main` does not change while a tranche runs.**
- When a layer starts, each of its jobs branches from the tranche branch: `job/T<n>/<module>`.
- When every job of the layer is complete, BOB merges their branches into the tranche branch. The modules own disjoint files, so these merges do not conflict.
- The next layer's jobs branch from the updated tranche branch.
- **A provided service changed within a layer.** BOB first writes the change into the provider's requirements on the tranche branch (§7) and tells both jobs (§13). The providing job merges the tranche branch into its own and implements the change; when it records completion, BOB merges its branch into the tranche branch at once, and tells the using job, which merges the tranche branch into its own. Each job's ownership check, taken against the tranche branch, still sees only its own changes.
- **Whenever BOB changes a file on the tranche branch that a running job reads** (its requirements, its entries, a used module's public part), BOB tells that job (§13), and the job merges the tranche branch into its own before continuing.
- **A tool fix made on the process repository's `main` during a tranche** reaches running jobs as a `CHANGE` naming the fix; a fix to product state is committed on the tranche branch and announced the same way.
- When the last layer completes, the plan is archived on the tranche branch first, and then `main` is fast-forwarded to it.

A failed tranche is abandoned without touching `main`.

## 5. The tranche cycle (P10, P14)

**Open (BOB).** BOB sets `next.md` as tranche `T<n>`: entries grouped by module, modules by layer, and tells Bob in one line that it has opened and what it covers. BOB asks Bob for his weekly meter reading, the one measure only he can take (P14); the tranche does not wait for it. `next.md` becomes `current.md`, and a new `next.md` is created.

**Each layer.** BOB spawns, **concurrently**, one job for each module of the layer that has entries. Every job stays active until every job of the layer has recorded completion. A change one job communicates to another, through BOB, **re-opens** that other job even if it had completed: it processes the change and records completion again. A job is complete when its record's state is `COMPLETE` with `handled` at the plan's `sent` for it, and the plan's `handled` is at the record's `sent` (§13); a `CHANGE` that crossed a `COMPLETE` leaves the job open (*K164*, P10; X16). When all are complete and no routine to or from their sessions is still enabled, BOB regenerates the layer's generated artifacts (§14), merges each job's branch at its complete commit (§4), records in the plan's `Jobs` line for each job the ownership check's result and the number of `ADDED` lines it reviewed (*K164*, P15; X7), archives the jobs' sessions, and writes each one's metrics row from its archive (§10), and starts the next layer.

**Starting a job (*K164*, P8, P13; F1, X1, X12).** BOB creates the job with `create_session`, whose prompt is its first message, `START B<n>` (§13; `B1` for a new job), and names it in the plan's `Jobs` line. The start is **confirmed** when the job's record, pushed on its branch, names its session id and has handled that `START`. A new session reads idle with no context for its first minutes, so BOB never re-sends a first message: it looks at the first backstop check at least five minutes after creation, and a start unconfirmed 15 minutes after creation, whose session has taken no turn or has failed, is restarted. **A restart** archives the old session first (writing its row, §10), then creates `<MODULE> #<k+1>` on the same branch, told to read its record and continue; if the archive is refused and the old session has not failed, BOB follows §16 and starts no new session (P8: one job per module).

**Watching a layer.** A job's message (§13) wakes BOB when it speaks. As a backstop against a job that hangs or dies without speaking, BOB checks every running job every 20 minutes while a layer runs (Bob, 2026-09-26), by a one-time routine into BOB's own session, first line `BACKSTOP (<tranche>, layer <k>)`, re-armed at each check, since a recurring routine may fire no oftener than hourly (bio K128). **A check reads each job's record on its branch first, its session state second** (*K164*, P9, P13; F2, X2, X6):
- a message in the record above the plan's `handled` mark for that job is handled as if it had arrived (§13);
- **a lost message** (*K164*, P9, P10; a lost `ANSWER` left its job waiting forever): when, at a check at least 20 minutes after BOB last sent to a job, the record's `handled` is still below the plan's `sent`, the start is confirmed and the session has not failed, BOB sends its newest message again, same id, never a `START`; the job reads any earlier one from the tranche branch (§13);
- **a wait on Bob is an open `NEEDS BOB` line in the record, or `needs_action` on a session whose record shows no open wait** (measured in D6: a refused job asked in its own window and sent BOB nothing); BOB relays it (§16). A record that says the job waits on BOB, or on its own command, is never relayed, whatever `status_bucket` reads: a session that ends its turn on any wait reads BLOCKED (measured in T6);
- a job is **quiet** when its session is not running, its record's state is `WORKING` or its `RUNNING until` time has passed (§6), and nothing has been pushed on its branch for 20 minutes. A quiet job is sent `RESUME`; one still quiet at the next check, or whose session has failed, is restarted (above).

**BOB's own liveness (*K164*, P13; X5).** At each check BOB also moves a one-time routine into ROOT's session, first line `From BOB #<n> (<tranche>): WATCH #<n>`, to 60 minutes ahead (`update_trigger`; created when BOB opens the tranche or takes over, so a BOB that dies before its first check is still watched). A live BOB never lets it fire; if it fires, ROOT acts as §2 says. The backstop and the `WATCH` are deleted when the tranche closes.

**While a tranche runs (P18).** BOB prepares what comes next, on the tranche branch, in this order of value: the next tranche's plan, ready to open; the requirements of the next tranche's modules and of the layers after it (bulk reading goes to short-lived workers, whose output BOB reviews before anything is committed, and product-module requirements go to Bob); the extraction map for each coming legacy extraction (which functions, tables and ops each target module takes). BOB keeps enough of its own attention for the running jobs: a job's question or completion comes first.

**Close (BOB),** in two steps, each pushed, so an interrupted close is a named state that any BOB resumes (*K164*, P12; X9): (1) `current.md` moves to `archive/T<n>.md` on the tranche branch, with each entry's outcome and the tranche's measured usage, its Status line `CLOSING`; (2) `main` fast-forwards to that commit, and the tranche is closed exactly when `main` is at it. A refused step 2 is §16's, its `NEEDS BOB` line in BOB's handoff or plan; no tranche opens while an archived plan reads `CLOSING` and `main` is behind it. BOB asks Bob for his weekly meter reading again, and reports the tranche to him in plain words: what was fixed, what was deferred and why, and what it cost.

## 6. The module job (P6, P7, P8, P11)

1. **Start** on `job/T<n>/<module>`. BOB's first message gives the job its own session id and BOB's, and the job's depth (BOB's plus one, §2), for the channel of §13. **The job's first act is to push its record's Status line**, which confirms its start (§5; a restarted job first processes every BOB message above its record's `handled` mark, §13), and it pushes that line again whenever it changes (*K164*, P9, P13; F1, X1, X6, X16):
   `**Status** · <session id> · depth <d> · <state> · sent J<n> · handled B<n>`, the state one of `WORKING`, `RUNNING until <UTC time> (<command>)` (set before waiting on a command expected to take over ten minutes), `WAITING ON BOB (J<n>)`, `NEEDS BOB`, `COMPLETE`.
   **A job that ends its turn on a wait** pushes that state first and ends with the one line `Waiting on BOB (J<n>). Nothing for Bob to do.` (or `on my command`): its session then reads BLOCKED, and this line is what Bob's app shows (*K164*, P17; F2).
   **A job whose context passes half its window** (`get_session`) finishes its current step, pushes its record with the next step named, sends `BLOCKED J<n>: context`, and ends its turn; BOB restarts it (§5). The threshold is confirmed or corrected by the metrics (§10) (*K164*, P13; X14).
2. **Read in full**, never scanned: its own requirements (both parts); the public part of each module it uses (§3); its layer's contract; its code and tests; its entries.
3. **Ambiguity.** Ask BOB (`QUESTION`, §13). Carry on with the rest of the job against your best reading, stated in the question; stop only if the answer decides what you would build next. When BOB answers, merge the tranche branch if BOB changed a requirement, and bring the work in line with the answer. A question revised before its answer arrives is a new `QUESTION` that `replaces` the old id (§13); an `ANSWER` is applied only if it answers the question's newest version, and one that answers a replaced version is marked handled, not applied (*K164*, P9; F5).
4. **Change the module** to apply every entry. Deal with every flaw or improvement found in the module in the job whenever possible. Defer one to `next.md` through BOB only when it must.
5. **Test.** Every requirement id is named by at least one test, and the coverage check passes. Run the module's tests, then its layer's tests. If it changed a provided service, BOB first updates the requirements (§7), and the job also runs the tests of the modules that use it.
6. **Check:** architecture, coverage and ownership (§8).
7. **Record completion** (state `COMPLETE`, `handled` naming BOB's newest message) in `build/jobs/T<n>/<module>.md`: the entries applied; anything deferred, and why; what it reported about other modules; the tests and checks run; and its size line (§10). Commit and push, then tell BOB (`COMPLETE`, §13). **Stay available** until BOB archives the session when the layer closes: a `CHANGE` re-opens the job, which processes it and records completion again. BOB ends the job by archiving its session.

**When tests will not pass** after three honest attempts, the job keeps its session and works the problem with BOB. BOB can clarify a requirement, route a cause found in another module, or re-scope the entry. Only if the two cannot resolve it is that entry deferred, and the job completes the rest.

A job writes only its module's `paths` and `tests`, plus its own job record. It never writes a generated artifact of another module (§14); it reports one it has made stale.

## 7. What BOB resolves, and what goes to Bob (P4, P5, P9)

**BOB resolves itself**, recording a ruling where it decides anything:
- conflicts between jobs;
- routing flaws and improvements (forward to a running job of that module, or add to `next.md`);
- ambiguities it can settle by clarifying the **wording** of a requirement without changing its meaning;
- sequencing within the process's rules;
- every lower-level technical or detailed decision (P17): dependency (`uses`) edges, order within a layer, which module owns a file, helper and legacy modules, the process's tooling and checks, tests, branches and CI.

**BOB brings to Bob** only:
- a change to what a requirement **means**, including a change to a provided service;
- the architecture at its high level (adding, removing or reordering layers, or adding or removing a module that carries product capability);
- doctrine and priority;
- anything the principles reserve to him.

Each question comes with a recommendation. When Bob rules a service change, BOB updates the provider's requirements and adds an entry for every module that uses it, in this tranche if that module's layer has not yet completed, otherwise in `next.md`.

## 8. The four checks (P4, P7, P16)

Small tools in the process repository, and the only process tooling:
1. **Architecture:** every product file is in exactly one module's `paths`, and every import is to the module itself or to a module earlier in the order that is declared in `uses`.
2. **Coverage:** every live requirement id is named by at least one of the module's tests.
3. **Ownership:** a job's diff touches only its module's `paths` and `tests` and its job record; an extraction job's additions to its legacy module are only imports from its own paths and lines that use them, with a net removal, each listed for BOB (§12.2); a line changed only by removing text from it counts as removed, not added (*K164*, P7; K140, X8).
4. **Format:** the build state's files parse, and every id they reference exists.

A new check is added only by BOB with Bob, and cites the principle it serves.

## 9. Rulings (P15)

One line per ruling in `build/rulings.md`:

`K<n> · <date> · <module or layer> · <the ruling> · <why>`

A ruling that changes requirements is folded into them in the same act. A ruling is changed only by a new line that names its evidence and the one it replaces.

## 10. Metrics (P14)

**Every session's usage is read from its archive, by BOB (P14).** When BOB archives a session, a job's or a predecessor BOB's (§2), `archive_session` returns that session's final usage (cache reads, cache writes, input, output), and BOB writes its row into `build/metrics/T<n>.csv` at once, keyed by the cloud session id, for every session, a dead one included. BOB's own row is written by its successor, under the tranche it worked in (T0 for the transition). No session reports its own usage: a session's transcript misses what its container restarts and its workers spent (measured: the self-reporting recorder read 51.0M of BOB #43's 245.4M cache reads and 92.9M of BOB #42's 440.1M tokens), so the recorder is retired. Each session of a job records its size in the record, one line `Size (<session id>): test runs <n>, module lines <n>` (*K164*: a restarted job has one per session), and BOB copies it into that session's row. `turns` is left empty: the archive does not report it.

Row: `session · role · module · cache-read · cache-write · input · output tokens · turns · test runs · module lines`. Rows the retired recorder wrote stay as measurements; where a session also has a row from its archive (`BOB-final`), that row is its usage.

Bob's weekly meter is noted at each tranche's open and close when he gives it. **No bounds yet.** After a few tranches, BOB reports the model: tokens per job against module size, entries and test runs; tokens against the movement of the weekly meter; and BOB's own cost against its context size, which tests §2's refresh threshold. Bob then sets bounds.

## 11. Release (P11)

A release runs the full regression, then follows the distribution process (a separate document). A full regression also runs whenever Bob asks.

## 12. Starting BIO on this process

1. **Canon and build state.** BOB, with Bob, assembles `requirements/` from the design corpus, then drafts `manifest.md`, `layers.md`, `modules.json` and the target modules' requirements.
2. **The monoliths.** `store.mjs`, `index.mjs` and `app.html` are each registered as a temporary **legacy module**, placed in the order after the modules extracted from it, so that it may use them (P4). An entry to extract a target module from a legacy module is applied by that target module's job, which is the one exception to ownership: in the legacy module's files it may remove the moved code, and **rewire the legacy code that called it** to the target module, adding only an import (or re-export) from its own paths and lines that use a name so imported (a delegating method, a call now made to the moved function); the legacy module's net change (over all of them, when there are several) is a removal. **A target module's code may sit in several legacy modules** (the store and the check catalogue): its `from` then names each, and the rule holds in each one. A legacy module earlier in the order than the target (the check catalogue is the first module) cannot import it, so there the job only removes, and the code that needs the moved part reaches it from a module later than the target (certified by D5, 2026-09-26: `dryrun/CERTIFICATION.md` J9). The ownership check enforces this and lists every line added to the legacy module, and BOB reads that list at the layer close before merging (certified by D4, 2026-09-26: `dryrun/CERTIFICATION.md` J8). Extraction runs bottom-up, a layer at a time. A legacy module is retired when it is empty.
3. **Tests.** Each extracted module's job writes its requirement-named tests at its interface. Source-anchored tests are retired with the legacy code they anchor on.
4. **The old plan.** BOB rewrites each of the 225 open rows that affects the product as an entry against a target module, and drops the rest.
5. **Batch30 is NOT landed** (Bob, 2026-09-25: no tokens for it). It stays reachable in `snapshot/pre-refactor-2026-09-25`, with all the old process's unmerged work. **Its value is judged by the requirements, not in advance:** a target module's extraction job reads the legacy and snapshot code for its module, keeps what meets its requirements, and discards the rest. The old process's own tooling is not carried forward.

## 13. Communication between BOB and a job (P9, P10, P13)

Measured in the D1 dry run (2026-09-26), and the channel the old process measured first (bio `docs/development/ORCHESTRATION.md`, "The channels", BOB #28, 2026-09-22). **What does not work:** a comment on a pull request wakes nobody, because every session posts as the same account; firing a standing routine on demand starts a new, empty session instead of reaching the one it names; session-to-session messaging reaches no cloud session.

**The channel is a one-time routine into the other side's session.** To send a message, a session calls `create_trigger` (claude-code-remote) with `persistent_session_id` = the recipient's session id (never a name: a name is not an address), `run_once_at` = the next whole minute in UTC, `initiation` = `own_followup`, a short `name`, and the message as `prompt`. It arrives as a new turn in that session, within one to two minutes. **BOB's address is state, never a constant** (M1): the Status line of `build/plan/current.md` on the tranche branch names exactly one session id, the current BOB's. A job re-reads it from `origin/tranche/<id>` before every message it sends. A BOB that takes over mid-tranche commits and pushes its own id there before anything else, then reads every running job's record (§2); it sends the jobs no notice, since each reads the address before it sends (*K164*, P13; X11).

- **A message's first line is its envelope and nothing else** (*K164*, P9, P15; F3, F5, X3, X13): `From <sender> (<tranche>)[ to <module>]: <KIND> <id>[ re <id>][ replaces <id>]`; the body follows on later lines. The sender is the session's name (`LEGACY-CHECKS #2`, `BOB #48`, `ROOT`); BOB names the job's module after `to`. One KIND per message. Ids count from 1 per job in each direction; a successor BOB or a restarted job continues the count from the plan or the record.
  - From a job, `J<n>`: `QUESTION` (with `replaces J<m>` when it revises one), `REPORT` (a flaw or improvement in another module, a generated artifact it made stale, a flaw in the process's tools), `COMPLETE`, `BLOCKED` with its cause after a colon (`: tests`, three honest attempts failed; `: needs Bob`, §16; `: context`, §6).
  - From BOB to a job, `B<n>`: `START` (the creation prompt; `B1` unless a restart), `ANSWER` (always `re J<n>`, the question version it answers; one that changed a file the job reads says so in its body, and is not also a `CHANGE`), `CHANGE` (a forwarded change, or a file on the tranche branch the job must merge), `RESUME` (§5). BOB ends a job by archiving its session; no message is needed.
  - Between a BOB and ROOT, `#<n>`, the BOB concerned: `START BOB #<n+1>` and `WATCH #<n>` from BOB; `REFUSED #<n+1>` (the reason on its second line) and `WAKE #<n>` from ROOT (§2, §5).
- **Receipt is idempotent.** Each side keeps the newest id it has handled from the other: the job in its record's Status (`handled B<n>`), BOB in the plan's `Jobs` line (`handled J<n> · sent B<n>` per job). The recipient acts by reading the sender's state up to its newest pushed id, never the message text alone, and moves its mark; a message at or below the mark is ignored, with no commit and no reply (a routine lands 40–60 s after its minute, measured in T6, so the record often answers first). The order of arrival then does not matter.
- **State drives; the message only accelerates.** A job writes each message in its record under the heading `## <envelope>`, and pushes, before it sends. BOB commits each `ANSWER`, `CHANGE` or `RESUME` to the tranche branch with its envelope as the commit subject, and the plan's `sent` mark in the same commit, and pushes, before it sends. The message log is therefore rebuilt from the records and the tranche branch alone; a lost, late or deleted routine loses nothing: BOB's backstop (§5) reads a job's message from its record, and sends its own again while the record has not handled it.
- **A side that waits says what it waits on,** in its record's state (§6) or BOB's handoff, and keeps working where it can.
- **A session that cannot send** (its `create_trigger` fails for its depth, a depth §2 should never produce) writes the message in its record, pushes it, and says so there; the pushed record is then its message, and BOB's backstop (§5) reads it. It never works around the failure through another session.
- **Never fire a standing routine to reach a session,** and delete any such routine found bound to a job's or BOB's session.

## 14. Generated artifacts (P7, P12)

A committed file generated by a tool from several modules' source (the fleet's bundled workers and plane, with their manifests) is not code: no job edits it by hand, and a job never writes another module's. Every generated artifact, and the command that regenerates it, is listed in the product's `build/manifest.md`. A job whose change makes another module's generated artifact stale reports it (`REPORT`). When the layer closes, BOB runs each listed command on the tranche branch, verifies the result with the tool's own check, and commits it before merging to `main`.

## 15. Certifying a revision (P3)

A revision of these mechanics is certified by a dry run before product work uses it: a toy product in this repository (`dryrun/`), with a tranche of two small jobs in one layer that between them exercise every path the revision touches, run by real job sessions exactly as a product tranche runs. The paths to prove are listed in `dryrun/CERTIFICATION.md`, each with the evidence that proves it (from K164, in `dryrun/cert/SUITE.md`, each with a pass condition a tool evaluates); a revision is certified only when every row there is proven by a run, or names why only a product tranche can prove it and the check that will. Each run's record is kept in `dryrun/RUNS.md`.


## 16. Acts only Bob can approve (P17)

A session's permission check can refuse an act that only Bob can clear, by approving it in the session that was refused; an approval typed in another session does not reach it (measured in T3: LEGACY-TESTS #1 waited two hours on a retired push hook). Bob's approval names the act itself; an approval of a page or a list did not clear a refusal (measured 2026-09-27, BOB #44).

**The standing list.** Acts Bob has approved once, as policy, are permission rules in the `.claude/settings.json` of the product repository and of this repository, written by Bob, each recorded as a ruling in the product's `build/rulings.md`. An act joins the list only after a session has been refused it, and only by Bob. The list never holds an act that loosens a standing safety rule (force-push, rewriting `main`, deleting the restore point).

**Anything else.** A refused session never works around the refusal, by another tool, a script, a worker or a later turn. It records `NEEDS BOB: <the one act>, <why>` in its record (a job) or its handoff (BOB), pushes that if the push is not itself the act, sends BOB `BLOCKED J<n>: needs Bob` with the same line, and carries on with whatever does not depend on the act. BOB tells Bob at once, in one line: the session's name and link, and the approval to type there, naming the act; and records the relay (session, act, time) in the plan's `Jobs` line, so no relay is made twice or lost (*K164*, P15; X7). BOB never approves for Bob. When Bob has approved, BOB says whether the act should join the standing list. At every backstop check (§5), BOB reads each running job's record for an open `NEEDS BOB` line.
