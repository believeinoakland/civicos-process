# PROCESS-MECHANICS.md: every citation of it, before the rewrite (commit-point step 5)

Brief commit-point-5, neoProcess #5, 2026-10-29. Read-only. Paths below are relative to `/home/user/civicos-process`. Lines of `/home/user/civicos-process/PROCESS-MECHANICS.md` are written `M:<line>`.

## 1. The mechanics' sections (`M:` gives the heading line)

Title · The process mechanics (M:1; its Status paragraph, M:3, carries no section number)
§1 · Where things live (P2, P5)  [M:5]
§2 · Roles and sessions (P4, P5, P9, P13)  [M:34]
§3 · Requirements format (P5, P6, P7, P15)  [M:56]
§4 · Branches (P10, P12)  [M:74]
§5 · The tranche cycle (P10, P12, P13, P14, P18, P19)  [M:91]
§5.1 · Take over  [M:97]
§5.2 · Open a tranche and a round  [M:101]
§5.3 · Start a layer  [M:108]
§5.4 · Watch the jobs (the backstop)  [M:112]
§5.5 · Merge a job  [M:120]
§5.6 · Close a layer  [M:124]
§5.7 · Close the tranche  [M:128]
§5.8 · Refresh: handoff to a successor through ROOT  [M:138]
§5.9 · Alongside the steps (P18, P19)  [M:147]
§5.10 · A mechanical pass (P7, P8)  [M:153]
§5.11 · The hooks (P16; Bob, K5326)  [M:159]
§6 · The module job (P6, P7, P8, P11)  [M:171]
§7 · What BOB resolves, and what goes to Bob (P4, P5, P9)  [M:185]
§8 · The seven checks (P4, P7, P15, P16)  [M:202]
§9 · Rulings (P15)  [M:216]
§10 · Metrics (P14)  [M:226]
§11 · Release (P11)  [M:236]
§12 · Legacy modules and the snapshot (P4, P6, P7)  [M:240]
§12.2 · Legacy modules.  [M:242]
§12.5 · The snapshot.  [M:244]
§13 · Communication between sessions: messages, with state in git (P9, P10, P13)  [M:246]
§13.1 · Across accounts (P2, P13, P15, P17)  [M:258]
§14 · Generated artifacts (P7, P12)  [M:270]
§15 · Certifying a revision (P3)  [M:274]
§16 · Acts only Bob can approve (P17)  [M:279]
§17 · Reading sets (P6, P13, P20)  [M:289]

The seven checks of §8 are numbered list items, not headings, and are cited as §8.1 to §8.7 (M:205 to M:212):
§8.1 · Architecture  [M:205]
§8.2 · Coverage  [M:206]
§8.3 · Ownership  [M:207]
§8.4 · Format  [M:208]
§8.5 · Channels  [M:210]
§8.6 · Words  [M:211]
§8.7 · Fixtures  [M:212]

The file has no §12.1, §12.3, §12.4 and no heading numbered below §12.2 under §12 (M:240 to M:244 hold only §12, §12.2, §12.5).

## 2. Citations, one line per citation (<file>:<line> · §<n> · words around it)

Marks: `[bare]` = written as a bare `§n` on the same line as, or in direct continuation of, a mechanics citation, with no word "mechanics" next to it (read as the mechanics by context; counted, flagged). `§-` = names the file or "mechanics sections" with no section number. A line citing several sections gets one line per section.

CLAUDE.md:3 · §- · The principles (`PROCESS-DESIGN.md`) and the mechanics (`PROCESS-MECHANICS.md`) govern both; a principle changes only with
HISTORY.md:26 · §- · ## PROCESS-MECHANICS.md (heading of the history section for that file)
HISTORY.md:107 · §2 · P13 and mechanics §2, §5.8 said BOB refreshes when its context passes
HISTORY.md:107 · §5.8 · P13 and mechanics §2, §5.8 said BOB refreshes when its context passes
HISTORY.md:107 · §15 · no path of the mechanics changes, so no dry run (P3, §15)  [bare]
HISTORY.md:111 · §2 · P13 and mechanics §2, §5.8 said BOB refreshes when its context passes "half of its context window"
HISTORY.md:111 · §5.8 · P13 and mechanics §2, §5.8 said BOB refreshes when its context passes "half of its context window"
HISTORY.md:111 · §6 · A job's own threshold (half its window, §6.1, roles/JOB.md) is unchanged (written §6.1; no such heading, it is §6 step 1)  [bare]
HISTORY.md:111 · §15 · no path of the mechanics changes, so no dry run (P3, §15)  [bare]
HISTORY.md:119 · §5.10 · mechanics §5.10 the pass, §5.7 step 0 the completion round, §5.2 (1)
HISTORY.md:119 · §5.7 · mechanics §5.10 the pass, §5.7 step 0 the completion round, §5.2 (1) (written "step 0"; §5.7 now has steps 1-6)
HISTORY.md:119 · §5.2 · §5.7 step 0 the completion round, §5.2 (1) no tranche opens while the words check finds anything
HISTORY.md:119 · §6 · §6 (4) and §7 routing by P19's three reasons, §8.4's next.md clause
HISTORY.md:119 · §7 · §6 (4) and §7 routing by P19's three reasons, §8.4's next.md clause
HISTORY.md:119 · §8.4 · §7 routing by P19's three reasons, §8.4's next.md clause and §8.6 the words check
HISTORY.md:119 · §8.6 · §8.4's next.md clause and §8.6 the words check (`checks/words.mjs`, bio K3922)
README.md:10 · §- · `PROCESS-MECHANICS.md` | how the principles are carried out, approved by Bob
README.md:11 · §2 · the standing instructions each role reads first (mechanics §2, §5, §6)
README.md:11 · §5 · the standing instructions each role reads first (mechanics §2, §5, §6)
README.md:11 · §6 · the standing instructions each role reads first (mechanics §2, §5, §6)
README.md:12 · §8 · `checks/` | the five checks (mechanics §8), with their tests; see `checks/README.md`
README.md:13 · §13 · `tools/mail.mjs` | the mailboxes between sessions (mechanics §13), with its tests
README.md:14 · §15 · `dryrun/` | the toy product that certifies a revision (mechanics §15)
checks/README.md:3 · §8 · PROCESS-MECHANICS §8: the only process tooling. Each takes the product repository's root
checks/README.md:14 · §6 · requires the K164 grammar exactly (mechanics §6, §10, §13): envelopes with ids
checks/README.md:14 · §10 · requires the K164 grammar exactly (mechanics §6, §10, §13): envelopes with ids
checks/README.md:14 · §13 · requires the K164 grammar exactly (mechanics §6, §10, §13): envelopes with ids
checks/README.md:43 · §8.7 · The text of PROCESS-MECHANICS §8 item 7 is in place.
checks/README.md:53 · §1 · "exactly one owner" (P4, mechanics §1) is read as
checks/architecture.mjs:1 · §8.1 · // Check 1, architecture (PROCESS-MECHANICS §8.1; P4): every product file is in exactly one
checks/cert/records.mjs:1 · §2 · (dryrun/cert/SUITE.md §0, §4 item 2; PROCESS-MECHANICS §2, §6, (the list may continue on line 2, outside the grep)
checks/cert/records.mjs:1 · §6 · (dryrun/cert/SUITE.md §0, §4 item 2; PROCESS-MECHANICS §2, §6, (the list may continue on line 2, outside the grep)
checks/cert/rules-current.mjs:1 · §- · The process protocol as PROCESS-MECHANICS.md and roles/*.md state it today (bio K164
checks/cert/rules-revised.mjs:1 · §- · The process protocol as the K164 revision of PROCESS-MECHANICS.md and roles/*.md states it
checks/channels.mjs:1 · §8.5 · The channels check (PROCESS-MECHANICS §8.5, §13.1; P15; bio K954): over each mail branch's history
checks/channels.mjs:1 · §13.1 · The channels check (PROCESS-MECHANICS §8.5, §13.1; P15; bio K954): over each mail branch's history
checks/coverage.mjs:1 · §8.2 · // Check 2, coverage (PROCESS-MECHANICS §8.2; P7): every live requirement id of a module
checks/format.mjs:1 · §8.4 · // Check 4, format (PROCESS-MECHANICS §8.4; P4, P5, P15): the build state's files parse
checks/format.mjs:7 · §8.4 · Also (P19, mechanics §8.4; bio K3923): every entry of `build/plan/next.md` names one of
checks/format.mjs:8 · §8.4 · Also (P19, mechanics §8.4; bio K5015): in `build/plan/current.md`, the running fix round's plan file(s)
checks/format.mjs:47 · §16 · The approvals revision (bio K1177, `next.md` P1; P15, P17, mechanics §16): a ruling records Bob's approval
checks/format.mjs:80 · §8.4 · P19, mechanics §8.4 (bio K3923): "An entry added to `next.md` while a tranche runs
checks/format.mjs:100 · §8.4 · P19, mechanics §8.4 (bio K5015): a line that defers work, outside `next.md`, cites `next.md`.
checks/format.mjs:319 · §3 · Requirements files: one per module, the sections of mechanics §3, each id once.
checks/lib.mjs:1 · §1 · Shared reading of a product repository's build state (PROCESS-MECHANICS §1, §8).
checks/lib.mjs:1 · §8 · Shared reading of a product repository's build state (PROCESS-MECHANICS §1, §8).
checks/lib.mjs:11 · §14 · The product's generated artifacts (mechanics §14): rows of build/manifest.md's table
checks/lib.mjs:38 · §1 · Ruling (BOB #38, 2026-09-26): "exactly one owner" (P4, mechanics §1) is read as
checks/ownership.mjs:1 · §8.3 · Check 3, ownership (PROCESS-MECHANICS §8.3, §6; P7): a module job's diff touches only its module's
checks/ownership.mjs:1 · §6 · Check 3, ownership (PROCESS-MECHANICS §8.3, §6; P7): a module job's diff touches only its module's
checks/ownership.mjs:2 · §14 · a generated artifact the manifest lists (mechanics §14) is not judged. The one exception (mechanics §12.2)
checks/ownership.mjs:2 · §12.2 · The one exception (mechanics §12.2): a module extracted
checks/ownership.mjs:168 · §14 · A generated artifact (mechanics §14) is no module's hand-written code: its committed copy
checks/test/channels.test.mjs:1 · §13.1 · The cross-account channel (PROCESS-MECHANICS §13.1; bio K954): tools/mail.mjs's x-commands and checks/channels.mjs
checks/test/channels.test.mjs:16 · §13.1 · const REGISTRY = `# Channels (PROCESS-MECHANICS §13.1)
checks/test/checks.test.mjs:447 · §8.4 · P19, mechanics §8.4 (bio K3923): an entry of next.md names one of P19's hard reasons
checks/test/checks.test.mjs:465 · §8.4 · P19, mechanics §8.4 (bio K5015): a line of current.md, of the running fix round's plan file
checks/test/mail-open.test.mjs:1 · §5.4 · A COMPLETE job behind BOB's newest entry reads OPEN (mechanics §5.4, §5.5; bio K5171
checks/test/mail-open.test.mjs:1 · §5.5 · A COMPLETE job behind BOB's newest entry reads OPEN (mechanics §5.4, §5.5; bio K5171
checks/test/running-cap.test.mjs:1 · §5.4 · The RUNNING window's cap and the QUIET rule (mechanics §5.4, §6; bio K4976): a dropped container
checks/test/running-cap.test.mjs:1 · §6 · The RUNNING window's cap and the QUIET rule (mechanics §5.4, §6; bio K4976): a dropped container
lane-neoprocess/COMMIT-POINT.md:7 · §- · `checks/*.mjs` (which name `proc.mjs` and mechanics sections in their text); also names `PROCESS-MECHANICS.md` (58 KB) as part of the old process
lane-neoprocess/COMMIT-POINT.md:15 · §- · `PROCESS-MECHANICS.md` is rewritten... Every citation `mechanics §n` in the checks' text, the tests and the design files is re-pointed (generic, no section number)
lane-neoprocess/PERMISSIONS.md:16 · §16 · The old process's struggle (mechanics §16; situations/refused.md; K1702, K4696, K5120, K5293)
lane-neoprocess/PROTOCOL.md:22 · §7 · what BOB resolves itself and what goes to Bob (mechanics §7); messages carry the words
lane-neoprocess/PROTOCOL.md:22 · §13 · messages carry the words and git carries the state (§13); a decision is recorded once  [bare]
lane-neoprocess/PROTOCOL.md:49 · §7 · Answer itself when the request is BOB's by mechanics §7: wording of a requirement without a change
lane-neoprocess/SESSIONS.md:7 · §5.3 · "the cheapest able" (mechanics §5.3) is retired. Measured per row (§10 metrics)
lane-neoprocess/SESSIONS.md:7 · §10 · "the cheapest able" (mechanics §5.3) is retired. Measured per row (§10 metrics) and revised by BOB  [bare]
lane-neoprocess/SESSIONS.md:40 · §2 · BOB at 40 % of its window (Bob, bio K3671 lineage; mechanics §2), a job or a lane
lane-neoprocess/SESSIONS.md:40 · §6 · a job or a lane at half (§6), ROOT at 55 % (§2)  [bare]
lane-neoprocess/SESSIONS.md:40 · §2 · a job or a lane at half (§6), ROOT at 55 % (§2). The successor continues from git  [bare]
lane-neoprocess/SESSIONS.md:82 · §17 · The old limit (mechanics §17: 25,600 bytes) is retired.
lane-neoprocess/SESSIONS.md:84 · §17 · else `BLOCKED: reading` and BOB prunes (mechanics §17); a lane's area canon
lane-neoprocess/n1/overlay/build/requirements/alpha.md:3 · §15 · **Status** · The dry run's toy module (PROCESS-MECHANICS §15).
lane-neoprocess/n1/overlay/build/requirements/beta.md:3 · §15 · **Status** · The dry run's toy module (PROCESS-MECHANICS §15).
lane-neoprocess/n1/overlay/build/requirements/stats.md:3 · §15 · **Status** · The dry run's toy module (PROCESS-MECHANICS §15). Extracted from `legacy`
lane-neoprocess/rulebooks/design.md:6 · §7 · answer it (BOB's by mechanics §7), ask the lane that owns the area, or bring it to Bob
lane-neoprocess/rulebooks/design.md:11 · §7 · (P15, P5; DESIGN-STAGE §2, mechanics §7) BOB'S · CODE: `proc ask close` refuses without
lane-neoprocess/rulebooks/governance.md:9 · §15 · with the check that will prove it. A meaningful flaw stops product work until then. (P3; mechanics §15; K111)
lane-neoprocess/rulebooks/governance.md:11 · §9 · (P15; mechanics §9; DESIGN-STAGE §3; K3676) BOB'S · CODE: `proc ask close` and `proc ruling`
lane-neoprocess/rulebooks/governance.md:13 · §16 · BOB tells Bob in one line and never approves for him (P17; mechanics §16) YOURS · CODE
lane-neoprocess/rulebooks/release.md:14 · §5.7 · each entry deferred with its P19 reason, work left, cost and footprint (P14, P19; mechanics §5.7) BOB'S
lane-neoprocess/rulebooks/repository.md:7 · §13.1 · (P7, P12, P18; JOB-LIFE §4, §11; mechanics §13.1) BOB'S · CODE: the hooks; `proc merge`
lane-neoprocess/rulebooks/repository.md:11 · §14 · (P7, P12; JOB-LIFE §4, mechanics §14) BOB'S · CODE: the gate; the ownership check
lane-neoprocess/rulebooks/repository.md:12 · §4 · the tool fetches older history only when a step needs it. (P13; mechanics §4) BOB'S
lane-neoprocess/rulebooks/repository.md:13 · §5.11 · (P16, P17; mechanics §5.11, §16; K1702) YOURS · CODE: `proc shims`; the platform refuses
lane-neoprocess/rulebooks/repository.md:13 · §16 · (P16, P17; mechanics §5.11, §16; K1702) YOURS · CODE: `proc shims`; the platform refuses
lane-neoprocess/rulebooks/repository.md:14 · §16 · since the proxy refuses a session's write of settings. (P17; mechanics §16, K4696; PRODUCT-SUPPLIES)
lane-neoprocess/rulebooks/requirements.md:13 · §12.2 · a legacy module retires when empty. (P4, P7; mechanics §12.2) BOB'S · CODE: the ownership check
lane-process-redesign/CHARTER.md:11 · §- · This repository's `PROCESS-DESIGN.md`, `PROCESS-MECHANICS.md`, `roles/BOB.md`, `roles/JOB.md`, `roles/ROOT.md`
lane-process-redesign/CHARTER.md:21 · §15 · 5. Certify (P3, mechanics §15): a dry run in `dryrun/`, recorded in `dryrun/RUNS.md`.
lane-process-redesign/DESIGN.md:26 · §6 · or its context is past half its window (mechanics §6), and the fresh one continues from the job's record
lane-process-redesign/DESIGN.md:58 · §15 · ## 5. Certification (P3, mechanics §15)
lane-process-redesign/DISPOSITION.md:5 · §- · `M§n`: `PROCESS-MECHANICS.md`. In bio: `CLAUDE.md`; `manifest`; `ra§n` (defines the alias M§n for it; no section number)
lane-process-redesign/HANDOFF.md:17 · §13 · mechanics §13's premise ("session-to-session messaging reaches no cloud session", so a routine is a doorbell
lane-process-redesign/HANDOFF.md:38 · §- · **The mechanics' text** (`PROCESS-MECHANICS.md` on this branch) brought in line with what D19/D20 proved:
lane-process-redesign/HANDOFF.md:38 · §2 · brought in line with what D19/D20 proved: §2 (ROOT woken by message and by a BOB's child-session event; no WATCH)  [bare]
lane-process-redesign/HANDOFF.md:38 · §5 · §5 (each procedure by its `proc` command; rounds, DESIGN §2.1), §6 (the job by `proc job …`)  [bare]
lane-process-redesign/HANDOFF.md:38 · §6 · §5 (each procedure by its `proc` command; rounds, DESIGN §2.1), §6 (the job by `proc job …`)  [bare]
lane-process-redesign/HANDOFF.md:38 · §10 · §10 (rows by `proc job archived`, `proc bob archived`), §13 (messages and state, replacing doorbell  [bare]
lane-process-redesign/HANDOFF.md:38 · §13 · §13 (messages and state, replacing doorbell, mailbox and cursor; §13.1 unchanged), §14 (artifacts at every merge  [bare]
lane-process-redesign/HANDOFF.md:38 · §13.1 · (messages and state, replacing doorbell, mailbox and cursor; §13.1 unchanged), §14  [bare]
lane-process-redesign/HANDOFF.md:38 · §14 · §14 (artifacts at every merge and layer close), §17's limits kept.  [bare]
lane-process-redesign/HANDOFF.md:38 · §17 · §14 (artifacts at every merge and layer close), §17's limits kept. `roles/*.md` and `situations/*.md`  [bare]
lane-process-redesign/HANDOFF.md:45 · §- · **Step 1, the mechanics** (`PROCESS-MECHANICS.md` on this branch): §1, §2, §5 (each step a `proc` command
lane-process-redesign/HANDOFF.md:45 · §1 · (`PROCESS-MECHANICS.md` on this branch): §1, §2, §5 (each step a `proc` command; §5.11 the hooks)  [bare]
lane-process-redesign/HANDOFF.md:45 · §2 · (`PROCESS-MECHANICS.md` on this branch): §1, §2, §5 (each step a `proc` command; §5.11 the hooks)  [bare]
lane-process-redesign/HANDOFF.md:45 · §5 · §1, §2, §5 (each step a `proc` command; §5.11 the hooks), §6, §10, §13  [bare]
lane-process-redesign/HANDOFF.md:45 · §5.11 · §5 (each step a `proc` command; §5.11 the hooks), §6, §10, §13  [bare]
lane-process-redesign/HANDOFF.md:45 · §6 · (each step a `proc` command; §5.11 the hooks), §6, §10, §13 (messages and state  [bare]
lane-process-redesign/HANDOFF.md:45 · §10 · (each step a `proc` command; §5.11 the hooks), §6, §10, §13 (messages and state  [bare]
lane-process-redesign/HANDOFF.md:45 · §13 · §6, §10, §13 (messages and state; §13.1 unchanged), §14, §16, §17 rewritten  [bare]
lane-process-redesign/HANDOFF.md:45 · §13.1 · §13 (messages and state; §13.1 unchanged), §14, §16, §17 rewritten  [bare]
lane-process-redesign/HANDOFF.md:45 · §14 · §13 (messages and state; §13.1 unchanged), §14, §16, §17 rewritten. `mail.mjs` marked retired  [bare]
lane-process-redesign/HANDOFF.md:45 · §16 · §13 (messages and state; §13.1 unchanged), §14, §16, §17 rewritten. `mail.mjs` marked retired  [bare]
lane-process-redesign/HANDOFF.md:45 · §17 · §13 (messages and state; §13.1 unchanged), §14, §16, §17 rewritten. `mail.mjs` marked retired  [bare]
lane-process-redesign/HANDOFF.md:60 · §4 · fixture test, 243/243); mechanics §4 "History on demand"; `situations/merge-close.md` (run
lane-process-redesign/HANDOFF.md:65 · §10 · (RD29); mechanics §10 "the repository is a ledger, not a mailbox".
lane-process-redesign/HANDOFF.md:119 · §9 · commits the files the ruling owes with it (mechanics §9). The format check refuses an id given twice
lane-process-redesign/evidence-pre-decline-practice.md:61 · §- · The practice, step by step (roles/BOB.md, roles/JOB.md and PROCESS-MECHANICS.md as at civicos-process `d547b03`
lane-process-redesign/evidence-pre-decline-practice.md:78 · §- · | PROCESS-MECHANICS.md | 47,128 | 49,516 | 49,784 | 54,194 | (size table row)
situations/messages.md:8 · §17 · reading: trim or split the document (mechanics §17), then message the job.
situations/messages.md:10 · §4 · A provider's change is merged first, then its users told (mechanics §4).
situations/refused.md:1 · §16 · # Situation: any refusal (P17; mechanics §16)
situations/round.md:6 · §17 · Keep a round's plan under 51,200 bytes (mechanics §17); a larger set is two rounds.
situations/takeover.md:5 · §10 · (`archive_session` returns its usage; mechanics §10); a routine of its still listed after that
tools/hooks.mjs:30 · §17 · P20: a document of a fixed reading set (mechanics §17) is read whole: a Read with an offset
tools/hooks.mjs:35 · §17 · a document too large to read whole is `BLOCKED: reading` (mechanics §17)
tools/hooks.mjs:51 · §4 · the tranche reaches main only by its close PR (mechanics §4, §5.7)
tools/hooks.mjs:51 · §5.7 · the tranche reaches main only by its close PR (mechanics §4, §5.7)
tools/hooks.mjs:57 · §5.5 · which runs every gate (mechanics §5.5)
tools/hooks.mjs:60 · §5.11 · 'a job starts no session and arms no timer (mechanics §5.11)'
tools/hooks.mjs:73 · §5.7 · a product PR is merged only at the tranche close, once the plan reads CLOSING (mechanics §5.7)
tools/mail.mjs:1 · §13 · RETIRED IN PART by the process redesign (PROCESS-MECHANICS §13, revised; lane-process-redesign/DESIGN.md §2.3)
tools/mail.mjs:6 · §13 · The mailboxes between BOB and a module job (PROCESS-MECHANICS §13; bio K168).
tools/mail.mjs:63 · §6 · mechanics §6 (bio K4976): a RUNNING window is at most this far ahead; a longer run is split
tools/mail.mjs:65 · §5.4 · mechanics §5.4 (bio K4976): QUIET is a job WORKING with no push for QUIET_MS
tools/mail.mjs:218 · §17 · 'prune them now (mechanics §17).'
tools/mail.mjs:293 · §6 · --running takes 1 to RUNNING_MAX_MIN minutes (mechanics §6): split a longer run into pieces
tools/mail.mjs:294 · §6 · RUNNING is set only by --running <minutes> --what <command> (mechanics §6)
tools/neo.mjs:278 · §13 · the message begins QUESTION or REPORT (mechanics §13)
tools/neo.mjs:586 · §16 · The session then carries on with what does not depend on the act (mechanics §16).
tools/neo.mjs:1111 · §14 · The artifacts regenerated and verified (mechanics §14): { changed, stale }. Nothing is committed here.
tools/proc.mjs:213 · §17 · prune ${...} under its limit (mechanics §17): ${s}
tools/proc.mjs:217 · §17 · documents over or near their limits (mechanics §17: listed for
tools/proc.mjs:383 · §14 · is regenerated and verified at each merge, in the manifest's order, and committed with it (mechanics §14).
tools/proc.mjs:414 · §9 · the files a ruling owes (requirements folded, next.md entries; mechanics §9) are committed with it.
tools/proc.mjs:436 · §14 · has a Generated artifacts section but no row ... (mechanics §14)
tools/proc.mjs:440 · §14 · every artifact path put back to HEAD, so a job never commits one (mechanics §14;
tools/proc.mjs:579 · §8 · The checks a module's work answers for (mechanics §8), scoped to the module where the check takes one.
tools/proc.mjs:730 · §6 · mechanics §6 step 5 whole: tests, checks, the report, COMPLETE, pushed; then the message to send.
tools/proc.mjs:767 · §8 · mechanics §8: format, architecture, coverage, fixtures, and words where the product has a word table
tools/test/mail.test.mjs:210 · §17 · /prune them now \(mechanics §17\)/.test(e.message)
tools/test/neo.test.mjs:199 · §7 · reason: 'wording only (mechanics §7)'
tools/test/proc.test.mjs:215 · §17 · status lists a document over its limit for BOB to prune (mechanics §17); takeover owes the prune

## 3. Table: each cited § as written, count, files

| § | heading | citations | of which bare | files (lines) |
| --- | --- | --- | --- | --- |
| §1 | Where things live (P2, P5) | 4 | 1 | checks/README.md (53); checks/lib.mjs (1,38); lane-process-redesign/HANDOFF.md (45) |
| §2 | Roles and sessions (P4, P5, P9, P13) | 8 | 3 | HISTORY.md (107,111); README.md (11); checks/cert/records.mjs (1); lane-neoprocess/SESSIONS.md (40,40); lane-process-redesign/HANDOFF.md (38,45) |
| §3 | Requirements format (P5, P6, P7, P15) | 1 | 0 | checks/format.mjs (319) |
| §4 | Branches (P10, P12) | 4 | 0 | lane-neoprocess/rulebooks/repository.md (12); lane-process-redesign/HANDOFF.md (60); situations/messages.md (10); tools/hooks.mjs (51) |
| §5 | The tranche cycle (P10, P12, P13, P14, P18, P19) | 3 | 2 | README.md (11); lane-process-redesign/HANDOFF.md (38,45) |
| §5.2 | Open a tranche and a round | 1 | 0 | HISTORY.md (119) |
| §5.3 | Start a layer | 1 | 0 | lane-neoprocess/SESSIONS.md (7) |
| §5.4 | Watch the jobs (the backstop) | 3 | 0 | checks/test/mail-open.test.mjs (1); checks/test/running-cap.test.mjs (1); tools/mail.mjs (65) |
| §5.5 | Merge a job | 2 | 0 | checks/test/mail-open.test.mjs (1); tools/hooks.mjs (57) |
| §5.7 | Close the tranche | 4 | 0 | HISTORY.md (119); lane-neoprocess/rulebooks/release.md (14); tools/hooks.mjs (51,73) |
| §5.8 | Refresh: handoff to a successor through ROOT | 2 | 0 | HISTORY.md (107,111) |
| §5.10 | A mechanical pass (P7, P8) | 1 | 0 | HISTORY.md (119) |
| §5.11 | The hooks (P16; Bob, K5326) | 3 | 1 | lane-neoprocess/rulebooks/repository.md (13); lane-process-redesign/HANDOFF.md (45); tools/hooks.mjs (60) |
| §6 | The module job (P6, P7, P8, P11) | 15 | 4 | HISTORY.md (111,119); README.md (11); checks/README.md (14); checks/cert/records.mjs (1); checks/ownership.mjs (1); checks/test/running-cap.test.mjs (1); lane-neoprocess/SESSIONS.md (40); lane-process-redesign/DESIGN.md (26); lane-process-redesign/HANDOFF.md (38,45); tools/mail.mjs (63,293,294); tools/proc.mjs (730) |
| §7 | What BOB resolves, and what goes to Bob (P4, P5, P9) | 6 | 0 | HISTORY.md (119); lane-neoprocess/PROTOCOL.md (22,49); lane-neoprocess/rulebooks/design.md (6,11); tools/test/neo.test.mjs (199) |
| §8 | The seven checks (P4, P7, P15, P16) | 5 | 0 | README.md (12); checks/README.md (3); checks/lib.mjs (1); tools/proc.mjs (579,767) |
| §8.1 | Architecture | 1 | 0 | checks/architecture.mjs (1) |
| §8.2 | Coverage | 1 | 0 | checks/coverage.mjs (1) |
| §8.3 | Ownership | 1 | 0 | checks/ownership.mjs (1) |
| §8.4 | Format | 8 | 0 | HISTORY.md (119); checks/format.mjs (1,7,8,80,100); checks/test/checks.test.mjs (447,465) |
| §8.5 | Channels | 1 | 0 | checks/channels.mjs (1) |
| §8.6 | Words | 1 | 0 | HISTORY.md (119) |
| §8.7 | Fixtures | 1 | 0 | checks/README.md (43) |
| §9 | Rulings (P15) | 3 | 0 | lane-neoprocess/rulebooks/governance.md (11); lane-process-redesign/HANDOFF.md (119); tools/proc.mjs (414) |
| §10 | Metrics (P14) | 6 | 3 | checks/README.md (14); lane-neoprocess/SESSIONS.md (7); lane-process-redesign/HANDOFF.md (38,45,65); situations/takeover.md (5) |
| §12.2 | Legacy modules. | 2 | 0 | checks/ownership.mjs (2); lane-neoprocess/rulebooks/requirements.md (13) |
| §13 | Communication between sessions: messages, with state in git (P9, P10, P13) | 9 | 3 | README.md (13); checks/README.md (14); lane-neoprocess/PROTOCOL.md (22); lane-process-redesign/HANDOFF.md (17,38,45); tools/mail.mjs (1,6); tools/neo.mjs (278) |
| §13.1 | Across accounts (P2, P13, P15, P17) | 6 | 2 | checks/channels.mjs (1); checks/test/channels.test.mjs (1,16); lane-neoprocess/rulebooks/repository.md (7); lane-process-redesign/HANDOFF.md (38,45) |
| §14 | Generated artifacts (P7, P12) | 10 | 2 | checks/lib.mjs (11); checks/ownership.mjs (2,168); lane-neoprocess/rulebooks/repository.md (11); lane-process-redesign/HANDOFF.md (38,45); tools/neo.mjs (1111); tools/proc.mjs (383,436,440) |
| §15 | Certifying a revision (P3) | 9 | 2 | HISTORY.md (107,111); README.md (14); lane-neoprocess/n1/overlay/build/requirements/alpha.md (3); lane-neoprocess/n1/overlay/build/requirements/beta.md (3); lane-neoprocess/n1/overlay/build/requirements/stats.md (3); lane-neoprocess/rulebooks/governance.md (9); lane-process-redesign/CHARTER.md (21); lane-process-redesign/DESIGN.md (58) |
| §16 | Acts only Bob can approve (P17) | 8 | 1 | checks/format.mjs (47); lane-neoprocess/PERMISSIONS.md (16); lane-neoprocess/rulebooks/governance.md (13); lane-neoprocess/rulebooks/repository.md (13,14); lane-process-redesign/HANDOFF.md (45); situations/refused.md (1); tools/neo.mjs (586) |
| §17 | Reading sets (P6, P13, P20) | 13 | 2 | lane-neoprocess/SESSIONS.md (82,84); lane-process-redesign/HANDOFF.md (38,45); situations/messages.md (8); situations/round.md (6); tools/hooks.mjs (30,35); tools/mail.mjs (218); tools/proc.mjs (213,217); tools/test/mail.test.mjs (210); tools/test/proc.test.mjs (215) |

Without a section number (13 entries, whole document or generic): CLAUDE.md:3; HISTORY.md:26; README.md:10; checks/cert/rules-current.mjs:1; checks/cert/rules-revised.mjs:1; lane-neoprocess/COMMIT-POINT.md:7; lane-neoprocess/COMMIT-POINT.md:15; lane-process-redesign/CHARTER.md:11; lane-process-redesign/DISPOSITION.md:5; lane-process-redesign/HANDOFF.md:38; lane-process-redesign/HANDOFF.md:45; lane-process-redesign/evidence-pre-decline-practice.md:61; lane-process-redesign/evidence-pre-decline-practice.md:78.

Totals: 156 entries over 109 matched lines in 45 files; 143 carry a section number (26 of them bare), 13 carry none.

## 4. Sections never cited (exact number, from the lines above)

§5.1 · Take over  [M:97] (parent cited: §5)
§5.6 · Close a layer  [M:124] (parent cited: §5)
§5.9 · Alongside the steps (P18, P19)  [M:147] (parent cited: §5)
§11 · Release (P11)  [M:236]
§12 · Legacy modules and the snapshot (P4, P6, P7)  [M:240] (its parts cited: §12.2)
§12.5 · The snapshot.  [M:244]

Sections cited only by [bare] lines (none of the cited sections depends on them alone):
(none)

## 5. Notes the rewrite should know (each with its file:line)

- Citations the prescribed search could not return: it matches only `mechanics §n`, `§n of the mechanics` and `PROCESS-MECHANICS`. A citation worded otherwise (`M§n` alias defined at lane-process-redesign/DISPOSITION.md:5; "the mechanics' §n"; a bare `§n` on a line with none of those words) is not in section 2. No file under `roles/` appeared in the search output at all.
- `checks/cert/records.mjs:1`: the citation list ends in a comma after `§6,`, so it may continue on line 2. Line 2 was not returned by the prescribed grep and was not read; the sections it names, if any, are not counted. Needed to be sure: `sed -n 2p checks/cert/records.mjs` (not run).
- Skipped by the brief: node_modules, lane-neoprocess/rulebooks/work, checks/test/fixtures, dryrun/ (the first `-l` search also listed files there; none was grepped).
- The mechanics' own internal cross-references (for example "§5.7 step 3" at M:83) are outside the search and not counted.
- Citations to a part that is not a heading of the current text: HISTORY.md:111 cites `§6.1` (counted under §6; the text has "§6" step 1, M:175); HISTORY.md:119 cites "§5.7 step 0" and "§5.7 (0)" (counted under §5.7; §5.7 now numbers steps 1 to 6, M:130 to M:136); checks/README.md:43 cites "§8 item 7" (counted as §8.7, M:212).
- Numbers that disagree with the current text: README.md:12 says "the five checks (mechanics §8)" while §8 is "The seven checks" (M:202); the rewrite should keep §8's numbering (8.1 to 8.7) or re-point checks/architecture.mjs:1, coverage.mjs:1, ownership.mjs:1, channels.mjs:1, format.mjs:1 and the rest of the §8.n lines.
- Section 12 has its heading (M:240) but the only cited parts are §12.2 (ownership.mjs:2, rulebooks/requirements.md:13); §12.5 (M:244) and §11 (M:236) are cited nowhere in the searched files.
- Not obeyed, by the brief's own words ("Read whole, and nothing else"): the project CLAUDE.md of neoprocess-dryrun tells a session to invoke `/neoprocess <role>` first; this brief names no role and says read nothing else, so it was not invoked. No hook refused any call.

DONE commit-point-5 · sections, citations, table, uncited
