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
