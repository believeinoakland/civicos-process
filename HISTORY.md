# Revision history, provenance and measurements

Not read in normal work. Read only when a rule's origin or evidence matters (P15: a ruling is not reopened without new evidence).

Each item below was moved, verbatim, out of the operative documents on 2026-10-01 (BOB #89, on Bob's direction "Archive the revision history so that it's not read unless it's necessary"). The rule it belonged to stays in its document; only its history, provenance or measurement is here. "bio K…" and "K…" are rulings in the product's `build/rulings.md`; "D…" are dry runs in `dryrun/RUNS.md` and `dryrun/CERTIFICATION.md`.

## PROCESS-DESIGN.md

### Status (the whole paragraph as it stood)

**Status** · APPROVED by Bob 2026-09-25, as written by BOB #36 from his direction in BOB's session that day. AMENDED and APPROVED the same day: P10 carries Bob's rule that a layer's jobs run concurrently, and P12 the tranche branch. AMENDED by Bob 2026-09-26: P17, the working relationship, which governs every other principle's "with Bob"; and P18, the pipeline. AMENDED by Bob 2026-10-01: P19, a plan is written from the work that remains (proposed by BOB #85). These principles REPLACE the current process wholly; nothing in the old process survives unless it is derived from them. Their home is this repository, `believeinoakland/civicos-process` (P2), since 2026-09-26; until then they sat on the branch `land/bob/process-design` of `believeinoakland/bio`. The restore point before the replacement is the branch `snapshot/pre-refactor-2026-09-25` (5b9c2643): its tree is `main` @ 95fe7bc7, and its parents are every branch tip of that moment, all kept reachable. Tags could not be pushed from the cloud (HTTP 403).

### P17

- (Bob, 2026-09-26: this working relationship is remembered and followed at all times, in all situations.) — the attribution "Bob, 2026-09-26" is moved; the rule "this working relationship is remembered and followed at all times, in all situations" stays in P17.

### P18

- (Bob, 2026-09-26.)

### P19

- (APPROVED by Bob 2026-09-30: "Yes, urgency! Add it, and live it."; his words: "development productivity is one of the highest priorities"; "don't stop", "pipeline", "go, go, go!"; "The layer level waits are proper. Complete code coverage is proper. All the safeguards in the process are proper.")
- (APPROVED by Bob 2026-10-01) — on "A plan is written from the work that remains, not from the work that is queued".

## PROCESS-MECHANICS.md

### Status (the whole paragraph as it stood)

**Status** · IN FORCE: the revision for bio K164 and K168, written by BOB #49 2026-09-27 on Bob's architecture and APPROVED by Bob 2026-09-27 (K168, K169); communication between sessions is a mailbox in git and a content-free doorbell (§13), with the tool `tools/mail.mjs`; ROOT and BOB's dead-man `WATCH` from K164/K167 (§2, §5); certified by dry run D11 (`dryrun/RUNS.md`, 2026-09-27: passed). The text in force: APPROVED by Bob 2026-09-25 (second draft, written by BOB #36). REVISED 2026-09-26 by BOB #42 (§12.2, §8.3: an extraction rewires the legacy code that called the moved code; certified by D4, `dryrun/RUNS.md`) and by BOB #38 after T1 found the mechanics incomplete (bio TRANSITION.md C14): §4, §5, §6, §10, and the new §13 (communication), §14 (generated artifacts) and §15 (certification); proven by the dry runs D1–D3 (`dryrun/RUNS.md`, `dryrun/CERTIFICATION.md`); D3's nine findings folded in the same day. REVISED 2026-09-27 by BOB #44 for the three flaws of bio ruling K111, approved by Bob (§2: a replaced BOB is archived by its successor; §10: every session's usage is read from its archive, and the self-reporting recorder is retired), and §16, acts only Bob can approve, written by Bob; certified by D6 (`dryrun/CERTIFICATION.md` A1–A4; bio K112, K113). REVISED 2026-09-27 by BOB #47 for bio K154, session depth (§2: ROOT, at depth 0, starts every BOB, so BOBs sit at depth 1 and jobs at 2, and every BOB reads its depth; §5: the backstop reads each job's record; §6, §13: a job knows its depth, and a job that cannot send lets its pushed record speak); certified by D7 (`dryrun/CERTIFICATION.md` L1–L7; `RUNS.md` D7). REVISED 2026-10-01 by BOB #87 for bio K954 (§13.1, the cross-account channel; §8.5, the channels check), approved by Bob; certified by `<D-run>`. This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P16) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2), since 2026-09-26. The product repository it is applied to is `believeinoakland/bio`.

### §2 Roles and sessions

- **Session names** (Bob, 2026-09-26).
- **Session depth is bounded (P13; bio K154).** — "bio K154" moved.
- (measured in T5: every BOB had started its successor, so BOB #46 sat at depth 7 in the chain BOB #38 → #40 → … → #46, and its job LEGACY-INDEX #3, at depth 8, could not send its COMPLETE; jobs at depth 7 could)
- **ROOT** (Bob, 2026-09-27)
- if it is running, nothing (Bob, K167).
- A session started by a routine (`create_new_session_on_fire`) has no parent but carries neither the connectors nor the session and routine tools, … (measured 2026-09-26 and in D7).
- **BOB's lifetime.** … every turn re-reads the whole context, so a large, stale context costs more per turn than a fresh session pays to re-read its working set (measured in BOB #36, 2026-09-25).

### §5 The tranche cycle

- **Watching a layer.** … BOB checks every 20 minutes while a layer runs (Bob, 2026-09-26), … since a recurring routine may fire no oftener than hourly (bio K128).
- **a wait on Bob:** … `needs_action` on a session whose record shows no other wait (measured in D6: a refused job asked in its own window and wrote nothing)
- … (a session that ends its turn waiting reads BLOCKED or COMPLETED, measured in T6 and D9). — "measured in T6 and D9" moved.
- **BOB's own liveness (Bob, K167; P13).** — "Bob, K167" moved.
- (`update_trigger` re-arms it even after it has fired, measured in D8) — "measured in D8" moved.
- if it fires, ROOT acts as §2 says (proven in D9: a BOB killed mid-layer was replaced 61 minutes later, and its successor finished the tranche).

### §8 The five checks

- 3. **Ownership:** … a line changed only by removing text from it counts as removed, not added (P7; K140). — "K140" moved.
- 5. **Channels:** … (P15; bio K954). — "bio K954" moved.

### §10 Metrics

- No session reports its own usage: a session's transcript misses what its container restarts and its workers spent (measured: the self-reporting recorder read 51.0M of BOB #43's 245.4M cache reads and 92.9M of BOB #42's 440.1M tokens), so the recorder is retired.

### §12 Starting BIO on this process

- 2. … the code that needs the moved part reaches it from a module later than the target (certified by D5, 2026-09-26: `dryrun/CERTIFICATION.md` J9).
- 2. … BOB reads that list at the layer close before merging (certified by D4, 2026-09-26: `dryrun/CERTIFICATION.md` J8).
- 5. **Batch30 is NOT landed** (Bob, 2026-09-25: no tokens for it).

The one-time transition steps of §12, moved verbatim on 2026-10-01 (K1007) when §12 was cut to the rules still live (§12.2 legacy modules, §12.5 the snapshot):

- 1. **Canon and build state.** BOB, with Bob, assembles `requirements/` from the design corpus, then drafts `manifest.md`, `layers.md`, `modules.json` and the target modules' requirements.
- 3. **Tests.** Each extracted module's job writes its requirement-named tests at its interface. Source-anchored tests are retired with the legacy code they anchor on.
- 4. **The old plan.** BOB rewrites each of the 225 open rows that affects the product as an entry against a target module, and drops the rest.
- 5. **Batch30 is NOT landed.** It stays reachable in `snapshot/pre-refactor-2026-09-25`, with all the old process's unmerged work. **Its value is judged by the requirements, not in advance:** a target module's extraction job reads the legacy and snapshot code for its module, keeps what meets its requirements, and discards the rest. The old process's own tooling is not carried forward.
- The section's heading as it stood: `## 12. Starting BIO on this process`; §1 said of the canon: "lives at `requirements/` in the product repository … For BIO, it is assembled from today's `docs/architecture/`."

### §13 Communication

- Heading: (P9, P10, P13; bio K168) — "bio K168" moved.
- **What the platform offers** (measured D1, T5–T6, D8–D9).

### §13.1 Across accounts

- Heading: (P2, P13, P15, P17; bio K954) — "bio K954" moved.
- 5. … BOB never edits `docs/development/ux-substrate/` or `docs/development/DECISIONS.md`, and keeps the design session's text in a merge conflict (K945).
- 5. … if `main` gains the number first, the branch renumbers (K473).

### §16 Acts only Bob can approve

- … an approval typed in another session does not reach it (measured in T3: LEGACY-TESTS #1 waited two hours on a retired push hook).
- Bob's approval names the act itself; an approval of a page or a list did not clear a refusal (measured 2026-09-27, BOB #44).

## roles/BOB.md

- **Watch the layer:** The backstop is a one-time routine into your own session every 20 minutes while a layer runs, re-armed at each check (K128)
- **Never idle while work remains (P18; Bob, 2026-09-26).** — "Bob, 2026-09-26" moved.
- Nothing runs unattended unless Bob asks: arm no timers, except the 20-minute backstop while a layer runs (Bob asked for it, 2026-09-26) or while your successor starts

## roles/ROOT.md

- … a session at depth 8 can start nothing, and a chain of BOBs started by BOBs reached it (bio K154).

## roles/JOB.md

Nothing moved.


## 2026-10-06 · BOB's refresh threshold (bio K1720)

P13 and mechanics §2, §5.8 said BOB refreshes when its context passes "about 2–3 times its working set"; BOBs refreshed near 330–340k of a 1M window. Bob, 2026-10-06: "I think that the point where BOB's start thinking about refreshing should be at 50% rather than ~30%". Replaced by: half of the context window, at the next point where no step is half done. A parameter of P13 set by Bob, its reason (cost) unchanged; no path of the mechanics changes, so no dry run (P3, §15).

## 2026-10-08 · BOB's refresh threshold raised (bio K2287)

P13 and mechanics §2, §5.8 said BOB refreshes when its context passes "half of its context window" (K1720). Bob, 2026-10-08: "Let's change the handover point to be at 55% rather than 50% to provide greater efficiency and continuity." Replaced by: 55% of the context window, at the next point where no step is half done. A job's own threshold (half its window, §6.1, roles/JOB.md) is unchanged. A parameter of P13 set by Bob; no path of the mechanics changes, so no dry run (P3, §15).

## 2026-10-18 · Nothing found in a tranche waits for the next (bio K3915)

P10 said "An entry that arises during a tranche goes to the **next** plan", and P19 allowed deferral for "the order" (a closed layer) and let no-behaviour work wait three tranches: together they outranked Bob's rulings (K642, K882, K1741, K3815, K3905, K3912), so work found after a layer closed slipped to the next tranche (K3913). Bob approved the exact text, rendered (2026-10-18: "approve change to principals"): P10's first bullet now adds work found to the running plan, done by the running job, an unstarted layer's START, or the tranche's completion round after the last layer; P19 defers only for Bob's pending decision, a deployment or measurement outside the tranche, or something outside the product not yet existing, each named in the tranche's report.

## 2026-10-18 · Mechanical passes; the completion round; the words check (bio K3923)

Bob approved the exact text, rendered (bio `build/plan/proposed-edits.html`, artifact DoQTeMJv89Ey4sDuarFzg2, v2 after his comment "Left out of what? Every red is fixed"): "I approve the edits to the principals". P7 gains "A mechanical change is one pass" and P8 its exception (asked by Bob, K3812, K3813, never written until now); mechanics §5.10 the pass, §5.7 step 0 the completion round, §5.2 (1) no tranche opens while the words check finds anything, §6 (4) and §7 routing by P19's three reasons, §8.4's next.md clause and §8.6 the words check (`checks/words.mjs`, bio K3922). Certification (P3) on a dry run follows before product work relies on §5.10, §5.7 (0) and §8.6.

- 2026-10-24 (bio K4976, approved by Bob in words after seeing the exact text): §6 caps a `RUNNING` window at 30 minutes, the mail tool refusing a longer one; §5.4 treats a job whose session is idle or disconnected while its record says `WORKING` or `RUNNING` as QUIET at once; `mail check`'s QUIET rule caps any window at 30 minutes from the last push (`checks/test/running-cap.test.mjs`). Cause: dropped job containers went unseen until a long RUNNING deadline passed (bio K4975).

## 2026-10-29 · The commit point: neoProcess replaces the old process (P3; lane neoProcess)

Certified on the dry run N1 (`believeinoakland/neoprocess-dryrun`, 29 Oct 2026, 05:55–14:39Z; `dryrun/N1/CERTIFICATION.md`: every row PROVEN or naming its product run; `lane-neoprocess/DRYRUN.md`: twenty-one flaws found by the run, each fixed with a test). The restore point before the commit point is the lane's branch tip `ed935a8` (`claude/modest-brahmagupta-vvaann`, 29 Oct) over `main` @ `b3b20fc`; both kept reachable (the branch is never deleted: REP 2; tags cannot be pushed from the cloud). Step 1 (`1e36cb5`): `tools/neo.mjs` → `tools/proc.mjs`, `tools/neo-hooks.mjs` → `tools/hooks.mjs`, what the new tool took from the old into `tools/lib.mjs`; the old tool's 27 tests retired with it (the suite 289 → 262). The steps that follow are `lane-neoprocess/COMMIT-POINT.md` §2.

### Step 4 (29 Oct): `roles/ROOT.md`, `roles/BOB.md`, `roles/JOB.md` and `situations/*.md` retired

A reader (Sonnet, 29 Oct) accounted for every line of the twelve files against the ten rulebooks and the seven design files: 268 items, 168 held by a new text, 39 folded (ROOT's turn → SESSIONS §3a; the mechanical pass → JOB-LIFE §10a; BOB's backstop and the usage row's writer → PROTOCOL §7, §7a; the rest one sentence each in BLD 5, BLD 7, SES 10, USE 10, JOB-LIFE §3, §6, SESSIONS §1a, §3, §6.3, PROTOCOL §7a, §9, PRODUCT-SUPPLIES), and 61 retired on purpose because the new design replaces the mechanism, each named here with what replaces it:

- roles/ROOT.md:3 · "a session at depth 8 can start nothing" (the reason for the depths) · replaced by SES 1 (the hooks refuse any other `create_session`, so depth holds by construction); SESSIONS §6.4 (a rulebook holds no rationale)
- roles/ROOT.md:5 · the prompt names the predecessor BOB's session id · replaced by PROTOCOL §7a (the successor's first command reads the predecessor, the asks and the addresses from git)
- roles/ROOT.md:8 · "Never archive" · replaced by PERMISSIONS §2.3 reverses it (ROOT archives every BOB, the session classifier accepts only a parent archiving its child); USE 10; SES 10. Note the writer conflict above.
- roles/ROOT.md:8 · `Nothing for Bob to do.` unless it is his · replaced by GOV 2 (nothing waits on Bob; a Stop hook refuses a turn that ends waiting for him)
- roles/BOB.md:10 · "Nothing for Bob to do." unless it is his · replaced by GOV 2 (nothing waits on Bob)
- roles/BOB.md:14 · at takeover read whole: this file · replaced by SESSIONS §1a (the one skill `neoprocess bob` shows the role's reading set) and §3 (the set is the principles plus all ten rulebooks); the role file is replaced by the rulebooks
- roles/BOB.md:14 · read whole: `build/rulings-active.md` · replaced by DESIGN-STAGE §3 (it retires at the commit point; a process rule lives in its rulebook; product rulings in `build/rulings-product/`)
- roles/BOB.md:14 · read the file a situation names, whole, when the situation arises · replaced by SESSIONS §3 (BOB always reads all ten rulebooks; no situation files). The product's own situations are held by PRODUCT-SUPPLIES row "The product's own procedures".
- roles/BOB.md:18-28 · the situations table: nine rows from situation to file · replaced by SESSIONS §3 (all rulebooks always read); each file's content is accounted below
- roles/BOB.md:20 · row "a session starts as BOB" → takeover.md · replaced by PROTOCOL §7a (first command `proc takeover` reads state from git); see situations/takeover.md below
- roles/BOB.md:21 · row "opening a tranche or a round; preparing the next" → round.md · replaced by PLN 5, 9 hold the content; see situations/round.md below
- roles/BOB.md:22 · row "starting a layer; a job's session ends or fills" → layer.md · replaced by JOB-LIFE §2, §8, §9; see situations/layer.md below
- roles/BOB.md:23 · row "a message from a job; a change to a running job" → messages.md · replaced by PROTOCOL §3 to §5; see situations/messages.md below
- roles/BOB.md:24 · row "merging a job; closing a layer, a round, the tranche" → merge-close.md · replaced by JOB-LIFE §6, §10; INT 5, 7, 9; REL 1 to 3; see situations/merge-close.md below
- roles/BOB.md:25 · row "your context passes 40 %" → refresh.md · replaced by SES 5; SESSIONS §2, §6.1; PROTOCOL §7a; see situations/refresh.md below
- roles/BOB.md:26 · row "weekly limit near, or Bob says move" → account-move.md · replaced by USE 9, 10; PROTOCOL §7a; see situations/account-move.md below
- roles/BOB.md:27 · row "any refusal" → refused.md · replaced by PERMISSIONS §1 to §5; REP 10; see situations/refused.md below
- roles/BOB.md:28 · row "the same mechanical change across many modules" → mechanical-pass.md · replaced by as a pointer; see situations/mechanical-pass.md below (which has folds)
- roles/JOB.md:3 · "this file is your whole standing instruction" · replaced by SESSIONS §1a (one skill `neoprocess job`) and §3 (Module job row: principles, rulebooks Building, Integration, Sessions)
- roles/JOB.md:9 · step 1: the job is on `job/<T>/<module>` · replaced by JOB-LIFE §1 and REP 1 (fixed name `job/<module>`; the tranche id is in the plan and PR, not the branch)
- roles/JOB.md:9 · "depth is BOB's plus one" · replaced by SES 1 (depth fixed by the hooks)
- roles/JOB.md:9 · `job start` merges the tranche into the job's branch · replaced by JOB-LIFE §2 (`proc layer start` creates the branch one opening commit past the tranche tip)
- roles/JOB.md:9 · `job start` prints the START · replaced by JOB-LIFE §2 (the START is the draft PR's body)
- roles/JOB.md:12 · another module's generated artifact your change made stale: tell BOB · replaced by REP 7 and JOB-LIFE §4 (a job never commits an artifact; the gate regenerates for its run and `proc layer close` commits them once)
- roles/JOB.md:22 · a permission or safety check refuses an act on the product's code, job or tranche branch or test deployments: the owner's standing approval covers it; take it again once as one plain command · replaced by PERMISSIONS §2.2 and §2.5 (routes the checks accept by construction); REP 10 ("never worked around, split or retried"); PERMISSIONS §6 (Bob's standing approval on record)
- roles/JOB.md:22 · refused again, or another refusal only Bob can clear: `NEEDS BOB: <the one act>`, message BOB · replaced by PERMISSIONS §2.5 (`neo refused` records the refusal on the state branch; BOB routes it from the act table; only then a one-line `NEEDS BOB`)
- roles/JOB.md:22 · carry on with what does not depend on the refused act · replaced by PERMISSIONS §2.1 and REP 10 (an unpredicted refusal stops the work until the table and route are fixed)
- roles/JOB.md:25 · COMPLETE is an end state; never replace it with WAITING, because `proc merge` refuses a job that is not COMPLETE · replaced by JOB-LIFE §6 (the merge reads the PR being ready, the gate, the review and the tip, not the state line)
- roles/JOB.md:25 · end with one line `Waiting on BOB. Nothing for Bob to do.` · replaced by SESSIONS §1b (the `/goal` condition, provable from the session's output, replaces a closing line); GOV 2
- situations/account-move.md:5 · act at once, then at the next point where no step is half done (no job live; a running layer finishes or hands off first) · replaced by PROTOCOL §7a ("a refresh of everyone at once"; anything in flight is re-dispatched from briefs and records)
- situations/account-move.md:7 · step 1: spin down every lane and the UX stream by `SPIN DOWN` message; each replies `SPUN DOWN` after rewriting its HANDOFF and prompt · replaced by PROTOCOL §7a (each party is replaced from its record on the new account; no message crosses accounts)
- situations/account-move.md:7 · record each reply's commit in `LANES.md` §3 · replaced by PROTOCOL §8 (the lane register `build/lanes.md` holds each lane's status and session)
- situations/account-move.md:7 · no reply after 20 minutes and one more message: record it unanswered; its successor starts from the last pushed prompt · replaced by PROTOCOL §7a and §7c (a lane restarts from its charter and its `decisions.md`, not from a spin-down reply)
- situations/account-move.md:9 · step 2: merge every lane branch's folder, and the UX stream's last MERGE, into the tranche branch · replaced by PROTOCOL §7d (durable output is written to the tranche branch at the moment it becomes durable, by `proc ask close`); DESIGN-STAGE §3
- situations/account-move.md:11 · step 4: hand off, naming the next account, every lane and the UX stream to restart from its prompt, and the ROOT prompt · replaced by PROTOCOL §7a (`MOVING` and the target account in the plan's Status line; lanes restart from the register per §7c and §8)
- situations/account-move.md:15 · "BOB #<n> is on the <old> account and unreachable; record its routines as `--unanswered "another account"`" · replaced by PERMISSIONS §2.3 and USE 2 (no routine handshake; the old BOB is left unmeasured)
- situations/account-move.md:17 · next BOB at takeover: `proc bob cleared --unanswered "another account"` for the predecessor · replaced by PERMISSIONS §2.3 (no routine handshake); USE 2
- situations/layer.md:3 · it prints one call per job: `message` to a live session from an earlier round, then `proc job messaged` · replaced by JOB-LIFE §8 (`proc layer close` retires every job of the layer; the START is the PR body, so no live job from a closed layer is sent a START)
- situations/layer.md:3 · model: the cheapest able (Haiku for test-only, wording-only, mechanical re-points; Sonnet otherwise), passed as `model` · replaced by SESSIONS §1 ("the cheapest able" is retired; table: Opus high for jobs, Sonnet medium for purely mechanical); SES 2
- situations/layer.md:6 · idle or failed while the record reads WORKING: route a message "continue from your record" · replaced by SESSIONS §1b (the `/goal` sends back a session that ends a turn while WORKING; BOB's backstop covers later stretches as today, JOB-LIFE §9)
- situations/merge-close.md:3 · it refuses unless the record reads COMPLETE · replaced by JOB-LIFE §6 (refuses unless the PR is ready, the review is approved, the plan's order is met, the result is for the current tip and the gate concluded success)
- situations/merge-close.md:3 · undoes the merge if anything is newly red; old reds are named, never a reason to refuse · replaced by INT 3 and JOB-LIFE §6 (merges only a green tip that holds the tranche, so nothing red is merged to undo); INT 6 and BLD 7 hold the inherited-red rule
- situations/merge-close.md:3 · strikes the met `*(not yet met: T<n>)*` marks the report names · replaced by JOB-LIFE §3 and REQ 5 (the job strikes them in its own commit, the ownership check allows only that edit)
- situations/merge-close.md:3 · writes the ruling line, pushes and verifies on origin · replaced by JOB-LIFE §6 (nothing is committed at a merge beyond the merge; the ruling line per merge retires with the log); INT 1 (`proc` reads the merge from GitHub)
- situations/merge-close.md:6 · run every module's tests and the checks · replaced by REL 3 and 4 (only modules changed since their last tested merge, and their users; the full regression only at a release or when Bob asks)
- situations/messages.md:6 · a stale generated artifact as a kind of report · replaced by REP 7; JOB-LIFE §4
- situations/refresh.md:3 · write `build/handoff.md` (replaced whole, under 25,600 bytes): what is running, what is next, the few rulings the successor must read · replaced by SESSIONS §6.1 (the handoff is generated by `proc handoff` from git, at most 4 KB, never written; the 25,600-byte limit is retired); DESIGN-STAGE §3 (no ruling list to read)
- situations/refresh.md:3 · an act on `main`, another party's branch, a session or a routine goes in with the ordering step or ruling and every ruling where it was refused · replaced by PERMISSIONS §2.1 and §2.5 (acts come from the act table; refusals are recorded events); SESSIONS §6.1
- situations/refresh.md:3 · on `TAKEN OVER`, delete every routine into your own session (`list_triggers`, every page), reply `ROUTINES DELETED`, do nothing more (it archives you) · replaced by PERMISSIONS §2.3 (the parent archives; the classifier refuses a peer); USE 10; SES 10
- situations/refused.md:4 · a permission or safety check refused an act on the product's code, branches or test deployments, and the standing approval covers it: take it again once as one plain command citing that approval · replaced by PERMISSIONS §2.2 and §2.5 (routes the checks accept by construction; no retry, REP 10); PERMISSIONS §6 (the approval is on record, carried by `permissions.json`)
- situations/refused.md:5 · record `NEEDS BOB: <the one act>, <why>` in the handoff or the job's record · replaced by PERMISSIONS §2.5 (the refusal is one line on the state branch, recorded by `neo refused`)
- situations/refused.md:5 · carry on with what does not depend on it · replaced by PERMISSIONS §2.1 and REP 10 (an unpredicted refusal stops the work until fixed)
- situations/refused.md:5 · his approval is recorded as a ruling that says `approved`, cites §16, and states `standing list: added` or `not added` · replaced by PERMISSIONS §6 and REP 9 (the standing list is one file, `permissions.json`, written by `neo shims`; Bob's 29 Oct approval is on record); GOV 7 (rulings are one line)
- situations/refused.md:6 · before an act on `main` or another party's branch, search the rulings for a refusal; if one exists and no standing-list rule covers it, ask Bob first · replaced by REL 1 and REP 1 (BOB's hook refuses any push to `main`); PERMISSIONS §2.1 (the act table); DESIGN-STAGE §3 (the rulings log retires)
- situations/round.md:5 · create `tranche/T<n>` from `main` with a plain push · replaced by REP 1 and JOB-LIFE §1 (the fixed branch `tranche`, made once, fast-forwarded to `main` at each open by `neo tranche open`)
- situations/round.md:5 · write the plan's Status line by `proc takeover` · replaced by PROTOCOL §7d (the plan's Status, Jobs and Owed lines live on the state branch)
- situations/takeover.md:3 · step 1: read your depth by following `parent_session_id` with `get_session` until the session your prompt names as ROOT (you should be 1) · replaced by SES 1 (depth is fixed by the hooks on `create_session`)
- situations/takeover.md:5 · step 3: tell Bob if your depth is not 1 (P13) · replaced by SES 1
- situations/takeover.md:5 · send the predecessor `TAKEN OVER by <you>: delete every routine ... reply ROUTINES DELETED` and wait for the reply · replaced by PERMISSIONS §2.3 (the parent starts and archives; the platform's classifier refuses a peer's deletes); USE 10
- situations/takeover.md:5 · record the reply with `proc bob cleared --reply`, or `--unanswered` after one more message and 20 minutes; `proc bob archived` refuses until one is recorded · replaced by PERMISSIONS §2.3, USE 10 (no routine handshake to record)
- situations/takeover.md:6 · `QUIET`: read the session with `get_session`; idle while WORKING means it stopped, so route a message (`proc job route`) · replaced by SESSIONS §1b (the `/goal` sends a stopped session back); JOB-LIFE §9; PROTOCOL §7 (backstop and the `LATE` list)

