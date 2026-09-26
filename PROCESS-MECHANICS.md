# The process mechanics

**Status** · APPROVED by Bob 2026-09-25 (second draft, written by BOB #36). REVISED 2026-09-26 by BOB #38 after T1 found the mechanics incomplete (bio TRANSITION.md C14): §4, §5, §6, §10, and the new §13 (communication), §14 (generated artifacts) and §15 (certification); proven by the dry runs D1–D3 (`dryrun/RUNS.md`, `dryrun/CERTIFICATION.md`); D3's nine findings folded in the same day. This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P16) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2), since 2026-09-26. The product repository it is applied to is `believeinoakland/bio`.

## 1. Where things live (P2, P5)

**The process repository** holds the principles, these mechanics, the role instructions (§2), and the four checks (§8). It is product-independent.

**The product's requirements canon** lives at `requirements/` in the product repository: the mission, the product requirements, and the construct designs. It is the one place every module's requirements cite, by section. For BIO, it is assembled from today's `docs/architecture/`.

**The build state** is `build/` in the product repository. Only process roles write there, and a module job writes only its own job record.

| path | holds | written by |
| --- | --- | --- |
| `build/manifest.md` | where the requirements canon, the build state, and each layer's tests live | BOB with Bob |
| `build/layers.md` | the layers, in order, each with its contract | BOB with Bob |
| `build/modules.json` | the modules in their **total order**; per module: `id`, `layer`, `paths` (the files it owns), `tests`, `uses` (earlier module ids) | BOB with Bob |
| `build/requirements/<module>.md` | the module's requirements, public and private parts (§3) | BOB (§7 says when with Bob) |
| `build/plan/current.md`, `next.md`, `archive/T<n>.md` | the running tranche's plan, the next one, and the finished ones | BOB |
| `build/jobs/T<n>/<module>.md` | one record per module job | the job |
| `build/rulings.md` | every ruling, one line each (§9) | BOB |
| `build/metrics/T<n>.csv` | tokens processed per session (§10) | each session, at its end |

A file is owned by exactly one module; `paths` never overlap.

## 2. Roles and sessions (P4, P5, P9, P13)

- **Bob** decides the high level only (P17): policy and doctrine, requirements and changes to what they mean, the architecture's layers and product modules, and UX. He does not edit files or enter commands. Which work goes into a tranche, and when a tranche opens, is BOB's (P17).
- **BOB** works with Bob on the architecture and the requirements. It opens and closes tranches and layers, spawns module jobs, routes flaws, improvements and changes, and resolves conflicts, ambiguities and other complications **itself wherever it reasonably can** (§7).
- **A module job** changes one module, the only role that changes product code (P7).

**Session names** (Bob, 2026-09-26). Every session is named by its lane in capitals followed by ` #n`, where n is that lane's iteration: `BOB #38`, `BOB #39`. A module job's lane is its module: `PDF-READER #1`, `PDF-READER #2` for the next job session of that module (a resumed or later job). The session that starts another names it at creation (`title`), and renames it with `set_session_title` if it was created otherwise.

**Session depth stays minimal.** Bob starts BOB. BOB spawns the module jobs. Module jobs spawn no sessions. BOB's successor is created as a fresh top-level session by a routine, never as BOB's child: BOB writes its handoff, then calls `create_trigger` with `create_new_session_on_fire` true and the successor's first message as `prompt`, fires it once with `fire_trigger`, deletes it, and names the new session `BOB #<n+1>`. (A session made with `create_session` is always its maker's child; a fired routine's is not, measured in D1.)

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

**Each layer.** BOB spawns, **concurrently**, one job for each module of the layer that has entries. Every job stays active until every job of the layer has recorded completion. A change one job communicates to another, through BOB, **re-opens** that other job even if it had completed: it processes the change and records completion again. When all are complete, BOB regenerates the layer's generated artifacts (§14), merges the job branches (§4), collects each job's metrics row (§10), archives the jobs' sessions, and starts the next layer.

**Watching a layer.** A job's message (§13) wakes BOB when it speaks. As a backstop against a job that hangs or dies without speaking, BOB checks every running job's session state every 20 minutes while a layer runs (Bob, 2026-09-26). A job whose session has failed, or has sat idle with nothing recorded since BOB last spoke to it, is resumed with a message, or restarted as a new session on the same branch told to read its job record and continue.

**While a tranche runs (P18).** BOB prepares what comes next, on the tranche branch, in this order of value: the next tranche's plan, ready to open; the requirements of the next tranche's modules and of the layers after it (bulk reading goes to short-lived workers, whose output BOB reviews before anything is committed, and product-module requirements go to Bob); the extraction map for each coming legacy extraction (which functions, tables and ops each target module takes). BOB keeps enough of its own attention for the running jobs: a job's question or completion comes first.

**Close (BOB).** `current.md` moves to `archive/T<n>.md` on the tranche branch, with each entry's outcome and the tranche's measured usage; then `main` fast-forwards to the tranche branch. BOB asks Bob for his weekly meter reading again, and reports the tranche to him in plain words: what was fixed, what was deferred and why, and what it cost.

## 6. The module job (P6, P7, P8, P11)

1. **Start** on `job/T<n>/<module>`. BOB's first message gives the job its own session id and BOB's, for the channel of §13.
2. **Read in full**, never scanned: its own requirements (both parts); the public part of each module it uses (§3); its layer's contract; its code and tests; its entries.
3. **Ambiguity.** Ask BOB (`QUESTION`, §13). Carry on with the rest of the job against your best reading, stated in the question; stop only if the answer decides what you would build next. When BOB answers, merge the tranche branch if BOB changed a requirement, and bring the work in line with the answer.
4. **Change the module** to apply every entry. Deal with every flaw or improvement found in the module in the job whenever possible. Defer one to `next.md` through BOB only when it must.
5. **Test.** Every requirement id is named by at least one test, and the coverage check passes. Run the module's tests, then its layer's tests. If it changed a provided service, BOB first updates the requirements (§7), and the job also runs the tests of the modules that use it.
6. **Check:** architecture, coverage and ownership (§8).
7. **Record completion** in `build/jobs/T<n>/<module>.md`: the entries applied; anything deferred, and why; what it reported about other modules; the tests and checks run; and its metrics row (§10). Commit and push, then tell BOB (`COMPLETE`, §13). **Stay available** until BOB archives the session when the layer closes: a `CHANGE` re-opens the job, which processes it and records completion again. BOB ends the job by archiving its session.

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
3. **Ownership:** a job's diff touches only its module's `paths` and `tests` and its job record.
4. **Format:** the build state's files parse, and every id they reference exists.

A new check is added only by BOB with Bob, and cites the principle it serves.

## 9. Rulings (P15)

One line per ruling in `build/rulings.md`:

`K<n> · <date> · <module or layer> · <the ruling> · <why>`

A ruling that changes requirements is folded into them in the same act. A ruling is changed only by a new line that names its evidence and the one it replaces.

## 10. Metrics (P14)

**A job's usage is read from its session, by BOB.** When BOB archives a job session, `archive_session` returns that session's final usage (cache reads, cache writes, input, output). BOB writes the row into `build/metrics/T<n>.csv`, keyed by the cloud session id, for every session a job used, a dead one included (measured in D3: a job's own transcript misses a dead session and names no session BOB can match). The job still records its test runs, its module's lines and its own row in its job record, as a cross-check. BOB and other sessions record their own rows with `metrics/record.mjs`, which names the cloud session id. Transition sessions record under `T0`.

Row: `session · role · module · cache-read · cache-write · input · output tokens · turns · test runs · module lines`.

Bob's weekly meter is noted at each tranche's open and close when he gives it. **No bounds yet.** After a few tranches, BOB reports the model: tokens per job against module size, entries and test runs; tokens against the movement of the weekly meter; and BOB's own cost against its context size, which tests §2's refresh threshold. Bob then sets bounds.

## 11. Release (P11)

A release runs the full regression, then follows the distribution process (a separate document). A full regression also runs whenever Bob asks.

## 12. Starting BIO on this process

1. **Canon and build state.** BOB, with Bob, assembles `requirements/` from the design corpus, then drafts `manifest.md`, `layers.md`, `modules.json` and the target modules' requirements.
2. **The monoliths.** `store.mjs`, `index.mjs` and `app.html` are each registered as a temporary **legacy module**. An entry to extract a target module from a legacy module is applied by that target module's job, which is the one exception to ownership: it may remove the moved code from the legacy file. Extraction runs bottom-up, a layer at a time. A legacy module is retired when it is empty.
3. **Tests.** Each extracted module's job writes its requirement-named tests at its interface. Source-anchored tests are retired with the legacy code they anchor on.
4. **The old plan.** BOB rewrites each of the 225 open rows that affects the product as an entry against a target module, and drops the rest.
5. **Batch30 is NOT landed** (Bob, 2026-09-25: no tokens for it). It stays reachable in `snapshot/pre-refactor-2026-09-25`, with all the old process's unmerged work. **Its value is judged by the requirements, not in advance:** a target module's extraction job reads the legacy and snapshot code for its module, keeps what meets its requirements, and discards the rest. The old process's own tooling is not carried forward.

## 13. Communication between BOB and a job (P9, P10, P13)

Measured in the D1 dry run (2026-09-26), and the channel the old process measured first (bio `docs/development/ORCHESTRATION.md`, "The channels", BOB #28, 2026-09-22). **What does not work:** a comment on a pull request wakes nobody, because every session posts as the same account; firing a standing routine on demand starts a new, empty session instead of reaching the one it names; session-to-session messaging reaches no cloud session.

**The channel is a one-time routine into the other side's session.** To send a message, a session calls `create_trigger` (claude-code-remote) with `persistent_session_id` = the recipient's session id (never a name: a name is not an address), `run_once_at` = the next whole minute in UTC, `initiation` = `own_followup`, a short `name`, and the message as `prompt`. It arrives as a new turn in that session, within one to two minutes. **BOB's address is state, never a constant** (M1): the Status line of `build/plan/current.md` on the tranche branch names exactly one session id, the current BOB's. A job re-reads it from `origin/tranche/<id>` before every message it sends. A BOB that takes over mid-tranche commits and pushes its own id there before anything else, then tells every running job it has taken over.

- **A message's first line is `From <sender> (<tranche>): <KIND>`.** From a job: `QUESTION`, `REPORT` (a flaw or improvement in another module, a generated artifact it made stale, a flaw in the process's tools), `COMPLETE`, `BLOCKED` (tests will not pass after three honest attempts). From BOB: `ANSWER`, `CHANGE` (a forwarded change, or a file on the tranche branch the job must merge). BOB ends a job by archiving its session when the layer closes; no message is needed.
- **Messages can arrive out of order** (measured in D3). The recipient acts on the newest state a message names (a commit, a record), never on the order messages arrive in.
- **State drives; the message only accelerates.** Whatever a message says is first committed and pushed where the recipient reads it (the job record, the tranche branch), and the recipient checks it there before acting. A lost message then loses nothing: BOB's backstop check (§5) finds the state.
- **A side that waits says what it waits on,** in its record and its last message, and keeps working where it can.
- **Never fire a standing routine to reach a session,** and delete any such routine found bound to a job's or BOB's session.

## 14. Generated artifacts (P7, P12)

A committed file generated by a tool from several modules' source (the fleet's bundled workers and plane, with their manifests) is not code: no job edits it by hand, and a job never writes another module's. Every generated artifact, and the command that regenerates it, is listed in the product's `build/manifest.md`. A job whose change makes another module's generated artifact stale reports it (`REPORT`). When the layer closes, BOB runs each listed command on the tranche branch, verifies the result with the tool's own check, and commits it before merging to `main`.

## 15. Certifying a revision (P3)

A revision of these mechanics is certified by a dry run before product work uses it: a toy product in this repository (`dryrun/`), with a tranche of two small jobs in one layer that between them exercise every path the revision touches, run by real job sessions exactly as a product tranche runs. The paths to prove are listed in `dryrun/CERTIFICATION.md`, each with the evidence that proves it; a revision is certified only when every row there is proven by a run, or names why only a product tranche can prove it and the check that will. Each run's record is kept in `dryrun/RUNS.md`.
