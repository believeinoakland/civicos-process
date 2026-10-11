# The process mechanics

**Status** · In force. Approved by Bob. History: `HISTORY.md`. §13.1 and §8.5 are certified by D12 (`dryrun/RUNS.md`). This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P20) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2). The product repository it is applied to is `believeinoakland/bio`.

## 1. Where things live (P2, P5)

**The process repository** holds the principles, these mechanics, the role instructions (§2), the five checks (§8) and the mail tool (§13). It is product-independent.

**The product's requirements canon** (the mission, the product requirements, and the construct designs) is listed in `requirements/README.md` in the product repository; for BIO its files are under `docs/architecture/` and `docs/development/`. It is the one place every module's requirements cite, by section.

**The build state** is `build/` in the product repository. Only process roles write there, and a module job writes only its own job record.

| path | holds | written by |
| --- | --- | --- |
| `build/manifest.md` | where the requirements canon, the build state, and each layer's tests live | BOB with Bob |
| `build/layers.md` | the layers, in order, each with its contract | BOB with Bob |
| `build/modules.json` | the modules in their **total order**; per module: `id`, `layer`, `paths` (the files it owns), `tests`, `uses` (earlier module ids); for a legacy module, `legacy`; for an extracted module, `from` (the legacy module, or list of them, it is extracted from, §12.2) | BOB with Bob |
| `build/requirements/<module>.md` | the module's requirements, public and private parts (§3) | BOB (§7 says when with Bob) |
| `build/plan/current.md`, `next.md`, `archive/T<n>.md` | the running tranche's plan, the next one, and the finished ones; each opens with its legacy census (§5.2) | BOB |
| `build/plan/starts-T<n>/<module>.txt` | the body of each job's `START` (§5.3) | BOB |
| `build/plan/draft-*.md` | drafts that prepare later stages (P18) | BOB |
| `build/extraction/<module>.md` | what each coming extraction moves out of a legacy module (P18) | BOB |
| `build/jobs/T<n>/<module>.md` | one record per module job, its mailbox to BOB (§13) | the job |
| `build/jobs/T<n>/<module>.bob.md` | BOB's mailbox to the job (§13) | BOB |
| `build/rulings.md` | every ruling, one line each (§9) | BOB |
| `build/metrics/T<n>.csv` | tokens processed per session (§10) | BOB, from each archived session's usage |
| `build/channels.md`, on `main` | the cross-account registry (§13.1) | BOB; the design session its own row |
| mail branches `mail/<NAME>` | each participant's outbox, `mail/<NAME>.md` (§13.1) | its owner |

A file is owned by exactly one module; `paths` never overlap.

## 2. Roles and sessions (P4, P5, P9, P13)

- **Bob** decides the high level only (P17): policy and doctrine, requirements and changes to what they mean, high-level architecture (like the definition of layers), and UX. He does not edit files or enter commands. Which work goes into a tranche, and when a tranche opens, is BOB's (P17).
- **BOB** works with Bob on the architecture and the requirements. It opens and closes tranches and layers, spawns module jobs, routes flaws, improvements and changes, and resolves conflicts, ambiguities and other complications **itself wherever it reasonably can** (§7).
- **A module job** changes one module, the only role that changes product code (P7).

**Session names.** Every session is named by its lane in capitals followed by ` #n`, where n is that lane's iteration: `BOB #38`, `BOB #39`. A module job's lane is its module: `PDF-READER #1`, `PDF-READER #2` for the next job session of that module (a resumed or later job). The session that starts another names it at creation (`title`), and renames it with `set_session_title` if it was created otherwise.

**Session depth is bounded (P13).** A session's **depth** is the number of `parent_session_id` links above it, read with `get_session`; a session Bob starts has none and sits at depth 0. **A session at depth 8 can neither `create_session` nor `create_trigger`**. So no session starts a session of its own lane; the depths are fixed:

| depth | session | started by |
| --- | --- | --- |
| 0 | **ROOT** (`roles/ROOT.md`) | Bob |
| 1 | every BOB | ROOT |
| 2 | every module job | the BOB running its tranche |

**ROOT** is one small session whose only work is to start each BOB (P13). A refreshing BOB pushes its handoff, then rings ROOT (§13) with the text `START BOB #<n+1>: <branch> @ <handoff commit>` (§5.8). ROOT checks the commit is on the branch and starts `BOB #<n+1>` with `create_session` (titled, on that branch, with the standard BOB prompt its role names), unless it has already started a session of that title, so a repeated request is harmless. It sends nothing back: the successor's takeover in the plan's Status line is the sign. If it cannot (the commit is not there, or `create_session` fails), it rings the requester with `ROOT: cannot start BOB #<n+1>: <reason>`. **ROOT is also rung by a BOB's `WATCH`** (§5.4): if that BOB's session is archived or failed, it starts `BOB #<n+1>` the same way, telling it that BOB #<n> died and that the plan and the job records are its handoff; if the session is idle, it rings it with `WAKE`, which BOB handles as a backstop check, and moves the `WATCH` 60 minutes ahead; if it is running, nothing. Each such turn adds a few thousand tokens to ROOT's context, so ROOT lives long while staying cheap to wake. ROOT's session id is recorded in the product's `build/manifest.md`. **ROOT is replaced only by Bob**, when its context passes 55% of its context window or it fails: then the refreshing BOB's handoff ends `NEEDS BOB: start ROOT` with the prompt to paste and plain steps, and the new ROOT starts that BOB's successor. BOB's workers are agents inside its own session, not sessions; module jobs start no sessions. A session started by a routine (`create_new_session_on_fire`) has no parent but carries neither the connectors nor the session and routine tools, so it is never ROOT, a BOB or a job.

**BOB's lifetime.** BOB keeps working while its context is useful. It starts thinking about refreshing (§5.8) when its context passes **55% of its context window** (`get_session`'s `context_usage`), and refreshes at the next point where no step is half done. The reason is cost against continuity: every turn re-reads the whole context, so a large context costs more per turn, while a refresh costs a fresh session's reading of its working set. The threshold is Bob's (bio K1720, K2287); the metrics (§10) report what it costs. Every BOB that ends has a successor, even across a pause in the work.

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

A requirement planned but not yet met carries the mark `*(not yet met: T<n>)*` on its line; BOB strikes it when the job that meets it is merged (§5.5).

A job for a module being written, or gaining capabilities, reads the **Purpose** of every earlier module and the **Provides** of those it will use. A job changing an existing module reads the **Purpose** of each module it uses and, in its **Provides**, each service its own **Uses** names (P6).

## 4. Branches (P10, P12)

- Opening a tranche creates `tranche/T<n>` from `main`. **This process never changes `main` while a tranche runs.** Bob's UX design stream may land on `main` meanwhile (§13.1); the tranche's close then merges `main` into the tranche branch (§5.7).
- When a layer starts, BOB pushes each of its jobs' branches from the tranche branch: `job/T<n>/<module>`.
- Each job is merged into the tranche branch as soon as it is complete (§5.5). The modules own disjoint files, so these merges do not conflict.
- The next layer's jobs branch from the tranche branch once the layer has closed.
- **A provided service changed within a layer.** BOB first writes the change into the provider's requirements on the tranche branch (§7) and tells both jobs (§13). The providing job merges the tranche branch into its own and implements the change; when it records completion, BOB merges its branch into the tranche branch at once, and tells the using job, which merges the tranche branch into its own. Each job's ownership check, taken against the tranche branch, still sees only its own changes.
- **Whenever BOB changes a file on the tranche branch that a running job reads** (its requirements, its entries, a used module's public part), BOB tells that job (§13), and the job merges the tranche branch into its own before continuing.
- **A tool fix made on the process repository's `main` during a tranche** reaches running jobs as a `CHANGE` naming the fix; a fix to product state is committed on the tranche branch and announced the same way.
- When the last layer completes, the tranche closes (§5.7): `main`, if it moved, is merged into the tranche branch (never a rebase), the plan is archived on the tranche branch, and then the tranche branch is merged into `main` by a pull request merged with the GitHub merge tool (§5.7 step 3).

A failed tranche is abandoned without touching `main`.

## 5. The tranche cycle (P10, P12, P13, P14, P18, P19)

Each lifecycle step is one procedure below, done in order. BOB commits and pushes after every step that writes, and verifies the push on the remote.

### 5.1 Take over

1. Read your depth (follow `parent_session_id` with `get_session` until a session has none) and write it, with your name and session id, as the plan's Status line with `mail bob`, before anything else; it names exactly one session, yours, because it is the address every job rings. At any depth other than 1, say so to Bob (P13, §2).
2. Run `mail check`, and read and act on every job's entries past BOB's cursor, whether they were written to you or to your predecessor (P9, §13).
3. Read the channel (§13.1, item 3) (P13).
4. Arm your backstop if a layer runs, and your `WATCH` if a tranche is open (§5.4) (P13).
5. Delete your predecessor's routines by id: its backstop, its `WATCH`, and any other routine into it (P13). A refused delete of a routine bound to an archived session (or one step 6 archives) is skipped, not reported: into an archived session a routine is disabled, never delivered (§13), so nothing waits on the act and it is not Bob's to clear (P13, P17).
6. Archive every earlier BOB session still unarchived once it is idle (one still mid-turn at the next check), and write its row, role `BOB-final`, under the tranche it worked in (§10) (P14).
7. Follow the handoff in order (P15).

### 5.2 Open a tranche

1. Open none while an archived plan reads `CLOSING` and `main` is behind it (§5.7) (P12).
2. Write `next.md` as tranche `T<n>` from the work that remains: entries grouped by module, modules by layer, the merge order within a layer where it matters, and the hard reason for each entry left out (P10, P19). **Every plan opens with a legacy census**: each module marked legacy in `modules.json`, with the entry that retires it in this tranche or the named hard reason (P19) it stays.
3. Tell Bob in one line that the tranche has opened and what it covers, and ask for his weekly meter reading, the one measure only he can take; the tranche does not wait for it (P14).
4. Create `tranche/T<n>` from `main`; move `next.md` to `current.md` and start a new `next.md` (P10, P12).
5. Create your `WATCH` (§5.4) (P13).
6. Start the lowest layer (§5.3) (P10).

### 5.3 Start a layer

For every module of the layer that has entries, all concurrently (P10):
1. Push `job/T<n>/<module>` from the tranche branch (P12, §4).
2. Write the job's `START` body to `build/plan/starts-T<n>/<module>.txt`: the job's depth (BOB's plus one, §2), the reds it inherits (§5.5), any finding about the module made before its job started, and anything else particular to it; post it with `mail post --as bob --kind START --body-file build/plan/starts-T<n>/<module>.txt` (P8, P9).
3. Create its session with `create_session` on its branch, titled `<MODULE> #<k>` (the module in capitals and its next job-session number), with the fixed prompt: "You are <MODULE> #k, the module job for `<module>` in tranche T<n> of <product repository>. Read roles/JOB.md in believeinoakland/civicos-process whole, and follow it." (P8, P13).
4. Record its address with `mail addjob` (§13).
5. Its start is **confirmed** when its record, pushed on its branch, names its session (`mail start`), and `mail check` no longer lists it `UNCONFIRMED`. A new session can read idle for its first minute or two, so never create a second session for a job while the first may still start: a start unconfirmed 15 minutes after creation, whose session has taken no turn or has failed, is restarted (§5.4) (P8).
6. Arm the backstop if it is not armed (§5.4) (P13).

### 5.4 Watch a layer (the backstop)

A job's doorbell (§13) wakes BOB when it writes. Whatever wakes BOB, it runs `mail check`, then for each job `mail inbox --as bob`, acts on every entry past its cursor in order, then `mail done` (P9). To reply, it posts with `mail post --as bob` (an `ANSWER` names its question with `--re J<n>`; only a revised question's newest version is answered) and rings the job: a one-time routine into its session, `run_once_at` the next whole minute (§13).

**BOB arms only two timers**, and nothing else runs unattended unless Bob asks (P13): the **backstop**, a one-time routine into its own session every 20 minutes while a layer runs or while its successor starts (§5.8), re-armed at each check, since a recurring routine may fire no oftener than hourly; and its **`WATCH`**, a one-time routine into ROOT's session, its text `WATCH #<n>: <branch>`, created when it opens the tranche or takes over. A backstop check, or a `WAKE` from ROOT:
1. Run `mail check`, which reads every job from git alone, and act on what it lists for each job (P10, P13):
   - **`READ`** (unread entries): read and act on them, as if their doorbell had rung;
   - **`RING`** (the job has not read BOB's newest entry): ring it again (a doorbell may be lost; a second one costs the job one empty look);
   - **`QUIET`** (the job's state is `WORKING`, or its `RUNNING until` time has passed, and nothing has been pushed on its branch for 20 minutes): post `RESUME` and ring; one still quiet at the next check, or whose session has failed, is restarted;
   - **`UNCONFIRMED`** past 15 minutes: restart;
   - **`BOB: relay to Bob`** (the state `NEEDS BOB`, or `needs_action` on a session whose record shows no other wait): relay it (§16). A job waiting on BOB or on its own command is never relayed, whatever the platform shows for its session (a session that ends its turn waiting reads BLOCKED or COMPLETED).
2. Read the channel (§13.1, item 3) (P13).
3. Move the `WATCH` to 60 minutes ahead (`update_trigger` re-arms it even after it has fired). A live BOB never lets it fire; if it fires, ROOT acts as §2 says (P13).
4. Re-arm the backstop (P13).

**A restart** (P8) archives the old session first (writing its row, §10), then creates `<MODULE> #<k+1>` on the same branch with the same prompt; it reads its record and its mailbox and continues. If the archive is refused and the old session has not failed, BOB follows §16 and starts no new session (P8: one job per module).

### 5.5 Merge a job

A job is **complete** when its state is `COMPLETE` and `mail check` shows it needs nothing: BOB has read all of its entries and it has read all of BOB's, so a `CHANGE` that crossed a `COMPLETE` leaves the job open (P10). A complete job is merged at once, in the layer's merge order when the plan names one (P12):
1. Run `node checks/ownership.mjs <product> <module> tranche/T<n> job/T<n>/<module>`; it must pass. Read every `ADDED` line it lists for an extraction: each must only rewire legacy code to the moved code (§12.2) (P7).
2. Merge the job branch into the tranche branch (§4) (P12).
3. Strike the job's met `*(not yet met: T<n>)*` marks in its module's requirements (§3) (P7, P15).
4. Record the merge in a ruling (§9). A red test is accepted only by name in that ruling, which names the merge that will clear it; the `START` of a job not yet started carries each red it inherits (P7, P15).

The job's session stays active until the layer closes (P10): a later `CHANGE` re-opens it, and it is merged again when it is complete once more.

### 5.6 Close a layer

The layer closes when every job is merged and none is open (P10).
1. Regenerate the generated artifacts listed in the product's `build/manifest.md`, verify them as it says, and commit them on the tranche branch (§14) (P7).
2. Run `node checks/run.mjs <product>`; each failure is fixed, or accepted by name as in §5.5 (P7, P15).
3. Archive the layer's job sessions, and write each one's row from `archive_session`'s usage with that session's `Size` line (§10) (P14).
4. Start the next layer (§5.3), or after the last, close the tranche (§5.7) (P10).

### 5.7 Close the tranche

Each step is pushed, so an interrupted close is a named state that any BOB resumes (P12).
1. If the design stream has asked for its PR to be merged (`MERGE`, §13.1 item 5), merge it into `main`. If `main` has moved, merge `main` into the tranche branch first (never a rebase), keeping that stream's text in any conflict, and run `node checks/run.mjs` again (P12).
2. Move `current.md` to `archive/T<n>.md` on the tranche branch, with each entry's outcome and the tranche's measured usage, its Status line `CLOSING` (P12, P14).
3. Bring `main` to that commit through a pull request from `tranche/T<n>` to `main`, merged with the GitHub merge tool (method `merge`), never a direct push to `main`; the tranche is closed exactly when `main` contains that commit. Its authority is Bob's standing direction in the product's `CLAUDE.md` (development pull requests are merged into `main` by BOB sessions with the GitHub merge tool at a tranche boundary, without his review). A refused step is §16's, its `NEEDS BOB` line in BOB's handoff (P12, P17).
4. Delete the backstop and the `WATCH` (P13).
5. Ask Bob for his weekly meter reading again, and report the tranche to him in plain words: its elapsed time, the work it finished (legacy lines removed, entries applied), what was deferred and why, the work left, and what it cost (P14, P19).
6. Open the next tranche at once (§5.2) (P18).

### 5.8 Refresh: handoff to a successor through ROOT

1. When your context passes 55% of its window (§2), at the next point where no step is half done, write a lean handoff into the build state, and push it (P13). **A handoff never carries a reviewed act as routine**: an act on `main`, on another party's branch, or on a session or a routine is written with the step or ruling that orders it, the standing-list rule that covers it if one does, and every ruling where it was refused (§16), never as a paraphrase of a past ruling (P15, P17).
2. Ring ROOT (its id is in the product's `build/manifest.md`) with `START BOB #<n+1>: <branch> @ <handoff commit>` (§2, §13). Your successor is started by ROOT, never by you (P13).
3. Keep your backstop until your successor's takeover is in the Status line, ending each turn meanwhile with `Waiting on ROOT to start BOB #<n+1>. Nothing for Bob to do.` (P13).
4. With no takeover 20 minutes after ringing, ring once more. After a `cannot start` or a second silence, end your handoff `NEEDS BOB: start ROOT`, with the prompt to paste and plain steps, and tell Bob in one line (P17).
5. Once your successor has taken over, do nothing more: it archives you and writes your row (§5.1, §10) (P14).

### 5.9 Alongside the steps (P18, P19)

**While a tranche runs, BOB prepares what comes next**, on the tranche branch, in this order of value: the next tranche's plan, ready to open; the requirements of the next tranche's modules and of the layers after it (bulk reading goes to short-lived workers, whose output BOB reviews before anything is committed, and product-module requirements go to Bob); the extraction map for each coming legacy extraction (which functions, tables and ops each target module takes). It never touches `main`, a running job's module, or the requirements a running job reads. BOB keeps enough of its own attention for the running jobs: a job's question or completion comes first.

**BOB never idles while work remains.** Before ending any turn, or waiting on a job, a worker or a timer, it asks what it can legitimately do instead, and does it in that turn: answer or pre-empt a job's open question (reading each running job's record, not only its messages), draft the next plan, requirements, extraction maps or reviews, or start workers on them. A timer is only a backstop, never the plan. It never tells Bob it will do something without doing it in the same turn. It ends a turn only when every such item is done or running, and says what is running. **A turn that ends waiting** ends with one line naming what it waits on and, unless it is Bob's, `Nothing for Bob to do.` (P17).

## 6. The module job (P6, P7, P8, P11)

1. **Start** on `job/T<n>/<module>`. **The job's first act is `mail start`**, which pushes its record's Status line naming its session and depth and confirms its start (§5.3); then `mail inbox`, whose first entry is BOB's `START` (a restarted job reads everything past its record's cursor, whoever wrote it). After acting on entries it runs `mail done`. The record's state is set with `mail state`: `WORKING`; `RUNNING until <time> (<command>)`, set before waiting on a command expected to take over ten minutes; `WAITING ON BOB (J<n>)`; `NEEDS BOB`; `COMPLETE`.
   **A job that ends its turn on a wait** sets that state first and ends with the one line `Waiting on BOB (J<n>). Nothing for Bob to do.` (or `on my command`), which is what Bob's app shows for it (P17).
   **A job whose context passes half its window** (`get_session`) finishes its current step, notes the next one in its record, posts `BLOCKED` with the cause `context`, and ends its turn; BOB restarts it (§5.4).
2. **Read in full**, never scanned: its own requirements (both parts); of each module it uses, what §3 names; its layer's contract; its code and tests; its entries.
3. **Ambiguity.** Ask BOB (a `QUESTION`, §13). Carry on with the rest of the job against your best reading, stated in the question; stop only if the answer decides what you would build next. A question revised before its answer arrives is a new `QUESTION` that says which one it replaces; BOB answers the newest, and an `ANSWER` to a question since replaced is read and not applied. When BOB answers, merge the tranche branch if BOB changed a requirement, and bring the work in line with the answer.
4. **Change the module** to apply every entry. Deal with every flaw or improvement found in the module in the job whenever possible. Defer one to `next.md` through BOB only when it must.
5. **Test.** Every requirement id is named by at least one test, and the coverage check passes. Run the module's tests, then its layer's tests. If it changed a provided service, BOB first updates the requirements (§7), and the job also runs the tests of the modules that use it.
6. **Check:** format, architecture, coverage and ownership (§8).
7. **Record completion** in `build/jobs/T<n>/<module>.md`: the entries applied; anything deferred, and why; what it reported about other modules; the tests and checks run; and the line `Size (<session id>): test runs <n>, module lines <n>` (§10). Set the state `COMPLETE`, then post `COMPLETE` (§13). **Stay available** until BOB archives the session when the layer closes: a `CHANGE` re-opens the job, which processes it and records completion again.

**When tests will not pass** after three honest attempts, the job keeps its session and works the problem with BOB. BOB can clarify a requirement, route a cause found in another module, or re-scope the entry. Only if the two cannot resolve it is that entry deferred, and the job completes the rest.

A job writes only its module's `paths` and `tests`, plus its own job record (and, extracting, its legacy module as §12.2 allows). It never writes a generated artifact of another module (§14); it reports one it has made stale.

## 7. What BOB resolves, and what goes to Bob (P4, P5, P9)

**BOB resolves itself**, recording a ruling where it decides anything:
- conflicts between jobs;
- routing flaws and improvements (confirm a reported one, then forward it to a running job of that module, or add it to `next.md`);
- ambiguities it can settle by clarifying the **wording** of a requirement without changing its meaning;
- sequencing within the process's rules;
- every lower-level technical or detailed decision (P17): details about layers, modules and their boundaries and order (splitting, merging or reordering modules, and adding or removing a module that carries no product capability), dependency (`uses`) edges, order within a layer, which module owns a file, helper and legacy modules, the process's tooling and checks, tests, branches and CI.

**BOB brings to Bob** only:
- a change to what a requirement **means**, including a change to a provided service;
- the architecture at its high level (adding, removing or reordering layers, or adding or removing a module that carries product capability);
- doctrine and priority;
- anything the principles reserve to him.

Each question comes with an explanation he can understand, a set of options, and a recommendation. When Bob rules a service change, BOB updates the provider's requirements and adds an entry for every module that uses it, in this tranche if that module's layer has not yet completed (which re-opens a finished job, P10), otherwise in `next.md`.

## 8. The five checks (P4, P7, P15, P16)

Small tools in the process repository; with `tools/mail.mjs` (§13), the only process tooling:
1. **Architecture:** every product file is in exactly one module's `paths`, and every import is to the module itself or to a module earlier in the order that is declared in `uses`.
2. **Coverage:** every live requirement id is named by at least one of the module's tests.
3. **Ownership:** a job's diff touches only its module's `paths` and `tests` and its job record; an extraction job's additions to its legacy module are only imports from its own paths and lines that use them, with a net removal, each listed for BOB (§12.2); a line changed only by removing text from it counts as removed, not added (P7).
4. **Format:** the build state's files parse, and every id they reference exists; every module's `paths` and `tests` entry names an existing file or directory in the product tree, a `tests` directory counting if it exists (P4, P15); every ruling after K1181 that records Bob's approval of a refused act states its standing-list decision (§16) (P15, P17).
   *Proposed revision (N656, bio K1763; not binding until certified, §15, `dryrun/CERTIFICATION.md` TC1):* where the product has a register of Anthropic's terms (named in `build/manifest.md`, else `build/terms/anthropic.md`), every sentence in `build/` (requirements, the plan's current, next and drafts, the manifest; rulings from K1764) or `docs/architecture/` that states a limit on Anthropic's accounts, plans or terms cites a register id (`AT-n`, `U-n`) the register defines, or a ruling of Bob's (a K id with "Bob's"); an id the register lacks always fails (P15, P17).
5. **Channels:** over each mail branch's history (§13.1), an entry once pushed is never rewritten or removed, entry numbers rise by one, a cursor never moves backwards, and a branch's tip always descends from the tip last read (P15). It runs only where the product has a registry, `build/channels.md`.

BOB adds or changes a check; each cites the principle it serves.

## 9. Rulings (P15)

One line per ruling in `build/rulings.md`:

`K<n> · <date> · <module or layer> · <the ruling> · <why>`

A ruling that changes requirements is folded into them in the same act. **Every act a ruling owes is an entry in `next.md` (or the running plan) in the same commit as the ruling** (P15, P19); a ruling never holds owed work alone. A ruling is changed only by a new line that names its evidence and the one it replaces. A ruling that records Bob's approval of a refused act states its standing-list decision (§16).

## 10. Metrics (P14)

**Every session's usage is read from its archive, by BOB (P14).** When BOB archives a session, a job's or a predecessor BOB's (§5.1), `archive_session` returns that session's final usage (cache reads, cache writes, input, output), and BOB writes its row into `build/metrics/T<n>.csv` at once, keyed by the cloud session id, for every session, a dead one included. BOB's own row is written by its successor, under the tranche it worked in (T0 for the transition). No session reports its own usage: a session's transcript misses what its container restarts and its workers spent, so the recorder is retired. Each session of a job records its size in the record, one line `Size (<session id>): test runs <n>, module lines <n>` (a restarted job has one per session), and BOB copies it into that session's row. `turns` is left empty: the archive does not report it.

Row: `session · role · module · cache-read · cache-write · input · output tokens · turns · test runs · module lines`. Rows the retired recorder wrote stay as measurements; where a session also has a row from its archive (`BOB-final`), that row is its usage.

Bob's weekly meter is noted at each tranche's open and close when he gives it. **No bounds yet.** After a few tranches, BOB reports the model: tokens per job against module size, entries and test runs; tokens against the movement of the weekly meter; and BOB's own cost against its context size, which tests §2's refresh threshold. Bob then sets bounds.

## 11. Release (P11)

A release runs the full regression, then follows the distribution process (a separate document). A release is cut from the open tranche branch, and anything it changes in the product's files is committed to that branch; it reaches `main` only through the tranche's close (§5.7), never by a merge of its own, so `main` and the tranche never hold two versions of the same file (P12). A full regression also runs whenever Bob asks.

## 12. Legacy modules and the snapshot (P4, P6, P7)

**12.2 Legacy modules.** `store.mjs`, `index.mjs` and `app.html` are each registered as a temporary **legacy module**, placed in the order after the modules extracted from it, so that it may use them (P4). An entry to extract a target module from a legacy module is applied by that target module's job, which is the one exception to ownership: in the legacy module's files it may remove the moved code, and **rewire the legacy code that called it** to the target module, adding only an import (or re-export) from its own paths and lines that use a name so imported (a delegating method, a call now made to the moved function); the legacy module's net change (over all of them, when there are several) is a removal. **A target module's code may sit in several legacy modules** (the store and the check catalogue): its `from` then names each, and the rule holds in each one. A legacy module earlier in the order than the target (the check catalogue is the first module) cannot import it, so there the job only removes, and the code that needs the moved part reaches it from a module later than the target. The ownership check enforces this and lists every line added to the legacy module, and BOB reads that list before merging (§5.5). Extraction runs bottom-up, a layer at a time. Source-anchored tests are retired with the legacy code they anchor on. A legacy module is retired when it is empty.

**12.5 The snapshot.** The old process's unmerged work, Batch30 among it, is not landed; it stays reachable in `snapshot/pre-refactor-2026-09-25`. **Its value is judged by the requirements, not in advance:** a target module's extraction job reads the legacy and snapshot code for its module, keeps what meets its requirements, and discards the rest. The old process's own tooling is not carried forward.

## 13. Communication between BOB and a job: mailbox and doorbell (P9, P10, P13)

**What the platform offers.** A pull request comment wakes nobody (every session posts as the same account); firing a standing routine starts a new, empty session; session-to-session messaging reaches no cloud session. The one way to wake a session is **a one-time routine into it** (`create_trigger` with `persistent_session_id` = its session id, `run_once_at` = the next whole minute, `initiation` = `own_followup`). It arrives 10–60 s after its minute; it can be late, arrive twice, arrive out of order, or not arrive; into an archived session it is disabled, not delivered. And a session's platform status (idle, blocked, completed) says nothing reliable about whether it is working or what it waits on.

**So a routine carries no message.** It is a **doorbell**, its text only `MAIL (<tranche>) for <name>: check your mailbox`. **The message lives in git**, which is reliable, ordered and durable:
- **A job's mailbox to BOB** is its record, `build/jobs/T<n>/<module>.md` on its job branch: numbered entries `## J<n> · <KIND>`, and its Status line, whose `handled B<n>` is its **cursor**, the last of BOB's entries it has processed.
- **BOB's mailbox to a job** is `build/jobs/T<n>/<module>.bob.md` on the tranche branch: entries `## B<n> · <KIND>`, and the line `**Read** · handled J<n>`, BOB's cursor over the job's entries.
- **Addresses** are in the plan: its Status line names the current BOB's session, its `Jobs` line each job's. A successor BOB or a restarted job writes its own; a sender reads the address from the remote branch just before it rings.

**The rule, for either side:** to send, append an entry to your own mailbox, push, and ring the other side's doorbell. **When woken, by a doorbell or anything else, read every entry of the other side's mailbox past your cursor, in order, act on them, and move your cursor.** A late or repeated doorbell then finds nothing new, and the order of doorbells does not matter, because the mailbox holds the order. A lost doorbell delays but loses nothing: BOB's backstop (§5.4) reads every job's mailbox, and rings again any job that has not read BOB's newest entry.

**The tool** `tools/mail.mjs` does all of this except ringing, which only the session's own routine tool can do: `post` (append a numbered entry, commit, push; the body by `--body` or `--body-file`), `inbox` (the other side's entries past your cursor), `done` (move your cursor), `start` and `state` (the job's Status line), `bob` and `addjob` (the plan's addresses), `addr` (the session id to ring), `ring-text` (the doorbell's text) and `check` (the backstop's view of every job). Sessions use it and never write mailboxes, cursors or addresses by hand.

**Kinds.** From a job: `QUESTION`, `REPORT` (a flaw or improvement in another module, a generated artifact it made stale, a flaw in the process's tools), `COMPLETE`, `BLOCKED` (its cause in the body: tests, needs Bob, context). From BOB: `START`, `ANSWER` (naming the question it answers), `CHANGE` (a forwarded change, or a file on the tranche branch the job must merge), `RESUME`. BOB ends a job by archiving its session.

**BOB and ROOT** ring each other the same way, with the texts of §2 and §5 (`START BOB`, `cannot start`, `WATCH`, `WAKE`); these need no mailbox, because each is an act on sessions whose result shows in git (the successor's takeover in the Status line).

- **A session that cannot ring** (its routine tool fails) writes its entry anyway, pushes, and says so in its record: BOB's backstop reads it. It never works around the failure through another session.
- **Never fire a standing routine to reach a session,** and delete any such routine found bound to a job's or BOB's session.

### 13.1 Across accounts (P2, P13, P15, P17)

Sessions on Bob's two accounts cannot see each other: `get_session`, `send_message` and the doorbell all fail across accounts, so the repository is the only place they meet. The channel gives them §13's mailbox rules without a doorbell.

1. **Participants and addresses (P2, P13).** The registry `build/channels.md` on the product's `main` has one row per participant: `name`, `account`, `mail branch`, `outbox`, an optional `letter` (else the name's first), and who `writes`. Today: `BOB` (secondary, `mail/BOB`, `mail/BOB.md`, `B`) and `UX-DESIGN` (primary, `mail/UX-DESIGN`, `mail/UX-DESIGN.md`, `U`). Each outbox lives on its writer's own **mail branch**, which holds only that outbox, is written only by its owner, never moves and is never merged into `main` (P12: this process never changes `main` while a tranche runs, and a working branch moves every tranche). The current session id is not in the registry: it is the outbox's first line, `**Writer** · <name> · <session id> · <account> · since <date>`, which a successor rewrites at takeover. The registry changes only when a participant is added or a branch renamed: by BOB at a tranche's close, or by the design session's PR for its own row.
2. **Mailboxes (P13, P15).** An outbox holds the Writer line, one cursor line per correspondent, `**Read** · handled <NAME> <L><n>`, and numbered, append-only entries `## <L><n> · <KIND>[ · re <L><n>] · <date> · <session id> · <account>`, `L` the writer's letter, so a reference is unambiguous. To send: append to your own outbox and push. To receive: fetch the other side's mail branch, read every entry past your cursor in order, act on each, then move your cursor. Never write another's outbox; never put a secret in an entry.
3. **When each side reads (P13, P17).** There is no doorbell, so each side reads its correspondents' outboxes (a) at takeover; (b) at every backstop check it already runs (BOB's, §5.4); (c) before recording any ruling of Bob's, DEC or K, since a ruling on one side may settle a question on the other; (d) whenever Bob says "check the channel". BOB arms no other timer for it (§5.4); the design session may also look on its own `send_later` schedule. No session fires a standing routine to reach anyone (§13).
4. **Kinds (P9).** `NOTICE` (a ruling of Bob's was recorded: its number, a one-line gist, where it is folded); `QUESTION` and `ANSWER` (as in §13; an answer names its question, `re U2`); `DEFER` (a question moved to the other side); `HANDOFF` (work a ruling owes the other side); `MERGE` (asks the other side, or Bob, to merge a branch); `ACK` (received and acted on, naming the entry).
5. **Ownership (P2, P4, P17).** The design session never writes `build/`, save its own registry row through its PR; BOB never edits `docs/development/ux-substrate/` or `docs/development/DECISIONS.md`, and keeps the design session's text in a merge conflict. **DEC numbers** are the design session's: it takes the next free number across `main` and its open branch and posts a `NOTICE` for each; if `main` gains the number first, the branch renumbers. **K numbers** are BOB's alone. When Bob rules on a UX question through BOB, BOB posts a `NOTICE`, so the design session cites the ruling instead of re-asking. A DEC's `owed:` work reaches BOB as a `HANDOFF`; BOB folds it into requirements (P5) once the DEC is on `main` or Bob names it, and answers with the K that folds it. **The design stream's PR** reaches `main` by BOB's merge at a tranche's close (§5.7 step 1; P12: never while a tranche runs), on the design session's `MERGE`, without Bob's review: his direction (bio K1177) is that development PRs, the design stream's included, are merged by sessions without his review, and the standing list carries the merge rule (§16). That direction is the merge's only authority; no ruling recording a past merge is an order.
6. **Tooling and check (P15, P16).** `tools/mail.mjs` carries the channel, from any checkout and without touching the working tree: `xwriter` (the Writer line, at takeover; it creates the mail branch, an orphan holding only the outbox, if absent), `xpost` (append an entry and push), `xinbox` (entries past my cursor), `xdone` (move my cursor, never back), `xcheck` (for each correspondent, what I have not read and what it has not read of mine). It reads the registry from the product's `origin/main`, else the working tree. The design session runs it from its own clone of this repository (read access is enough). Sessions never write an outbox by hand. The **channels** check (§8.5) guards each mail branch's history.
7. **Certification (P3, §15).** The tool and the check are proven by fixture tests (`checks/test/channels.test.mjs`: two outboxes on two mail branches in a scratch repository; post, read past the cursor, move it, the Writer line replaced, and a rewritten entry, a removed entry, a skipped number, a backward cursor and a forced rewrite each failing the check). The cross-account step itself can be proven only between Bob's two real accounts, so §15's "names why only a product run can prove it" applies: the first live exchange (BOB's `NOTICE`, UX-DESIGN's `ACK`) is the proof, recorded in `dryrun/RUNS.md` (D12). A module job's mechanics do not change.

## 14. Generated artifacts (P7, P12)

A committed file generated by a tool from several modules' source (the fleet's bundled workers and plane, with their manifests) is not code: no job edits it by hand, and a job never writes another module's. Every generated artifact, and the command that regenerates it, is listed in the product's `build/manifest.md`. A job whose change makes another module's generated artifact stale reports it (`REPORT`). When the layer closes, BOB runs each listed command on the tranche branch, verifies the result with the tool's own check, and commits it before merging to `main` (§5.6).

## 15. Certifying a revision (P3)

A revision of these mechanics is certified by a dry run before product work uses it: a toy product in this repository (`dryrun/`), with a tranche of two small jobs in one layer that between them exercise every path the revision touches, run by real job sessions exactly as a product tranche runs. The paths to prove are listed in `dryrun/CERTIFICATION.md`, each with the evidence that proves it ; a revision is certified only when every row there is proven by a run, or names why only a product tranche can prove it and the check that will. Each run's record is kept in `dryrun/RUNS.md`.


## 16. Acts only Bob can approve (P17)

A session's permission check can refuse an act that only Bob can clear, by approving it in the session that was refused; an approval typed in another session does not reach it. Bob's approval names the act itself; an approval of a page or a list does not clear a refusal.

**The standing list.** Acts Bob has approved once, as policy, are permission rules in the `.claude/settings.json` of the product repository and of this repository, written by Bob, each recorded as a ruling in the product's `build/rulings.md`. An act joins the list only after a session has been refused it, and only by Bob. The list never holds an act that loosens a standing safety rule (force-push, rewriting `main`, deleting the restore point). The list covers the permission prompt only. A refusal by auto mode's safety check is not a permission rule and the list cannot clear it: such an act is replaced by a route the check accepts (as §5.7 step 3), or approved by Bob in the refused session each time.

**Anything else.** A refused session never works around the refusal, by another tool, a script, a worker or a later turn. It records `NEEDS BOB: <the one act>, <why>` in its record (a job, with the state `NEEDS BOB` and a `BLOCKED` entry to BOB giving the same line, §13) or its handoff (BOB), pushes that if the push is not itself the act, and carries on with whatever does not depend on the act. BOB tells Bob at once, in one line: the session's name and link, and the approval to type there, naming the act. BOB never approves for Bob. **The ruling that records Bob's approval** says `approved`, cites §16, and states its standing-list decision, `standing list: added <rule>` (the settings rule, in backticks) or `standing list: not added (<why>)`; the format check fails one without it (§8.4) (P15; P17: the standing list is Bob's policy, so each approval decides it). At every backstop check (§5.4), `mail check` shows each job whose state is `NEEDS BOB`.

**Before an act on `main` or on another party's branch**, BOB searches `build/rulings.md` for a refusal of that act. If one exists and no standing-list rule covers the act, BOB asks Bob first, naming the act and the ruling, and does not act until he approves (P15: a recorded refusal is read, not relearned; P17: an act only Bob can clear is brought to him before it is taken).

## 17. Reading sets (P6, P13, P20)

**What a session reads.** A session's reading set is everything its role says it reads in full: BOB's takeover set (§5.1 and its role file), and a job's set (§3, §6 step 2). Each set is defined in advance, by the role and by the module's own requirements (its **Uses** names the services it calls), so no session decides what to skip while reading.

**Limits.** BOB sets a size limit for each kind of set, records it as a ruling, and measures every set against it: a job's at its `START` (§5.3), BOB's takeover set and the plan at each tranche's opening (§5.2).

**When a set is over its limit**, BOB fixes it before the session starts, in this order:
1. trim the documents: remove history and anything stated elsewhere, keeping every binding word;
2. split the document or the module, so each part is read whole by those who need it (P6);
3. for what is still too large, a summary for that task only. Its helpers are given the work the summary serves: the job's entries, the requirements it changes, and the stages after it that will rely on the job's result. They read the sources in full and write what that work and those later stages need, each statement citing its source section. The sources stay binding, the job may read any cited section in full, and the summary is never reused for other work.

**To Bob.** Only a set still over its limit after all three, and only when BOB sees no other fix: BOB tells him what it tried, the options and a recommendation (P17).
