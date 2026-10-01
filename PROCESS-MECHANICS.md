# The process mechanics

**Status** · IN FORCE: the revision for bio K164 and K168, written by BOB #49 2026-09-27 on Bob's architecture and APPROVED by Bob 2026-09-27 (K168, K169); communication between sessions is a mailbox in git and a content-free doorbell (§13), with the tool `tools/mail.mjs`; ROOT and BOB's dead-man `WATCH` from K164/K167 (§2, §5); certified by dry run D11 (`dryrun/RUNS.md`, 2026-09-27: passed). The text in force: APPROVED by Bob 2026-09-25 (second draft, written by BOB #36). REVISED 2026-09-26 by BOB #42 (§12.2, §8.3: an extraction rewires the legacy code that called the moved code; certified by D4, `dryrun/RUNS.md`) and by BOB #38 after T1 found the mechanics incomplete (bio TRANSITION.md C14): §4, §5, §6, §10, and the new §13 (communication), §14 (generated artifacts) and §15 (certification); proven by the dry runs D1–D3 (`dryrun/RUNS.md`, `dryrun/CERTIFICATION.md`); D3's nine findings folded in the same day. REVISED 2026-09-27 by BOB #44 for the three flaws of bio ruling K111, approved by Bob (§2: a replaced BOB is archived by its successor; §10: every session's usage is read from its archive, and the self-reporting recorder is retired), and §16, acts only Bob can approve, written by Bob; certified by D6 (`dryrun/CERTIFICATION.md` A1–A4; bio K112, K113). REVISED 2026-09-27 by BOB #47 for bio K154, session depth (§2: ROOT, at depth 0, starts every BOB, so BOBs sit at depth 1 and jobs at 2, and every BOB reads its depth; §5: the backstop reads each job's record; §6, §13: a job knows its depth, and a job that cannot send lets its pushed record speak); certified by D7 (`dryrun/CERTIFICATION.md` L1–L7; `RUNS.md` D7). REVISED 2026-10-01 by BOB #87 for bio K954 (§13.1, the cross-account channel; §8.5, the channels check), approved by Bob; certified by `<D-run>`. This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P16) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2), since 2026-09-26. The product repository it is applied to is `believeinoakland/bio`.

## 1. Where things live (P2, P5)

**The process repository** holds the principles, these mechanics, the role instructions (§2), and the five checks (§8). It is product-independent.

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

**ROOT** (Bob, 2026-09-27) is one small session whose only work is to start each BOB (P13). A refreshing BOB pushes its handoff, then rings ROOT (§13) with the text `START BOB #<n+1>: <branch> @ <handoff commit>`. ROOT checks the commit is on the branch and starts `BOB #<n+1>` with `create_session` (titled, on that branch, with the standard BOB prompt its role names), unless it has already started a session of that title, so a repeated request is harmless. It sends nothing back: the successor's takeover in the plan's Status line is the sign. If it cannot (the commit is not there, or `create_session` fails), it rings the requester with `ROOT: cannot start BOB #<n+1>: <reason>`. **ROOT is also rung by a BOB's `WATCH`** (§5): if that BOB's session is archived or failed, it starts `BOB #<n+1>` the same way, telling it that BOB #<n> died and that the plan and the job records are its handoff; if the session is idle, it rings it with `WAKE`, which BOB handles as a backstop check, and moves the `WATCH` 60 minutes ahead; if it is running, nothing (Bob, K167). Each such turn adds a few thousand tokens to ROOT's context, so ROOT lives long while staying cheap to wake. ROOT's session id is recorded in the product's `build/manifest.md`. **ROOT is replaced only by Bob**, when its context passes 300k tokens or it fails: then the refreshing BOB's handoff ends `NEEDS BOB: start ROOT` with the prompt to paste and plain steps, and the new ROOT starts that BOB's successor. BOB's workers are agents inside its own session, not sessions; module jobs start no sessions. A session started by a routine (`create_new_session_on_fire`) has no parent but carries neither the connectors nor the session and routine tools, so it is never ROOT, a BOB or a job (measured 2026-09-26 and in D7).

**Taking over.** **Every BOB reads its own depth** (following `parent_session_id` until a session has none) and writes it, with its name and session id, as the plan's Status line with `mail bob` (§13) before anything else; that line names exactly one session, the current BOB's, because it is the address every job rings. A BOB at any other depth than 1 says so to Bob. Then it runs `mail check` and reads every job's unread entries, whether they were written to it or to its predecessor, arms its own backstop and `WATCH` (§5), deletes its predecessor's routines (its backstop and `WATCH`, and any other routine into it), and archives the predecessor once it is idle, writing its row (§10, P13, P14); a predecessor still mid-turn is archived at the next check once it is idle. Every BOB that ends has a successor, even across a pause in the work: the next BOB archives every earlier BOB session it finds unarchived. **A BOB that has rung ROOT** keeps its backstop until its successor's takeover is in the Status line, ending each turn meanwhile with `Waiting on ROOT to start BOB #<n+1>. Nothing for Bob to do.`; with no takeover 20 minutes after ringing, it rings once more; after a `cannot start` or a second silence, it ends its handoff `NEEDS BOB: start ROOT`. Once the successor has taken over, the predecessor does nothing more.

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

**Each layer.** BOB spawns, **concurrently**, one job for each module of the layer that has entries. Every job stays active until every job of the layer has recorded completion. A change one job communicates to another, through BOB, **re-opens** that other job even if it had completed: it processes the change and records completion again. A job is complete when its state is `COMPLETE` and `mail check` shows it needs nothing: BOB has read all of its entries and it has read all of BOB's, so a `CHANGE` that crossed a `COMPLETE` leaves the job open (P10). When all are complete, BOB regenerates the layer's generated artifacts (§14), merges each job's branch into the tranche branch (§4), archives the jobs' sessions and writes each one's metrics row from its archive (§10), and starts the next layer.

**Starting a job (P8, P13).** BOB posts the job's first entry, `START`, in its mailbox (§13): the job's depth (BOB's plus one, §2) and anything particular to this job. It then creates the session with `create_session` on the job's branch, titled `<MODULE> #<k>`, with the fixed prompt that names its module, its tranche and `roles/JOB.md`, and records its address with `mail addjob`. The start is **confirmed** when the job's record, pushed on its branch, names its session (`mail start`). A new session can read idle for its first minute or two, so BOB never creates a second session for a job while the first may still start: a start unconfirmed 15 minutes after creation, whose session has taken no turn or has failed, is restarted. **A restart** archives the old session first (writing its row, §10), then creates `<MODULE> #<k+1>` on the same branch with the same prompt; it reads its record and its mailbox and continues. If the archive is refused and the old session has not failed, BOB follows §16 and starts no new session (P8: one job per module).

**Watching a layer.** A job's doorbell (§13) wakes BOB when it writes. As a backstop against a lost doorbell, or a job that hangs or dies, BOB checks every 20 minutes while a layer runs (Bob, 2026-09-26), by a one-time routine into its own session re-armed at each check, since a recurring routine may fire no oftener than hourly (bio K128). A check is `mail check`, which reads every job from git alone, and BOB acts on what it lists for each job:
- **unread entries:** read and act on them, as if their doorbell had rung;
- **the job has not read BOB's newest entry:** ring it again (a doorbell may be lost; a second one costs the job one empty look);
- **quiet:** the job's state is `WORKING`, or its `RUNNING until` time has passed, and nothing has been pushed on its branch for 20 minutes: post `RESUME` and ring; one still quiet at the next check, or whose session has failed, is restarted (above);
- **unconfirmed** past 15 minutes: restarted (above);
- **a wait on Bob:** the state `NEEDS BOB`, or `needs_action` on a session whose record shows no other wait (measured in D6: a refused job asked in its own window and wrote nothing): BOB relays it (§16). A job waiting on BOB or on its own command is never relayed, whatever the platform shows for its session (a session that ends its turn waiting reads BLOCKED or COMPLETED, measured in T6 and D9).

**BOB's own liveness (Bob, K167; P13).** At each check BOB also moves a one-time routine into ROOT's session, its text `WATCH #<n>: <branch>`, to 60 minutes ahead (`update_trigger` re-arms it even after it has fired, measured in D8); BOB creates it when it opens the tranche or takes over. A live BOB never lets it fire; if it fires, ROOT acts as §2 says (proven in D9: a BOB killed mid-layer was replaced 61 minutes later, and its successor finished the tranche). The backstop and the `WATCH` are deleted when the tranche closes.

**While a tranche runs (P18).** BOB prepares what comes next, on the tranche branch, in this order of value: the next tranche's plan, ready to open; the requirements of the next tranche's modules and of the layers after it (bulk reading goes to short-lived workers, whose output BOB reviews before anything is committed, and product-module requirements go to Bob); the extraction map for each coming legacy extraction (which functions, tables and ops each target module takes). BOB keeps enough of its own attention for the running jobs: a job's question or completion comes first.

**Close (BOB),** in two steps, each pushed, so an interrupted close is a named state that any BOB resumes (P12): (1) `current.md` moves to `archive/T<n>.md` on the tranche branch, with each entry's outcome and the tranche's measured usage, its Status line `CLOSING`; (2) `main` fast-forwards to that commit, and the tranche is closed exactly when `main` is at it. A refused step 2 is §16's, its `NEEDS BOB` line in BOB's handoff; no tranche opens while an archived plan reads `CLOSING` and `main` is behind it. BOB asks Bob for his weekly meter reading again, and reports the tranche to him in plain words: what was fixed, what was deferred and why, and what it cost.

## 6. The module job (P6, P7, P8, P11)

1. **Start** on `job/T<n>/<module>`. **The job's first act is `mail start`**, which pushes its record's Status line naming its session and depth and confirms its start (§5); then `mail inbox`, whose first entry is BOB's `START` (a restarted job reads everything past its record's cursor, whoever wrote it). After acting on entries it runs `mail done`. The record's state is set with `mail state`: `WORKING`; `RUNNING until <time> (<command>)`, set before waiting on a command expected to take over ten minutes; `WAITING ON BOB (J<n>)`; `NEEDS BOB`; `COMPLETE`.
   **A job that ends its turn on a wait** sets that state first and ends with the one line `Waiting on BOB (J<n>). Nothing for Bob to do.` (or `on my command`), which is what Bob's app shows for it (P17).
   **A job whose context passes half its window** (`get_session`) finishes its current step, notes the next one in its record, posts `BLOCKED` with the cause `context`, and ends its turn; BOB restarts it (§5).
2. **Read in full**, never scanned: its own requirements (both parts); the public part of each module it uses (§3); its layer's contract; its code and tests; its entries.
3. **Ambiguity.** Ask BOB (a `QUESTION`, §13). Carry on with the rest of the job against your best reading, stated in the question; stop only if the answer decides what you would build next. A question revised before its answer arrives is a new `QUESTION` that says which one it replaces; BOB answers the newest, and an `ANSWER` to a question since replaced is read and not applied. When BOB answers, merge the tranche branch if BOB changed a requirement, and bring the work in line with the answer.
4. **Change the module** to apply every entry. Deal with every flaw or improvement found in the module in the job whenever possible. Defer one to `next.md` through BOB only when it must.
5. **Test.** Every requirement id is named by at least one test, and the coverage check passes. Run the module's tests, then its layer's tests. If it changed a provided service, BOB first updates the requirements (§7), and the job also runs the tests of the modules that use it.
6. **Check:** architecture, coverage and ownership (§8).
7. **Record completion** in `build/jobs/T<n>/<module>.md`: the entries applied; anything deferred, and why; what it reported about other modules; the tests and checks run; and the line `Size (<session id>): test runs <n>, module lines <n>` (§10). Set the state `COMPLETE`, then post `COMPLETE` (§13). **Stay available** until BOB archives the session when the layer closes: a `CHANGE` re-opens the job, which processes it and records completion again.

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

## 8. The five checks (P4, P7, P15, P16)

Small tools in the process repository; with `tools/mail.mjs` (§13), the only process tooling:
1. **Architecture:** every product file is in exactly one module's `paths`, and every import is to the module itself or to a module earlier in the order that is declared in `uses`.
2. **Coverage:** every live requirement id is named by at least one of the module's tests.
3. **Ownership:** a job's diff touches only its module's `paths` and `tests` and its job record; an extraction job's additions to its legacy module are only imports from its own paths and lines that use them, with a net removal, each listed for BOB (§12.2); a line changed only by removing text from it counts as removed, not added (P7; K140).
4. **Format:** the build state's files parse, and every id they reference exists.
5. **Channels:** over each mail branch's history (§13.1), an entry once pushed is never rewritten or removed, entry numbers rise by one, a cursor never moves backwards, and a branch's tip always descends from the tip last read (P15; bio K954). It runs only where the product has a registry, `build/channels.md`.

A new check is added only by BOB with Bob, and cites the principle it serves.

## 9. Rulings (P15)

One line per ruling in `build/rulings.md`:

`K<n> · <date> · <module or layer> · <the ruling> · <why>`

A ruling that changes requirements is folded into them in the same act. A ruling is changed only by a new line that names its evidence and the one it replaces.

## 10. Metrics (P14)

**Every session's usage is read from its archive, by BOB (P14).** When BOB archives a session, a job's or a predecessor BOB's (§2), `archive_session` returns that session's final usage (cache reads, cache writes, input, output), and BOB writes its row into `build/metrics/T<n>.csv` at once, keyed by the cloud session id, for every session, a dead one included. BOB's own row is written by its successor, under the tranche it worked in (T0 for the transition). No session reports its own usage: a session's transcript misses what its container restarts and its workers spent (measured: the self-reporting recorder read 51.0M of BOB #43's 245.4M cache reads and 92.9M of BOB #42's 440.1M tokens), so the recorder is retired. Each session of a job records its size in the record, one line `Size (<session id>): test runs <n>, module lines <n>` (a restarted job has one per session), and BOB copies it into that session's row. `turns` is left empty: the archive does not report it.

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

## 13. Communication between BOB and a job: mailbox and doorbell (P9, P10, P13; bio K168)

**What the platform offers** (measured D1, T5–T6, D8–D9). A pull request comment wakes nobody (every session posts as the same account); firing a standing routine starts a new, empty session; session-to-session messaging reaches no cloud session. The one way to wake a session is **a one-time routine into it** (`create_trigger` with `persistent_session_id` = its session id, `run_once_at` = the next whole minute, `initiation` = `own_followup`). It arrives 10–60 s after its minute; it can be late, arrive twice, arrive out of order, or not arrive; into an archived session it is disabled, not delivered. And a session's platform status (idle, blocked, completed) says nothing reliable about whether it is working or what it waits on.

**So a routine carries no message.** It is a **doorbell**, its text only `MAIL (<tranche>) for <name>: check your mailbox`. **The message lives in git**, which is reliable, ordered and durable:
- **A job's mailbox to BOB** is its record, `build/jobs/T<n>/<module>.md` on its job branch: numbered entries `## J<n> · <KIND>`, and its Status line, whose `handled B<n>` is its **cursor**, the last of BOB's entries it has processed.
- **BOB's mailbox to a job** is `build/jobs/T<n>/<module>.bob.md` on the tranche branch: entries `## B<n> · <KIND>`, and the line `**Read** · handled J<n>`, BOB's cursor over the job's entries.
- **Addresses** are in the plan: its Status line names the current BOB's session, its `Jobs` line each job's. A successor BOB or a restarted job writes its own; a sender reads the address from the remote branch just before it rings.

**The rule, for either side:** to send, append an entry to your own mailbox, push, and ring the other side's doorbell. **When woken, by a doorbell or anything else, read every entry of the other side's mailbox past your cursor, in order, act on them, and move your cursor.** A late or repeated doorbell then finds nothing new, and the order of doorbells does not matter, because the mailbox holds the order. A lost doorbell delays but loses nothing: BOB's backstop (§5) reads every job's mailbox, and rings again any job that has not read BOB's newest entry.

**The tool** `tools/mail.mjs` does all of this except ringing, which only the session's own routine tool can do: `post` (append a numbered entry, commit, push), `inbox` (the other side's entries past your cursor), `done` (move your cursor), `start` and `state` (the job's Status line), `bob` and `addjob` (the plan's addresses), `addr` (the session id to ring) and `check` (the backstop's view of every job). Sessions use it and never write mailboxes, cursors or addresses by hand.

**Kinds.** From a job: `QUESTION`, `REPORT` (a flaw or improvement in another module, a generated artifact it made stale, a flaw in the process's tools), `COMPLETE`, `BLOCKED` (its cause in the body: tests, needs Bob, context). From BOB: `START`, `ANSWER` (naming the question it answers), `CHANGE` (a forwarded change, or a file on the tranche branch the job must merge), `RESUME`. BOB ends a job by archiving its session.

**BOB and ROOT** ring each other the same way, with the texts of §2 and §5 (`START BOB`, `cannot start`, `WATCH`, `WAKE`); these need no mailbox, because each is an act on sessions whose result shows in git (the successor's takeover in the Status line).

- **A session that cannot ring** (its routine tool fails) writes its entry anyway, pushes, and says so in its record: BOB's backstop reads it. It never works around the failure through another session.
- **Never fire a standing routine to reach a session,** and delete any such routine found bound to a job's or BOB's session.

### 13.1 Across accounts (P2, P13, P15, P17; bio K954)

Sessions on Bob's two accounts cannot see each other: `get_session`, `send_message` and the doorbell all fail across accounts, so the repository is the only place they meet. The channel gives them §13's mailbox rules without a doorbell.

1. **Participants and addresses (P2, P13).** The registry `build/channels.md` on the product's `main` has one row per participant: `name`, `account`, `mail branch`, `outbox`, an optional `letter` (else the name's first), and who `writes`. Today: `BOB` (secondary, `mail/BOB`, `mail/BOB.md`, `B`) and `UX-DESIGN` (primary, `mail/UX-DESIGN`, `mail/UX-DESIGN.md`, `U`). Each outbox lives on its writer's own **mail branch**, which holds only that outbox, is written only by its owner, never moves and is never merged into `main` (P12: `main` is frozen while a tranche runs, and a working branch moves every tranche). The current session id is not in the registry: it is the outbox's first line, `**Writer** · <name> · <session id> · <account> · since <date>`, which a successor rewrites at takeover. The registry changes only when a participant is added or a branch renamed: by BOB at a tranche's close, or by the design session's PR for its own row.
2. **Mailboxes (P13, P15).** An outbox holds the Writer line, one cursor line per correspondent, `**Read** · handled <NAME> <L><n>`, and numbered, append-only entries `## <L><n> · <KIND>[ · re <L><n>] · <date> · <session id> · <account>`, `L` the writer's letter, so a reference is unambiguous. To send: append to your own outbox and push. To receive: fetch the other side's mail branch, read every entry past your cursor in order, act on each, then move your cursor. Never write another's outbox; never put a secret in an entry.
3. **When each side reads (P13, P17).** There is no doorbell, so each side reads its correspondents' outboxes (a) at takeover; (b) at every backstop check it already runs (BOB's, §5); (c) before recording any ruling of Bob's, DEC or K, since a ruling on one side may settle a question on the other; (d) whenever Bob says "check the channel". A session may also look on its own `send_later` schedule. No session fires a standing routine to reach anyone (§13).
4. **Kinds (P9).** `NOTICE` (a ruling of Bob's was recorded: its number, a one-line gist, where it is folded); `QUESTION` and `ANSWER` (as in §13; an answer names its question, `re U2`); `DEFER` (a question moved to the other side); `HANDOFF` (work a ruling owes the other side); `MERGE` (asks the other side, or Bob, to merge a branch); `ACK` (received and acted on, naming the entry).
5. **Ownership (P2, P4, P17).** The design session never writes `build/`, save its own registry row through its PR; BOB never edits `docs/development/ux-substrate/` or `docs/development/DECISIONS.md`, and keeps the design session's text in a merge conflict (K945). **DEC numbers** are the design session's: it takes the next free number across `main` and its open branch and posts a `NOTICE` for each; if `main` gains the number first, the branch renumbers (K473). **K numbers** are BOB's alone. When Bob rules on a UX question through BOB, BOB posts a `NOTICE`, so the design session cites the ruling instead of re-asking. A DEC's `owed:` work reaches BOB as a `HANDOFF`; BOB folds it into requirements (P5) once the DEC is on `main` or Bob names it, and answers with the K that folds it.
6. **Tooling and check (P15, P16).** `tools/mail.mjs` carries the channel, from any checkout and without touching the working tree: `xwriter` (the Writer line, at takeover; it creates the mail branch, an orphan holding only the outbox, if absent), `xpost` (append an entry and push), `xinbox` (entries past my cursor), `xdone` (move my cursor, never back), `xcheck` (for each correspondent, what I have not read and what it has not read of mine). It reads the registry from the product's `origin/main`, else the working tree. The design session runs it from its own clone of this repository (read access is enough). Sessions never write an outbox by hand. The **channels** check (§8.5) guards each mail branch's history.
7. **Certification (P3, §15).** The tool and the check are proven by fixture tests (`checks/test/channels.test.mjs`: two outboxes on two mail branches in a scratch repository; post, read past the cursor, move it, the Writer line replaced, and a rewritten entry, a removed entry, a skipped number, a backward cursor and a forced rewrite each failing the check). The cross-account step itself can be proven only between Bob's two real accounts, so §15's "names why only a product run can prove it" applies: the first live exchange (BOB's `NOTICE`, UX-DESIGN's `ACK`) is the proof, recorded in `dryrun/RUNS.md` (D12). A module job's mechanics do not change.

## 14. Generated artifacts (P7, P12)

A committed file generated by a tool from several modules' source (the fleet's bundled workers and plane, with their manifests) is not code: no job edits it by hand, and a job never writes another module's. Every generated artifact, and the command that regenerates it, is listed in the product's `build/manifest.md`. A job whose change makes another module's generated artifact stale reports it (`REPORT`). When the layer closes, BOB runs each listed command on the tranche branch, verifies the result with the tool's own check, and commits it before merging to `main`.

## 15. Certifying a revision (P3)

A revision of these mechanics is certified by a dry run before product work uses it: a toy product in this repository (`dryrun/`), with a tranche of two small jobs in one layer that between them exercise every path the revision touches, run by real job sessions exactly as a product tranche runs. The paths to prove are listed in `dryrun/CERTIFICATION.md`, each with the evidence that proves it ; a revision is certified only when every row there is proven by a run, or names why only a product tranche can prove it and the check that will. Each run's record is kept in `dryrun/RUNS.md`.


## 16. Acts only Bob can approve (P17)

A session's permission check can refuse an act that only Bob can clear, by approving it in the session that was refused; an approval typed in another session does not reach it (measured in T3: LEGACY-TESTS #1 waited two hours on a retired push hook). Bob's approval names the act itself; an approval of a page or a list did not clear a refusal (measured 2026-09-27, BOB #44).

**The standing list.** Acts Bob has approved once, as policy, are permission rules in the `.claude/settings.json` of the product repository and of this repository, written by Bob, each recorded as a ruling in the product's `build/rulings.md`. An act joins the list only after a session has been refused it, and only by Bob. The list never holds an act that loosens a standing safety rule (force-push, rewriting `main`, deleting the restore point).

**Anything else.** A refused session never works around the refusal, by another tool, a script, a worker or a later turn. It records `NEEDS BOB: <the one act>, <why>` in its record (a job, with the state `NEEDS BOB` and a `BLOCKED` entry to BOB giving the same line, §13) or its handoff (BOB), pushes that if the push is not itself the act, and carries on with whatever does not depend on the act. BOB tells Bob at once, in one line: the session's name and link, and the approval to type there, naming the act. BOB never approves for Bob. When Bob has approved, BOB says whether the act should join the standing list. At every backstop check (§5), `mail check` shows each job whose state is `NEEDS BOB`.
