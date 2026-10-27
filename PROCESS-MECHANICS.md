# The process mechanics

**Status** · In force. Approved by Bob. History: `HISTORY.md`. §13.1 and §8.5 are certified by D12 (`dryrun/RUNS.md`). *Revision (the process redesign, bio K5334; `lane-process-redesign/DESIGN.md`): §1, §2, §5, §6, §10, §13, §14, §16, §17, certified by D19 and D20 (`dryrun/CERTIFICATION.md` RD0-RD19); in force once BOB merges it at a tranche boundary (P3, P12), or sooner on Bob's ruling.* This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P20) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2). The product repository it is applied to is `believeinoakland/bio`.

## 1. Where things live (P2, P5)

**The process repository** holds the principles, these mechanics, each role's index (`roles/<ROLE>.md`, §2) and the situations it names (`situations/*.md`, each read whole when it arises), the seven checks (§8), the process tool `tools/proc.mjs` and its hooks `tools/hooks.mjs` (§5), and the channel tool `tools/mail.mjs` (§13.1). It is product-independent.

**The product's requirements canon** (the mission, the product requirements, and the construct designs) is listed in `requirements/README.md` in the product repository; for BIO its files are under `docs/architecture/` and `docs/development/`. It is the one place every module's requirements cite, by section.

**The build state** is `build/` in the product repository. Only process roles write there, and a module job writes only its own job record.

| path | holds | written by |
| --- | --- | --- |
| `build/manifest.md` | where the requirements canon, the build state, and each layer's tests live | BOB with Bob |
| `build/layers.md` | the layers, in order, each with its contract | BOB with Bob |
| `build/modules.json` | the modules in their **total order**; per module: `id`, `layer`, `paths` (the files it owns), `tests`, `uses` (earlier module ids); for a legacy module, `legacy`; for an extracted module, `from` (the legacy module, or list of them, it is extracted from, §12.2) | BOB with Bob |
| `build/requirements/<module>.md` | the module's requirements, public and private parts (§3) | BOB (§7 says when with Bob) |
| `build/plan/current.md`, `next.md`, `archive/T<n>.md`, `archive/T<n>-R<k>.md` | the running round's plan with its Status, Round, Jobs and Owed lines (§5), the next one, the finished tranches and rounds; each tranche's plan opens with its legacy census (§5.2) | BOB, by `proc` |
| `build/plan/starts-T<n>/<module>.txt` | each job's `START`, its first message (§5.3) | BOB, by `proc layer start` |
| `build/plan/draft-*.md` | drafts that prepare later stages (P18) | BOB |
| `build/extraction/<module>.md` | what each coming extraction moves out of a legacy module (P18) | BOB |
| `build/jobs/T<n>/<module>.md` | one record per module job: its Status line (session, depth, state), its session count, its completion reports (§6) | the job, by `proc job …` |
| `build/rulings.md` | every ruling, one line each (§9); the full log, searched, never read whole | BOB |
| `build/rulings-active.md` | the standing process judgments no code, situation or product file holds (§17) | BOB |
| `build/rulings-product/<subject>.md` | Bob's product rulings by subject, read whole by the work that touches the subject (bio K5323) | BOB |
| `build/situations/*.md` | the product's own procedures (release, deploy, live walks, the design channel), named in the manifest | BOB with Bob |
| `build/metrics/T<n>.csv` | tokens processed per session (§10) | BOB, by `proc job archived`, `proc bob archived` |
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

**ROOT** is one small session whose only work is to start each BOB (`roles/ROOT.md`; P13). A refreshing BOB sends ROOT, by `send_message`, `START BOB #<n+1>: <branch> @ <handoff commit>` (§5.8). ROOT checks the commit is on the branch and starts `BOB #<n+1>` with `create_session` (titled, on that branch, with the prompt its role names), unless it has already started a session of that title, so a repeated request is harmless. It sends nothing back: the successor's takeover in the plan's Status line is the sign. If it cannot (the commit is not there, or `create_session` fails), it replies `ROOT: cannot start BOB #<n+1>: <reason>`. **ROOT is also woken by the platform when a BOB it started fails** (a child session's failed turn is reported to its parent): if that BOB is failed or archived and no later BOB was started, ROOT starts `BOB #<n+1>` the same way, telling it that BOB #<n> died and that `proc takeover` shows everything it left. Each such turn adds a few thousand tokens to ROOT's context, so ROOT lives long while staying cheap to wake. ROOT's session id is recorded in the product's `build/manifest.md`. **ROOT is replaced only by Bob**, when its context passes 55% of its context window or it fails: then the refreshing BOB's handoff ends `NEEDS BOB: start ROOT` with the prompt to paste and plain steps, and the new ROOT starts that BOB's successor. BOB's workers are agents inside its own session, not sessions; module jobs start no sessions. A session started by a routine (`create_new_session_on_fire`) has no parent but carries neither the connectors nor the session and routine tools, so it is never ROOT, a BOB or a job.

**Role skills (P2, P16).** A BOB or a job session starts on the product repository, whose `CLAUDE.md` tells it to attach this repository and invoke its role's skill (`civicos-bob`, `civicos-job`, under the product's `.claude/skills/`). The skill shows the role's index from this repository and registers the role's hooks (§5.11): a session loads skills and hooks only from the repository it starts on, and a skill's hooks hold for the rest of the session once it is invoked (probes P2, P3). The skills are written by `proc shims` and never by hand; `proc takeover` owes their rewrite when they differ.

**BOB's lifetime.** BOB keeps working while its context is useful. It starts thinking about refreshing (§5.8) when its context passes **40% of its context window** (`get_session`'s `context_usage`), and refreshes at the next point where no step is half done. The reason is cost against continuity: every turn re-reads the whole context, so a large context costs more per turn, while a refresh costs a fresh session's reading of its working set. The threshold is Bob's (bio K3671); the metrics (§10) report what it costs. Every BOB that ends has a successor, even across a pause in the work.

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

A requirement planned but not yet met carries the mark `*(not yet met: T<n>)*` on its line; `proc merge` strikes it when the job that meets it is merged and names it in its `**Met**` line (§5.5).

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

**Old debt never blocks new work, and new work never adds to it (P7, P19).** Every test and check result is judged against the same measure taken on the tranche before the work: a test red or a check finding that was already there is inherited, named in the job's record (`Inherited reds: …`) and carried to the merge; only a new one refuses. Paying old debt down is planned work, an entry like any other.

**History on demand (P13).** A session starts on a shallow clone of its branch. The tool fetches older history only when a step needs to find where two branches split (`proc merge`, `job start`, `job complete`, `status`); before a merge BOB makes itself, `proc history --ref <ref>` does the same. No session downloads the whole history at start.

## 5. The tranche cycle (P10, P12, P13, P14, P18, P19)

Each step is one command of the process tool, `node <process>/tools/proc.mjs <command> --product <product> --tranche T<n> …` (the command list is its header). A command checks the state it needs, does the whole step, commits, pushes and verifies the push, or refuses (exit 1, naming what is missing) and writes nothing; it never leaves a step half done (P16; Bob, K5326). A platform act a script cannot take (start, message or archive a session) is printed as the exact call and recorded in the plan's `Owed` line; the command that records its result clears it, and BOB's hooks (§5.11) refuse any other form of the call and the end of a turn while an act is owed. BOB reads, for each situation, the file `roles/BOB.md` names; this section says what each command does and why.

**The plan's lines** (`build/plan/current.md`, written only by the tool): `**Status** · <OPEN|CLOSING> · BOB #<n> · <session> · depth <d>` (the BOB every job messages); `**Round** · R<k> · layer <L> <OPEN|CLOSED> …`; `**Jobs** · <module>: <MODULE #k> <session>; …` (each job's live session); `**Owed** · <act>; …`.

### 5.1 Take over

`proc takeover --name "BOB #<n>" --session <id> --depth <d>` (`situations/takeover.md`) writes the Status line before anything else, records the role for the hooks, and prints from git alone: the predecessor, every job's state and needs (`proc status`), the acts owed, each document over its limit (§17), and the acts that remain: tell Bob if the depth is not 1 (§2); message the outgoing BOB `TAKEN OVER` so it deletes every routine into its own session and replies (another session's delete of them is refused at random by the platform's auto-mode check), then archive every earlier BOB once idle and write its row (`proc bob archived`, §10); a routine still listed is one-shot and disabled in an archived session, never delivered: leave it; arm the backstop (§5.4); rewrite the role skills where they differ from `proc shims` (§2). Where the product has a registry, BOB writes its Writer line and reads the channel (§13.1). Then it follows the handoff in order (P15).

### 5.2 Open a tranche and a round

A tranche runs as one or more **rounds** (`situations/round.md`). A round's scope is fixed when it opens: its plan, entries grouped by module under `## Layer <n>`, is copied whole into `current.md` by `proc round open --round R<k> --plan <file>`, which refuses while another round is open. Work found while it runs goes to the running job of its module (§13), else to the START of its module's job in a layer not yet started, else into the next round's plan, which opens the moment this one closes: nothing found waits for another tranche, and no running round is re-planned (P10, P19). The tranche's completion round (P10) is its last round.
1. Open no tranche while an archived plan reads `CLOSING` and `main` is behind it (§5.7), nor while the words check reports a finding (P12, P7).
2. Every plan is written from the work that remains, with the hard reason for each entry left out (P19), and opens with its legacy census: each module marked legacy in `modules.json`, with the entry that retires it or the hard reason it stays.
3. Opening a tranche, tell Bob in one line what it covers. His weekly meter is noted when he gives it (P14); BOB never asks for it or raises it (Bob, bio K5136: "Don't worry about weekly usage. I'm watching it.").

### 5.3 Start a layer

`proc layer start --layer <L> --usage <rate_limit_info.status>` (`situations/layer.md`), for every module of the layer with entries, all at once (P10): pushes `job/T<n>/<module>` at the tranche's tip (a branch holding its own work is left for the job to merge), writes each START to `build/plan/starts-T<n>/<module>.txt` (round, layer, depth, BOB's address, the tool command, the entries), and prints per job either `message` (its session from an earlier round is live: the START goes to it) or `create_session` (title `<MODULE> #<k>`, on its job branch, the fixed prompt). It starts nothing while the usage status is not `allowed` (no job cap but usage, K5323). BOB records each result: `proc job started --module <m> --name "<MODULE> #k" --session <id>`, or `proc job messaged --module <m>`. The model is the cheapest able (haiku for test-only, wording-only and mechanical re-points; sonnet otherwise).

### 5.4 Watch the jobs (the backstop)

A job's message wakes BOB (§13). Whatever wakes BOB, `proc status` reads every job's record from git and lists what each needs: `ANSWER` (its record reads `WAITING: <question>`), `MERGE` (COMPLETE, not merged), `UNBLOCK` (`BLOCKED: …`), `RELAY TO BOB` (`NEEDS BOB: …`), `UNCONFIRMED` (started, no record yet), `QUIET` (WORKING with nothing pushed for an hour: read its session with `get_session`; idle or failed while WORKING, route it a message; still nothing at the next check, a fresh session by `proc job route`), and each document over or near its limit (§17). BOB acts on each (`situations/messages.md`).

**BOB's one timer** is its backstop, a `send_later` into its own session every hour while any job is live, only to catch a job that died silently; the platform also reports a child session's failed turn to its parent (P13). Nothing else runs unattended unless Bob asks.

**A fresh session for a job** (P8): `proc job route --module <m> [--session-status <s>] [--context-pct <n>]` prints `message` to the live session, or, when that session is archived, failed or past half its window, `create_session` for `<MODULE> #<k+1>` on the same branch with the same prompt, after BOB archives the old one and writes its row (`proc job archived`). The fresh session continues from the job's record. If the archive is refused and the old session has not failed, BOB follows §16 and starts no new session (P8: one job per module).

### 5.5 Merge a job

`proc merge --module <m> --context <BOB's context %>` (`situations/merge-close.md`), as soon as a job's record reads COMPLETE, in the layer's merge order when the plan names one (P12). It refuses unless the record reads COMPLETE; runs the ownership check against the merge base (for an extraction BOB reads every `ADDED` line it lists, §12.2); merges with a merge commit; regenerates and verifies every generated artifact (§14); runs the module's tests and its checks (§8, scoped to the module), and undoes the merge if anything is newly red: a test red that is not among the reds its record says it inherited, or a check finding the tranche did not already have; strikes the `*(not yet met: T<n>)*` marks the report's `**Met**` line names (§3); writes the ruling line (§9) with BOB's context figure (bio K5167); commits all of it as the one merge commit; pushes and verifies on origin. A red undoes the merge whole. A red is never merged: the job fixes it, or BOB re-scopes its entry with the job (P7). The job's session stays active until its layer closes (P10): a later CHANGE re-opens it, and it is merged again when it is complete once more.

### 5.6 Close a layer

`proc layer close --layer <L>`, once every job of the layer is merged and none re-opened (P10): it regenerates and verifies the artifacts again (§14), runs every check over the whole product once, and refuses any finding new since the tranche opened (each is fixed first, P7), closes the layer in the Round line and owes the archive of each of its sessions. BOB archives each (`archive_session`) and writes its row with `proc job archived --module <m> --usage '<the usage JSON archive_session returns>'` (§10) (P14), then starts the next layer (§5.3), or after the last, closes the round: `proc round close` refuses while a layer is open or an act owed, and archives the round's plan whole to `build/plan/archive/T<n>-R<k>.md`. The next round opens at once if it has entries; after the last, the tranche closes (§5.7).

### 5.7 Close the tranche

Each step is pushed, so an interrupted close is a named state any BOB resumes (P12).
1. If the design stream has asked for its PR to be merged (`MERGE`, §13.1 item 5), merge it into `main`. If `main` has moved, merge `main` into the tranche branch (never a rebase), keeping that stream's text in any conflict, and run every module's tests and `checks/run.mjs` again (P12).
2. Archive the plan as `archive/T<n>.md` on the tranche branch, with each entry's outcome and the tranche's measured usage, its Status `CLOSING` (P12, P14).
3. Bring `main` to that commit through a pull request from `tranche/T<n>` to `main`, merged with the GitHub merge tool (method `merge`), never a direct push: BOB's hook allows the merge only once the plan reads CLOSING, and refuses any push to `main`. The tranche is closed exactly when `main` contains that commit. Its authority is Bob's standing direction in the product's `CLAUDE.md` (bio K1177). A refused step is §16's (P12, P17).
4. Delete the backstop (P13).
5. Report the tranche to Bob in plain words (his meter is noted only when he gives it, §5.2): elapsed time, the work finished (legacy lines removed, entries applied), what was deferred and why, the work left, what it cost, and its footprint (`proc footprint`: commits by kind, the bookkeeping share) (P14, P19).
6. Open the next tranche at once (§5.2) (P18).

### 5.8 Refresh: handoff to a successor through ROOT

When BOB's context passes 40 % of its window (§2), at the next point where no step is half done (`situations/refresh.md`):
1. Write `build/handoff.md` (replaced whole; §17's limit): what is running, what is next in order, the few rulings the successor must read. **A handoff never carries a reviewed act as routine**: an act on `main`, on another party's branch, or on a session or a routine is written with the step or ruling that orders it, the standing-list rule that covers it if one does, and every ruling where it was refused (§16), never as a paraphrase of a past ruling (P15, P17).
2. `proc handoff` refuses while an act is owed or work is unpushed, and prints `START BOB #<n+1>: <branch> @ <commit>`; send it to ROOT (the manifest names its session) by `send_message`. The successor is started by ROOT, never by BOB (§2, P13).
3. Keep the backstop until the successor's takeover is in the Status line, ending each turn meanwhile `Waiting on ROOT to start BOB #<n+1>. Nothing for Bob to do.`
4. No takeover 20 minutes after: send once more. After a `cannot start` reply or a second silence, end the handoff `NEEDS BOB: start ROOT`, with the prompt to paste and plain steps, and tell Bob in one line (P17).
5. Once the successor has taken over, do nothing more: it archives BOB and writes its row (§5.1, §10) (P14).

### 5.9 Alongside the steps (P18, P19)

**While a tranche runs, BOB prepares what comes next**, on the tranche branch, in this order of value: the next round's or tranche's plan, ready to open; the requirements of the coming modules (bulk reading to short-lived workers, sonnet at medium, whose output BOB reviews before anything is committed; product-module requirements go to Bob); the extraction map for each coming legacy extraction. It never touches `main`, a running job's module, or the requirements a running job reads. A job's question or completion comes first.

**BOB never idles while work remains.** Before ending any turn it asks what it can legitimately do instead, and does it in that turn; a timer is only a backstop, never the plan. It never tells Bob it will do something without doing it in the same turn. **A turn that ends waiting** ends with one line naming what it waits on and, unless it is Bob's, `Nothing for Bob to do.` (P17).

### 5.10 A mechanical pass (P7, P8)

`situations/mechanical-pass.md` holds the procedure whole; its binding words are P7's.

### 5.11 The hooks (P16; Bob, K5326)

Each role's skill registers `tools/hooks.mjs <role> <pre|stop>` from its frontmatter (§2), so they hold for the rest of the session once it is invoked, and no settings file changes (bio K1702). A refusal names the rule and the route that does the act; the session takes that route, never the same act another way (§16).
- **Job, PreToolUse:** refuses a force push, mirror or remote delete; a push to any branch but its own; `create_session`, `create_trigger`, `fire_trigger`, `send_later`.
- **Job, Stop:** refuses the end of a turn with uncommitted or unpushed work, or with the record reading `WORKING` (a turn ends on a named wait or COMPLETE).
- **BOB, PreToolUse:** refuses a force push; any push to `main`; a hand merge of a job branch (`proc merge` does it); a `create_session` for a job that no `Owed` start names, or on another branch, or with another prompt than the tool printed; a routine into any session but its own, and firing a routine; a PR merge before the plan reads CLOSING.
- **BOB, Stop:** refuses the end of a turn while an act is owed or work is unpushed.
The same Stop refusal three times running lets the turn end, so a cause the session cannot clear never loops.

## 6. The module job (P6, P7, P8, P11)

A job follows `roles/JOB.md`, its whole standing instruction, and writes its record only through the tool: `proc job start` (merges the tranche into its branch, writes its Status line naming its session and depth, counts its sessions, prints its START), `proc job state --set <STATE>`, and `proc job complete --report-file <f>`. Its record's states are `WORKING`, `WAITING: <the question in one line>`, `BLOCKED: <tests|context|reading|needs Bob> …`, `NEEDS BOB: <the one act>`, and `COMPLETE`, set only by `job complete`. A state that waits is the record a successor BOB reads, so a question is never only in a message (§13).

1. **Read in full**, never scanned: the product's standing rules for every job when its START names them (`build/situations/job.md`); its own requirements (both parts); its entries; its layer's contract; its own code; of each module it uses, the services its entries touch (§3); and the tests that name a requirement its entries change. Its other tests are run, not read.
2. **Ambiguity:** a QUESTION (§13), carrying on against its best reading, stated in the question; it stops only if the answer decides what it builds next. When BOB answers, it merges the tranche branch if BOB changed a file it reads.
3. **Change the module** to apply every entry, and deal with every flaw or improvement found in it in the job whenever possible (P8). One it cannot finish goes to BOB, who places it in this tranche (P10); it waits for another tranche only for one of P19's three reasons.
4. **Test.** Every requirement id is named by a test that checks full compliance with it at the interface (P7). The module's tests, then its layer's; a job that changed a provided service also runs the tests of the modules that use it, after BOB has updated the requirements (§7).
5. **Complete:** `proc job complete` refuses while the report lacks its `**Met**` line, the work is uncommitted, the tranche has moved past the branch, a test is red, or a check finds something new (format, architecture, coverage, fixtures, words where the product has a word table, ownership; §8); when it passes it writes the completion report with the line `Size (<session id>): test runs <n>, module lines <n>` (§10), sets COMPLETE, pushes, and prints the message for BOB. The job **stays available** until BOB archives its session at the layer's close: a CHANGE re-opens it, and it completes again.

**When tests will not pass** after three honest attempts, the job sets `BLOCKED: tests: …` and works the problem with BOB, who can clarify a requirement, route a cause found in another module, or re-scope the entry. Only if the two cannot resolve it is that entry deferred, and the job completes the rest. **A job whose context passes half its window** finishes its step, pushes, sets `BLOCKED: context: next is <step>`, and tells BOB, who starts its successor (§5.4).

A job writes only its module's `paths` and `tests` and its own record (and, extracting, its legacy module as §12.2 allows). It never writes a generated artifact (§14); it reports one it has made stale.

## 7. What BOB resolves, and what goes to Bob (P4, P5, P9)

**BOB resolves itself**, recording a ruling where it decides anything:
- conflicts between jobs;
- routing flaws and improvements (confirm a reported one, then forward it to a running job of that module, else to the START of its module's job in a layer not yet started, else to the tranche's completion round; to `next.md` only for one of P19's three reasons, named);
- ambiguities it can settle by clarifying the **wording** of a requirement without changing its meaning;
- sequencing within the process's rules;
- every lower-level technical or detailed decision (P17): details about layers, modules and their boundaries and order (splitting, merging or reordering modules, and adding or removing a module that carries no product capability), dependency (`uses`) edges, order within a layer, which module owns a file, helper and legacy modules, the process's tooling and checks, tests, branches and CI.

**BOB brings to Bob** only:
- a change to what a requirement **means**, including a change to a provided service;
- the architecture at its high level (adding, removing or reordering layers, or adding or removing a module that carries product capability);
- doctrine and priority;
- anything the principles reserve to him.

Each question comes with an explanation he can understand, a set of options, and a recommendation. When Bob rules a service change, BOB updates the provider's requirements and adds an entry for every module that uses it, in this tranche if that module's layer has not yet completed (which re-opens a finished job, P10), otherwise in `next.md`.

## 8. The seven checks (P4, P7, P15, P16)

Small tools in the process repository; with `tools/proc.mjs`, `tools/hooks.mjs` (§5) and `tools/mail.mjs` (§13.1), the only process tooling. `proc job complete` and `proc merge` run all but channels, scoped to the module, and `proc layer close` runs them all once over the whole product; `proc merge` and `proc layer close` run them all (`checks/run.mjs`):
1. **Architecture:** every product file is in exactly one module's `paths`, and every import is to the module itself or to a module earlier in the order that is declared in `uses`.
2. **Coverage:** every live requirement id is named by at least one of the module's tests.
3. **Ownership:** a job's diff touches only its module's `paths` and `tests` and its job record; an extraction job's additions to its legacy module are only imports from its own paths and lines that use them, with a net removal, each listed for BOB (§12.2); a line changed only by removing text from it counts as removed, not added (P7).
4. **Format:** the build state's files parse, and every id they reference exists; every module's `paths` and `tests` entry names an existing file or directory in the product tree, a `tests` directory counting if it exists (P4, P15); every ruling after K1181 that records Bob's approval of a refused act states its standing-list decision (§16) (P15, P17). An entry added to `next.md` while a tranche runs names one of P19's three reasons (Bob's pending decision, a deployment or measurement outside the tranche, something outside the product not yet existing); any other reason fails (P19). A line that defers work fails, naming its file and line, unless it cites `next.md`: in `build/plan/current.md`, in the running fix round's plan file that `current.md` names, and in `build/handoff.md`, the words "next fix round", "next round", "a later round", "later tranche" and "deferred to". Work that waits is an entry of `next.md` only, with its P19 reason; plan text names dependencies, never "later".
   *Proposed revision (N656, bio K1763; not binding until certified, §15, `dryrun/CERTIFICATION.md` TC1):* where the product has a register of Anthropic's terms (named in `build/manifest.md`, else `build/terms/anthropic.md`), every sentence in `build/` (requirements, the plan's current, next and drafts, the manifest; rulings from K1764) or `docs/architecture/` that states a limit on Anthropic's accounts, plans or terms cites a register id (`AT-n`, `U-n`) the register defines, or a ruling of Bob's (a K id with "Bob's"); an id the register lacks always fails (P15, P17).
5. **Channels:** over each mail branch's history (§13.1), an entry once pushed is never rewritten or removed, entry numbers rise by one, a cursor never moves backwards, and a branch's tip always descends from the tip last read (P15). It runs only where the product has a registry, `build/channels.md`.
6. **Words:** no module's own code holds a sentence people read (it reads each by key from the word table); no test copies such a sentence; every key a module reads exists in the word table; no test hand-lists another module's operations, error codes or words (P7; bio K3366, K3810, K3268). It runs in every job's checks before COMPLETE and at every layer close, so a regression fails at once (`checks/words.mjs`).
7. **Fixtures:** no module's test builds by hand an answer that another module gives, or a stand-in for another module's service; every refusal code a test names is one that some product file gives. A test that needs another module's answer takes it from that module's own published fixture, which that module makes by running its real code when the test runs, so a change to the provider reaches every user's test in the provider's own job (P7, P11; bio K4990, K4993). Where the provider comes later in the module order than the user, the user cannot import it; there the user may keep the hand-built answer only if it marks it with the line `// fixtures-contract: <provider> <id>` (on the answer's line or up to eight lines above it) and a test of the provider carries the line `// fixtures-run: <user> <id>` and runs that answer against the provider's real code. The check accepts the answer only when the provider is later in the order and that run exists; it fails a marker whose provider is not later, one the provider does not run, one that covers nothing, and a run that no user marks (bio K4995). It lists every candidate over the whole product tree mechanically, so the list, not a sample, is the audit's coverage (bio K4996): an answer of another module's shape (`ok` with a reason or detail, an owed or final answer, an extent) built in a stub or a returned value rather than expected in an assertion or handed in as an input; a named double (`*Stub`, `*Fake`, `*Double`, `fake*`, `stub*`) or a function standing in for a service such as `registerJob`, `readHeld`, `armJobs`, `owedLater`, `keepLater`, `deliver` or `partsOf`; and a refusal code that no product file holds. Doubles of the platform (the clock, `fetch`, R2, the alarm, the bindings) are not another module's service and are not refused. It runs in every job's checks before COMPLETE and at every layer close, so a hand-built answer cannot return (`checks/fixtures.mjs`; `--list` prints every candidate with its file, line and provider for the reading workers).

BOB adds or changes a check; each cites the principle it serves.

## 9. Rulings (P15)

One line per ruling in `build/rulings.md`:

`K<n> · <date> · <module or layer> · <the ruling> · <why>`

The tool numbers every ruling: `proc merge` its own, and `proc ruling --line-file <f> [--files <p1,p2>]` BOB's, which commits the files the ruling owes with it. The format check refuses an id given twice (lane R17).

A ruling that changes requirements is folded into them in the same act. **Every act a ruling owes is an entry in `next.md` (or the running plan) in the same commit as the ruling** (P15, P19); a ruling never holds owed work alone. A ruling is changed only by a new line that names its evidence and the one it replaces. A ruling that records Bob's approval of a refused act states its standing-list decision (§16).

## 10. Metrics (P14)

**Every session's usage is read from its archive, by BOB (P14).** When BOB archives a session, a job's or a predecessor BOB's (§5.1), `archive_session` returns that session's final usage (cache reads, cache writes, input, output), and BOB writes its row into `build/metrics/T<n>.csv` at once with `proc job archived` or `proc bob archived`, keyed by the cloud session id, for every session, a dead one included. BOB's own row is written by its successor, under the tranche it worked in (T0 for the transition). No session reports its own usage: a session's transcript misses what its container restarts and its workers spent, so the recorder is retired. Each completion of a job writes its size in the record, one line `Size (<session id>): test runs <n>, module lines <n>` (`proc job complete`), and `proc job archived` copies the last one into that session's row. `turns` is left empty: the archive does not report it.

Row: `session · role · module · cache-read · cache-write · input · output tokens · turns · test runs · module lines`. Rows the retired recorder wrote stay as measurements; where a session also has a row from its archive (`BOB-final`), that row is its usage.

**The repository is a ledger, not a mailbox.** Git holds what a successor or a merge must read; messages travel by `send_message` (§13). Each tranche's report gives its footprint (`proc footprint`): in October 2026, 87 % of bio's commits were bookkeeping under the old mailbox (lane HANDOFF R8), and the share is watched so it cannot grow back unseen.

Bob's weekly meter is noted at each tranche's open and close when he gives it. **No bounds yet.** After a few tranches, BOB reports the model: tokens per job against module size, entries and test runs; tokens against the movement of the weekly meter; and BOB's own cost against its context size, which tests §2's refresh threshold. Bob then sets bounds.

## 11. Release (P11)

A release runs the full regression, then follows the distribution process (a separate document). A release is cut from the open tranche branch, and anything it changes in the product's files is committed to that branch; it reaches `main` only through the tranche's close (§5.7), never by a merge of its own, so `main` and the tranche never hold two versions of the same file (P12). A full regression also runs whenever Bob asks.

## 12. Legacy modules and the snapshot (P4, P6, P7)

**12.2 Legacy modules.** `store.mjs`, `index.mjs` and `app.html` are each registered as a temporary **legacy module**, placed in the order after the modules extracted from it, so that it may use them (P4). An entry to extract a target module from a legacy module is applied by that target module's job, which is the one exception to ownership: in the legacy module's files it may remove the moved code, and **rewire the legacy code that called it** to the target module, adding only an import (or re-export) from its own paths and lines that use a name so imported (a delegating method, a call now made to the moved function); the legacy module's net change (over all of them, when there are several) is a removal. **A target module's code may sit in several legacy modules** (the store and the check catalogue): its `from` then names each, and the rule holds in each one. A legacy module earlier in the order than the target (the check catalogue is the first module) cannot import it, so there the job only removes, and the code that needs the moved part reaches it from a module later than the target. The ownership check enforces this and lists every line added to the legacy module, and BOB reads that list before merging (§5.5). Extraction runs bottom-up, a layer at a time. Source-anchored tests are retired with the legacy code they anchor on. A legacy module is retired when it is empty.

**12.5 The snapshot.** The old process's unmerged work, Batch30 among it, is not landed; it stays reachable in `snapshot/pre-refactor-2026-09-25`. **Its value is judged by the requirements, not in advance:** a target module's extraction job reads the legacy and snapshot code for its module, keeps what meets its requirements, and discards the rest. The old process's own tooling is not carried forward.

## 13. Communication between sessions: messages, with state in git (P9, P10, P13)

**What the platform offers** (measured by probes P1-P3, `lane-process-redesign/HANDOFF.md` R2, R3): `send_message` (claude-code-remote) carries a message between cloud sessions of one account, both ways; it wakes an idle session within seconds, and is refused at once (`session_inactive`) for an archived one. A session's platform status says nothing reliable about what it waits on. A routine into a session can be late, doubled or lost, so no routine carries or rings for a message, and no session fires a standing routine to reach another (the hooks refuse both, §5.11).

**So a message carries the words, and git carries the state.** A message is sent once, to the address read from git at that moment: BOB's from the plan's Status line (`proc addr --bob`), a job's from its Jobs line (`proc job route`). What a successor or a merge must read is in git: the job's record (its state, its completion reports), the plan's lines (§5), and every file a message refers to, committed and pushed before the message is sent. No mailbox, cursor, doorbell, `RING` or `READ` exists.

**A refused message** (`session_inactive`) means its target was replaced: the sender reads the address again and resends to the session it now names. A job whose BOB is replaced therefore loses nothing: its state is in its record, which the successor's `proc status` reads at takeover (§5.1).

**Kinds**, each the message's first words. From a job: `QUESTION` (its record already reads `WAITING: …`), `REPORT` (a flaw or improvement in another module, a generated artifact it made stale, a flaw in the process's tools), `COMPLETE` (the text `proc job complete` printed), `BLOCKED` (its cause, as its record says). From BOB: the `START` (the file `proc layer start` wrote), `ANSWER` (naming the question; only the newest version of a revised question is answered), `CHANGE` (a forwarded change, or a file on the tranche branch the job must merge), `CONTINUE` (to a quiet job: continue from your record). BOB ends a job by archiving its session.

**BOB and ROOT** exchange the texts of §2 and §5.8 (`START BOB …`, `ROOT: cannot start …`) the same way; their result shows in git (the successor's takeover in the Status line).

### 13.1 Across accounts (P2, P13, P15, P17)

Sessions on Bob's two accounts cannot see each other: `get_session`, `send_message` and routines all fail across accounts, so the repository is the only place they meet. The channel is therefore a mailbox in git, with no message and no doorbell: each side reads what it has not read when it looks (item 3).

1. **Participants and addresses (P2, P13).** The registry `build/channels.md` on the product's `main` has one row per participant: `name`, `account`, `mail branch`, `outbox`, an optional `letter` (else the name's first), and who `writes`. Today: `BOB` (secondary, `mail/BOB`, `mail/BOB.md`, `B`) and `UX-DESIGN` (primary, `mail/UX-DESIGN`, `mail/UX-DESIGN.md`, `U`). Each outbox lives on its writer's own **mail branch**, which holds only that outbox, is written only by its owner, never moves and is never merged into `main` (P12: this process never changes `main` while a tranche runs, and a working branch moves every tranche). The current session id is not in the registry: it is the outbox's first line, `**Writer** · <name> · <session id> · <account> · since <date>`, which a successor rewrites at takeover with `mail xwriter` (§5.1). The registry changes only when a participant is added or a branch renamed: by BOB at a tranche's close, or by the design session's PR for its own row.
2. **Mailboxes (P13, P15).** An outbox holds the Writer line, one cursor line per correspondent, `**Read** · handled <NAME> <L><n>`, and numbered, append-only entries `## <L><n> · <KIND>[ · re <L><n>] · <date> · <session id> · <account>`, `L` the writer's letter, so a reference is unambiguous. To send: append to your own outbox and push. To receive: fetch the other side's mail branch, read every entry past your cursor in order, act on each, then move your cursor. Never write another's outbox; never put a secret in an entry.
3. **When each side reads (P13, P17).** There is no doorbell, so each side reads its correspondents' outboxes (a) at takeover; (b) at every backstop check it already runs (BOB's hourly backstop, §5.4); (c) before recording any ruling of Bob's, DEC or K, since a ruling on one side may settle a question on the other; (d) whenever Bob says "check the channel". BOB arms no other timer for it (§5.4); the design session may also look on its own `send_later` schedule. No session fires a standing routine to reach anyone (§13). `send_message` does not cross accounts, so the channel is unchanged by §13.
4. **Kinds (P9).** `NOTICE` (a ruling of Bob's was recorded: its number, a one-line gist, where it is folded); `QUESTION` and `ANSWER` (as in §13; an answer names its question, `re U2`); `DEFER` (a question moved to the other side); `HANDOFF` (work a ruling owes the other side); `MERGE` (asks the other side, or Bob, to merge a branch); `ACK` (received and acted on, naming the entry).
5. **Ownership (P2, P4, P17).** The design session never writes `build/`, save its own registry row through its PR; BOB never edits `docs/development/ux-substrate/` or `docs/development/DECISIONS.md`, and keeps the design session's text in a merge conflict. **DEC numbers** are the design session's: it takes the next free number across `main` and its open branch and posts a `NOTICE` for each; if `main` gains the number first, the branch renumbers. **K numbers** are BOB's alone. When Bob rules on a UX question through BOB, BOB posts a `NOTICE`, so the design session cites the ruling instead of re-asking. A DEC's `owed:` work reaches BOB as a `HANDOFF`; BOB folds it into requirements (P5) once the DEC is on `main` or Bob names it, and answers with the K that folds it. **The design stream's PR** reaches `main` by BOB's merge at a tranche's close (§5.7 step 1; P12: never while a tranche runs), on the design session's `MERGE`, without Bob's review: his direction (bio K1177) is that development PRs, the design stream's included, are merged by sessions without his review, and the standing list carries the merge rule (§16). That direction is the merge's only authority; no ruling recording a past merge is an order.
6. **Tooling and check (P15, P16).** `tools/mail.mjs` carries the channel, from any checkout and without touching the working tree: `xwriter` (the Writer line, at takeover; it creates the mail branch, an orphan holding only the outbox, if absent), `xpost` (append an entry and push), `xinbox` (entries past my cursor), `xdone` (move my cursor, never back), `xcheck` (for each correspondent, what I have not read and what it has not read of mine). It reads the registry from the product's `origin/main`, else the working tree. The design session runs it from its own clone of this repository (read access is enough). Sessions never write an outbox by hand. The **channels** check (§8.5) guards each mail branch's history.
7. **Certification (P3, §15).** The tool and the check are proven by fixture tests (`checks/test/channels.test.mjs`: two outboxes on two mail branches in a scratch repository; post, read past the cursor, move it, the Writer line replaced, and a rewritten entry, a removed entry, a skipped number, a backward cursor and a forced rewrite each failing the check). The cross-account step itself can be proven only between Bob's two real accounts, so §15's "names why only a product run can prove it" applies: the first live exchange (BOB's `NOTICE`, UX-DESIGN's `ACK`) is the proof, recorded in `dryrun/RUNS.md` (D12). A module job's mechanics do not change.

## 14. Generated artifacts (P7, P12)

A committed file generated by a tool from several modules' source (the fleet's bundled workers and plane, with their manifests) is not code: no job edits it by hand, and a job never writes another module's. Every generated artifact, and the command that regenerates it, is listed in the product's `build/manifest.md`. Each row of the manifest's artifact table names the path (or several, comma-separated), its owner, the command that regenerates it and the command that verifies it. At every merge and every layer close, `proc merge` and `proc layer close` run each listed command on the tranche branch in the table's order, verify the result, and commit what changed (a manifest whose table the tool cannot parse is refused, never read as empty); a result that still fails its verification undoes the merge or refuses the close (§5.5, §5.6; D19 finding 1: a merged change can make another module's artifact stale). A job whose change makes another module's generated artifact stale also reports it (`REPORT`).

## 15. Certifying a revision (P3)

A revision of these mechanics is certified by a dry run before product work uses it: a toy product in this repository (`dryrun/`), with a tranche of two small jobs in one layer that between them exercise every path the revision touches, run by real job sessions exactly as a product tranche runs. The paths to prove are listed in `dryrun/CERTIFICATION.md`, each with the evidence that proves it ; a revision is certified only when every row there is proven by a run, or names why only a product tranche can prove it and the check that will. Each run's record is kept in `dryrun/RUNS.md`.


## 16. Acts only Bob can approve (P17)

A session's permission check can refuse an act that only Bob can clear, by approving it in the session that was refused; an approval typed in another session does not reach it. Bob's approval names the act itself; an approval of a page or a list does not clear a refusal.

**The standing list.** Acts Bob has approved once, as policy, are permission rules in the `.claude/settings.json` of the product repository and of this repository, written by Bob, each recorded as a ruling in the product's `build/rulings.md`. An act joins the list only after a session has been refused it, and only by Bob. The list never holds an act that loosens a standing safety rule (force-push, rewriting `main`, deleting the restore point). The list covers the permission prompt only. A refusal by auto mode's safety check is not a permission rule and the list cannot clear it: such an act is replaced by a route the check accepts (as §5.7 step 3), or approved by Bob in the refused session each time.

**Anything else.** A refused session never works around the refusal, by another tool, a script, a worker or a later turn. It records `NEEDS BOB: <the one act>, <why>` in its record (a job, by `proc job state`, and a message to BOB giving the same line, §13) or its handoff (BOB), pushes that if the push is not itself the act, and carries on with whatever does not depend on the act. BOB tells Bob at once, in one line: the session's name and link, and the approval to type there, naming the act. BOB never approves for Bob. **The ruling that records Bob's approval** says `approved`, cites §16, and states its standing-list decision, `standing list: added <rule>` (the settings rule, in backticks) or `standing list: not added (<why>)`; the format check fails one without it (§8.4) (P15; P17: the standing list is Bob's policy, so each approval decides it). `proc status` shows each job whose state is `NEEDS BOB` as `RELAY TO BOB` (§5.4).

**Before an act on `main` or on another party's branch**, BOB searches `build/rulings.md` for a refusal of that act. If one exists and no standing-list rule covers the act, BOB asks Bob first, naming the act and the ruling, and does not act until he approves (P15: a recorded refusal is read, not relearned; P17: an act only Bob can clear is brought to him before it is taken).

## 17. Reading sets (P6, P13, P20)

**What a session reads.** A session's reading set is everything its role says it reads in full: BOB's takeover set (`roles/BOB.md`), and a job's set (§3, §6 step 1). A job that finds a document of its set over its limit sets `BLOCKED: reading: <the documents>` and tells BOB, who prunes them on the tranche branch. Each set is defined in advance, by the role and by the module's own requirements (its **Uses** names the services it calls), so no session decides what to skip while reading.

**Limits.** The limits of the documents every session reads whole are fixed here and measured by `proc status` and `proc takeover`, which list each document over its limit (`SIZE`) and each of BOB's two documents above 95 % of its limit (`NEAR`) for BOB to prune; no session's command is refused for another's document (bio K5123): `build/rulings-active.md` at most 80 lines and 25,600 bytes; `build/handoff.md` at most 25,600 bytes; every text file under `build/plan/` outside `build/plan/archive/` at most 51,200 bytes. A fix round's plan is one file, moved whole to `build/plan/archive/` when the round ends. The session that makes a document grow past its limit prunes it in the same act: removing history and what is stated elsewhere, keeping every binding word, or moving finished material whole to the archive. BOB sets the limit of any other kind of set as a ruling and measures it before the job starts (§5.3).

**When a set is over its limit**, BOB fixes it before the session starts, in this order:
1. trim the documents: remove history and anything stated elsewhere, keeping every binding word;
2. split the document or the module, so each part is read whole by those who need it (P6);
3. for what is still too large, a summary for that task only. Its helpers are given the work the summary serves: the job's entries, the requirements it changes, and the stages after it that will rely on the job's result. They read the sources in full and write what that work and those later stages need, each statement citing its source section. The sources stay binding, the job may read any cited section in full, and the summary is never reused for other work.

**To Bob.** Only a set still over its limit after all three, and only when BOB sees no other fix: BOB tells him what it tried, the options and a recommendation (P17).
