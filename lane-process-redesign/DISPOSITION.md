# The inventory's disposition

**Status** · PROCESS-REDESIGN #2, 2026-10-26. Every row of bio `build/plan/draft-process-inventory.md` (BOB #313; tranche/T51 @ `691eff82`), each **KEPT IN** a named home or **RETIRED** with why, so nothing binding is lost in the redesign (lane R5, next step 3). The homes are as adopted by `adoption/bio-adoption.patch` and this branch.

**Homes.** `proc <cmd>`: `tools/proc.mjs`. `hook <role> <pre|stop>`: `tools/hooks.mjs`, registered by the role's skill. `check <name>`: `checks/`. `idx BOB|JOB|ROOT`: `roles/<ROLE>.md`, the role's index. `sit <name>`: this repository's `situations/<name>.md`. `M§n`: `PROCESS-MECHANICS.md`. In bio: `CLAUDE.md`; `manifest`; `ra§n`: `build/rulings-active.md`; `rp/<subject>`: `build/rulings-product/<subject>.md`; `bs/<name>`: `build/situations/<name>.md`; `placed`: `build/plan/bob-rulings-placed.txt`.

| # | disposition | home, or why retired |
|---|---|---|
| B1 | KEPT IN | idx BOB "Working with Bob"; bio CLAUDE.md; ra§1 line 1 (K2008 packaging, K1876, K1881) |
| B2 | KEPT IN | idx BOB, idx JOB "Ending a turn"; hook job stop (refuses WORKING: a turn ends on a named wait); M§5.9 |
| B3 | KEPT IN | ra§1 line 2 (K1913, K2009); `rulings.md` searched, the rulings relied on read whole (ra§1 "No scans") |
| B4 | KEPT IN | ra§1 line 2 (K1762) |
| B5 | KEPT IN | proc takeover owes, proc handoff refuses, a recent ruling of Bob's with no home (`unplacedBobRulings`; was `bob-rulings-check.mjs`) |
| B6 | KEPT IN | ra§1 line 2 (K5036, K2020); M§15 |
| B7 | KEPT IN | ra§1 line 3 (K3656) |
| B8 | KEPT IN | sit refused; idx JOB "When"; ra§1 line 3 (K4696); hook reasons say "do not work around it" |
| B9 | KEPT IN | ra§1 line 4 (K3540); the proposed check stays proposed (M§8.4, uncertified) |
| B10 | KEPT IN | ra§1 line 4 (K2425, K3061): a process judgment about what reaches Bob, so not moved to a product file |
| B11 | KEPT IN | ra§1 line 5 (K1741); sit round (P19) |
| B12 | KEPT IN | ra§1 line 5 (K5006); check format (defer words, P19 reasons); sit round |
| B13 | KEPT IN | ra§1 line 5 (K5122, K1548, K3528) |
| B14 | KEPT IN | rp/quality (K3052) |
| B15 | KEPT IN | rp/quality (the plan audited screen by screen); sit round names P19's plan |
| B16 | KEPT IN | bs/design-channel (K3462, K3460, K4269); rp/quality |
| B17 | KEPT IN | rp/quality; bs/release |
| B18 | KEPT IN | rp/quality (K3296) |
| B19 | KEPT IN | rp/installer-accounts (K3445) |
| B20 | KEPT IN | rp/ai (K4421, K3717) |
| B21 | KEPT IN | rp/ai (K4443, K3347) |
| B22 | KEPT IN | rp/ai (K3558, K3574, K3538, K3578) |
| B23 | KEPT IN, in part | no cap: proc layer start `--usage` (K5323); providers first: ra§1. **Retired:** archive at merge and a new session per CHANGE (K4219): P10 keeps a job's session to its layer's close (conflict (d)2) |
| B24 | KEPT IN, in part | proc merge (ownership, tests, checks incl. words; undone if red). **Retired:** the cursor (K5171): no mailbox exists (M§13); a CHANGE that crosses a COMPLETE re-opens the job's record, which proc merge reads |
| B25 | KEPT IN | ra§1 (K2605, K4614, K5036, K5136); M§5.2 item 3, §5.7 item 5 never ask the meter (conflict (d)1) |
| B27 | KEPT IN | ra§1 (K4790); manifest's ROOT rows |
| B28 | KEPT IN | rp/scope (K3815, K3803, K3804, K4269, K5311, K5319): lines leave when their tranche closes |
| B29 | KEPT IN | rp/scope (T51's aim: 1280 and 390 px); bs/deploy-and-walk |
| B30 | KEPT IN | rp/scope (K4403, K3804) |
| B31 | KEPT IN | rp/installer-accounts (K4557) |
| B32 | KEPT IN | ra§1 "No scans" (K3588, K3678); idx JOB step 2; job `BLOCKED: reading`; M§17 (proc status lists `SIZE`) |
| B33 | KEPT IN | bs/deploy-and-walk (K4297, K5257) |
| B34 | KEPT IN | bs/deploy-and-walk (K4782, K4783); mutation sample K4994: placed (test rethink) |
| B35 | KEPT IN | bs/deploy-and-walk (stale test, test files only); rp/quality (fix lands in the owning module); check ownership |
| B36 | KEPT IN | bs/job (bundle tests `--test-force-exit`, background tasks); bs/deploy-and-walk item 4 (two suites at once); M§5.7 item 1 (the close's own run) |
| B37 | KEPT IN | bs/deploy-and-walk (K5257, K5258, K5313) |
| B39 | KEPT IN | bs/fix-round (K4426, K4597, K4428, K4427, K4849) |
| B40 | KEPT IN | rp/tests (K4787, K4966, K5124) |
| B42 | KEPT IN | rp/platform (K4565, K4566) |
| B43 | KEPT IN | rp/reading (K4562, K4571, K4630, K4632, K4636, K4812, K4831) |
| B44 | KEPT IN | rp/reading (K4628, K4785, K4798) |
| B46 | KEPT IN | rp/platform (K4635, K4746, K4747) |
| B47 | KEPT IN | rp/scope (K4781, K4170) |
| B48 | KEPT IN | rp/installer-accounts (K4935, K4937, K4951, K4942) |
| B49 | KEPT IN | bio CLAUDE.md "Standing safety rules" (unchanged) |
| B50 | KEPT IN | rp/quality "Speed" (K4354) |
| B51 | KEPT IN | rp/quality (K4164); bs/release (the census before a cut) |
| S1 | KEPT IN | ra§2 (K1177, K1702, K620); both settings files untouched |
| S2 | KEPT IN | ra§2 (K2704); M§5.7 item 1 |
| S3 | KEPT IN | ra§2 (K5120, K5293, K4841, K5137); sit refused; idx JOB "When" |
| S4 | KEPT IN | bio CLAUDE.md safety rules; ra§2; hook bob/job pre (force push, push to `main`) |
| S5 | KEPT IN | ra§2 "Releases" (K3217); bs/release |
| S6 | KEPT IN | ra§2 (K1758, K273) |
| S7 | KEPT IN | rp/quality (K1944) |
| S8 | KEPT IN | rp/quality (K1430) |
| S9 | KEPT IN | rp/installer-accounts (K3447, K3471, K3496) |
| S10 | KEPT IN | rp/ai (K3602, K1880) |
| S11 | KEPT IN | rp/installer-accounts (K1874, DEC-2, DEC-224) |
| S12 | KEPT IN | rp/stewards (K2819, K2782, K2799) |
| S13 | KEPT IN | rp/stewards; bs/release |
| S14 | KEPT IN | rp/words-ux (K3472, K1821) |
| S15 | KEPT IN | rp/scope (K3052, K4100) |
| S16 | KEPT IN | the requirements, as before (it was already out of rulings-active: K3060, K3080, K3079) |
| S17 | KEPT IN | rp/ai via K4443 and K3347, which supersede it where they differ (conflict (d)4) |
| O1 | KEPT IN | bs/deploy-and-walk (K4733, K1898, K1985) |
| O2 | KEPT IN | bs/deploy-and-walk (K3546) |
| O3 | KEPT IN, in part | ra§3 (K1977). **Retired:** `mail post`/`done` pushing the tranche (K4683): those commands are gone; proc pushes only what it commits, merging the remote once on a lost race |
| O5 | KEPT IN | proc merge (premerge's gates, merge commit, ownership against the merge base, verified on origin); proc layer start (job branches, never forced); proc layer close (every job merged); hook bob pre (hand merge refused); ra§4 (K1965 order) |
| O8 | KEPT IN | bs/job (K4113, K4207); bio's SessionStart hook (unchanged) |
| O9 | KEPT IN | bs/job (K3972, K1994); manifest's artifact table order (K1540, K1341) |
| O11 | KEPT IN | ra§3 (K4668, K874, K2547, K2513); bs/job (K702, K313, K3971); proc merge runs words over the merged tree (K3986); manifest table order (K1540) |
| O14 | KEPT IN | ra§3 (K3987, K5167); sit refresh; proc merge `--context` writes the figure in the ruling |
| O15 | KEPT IN, in part | ra§3 (K506). **Retired:** the doorbell's timing (K1825) and waiting for the next entry (K1172): no doorbell or mailbox exists (M§13) |
| O16 | RETIRED, into code | `RUNNING` is gone; a quiet job is proc status QUIET (WORKING, no push for an hour) and the platform's child-session event; K4976 placed |
| V1 | KEPT IN | proc merge strikes the marks a job's `**Met**` line names (K787); bs/job (K208, `test.todo`); ra§4 (K1965) |
| V2 | KEPT IN | ra§4 (K624, K1185, K1975) |
| V3 | KEPT IN | rp/words-ux (K446) |
| V5 | KEPT IN | sit round (an entry for a module not yet started joins its START, K411) |
| V6 | KEPT IN | sit refresh (replaced whole); ra§4 (K2026, K3559); proc status `SIZE`/`NEAR` |
| V7 | KEPT IN | ra§4 (K2700, K3271) |
| V8 | KEPT IN | bs/job (K3810, K4990, K4993); check words and check fixtures, now also run by proc job complete |
| V9 | KEPT IN | bs/job (K3930, K3943, K3944, K3985) |
| V11 | KEPT IN | ra§4 (K3259, K3268); bs/job (a test asserts its own module); ra§4 "Citations" (K3676) |
| V12 | KEPT IN | ra§4 "Citations"; M§9 |
| V13 | KEPT IN | ra§4 "Effort" (K3269, K3294, K3518); sit layer (model per job) |
| V14 | KEPT IN | ra§4 "Lanes" (K3538, K3553, K5295, K3053); bs/design-channel |
| V15 | KEPT IN | ra§4 "Lanes" (K3082, K3086) |
| V16 | RETIRED | ended lanes are history; K2241 and the dropped "may wait three tranches" are not in force in rulings-active today and are not revived (conflict (d)5) |
| M1 | KEPT IN | M§1, §3, §8; the checks |
| M2 | KEPT IN | check format; M§8.4, §16 |
| M3 | KEPT IN | M§2; proc takeover owes "tell Bob" at depth ≠ 1; hook bob pre (title, branch, prompt as printed) |
| M4 | KEPT IN | hook job pre (no session, routine or timer); hook bob pre (only its own backstop; never fire a routine); WATCH **retired**: ROOT is woken by the platform's child-session event (M§2) |
| M5 | KEPT IN | M§4; hook bob/job pre (no push to `main`); proc layer start (job branches) |
| M6 | KEPT IN | M§4; sit messages ("a change to a running job"); proc job complete refuses while the tranche is ahead of the job's branch |
| M7 | KEPT IN | M§4, §7; sit messages |
| M8 | KEPT IN | proc takeover (Status line, depth, `SIZE`, every job's state); M§5.1 (Writer line and channel); sit takeover |
| M9 | KEPT IN | proc takeover prints each act (archive predecessor, its row, routines, backstop); hook bob stop refuses a turn's end while an act is owed; sit takeover |
| M10 | KEPT IN | M§5.2 item 1; sit round |
| M11 | KEPT IN | M§5.2 (census, P19 reasons, one line to Bob; meter not asked, K5136); proc round open |
| M12 | KEPT IN | proc layer start (branches, STARTs, calls owed); proc job started; hook bob pre; proc status `UNCONFIRMED` |
| M13 | KEPT IN | proc layer start writes the START (depth, BOB, the tool, entries, the product's `bs/job`); K5120 line: idx JOB; Done criteria: proc job complete; model: sit layer |
| M14 | KEPT IN | K5175 (every bug found is fixed in its round) is P8's "deals with it in the job whenever possible" and P19, binding as before; bs/fix-round (K4426 family). K5138 (r8-kit door tests are control-plane's) is a T51 START direction and ends with T51 |
| M16 | RETIRED, replaced | a job's message is a turn (M§13); proc status lists what each job needs; sit messages |
| M17 | RETIRED | no doorbell: `send_message` to the address read from git (M§13); a refused message is resent to the address read again |
| M18 | KEPT IN, changed | one backstop, hourly `send_later` into BOB's own session (M§5.4; idx BOB); WATCH retired (M4) |
| M19 | KEPT IN | proc status (ANSWER, MERGE, UNBLOCK, RELAY TO BOB, UNCONFIRMED, QUIET, SIZE); platform status is never state (M§13) |
| M20 | KEPT IN | proc job route (a fresh session when archived, failed or past half); M§5.4 (archive first; refused archive: §16) |
| M21 | KEPT IN | proc merge whole; then the job stays (P10) |
| M22 | KEPT IN | M§5.5 (a red is never merged; the job fixes it or its entry is re-scoped); sit merge-close |
| M23 | KEPT IN | proc layer close (artifacts, checks, archives owed); proc job archived (rows) |
| M24 | KEPT IN | M§5.7 items 1-3; hook bob pre (PR merge only once CLOSING, no push to `main`); sit merge-close |
| M25 | KEPT IN | M§5.7 items 4-6; sit merge-close |
| M26 | KEPT IN | proc handoff (refuses while owed, unpushed, or a Bob ruling unplaced; prints ROOT's text); M§5.8; sit refresh |
| M27 | KEPT IN | M§5.9; sit round "Alongside" |
| M28 | KEPT IN | sit mechanical-pass; P7 |
| M29 | KEPT IN, changed | proc job start / state; the states WORKING, WAITING, BLOCKED, NEEDS BOB, COMPLETE (M§6); `RUNNING`, cursors and `done` **retired** |
| M30 | KEPT IN | proc job complete (Met line, committed, tranche merged, tests, format, architecture, coverage, fixtures, words, ownership, Size line, pushed, the message printed) |
| M31 | KEPT IN | proc writes every Status line; check ownership (a job's own paths and record); M§6 |
| M33 | KEPT IN | idx JOB "When" (context, tests); M§6 |
| M34 | KEPT IN | idx JOB "When"; sit refused; M§16; proc status `RELAY TO BOB` |
| M35 | KEPT IN | idx JOB steps 2, 7; M§6 |
| M36 | KEPT IN | idx JOB step 3 (`WAITING:` in the record, then a message); sit messages (answer the newest) |
| M37 | KEPT IN | idx JOB steps 4-5; M§6 |
| M38 | KEPT IN | M§7; sit messages |
| M39 | KEPT IN | M§9; proc merge writes its own ruling line; ra§4 |
| M40 | KEPT IN | proc job archived, proc bob archived (M§10) |
| M41 | KEPT IN | M§11; bs/release |
| M42 | KEPT IN | M§12.2, §12.5; check ownership (`ADDED` lines, read by BOB at proc merge) |
| M43 | KEPT IN | M§13.1 item 5; bs/design-channel |
| M44 | KEPT IN | sit refused ("before an act on `main` …"); M§16 |
| M45 | KEPT IN, changed | M§17 limits unchanged; proc status and takeover list `SIZE`/`NEAR` for BOB; no session's command is refused for another's document (K5123) |
| H1 | RETIRED | instance state of T51's handoff; `premerge.mjs` is proc merge, `bob-rulings-check.mjs` is in proc (conflict (d)6) |
| H2 | KEPT IN | bio's handoff and rulings (K5300, K5302) as before; no hook (a manual remote delete is already a force-class push the hooks refuse: `--delete`, `:ref`) |
| H3 | KEPT IN | bio CLAUDE.md (attach, invoke the role skill) |
| H4 | KEPT IN | check format (unchanged) |
| H5 | KEPT IN | M§4 (a fix reaches a running job as a CHANGE, which merges the tranche); proc takeover owes routine deletes and archives |
| H6 | KEPT IN | idx ROOT (repeat-safe, `ls-remote`, child-session event; WATCH and WAKE retired) |
| X1 | RETIRED | duplicates of rows above, as the inventory says |
| X2 | RETIRED | finished history, as the inventory says |
| X3 | KEPT IN | bs/deploy-and-walk (K4269, K4270) |

## The inventory's §(d), settled

1. **The meter.** BOB never asks for or raises Bob's weekly meter; it is noted when he gives it. Bob's own words govern (K5136: "Don't worry about weekly usage. I'm watching it."; K1762), and P14 says the meter is noted "when he gives it", so nothing in the principles needs the ask. Mechanics §5.2 item 3 and §5.7 item 5 changed to match. (This reverses R5's tentative reading, which had the mechanics' ask winning.)
2. **Archive timing.** A job's session stays until its layer closes (P10's text); K4219's archive at merge is retired (a BOB ruling; P17 makes its replacement BOB's). A ruling line at adoption records it (`adoption/README.md`).
3. **The rehearsal account.** Not a process question: K4942 (Bob's throwaway via `CS_TEST_*`) stands in bio's CLAUDE.md and rp/installer-accounts; the handoff's K5258 reading is BOB's to reconcile in the alpha's cut, as today.
4. **K3061, K2892, the group API key.** Superseded where they differ by K4443 and K3347, both in rp/ai; nothing is revived.
5. **K2241 and "may wait three tranches".** Neither is in force in today's rulings-active; not revived (V16).
6. **Tool locations.** `premerge.mjs`, `bob-rulings-check.mjs` and the prep branches' `jobbranch` and running-cap are all superseded by `tools/proc.mjs` on this branch; nothing needs moving at adoption but the merge of this branch.
7. **Folds into requirements (B44, S12, S16).** Moot for adoption: the product rulings move whole to `build/rulings-product/` and are still read, so no fold has to be verified before they leave the active file.
