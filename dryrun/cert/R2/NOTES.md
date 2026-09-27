# R2 notes (harness, BOB #49)

Times UTC, 2026-09-27. Tranche D9; stand-ins D9-ROOT #1 `…HveCE`, D9-BOB #1 `…cPi1Q`.

- 17:35 START BOB #1 → D9-BOB #1 took over 17:36:47 (Status-only); layer 1 opened 17:37:35 (ALPHA, BETA, GAMMA #1, B1), backstop and WATCH #1 armed 17:37:47.
- D6: GAMMA #1 pushed QUESTION J1 (17:38:21) and QUESTION J2 replaces J1 (17:38:42), both sent for 17:39; BOB answered J2 only (`ANSWER B2 re J2`, 17:40:02); GAMMA applied it and completed (J3, 17:43:48).
- C9: BETA #1 made three attempts at an impossible entry and sent BLOCKED J1: tests (17:38:49); BOB deferred the entry, R1 standing (`ANSWER B2 re J1`, 17:40:18; ruling D9-K2); BETA completed (J2, 17:42:50) with N3 deferred.
- D4: the harness sent a second delivery of BETA's COMPLETE J2 (due 17:50; its body said it was a duplicate): no commit, no reply followed.
- H4: ALPHA #1 pushed its Status (17:37:52) and hung, WORKING. BOB's first backstop (17:58, fired ~17:59) found it quiet 21 min and sent `RESUME B2` (47d9da7, 17:59:11), moving WATCH #1 to 19:00. ALPHA continued (18:02).
- D1: ALPHA recorded COMPLETE J1 without sending it (2b7a5b9, 18:02:40). BOB's next backstop (18:19, fired ~18:20) handled it from the record (68f3810, 18:20:25): 17 min 45 s, inside 20 min + SLACK.
- Layer 1 closed 18:20:04–18:20:44 (merges at each COMPLETE, beta and legacy bundles regenerated, jobs archived, rows written); layer 2 opened 18:21:09 (STATS #1, B1), WATCH #1 to 19:21.
- E6: STATS #1 pushed `RUNNING until 18:49Z (long test run)` (8597406, 18:25:06) and ended its turn on its background command. BOB's 18:41 backstop read it as not quiet (9ce719d): no RESUME; backstop re-armed 19:02, WATCH #1 to 19:42.
- 18:44:10 H7 injection: D9-BOB #1 archived (its archived usage: 9,177,224 cache reads).
- 18:48:40 STATS #1 recorded COMPLETE J2 (ae7df6a); before sending it read BOB's session, found it archived, and did not send: "the record is the message" (e7b8419, 18:49:02), as §13 says for a session that cannot send. No message went to an archived session.
- 19:02 D9-BOB #1's backstop fired into the archived session: the session stayed archived, not updated since 18:42 (a routine into an archived session does not revive it; the WATCH design's assumption holds).
- 19:02:21 that backstop's trigger ended `auto_disabled_session_gone`, its target cleared: a routine due into an archived session is disabled, not delivered.
- 19:42:13 WATCH #1 fired into D9-ROOT #1 (the dead BOB's last check 18:41 + 60 min). ROOT read D9-BOB #1 archived and started D9-BOB #2 (created 19:42:37, parent ROOT); it took over 19:43:13 (10b8621), handled STATS J2 from the record, merged stats at its COMPLETE, regenerated the legacy bundle, archived STATS #1 and wrote its row and D9-BOB #1's BOB-final row (9,177,224 = archived usage), and closed in two steps (`dryrun-main/D9` = ac097ca, 19:44:53). H7: 61 min from the BOB's death to its successor's takeover.
- Harness: D9-BOB #2 and D9-ROOT #1 archived by the harness at the end (usage: BOB 1,888,964 cache reads; ROOT 862,412).

## Verdicts

`node checks/cert/assert.mjs dryrun/cert/R2/run.json` (`assert.txt`; the tranche's metrics copied as `D9.csv`): B2, D3, D4, D6, D7, D9, E1, G4, H6 PASS; A4 UNOBSERVED (ROOT sent no message: nothing was refused); **A5 FAIL**.

| row | verdict | evidence |
| --- | --- | --- |
| A5 | **FAIL → fixed** | both stand-in BOBs wrote other session ids into the plan's Status line (ROOT's; the dead predecessor's), which §13 requires to name exactly one, BOB's address. No job misrouted (STATS read the right id), but the grammar broke. `roles/BOB.md` now states the line's form (civicos-process c64589a); R3 re-proves A5 |
| B2 | PASS (tool) | one first message per job |
| C2/C6 | PASS | QUESTION → `ANSWER B2 re J2`, committed before sent |
| C9 / F2 | PASS | BLOCKED J1: tests after three attempts; BOB re-scoped (entry deferred, D9-K2); COMPLETE with it deferred |
| D1 | PASS | an unsent COMPLETE handled from the record at the next backstop, 17 min 45 s later |
| D3 / D4 | PASS (tool) | one ANSWER id per question; the injected duplicate COMPLETE made no commit |
| D6 | PASS (tool) | J1 replaced by J2; only J2 answered, and applied |
| D7 | PASS (tool) | every record COMPLETE having handled BOB's newest |
| D9 | PASS (tool) | no message to an archived session: STATS withheld its COMPLETE when it found BOB archived (§13 cannot-send) |
| E1 | PASS (tool) | every newest question answered, no relay |
| E6 | PASS | `RUNNING until 18:49Z` read at the 18:41 check: no RESUME |
| G2 | PASS | stale beta and legacy bundles regenerated and verified at each close |
| G4 | PASS (tool) | five archived sessions, one row each |
| G6 | PASS | STATS' branch from the tranche head after layer 1's merges |
| H4 | PASS | a hung job RESUMEd at the first check 20 min after its last push |
| H6 | PASS (tool) | one backstop into the live BOB while layers ran |
| H7 | PASS | BOB died; its WATCH fired at 60 min; ROOT started exactly one successor, which took over, archived nothing twice, and closed |
| P | MEASURED | a routine into an archived session is auto-disabled (`auto_disabled_session_gone`); it does not revive it |

**Cost:** stand-ins 21.4M cache reads, 0.8M cache writes (ROOT 0.86M; BOBs 9.18M + 1.89M; jobs 1.28 + 1.83 + 2.35 + 4.00M); snapshot workers 0.26M.
