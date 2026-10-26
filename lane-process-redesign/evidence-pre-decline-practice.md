# CivicOS practice before the decline: what worked, with evidence

Reading worker for PROCESS-REDESIGN. Data: bio `build/rulings.md` (5,322 rulings parsed, K1-K5334), bio git history of `tranche/T51` (68,250 commits, full back to July; the snapshot branch is on origin but not fetched), `build/metrics/T36-T51.csv`, `build/jobs/T36-T51` mailboxes read from git history, civicos-process `origin/main` (77 commits) and `git show <commit>:<file>`. Rulings I rely on were read whole; others are counted by keyword and marked "count". All dates are UTC, 2026.

Measurement notes. "Job sessions started" = commits `plan T<n>: <MODULE> #k session_...`; "BOB takeovers" = commits `plan T<n>: BOB #n session_...` (or takeover rulings, whichever is higher); "merges" = commits whose subject has `merge ... job/T<n>/...` and not "into job/" (an undercount for T46, whose merges used other subjects). "Cursor", "QUIET" = rulings whose text mentions the word (they reproduce the earlier worker's K5322 series: 3 / 34 / 58 on Oct 24 / 25 / 26; I get 5 / 34 / 60). Commit dates are author dates; a few process-repo commits have author dates that disagree with merge order.

## (a) By day

| Day | Tranche / round | BOB takeovers | Job sessions started | Job merges | Rulings | Rulings naming "cursor" | Rulings naming QUIET / session gone / unheard / idle-disconnected | Rulings "merged again / re-opened / restarted" |
|---|---|---|---|---|---|---|---|---|
| 10-09 | T40 closed early, T41 opens (K2422, K2424: 63 entries) | 4 | 46 | 46 | 110 | 1 | 0 | 2 |
| 10-10 | T41 L6-L11, closes (K2603); T42 opens (K2607); Bob pauses for account switch then lifts (K2510, K2605) | 4 | 45 | 55 | 112 | 0 | 0 | 16 |
| 10-11 | T42 closes (K2696); T43 opens/closes (K2697/K2733); T44 opens/closes (K2735/K2784); T45 opens | 9 | 110 | 120 | 256 | 3 | 2 | 18 |
| 10-12 | T45 closes (K2907); T46 opens/closes (K2914/K3024); T47 opens (K3027); release 0.82.0 | 7 | 92 | 61 | 189 | 0 | 0 | 11 |
| 10-13 | T47, design-heavy, quiet | 2 | 50 | 52 | 80 | 1 | 0 | 4 |
| 10-14 | T47 closes (K3194); T48 opens/closes (K3195/K3322); T49 opens (K3327) | 13 | 150 | 159 | 236 | 3 | 0 | 9 |
| 10-15 | T49 closes (K3423); release/assistant-hosting walks begin | 5 | 10 | 30 | 93 | 1 | 1 | 14 |
| 10-16 | release fix rounds 3-7 on a cut (`R085`), assistant-hosting study; 10 BOBs with no job running (K3475-K3604) | 10 | 42 | 0 | 139 | 1 | 0 | 3 |
| 10-17 | T50 opens, L1-L11 (73 jobs planned, K3616) | 11 | 85 | 89 | 184 | 5 | 2 | 21 |
| 10-18 | T50 closes (K3799); T51 opens (K3821: 80 jobs; aim K3815); rounds R1.. | 10 | 81 | 114 | 175 | 6 | 0 | 14 |
| 10-19 | T51 rounds R1-R9 | 12 | 182 | 228 | 188 | 3 | 0 | 63 |
| 10-20 | wave 2: 57 jobs at once, killed (K4211); caps 10 then 20 (K4211, K4215); archive at merge (K4219) | 7 | 165 | 120 | 98 | 0 | 2 | 12 |
| 10-21 | fix rounds 2-4 (K4303, K4350, K4425); K4297, K4426 | 10 | 154 | 152 | 206 | 2 | 2 | 5 |
| 10-22 | fix rounds 4b-6 | 11 | 102 | 115 | 176 | 15 | 1 | 8 |
| 10-23 | fix rounds 6-8 | 14 | 107 | 114 | 192 | 2 | 3 | 9 |
| 10-24 | fix round 9 (K4835) | 12 | 112 | 118 | 167 | 5 | 4 | 4 |
| 10-25 | fix round 10 (K5039-K5175); K5012, K5015, K5123, K5171 | 21 | 366 | 335 | 208 | 34 | 10 | 2 |
| 10-26 | fix round 10 ends; cut prep (K5319-K5334) | 10 | 116 | 144 | 123 | 60 | 3 | 0 |

Distinct modules among the sessions started each day (sessions per module): 10-10 45 (1.0); 10-11 74 (1.49); 10-12 76 (1.21); 10-13 50 (1.0); 10-14 92 (1.63); 10-17 82 (1.04); 10-18 71 (1.14); 10-19 144 (1.26); **10-20 71 (2.32); 10-21 76 (2.03); 10-22 57 (1.79); 10-23 58 (1.84); 10-24 54 (2.07); 10-25 141 (2.60)**; 10-26 57 (2.04).

### Per tranche (the cleaner unit)

| Tranche | Window (h) | Planned | Job sessions / modules (per module) | BOB plan lines | Merges | CHANGE per module | COMPLETE per module | Mailbox entries J+B per module | Rulings | BOB cache-read per BOB row, BOB share of tokens |
|---|---|---|---|---|---|---|---|---|---|---|
| T41 | 10-09 18:02 - 10-10 21:57 (27.9) | 63 entries | 85 / 79 (1.08) | 6 | 95 | 1.5 | 1.8 | 3.2+3.6 | 182 | 164M, 0.31 |
| **T42** | 10-10 23:05 - 10-11 06:41 (7.6) | 30 entries | 40 / 40 (1.00) | 3 | 44 | 0.7 | 1.3 | 2.0+2.1 | 90 | 159M, 0.36 |
| **T43** | 10-11 06:48 - 12:10 (5.4) | 15 | 23 / 23 (1.00) | 1 | 25 | 0.4 | 1.2 | 1.9+1.8 | 38 | 103M, 0.35 |
| **T44** | 10-11 13:05 - 16:29 (3.4) | 13 | 13 / 13 (1.00) | 2 | 13 | 0.3 | 1.2 | 1.7+1.5 | 49 | 117M, 0.32 |
| T45 | 10-11 17:13 - 10-12 01:57 (8.7) | 47 jobs | 49 / 49 | 4 | 57 | 2.0 | 1.8 | 3.3+4.4 | 130 | 129M, 0.24 |
| T46 | 10-12 02:58 - 10:19 (7.3) | 62 | 64 / 64 | 4 | n/a | 1.0 | 1.5 | 2.7+2.6 | 113 | 132M, 0.25 |
| T47 | 10-12 12:03 - 10-14 07:20 (43.3, includes the quiet 10-13) | 75 | 97 / 88 (1.10) | 7 | 108 | 1.9 | 1.8 | 3.2+3.6 | 168 | 176M, 0.26 |
| **T48** | 10-14 09:06 - 17:38 (8.5) | 80 jobs | 86 / 86 (1.00) | 6 | 92 | 0.6 | 1.3 | 2.0+2.0 | 131 | 95M, 0.32 |
| T49 | 10-14 19:32 - 10-15 15:46 (20.2) | 32 jobs | 40 / 35 (1.14) | 8 (19 BOB rows in metrics) | 54 | 2.4 | 2.5 | 3.9+4.7 | 285 | 50M, 0.44 |
| T50 | 10-17 11:34 - 10-18 00:07 (10.9) | 73 jobs | 85 / 82 (1.04) | 10 | 92 | 1.15 | 1.7 | 2.7+2.5 | 207 | 104M, 0.37 |
| **T51** (open) | 10-18 05:00 - 10-26 20:01 (207) | 80 jobs (K3821) | **1,385 / 199 (6.96; control-plane 30, capture 27)** | 107 | 1,437 | **5.7** | **9.4** | **13.6+14.5** | 1,509 | 116M, 0.36 |

Sources: mailbox counts are `## J<n> · KIND` / `## B<n> · KIND` headings in `build/jobs/T<n>/*.md` at the last commit before the directory was removed. Plan sizes are in K2424, K2607, K2697, K2735, K2784, K2914, K3027, K3195, K3327, K3616, K3821 (each read whole).

Fault events I classified by reading the rulings whole (not by keyword):

- 10-09 to 10-14 (about 1,090 rulings, 11 events, about 1%): K2502 permission check refused a job's `git pull` (needs Bob, §16); K2613 names corrected after applying K2611; K2634 and K2676 a merged job re-opened (session archived with a follow-up pushed; a flaw fixed in a second job round); K2659 two fixtures red from one earlier entry (bisected); K2704 27 reds appeared from merging `main` at a close (fixed by running every module's tests at close, K2704); K2687, K2715, K2734 the start prompt still carried the retired "ROOT at 300k" text (3 times); K2658 one QUIET job (RESUME); K2918 BOB committed two `node_modules` symlinks ("BOB's mistake"); K2926 release 0.82.0 migration fault (`CREATE TEMP TABLE` refused by Durable Object SQLite), fixed on the cut; K3162 doorbells did not reach eight idle jobs, rung again; K3052 Bob rebuked a UX oversight.
- 10-15 to 10-19: K3533 BOB's error, setup-script lines broke every new session; K3576 BOB's omission, re-walk missing from the handoff; K3686 BOB set doorbells 4-5 minutes late so two jobs idled 5 and 9 minutes and Bob asked "Is the development process broken?"; K3797 BOB never merged a complete job (store-door T50-50) until a close audit found it; 38 rulings on 10-16 concern approvals/refusals of deploy and release acts (count).
- 10-20 to 10-24: K4211 57 jobs at once burned the meter from 88% to 96%; K4297 "For the 5th time: fixes test-only stale tests itself"; K4426 Bob: "yet another endless loop identifying issues, but only fixing some"; K4427 BOB's own part: merge rulings dropped jobs' "not proved here" lines; K4547 a job's doorbell failed on a stale BOB address; K4589 BOB #253's slip (a `mail done` pushed unverified merges); K4975/K4976 a dropped job container went unseen until its deadline ("happened a number of times before, costs an hour or more each time").
- 10-25 to 10-26: K5012 (Bob: rulings-active 173 lines, "THEY WERE SUPPOSED TO BE PRUNED"); K5123 BOB's edit left `rulings-active.md` 214 bytes over its limit and the size gate then refused every job's `post` and `inbox`, and the session safety check refused a compound command, both reaching Bob; K5171 two complete jobs merged while BOB's newest entry was unread and a third job lost its work; K5180 "BOB's error, recorded": premerge checked the cursor but not the state, a worker's batch lost; K5320/K5321 a COMPLETE behind BOB's newest entry costs a ring and a turn; ring set 9 minutes ahead; ring to an archived BOB; K5319 Bob: "SOMETHING IS WRONG!".

## (b) The period that worked best, and how it ran

Best period: the regime of Oct 8 14:31 to Oct 14 17:38 (T38-T48), cleanest in **T42-T44 (Oct 10 23:05 to Oct 11 16:29)** and **T48 (Oct 14)**. Why, from the tables: one session per module per tranche (1.00 in T42, T43, T44, T45, T46, T48; 6.96 in T51); the fewest CHANGEs per module (0.3-0.7 in T42-T44, 0.6 in T48, vs 1.9-2.4 in T45, T47, T49 and 5.7 in T51); about 1.5-2.1 mailbox entries per module each way (T51: 14); few fault rulings; each tranche closed to `main` within 3.4-8.7 hours. T42-T44 did 76 job sessions, 82 merges and three closed tranches in 17.4 hours with five BOBs. BOB replacement per merged job was not better here than later (0.04-0.15 in T42-T44, 0.065 in T48 and 0.074 in T51, T51: 107 BOBs / 1,437 merges = 0.074), so BOB turnover is not what changed. The honest limit of this choice: T45, T46, T47, T49 sit in the same regime but with more rework, I did not find a recorded cause, and T42-T44 are also the smallest tranches (13-30 entries).

### The practice, step by step (roles/BOB.md, roles/JOB.md and PROCESS-MECHANICS.md as at civicos-process `d547b03`, 2026-10-11; the documents did not change in substance between Oct 8 and Oct 18)

1. **Scope was fixed when the tranche opened and was small.** BOB wrote the plan `build/plan/current.md` from `next.md` (§5.2): entries grouped by module, modules by layer, each omission with a named hard reason, a legacy census (K2607, K2697, K2735). 13-80 entries; layers of 1-26 concurrent jobs (T48 L11 had 26, K3195). A tranche was finished when its entries were merged and it was closed to `main`; the next opened "at once" (K2605, P18). No closing sweep existed; work found mid-tranche joined a layer not yet started (P10 as then written, K1249, K2704).
2. **Job unit = one module, one session for the whole tranche.** Fixed prompt: "You are <MODULE> #k ... Read roles/JOB.md ... and follow it" (§5.3). The job applied every entry for its module and fixed any flaw it found in its own module in the same job (P8; e.g. K2765, K2767 "its whole read fixed two flaws"). Its session stayed open until the layer closed; a CHANGE re-opened the same session (§5.5). Module size bound about 4,000 lines (K2, K617). Job count caps: none (rulings-active §1 on Oct 11: "A tranche carries everything safely doable, with no job-count cap", K642, K1741, K882); concurrency was bounded by the layer. Reading sets: K2057/K2700 limit about 300-600 KB, measured by `build/plan/reading-sets.py`; over the limit the job's own workers write cited digests (e.g. START for actions T42-25).
3. **START written ahead (P18).** While a layer ran, BOB (with short-lived workers whose output it reviewed whole) drafted the next layers' STARTs into `build/plan/starts-T42/<module>.txt` (about 2 KB: depth, entry, the requirements marked "not yet met: T42", inherited reds, reading-set measure, merge order). Posted with `mail post --as bob --kind START`; the job branch pushed from the tranche with a plain push; session created; address recorded by `mail addjob`. Start confirmed by the job's `mail start`; unconfirmed after 15 minutes means restart (§5.3).
4. **Communication: mailbox in git plus a content-free doorbell (§13).** Job to BOB: `build/jobs/T<n>/<module>.md` entries J<n> (QUESTION, REPORT, COMPLETE, BLOCKED). BOB to job: `<module>.bob.md` B<n> (START, ANSWER, CHANGE, RESUME). Each side moves a cursor with `mail done`. The doorbell is a one-time routine into the other's session at the next whole minute whose text carries nothing, so a lost or duplicate ring changes nothing. BOB's only timers: a 20-minute backstop while a layer runs (`mail check` lists READ, RING, QUIET, UNCONFIRMED, relay) and a dead-man `WATCH` into ROOT. A typical job had J1 QUESTION (best readings, carries on), B2 ANSWER "all stand", J2 REPORT, a completion record, COMPLETE (monitoring T45, read whole: `build/jobs/T45/monitoring.md` and `.bob.md`).
5. **Merge as soon as complete (§5.5).** Complete means state COMPLETE and `mail check` shows neither side owes a read. BOB ran `checks/ownership.mjs`, merged the job branch with a merge commit, struck the met `*(not yet met: T<n>)*` marks in the requirements, and wrote one ruling per merge or small group naming test counts, ownership result and any red accepted by name with the merge that clears it. About 1.3 rulings per merged job (T42: 90 / 44).
6. **Layer close (§5.6):** regenerate the generated artifacts in the manifest's order (K1540), run `checks/run.mjs`, archive the layer's job sessions and write their usage rows; start the next layer. **Tranche close (§5.7):** run every module's tests (`.github/scripts/module-tests.mjs`, K1692, K2704) and accept or fix each red by name; archive `current.md` as `archive/T<n>.md` (T42 23 KB, T43 16 KB, T44 10 KB); PR `tranche/T<n>` to `main` merged with the GitHub merge tool under Bob's standing direction (K1177, K2273); report to Bob; open the next tranche.
7. **BOB refresh:** at 55% of its window (K2287) at a point with no step half done: lean `build/handoff.md` (3.6-5.5 KB), ring ROOT, ROOT starts the successor, successor archives it (§5.8, §5.1). In T42-T44 five BOBs (#151-#155) each did 1-2 layers.
8. **Decisions:** Bob decided only policy, doctrine, requirements, architecture and UX; every detail was BOB's, recorded once (P17, rulings-active §1). Bob's answers arrive as short rulings; BOB's "details (P17)" clause follows each.

### Always-read set and its size (git `cat-file -s` at the end of the day)

| Item | Oct 11 (a969c420, T42-T44) | Oct 18 | Oct 24 | Oct 26 |
|---|---|---|---|---|
| roles/BOB.md | 4,155 | 4,155 | 4,155 | 4,201 |
| PROCESS-DESIGN.md | 12,400 | 13,776 | 13,776 | 13,776 |
| PROCESS-MECHANICS.md | 47,128 | 49,516 | 49,784 | 54,194 |
| build/manifest.md | 10,495 | 12,550 | 14,546 | 15,310 |
| build/handoff.md | 3,593 | 5,550 | 6,962 | 6,410 |
| build/rulings-active.md | 16,721 (82 lines) | 38,737 (125) | 63,794 (173) | 25,684 (78) |
| bio CLAUDE.md | 2,275 | 2,275 | 2,388 | 2,388 |
| **BOB takeover set** | **96,767** | 126,559 | **155,405** | 121,958 |
| plan current.md | per-tranche, closed at 10-23 KB | 189,973 | 229,662 | 19,645 |
| roles/JOB.md | 6,774 | 6,876 | 6,876 | 7,314 |

rulings-active.md was 14,678 B on Oct 8, 25,534 B on Oct 15, then grew 2-6 KB a day. T42-T44 archives of the plan were 10-23 KB; T51's single plan reached 190-230 KB (K5012 measured fix-round files at 236 KB and 341 KB).

### Tools that existed on Oct 11 (civicos-process `d547b03`, bio)

`tools/mail.mjs` 31.8 KB (take over, post, inbox, done, state, check, addjob, ring-text, cross-account x-commands); `checks/format.mjs` 16.2 KB, `ownership.mjs` 10.2 KB, `architecture.mjs` 3.5 KB, `coverage.mjs` 1.9 KB, `channels.mjs` 4.8 KB, `run.mjs` 1 KB (five checks, §8); bio `.github/scripts/module-tests.mjs` (K1692), `build/plan/reading-sets.py` (K2053), `build/plan/starts-T<n>/`. Absent then: words check, fixtures check, size gate, the 30-minute RUNNING cap, `jobbranch`, `premerge.mjs`, `watch-job.sh`. Total check code on Oct 11 about 38 KB; on Oct 25 about 38 KB + words 37.3 KB + fixtures 94.6 KB.

## (c) Changes since that period, with measured effect where the evidence shows one

| Date | Change (ruling, commit) | Evidence of effect |
|---|---|---|
| 10-14 | Effort revision, Bob approved (K3271; civicos-process `3460207`): job reads only the tests that name a requirement it changes; **BOB refreshes at 30%** (was 55%); behaviour-free entries may wait up to 3 tranches | BOB cache-read per BOB row fell from 95-176M (T36-T48) to 50M (T49); BOB share of all tokens 0.44 in T49 vs 0.24-0.36 before; 19 BOB rows for 40 jobs (T49). Takeovers on 10-15 and 10-16: 5 and 10 with no job running (K3396-K3604 each "no step half done"). Partly offset when Bob moved it to 40% (K3671, 10-17: "a BOB's takeover alone loads 11% of its context"); P13 text says 40% now |
| 10-17 | Doorbells at the next whole minute (K3686), after BOB set two 4-5 minutes late | Fault ended (no repeat found), cost shown: 5 and 9 minutes idle |
| 10-18 | T51 aim: until released, deployed and walked, every defect fixed in T51 (K3813, K3815); T51 opens with 80 jobs (K3821) | 1,385 sessions, 1,437 merges, still open after 8.6 days; the previous model closed a tranche in 3-11 hours. This changed the unit of work from "the tranche's entries" to "everything a walker finds" |
| 10-18 | P10/P19: nothing found in a tranche waits (K3915, civicos-process `427e7bc`); mechanical passes, completion round, **words check** (K3923, `314d84f`; checks/words.mjs 22 KB, 37 KB by 10-24) | Words findings 13,910 (K3927); a 433-file team pass (K3820); 17 of the 18 process-repo commits of 10-18/19 mention the words check (K3930-K4053) |
| 10-20 | Wave 2 of 57 jobs killed (K4211: meter 88% to 96%); cap 10 (K4211), 20 (K4215); **a session is archived at its merge and a later CHANGE is a new session** (K4219) | Sessions per module per day: 1.0-1.6 (10-10 to 10-19) became 1.8-2.6 (10-20 to 10-26); T51: 6.96 sessions and 9.4 COMPLETEs per module vs 1.0 and 1.2-1.8 earlier. Mailbox: 13.6 J + 14.5 B entries per module |
| 10-21 | K4297 BOB fixes stale tests itself, deploy first; K4426 root cause + why fixtures missed it + failing-first test before any deploy; K4427 five conventions | Fix rounds 2-10 over 10-21 to 10-25, each from a walker's findings; Bob (K4426) saw issues "reappear again and again" |
| 10-24 | RUNNING capped at 30 minutes; QUIET also for idle/disconnected (K4975, K4976, civicos-process `cf9c196`) | Cause: unseen dropped containers. No before/after: QUIET-type rulings 4 (10-24), 10 (10-25), 3 (10-26) |
| 10-25 | K5012: rulings-active trimmed 64 KB to 25 KB (de49f04f7d), 117 lines to `archive/rulings-active-dropped-K5012.md`; limit 80 lines/25 KB | rulings-active had been 82 lines at 10-11, 173 at 10-24; the trim removed operating detail that K5258 could not refold (K5322) |
| 10-25 | K5015/K5036 size gate in `mail.mjs` refuses commands over limit (mail.mjs 35 to 45 KB); fixtures check (94.6 KB); K5036 lets BOB change process texts without Bob | K5123: BOB's 214-byte overrun made the gate refuse every job's post/inbox; fixed by scoping the gate to a job's own reading set (`8007c93`). Bob reached by approval twice that day |
| 10-25 | K5171: no cap on concurrent jobs; merge only when the job has read BOB's newest entry; premerge refuses a lagging cursor | 10-25: 366 sessions, 21 BOBs; 482 sessions 10-25/26 (K5322 counts 488 STARTs in fix round 10). "cursor" in rulings 3 to 34 to 60. K5320: each COMPLETE behind a B-entry costs a ring and a turn |
| 10-26 | `premerge.mjs` (K5309), `watch-job.sh` (K5321) | Too new to measure |

## (d) Before 2026-09-25 (short)

The old process ran in `believeinoakland/bio` as five standing lanes (BOB, SCHEDULER, CONDUCT, DIST, FLEET; `docs/development/ORCHESTRATION.md` 24.5 KB at 95fe7bc7) with ephemeral workers, each spawned by CONDUCT for one cached task from `QUEUE.md`/`BACKLOG.md`, landing in numbered batches ("train ... land land/conduct/c22-batch29": 62 train commits 09-18 to 09-25). Notably simple or effective (evidence in `git show 95fe7bc7:CLAUDE.md`, 16.4 KB): a single stated source of truth with lookup commands (`tools/decided.mjs`, `status.mjs`, `owed.mjs`, `ledger.mjs`) so sessions "stop guessing"; a reading budget with named read-whole and looked-up files; a push refused until `construct-status.json` was updated; a stated rule "the goal is BIO work; process is overhead" (Bob 09-22); workers that did one task and ended. Throughput by commits: 492 (09-18), 257, 32, 222, 165, 517 (09-23), 534 (09-24). I found no measured error rate or stated reason for the replacement in the files I read; K111 shows the new process found its own flaws on 09-26. HISTORY.md in civicos-process only records revisions after 09-26.

## (e) What is unknown

- No measure of correctness: the per-day table counts activity and rework; whether T42-T44 output met its requirements better than later output is not shown, and tests green at merge is the only quality signal.
- The cause of T45/T47/T49 rework (2-2.5 CHANGEs per module) is not in a ruling I read.
- Keyword counts (cursor, QUIET) are not error counts; I read whole only the rulings named above. Doorbell platform records (delivery times, lost routines) are not in git except where a ruling quotes them (K3686, K5321).
- Weekly meter readings are sparse (K2615 18%, K2677 26%, K2741 35% across T42-T44; K4211 88% to 96%), on two accounts, so cost per job cannot be compared across periods.
- Which of the 10-20 changes (cap, archive-at-merge, wave size) caused the session inflation versus the walker-driven fix rounds is not separable from these data.
- The process repository `main` is not what BOB used late in T51 (prep branches such as `prep/running-cap-K4976` were used before they merged on 10-25); effective process by day is from rulings, not from `main`.
- The snapshot branch `snapshot/pre-refactor-2026-09-25` (5b9c2643) exists on origin; I used commit 95fe7bc7, which is in the clone.
