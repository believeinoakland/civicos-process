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
