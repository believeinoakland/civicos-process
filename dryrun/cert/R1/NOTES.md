# R1 notes (harness, BOB #49)

Timeline and platform measurements, as observed. Times UTC, 2026-09-27.

- 16:51:53 D8-ROOT #1 created with its prompt; idle 16:52:13 (P1: 20 s to first turn end).
- 16:54 A2 injection (START BOB #1 naming 65ca7681, tranche/D7's tip) → `From ROOT (D8): REFUSED #1` into the harness, fired 16:57:10; no session started (A2).
- 16:57 A1 START BOB #1 (9be9d5c9) → D8-BOB #1 `session_01LPHZFDBMZ6WXhvGqzzx1Hw`; its takeover commit 5b8dd2c at 16:57:52 (under a minute from the routine's minute).
- 16:58:39–42 ALPHA #1, BETA #1, GAMMA #1 created (efe9104); each pushed its record Status by 16:59:08 (P1: a new job confirms its start in ~25 s, not the 1–2 min the model assumes; K161's "reads idle for its first minutes" did not recur).
- 17:00 alpha and gamma COMPLETE; beta WAITING ON BOB (J1).
- 17:02:43 harness calibration routine due 17:02:00 fired (P2: 43 s).
- 17:03:01 `update_trigger` on that fired one-time routine: enabled again, `ended_reason` cleared, new `run_once_at` (the WATCH re-arm assumption holds).
- 17:03:37 injections: BETA #1 archived while waiting (H3/B3 variant); stray routine into D8-BOB #1 (A6).
- P3: BETA #1, having ended its turn on `Waiting on BOB (J1)`, read `status_bucket` COMPLETED, `status_category` review_ready, `needs_action` empty; not BLOCKED as T6 measured. The K164 rule classifies by the record, so either reading is handled.
- Harness: my own `delete_trigger` of ROOT's routine into BOB #48 (created by ROOT) was refused by the auto-mode classifier ("Interfere With Workloads"); watch whether a successor BOB may delete its predecessor's routines (X10, A6).
- 17:06:03 D8-BOB #1's first backstop fired (armed 17:05, 6.5 min after the jobs' creation): it found BETA #1 archived, wrote its row (both counts empty: it died before its Size line) and restarted it as BETA #2 (`From D8-BOB #1 (D8) to beta: START B2`, 1ef086e, 17:07:01); BETA #2 confirmed 17:07:13 and waited on J1. D8-BOB #1 handled no other job message (the scripted fault), wrote its handoff (f7c9026) and sent START BOB #2 (due 17:08, fired 17:08:07).
- 17:08:25 D8-ROOT #1 started D8-BOB #2 (the duplicate START BOB #1 at 17:00 was ignored: one D8-BOB #1). 17:08:57 takeover, Status only (afa0ca9). It merged alpha early (a provided service changed, §4), answered BETA J1 (`ANSWER B3 re J1`) and forwarded alpha's REPORT (`CHANGE B4`), both commits at 17:10:03 before their routines; armed its backstop and WATCH #2; deleted D8-BOB #1's backstop, WATCH #1 and the injected stray routine; archived D8-BOB #1 and wrote its BOB-final row (a262e72, 17:10:56).
- 17:12:39 BETA #2 COMPLETE (handled B4). 17:13:59–17:14:40 layer 1 closed: merges at each COMPLETE commit, legacy bundle regenerated and verified, ownership 0 and ADDED 0 each in the Jobs line, jobs archived, rows written. 17:14:58 close step 1 (archive/D8.md, CLOSING) and step 2 (`dryrun-main/D8` = 116ef56) done; backstop and WATCH #2 deleted.
- 17:24 HARNESS ERROR: I misread `dryrun-main/D8` as behind and injected a wake (trig_01T4dGjp…). D8-BOB #2 found the tranche closed and made no commit: a spurious wake handled idempotently. Not a finding.
- P6: a deleted trigger vanishes from `list_triggers(include_completed)`: D8-BOB #1's re-armed backstop, WATCH #1, the stray routine, and D8-BOB #2's backstop and WATCH #2 appear in no later snapshot. X13's rule (the log from git, never from triggers) is necessary; "no enabled routine before archive" is judged from the snapshot before the deletion.
- P5: `archive_session` returned the same usage as `get_session` read just before, for D8-BOB #2 (4,342,774 cache reads both).

## Verdicts

`node checks/cert/assert.mjs dryrun/cert/R1/run.json` (`assert.txt`; the tranche's metrics copied as `D8.csv`): A4, A5, B2, D9, E1, G4, H6 PASS; the rest have no predicate and are judged here from the evidence above.

| row | verdict | evidence |
| --- | --- | --- |
| A1 | PASS | one D8-BOB #1 (then one #2), parent D8-ROOT #1, created after the START fired; the handoff commit on the branch |
| A2 | PASS | `From ROOT (D8): REFUSED #1` to the requester, reason on line 2; no session started |
| A3 | PASS | the duplicate START BOB #1 fired 17:00:00; one session titled D8-BOB #1 |
| A4 | PASS (tool) | no STARTED; ROOT's one message went to its live requester |
| A5 | PASS (tool) | both takeovers Status-only commits; depth 1 from D8-ROOT #1 |
| A6 | PASS | D8-BOB #2 deleted the stray routine, the backstop and WATCH #1 before archiving the idle D8-BOB #1; row BOB-final = archived usage (4,453,300) |
| A7 | NOT PROVOKED | D8-BOB #1 was idle at the takeover; carried to R2 |
| A8 | PASS | the successor handled every message above the marks (ALPHA J1, J2; BETA J1; GAMMA J1) |
| B1 | PASS | branches from the tranche head; titles ALPHA #1, BETA #1/#2, GAMMA #1; parent the BOB; Status with depth 2 within 30 s |
| B2 | PASS (tool) | one first message per session |
| B3 | PASS (variant) | birth-death window missed (jobs start in 25 s); a job archived while waiting was found at the next backstop, its row written, restarted as #2 (X12), and completed |
| D9 | PASS (tool) | no message to an archived session; the BOB restarted beta before answering it |
| E1 | PASS (tool) | every question answered; no relay |
| G4 | PASS (tool) | five archived job/BOB sessions, one row each with archived usage |
| H2 | PASS | an unanswered QUESTION across the refresh was answered by the successor; the successor armed its backstop and WATCH and deleted the predecessor's |
| H6 | PASS (tool) | one backstop into the current BOB while the layer ran |
| P1 | CHANGED | a session with a creation prompt starts its first turn within ~20 s and a job pushes its Status within ~25 s (the model assumes 1–2 min idle; harmless: the rule waits ≥5 min) |
| P2 | PASS | routine latency 7–44 s past its minute (A1 9.9 s, backstop 63 s after 17:05 with minute rounding, calibration 43 s) |
| P3 | CHANGED | a job that ends its turn waiting reads COMPLETED/review_ready, not BLOCKED; the record-based rule is indifferent |
| P5 | PASS | archive usage = get_session usage |
| P6 | MEASURED | deleted triggers leave no trace |
| — | PASS | `update_trigger` re-arms a fired one-time routine (enabled, new time, fired again 17:15:34 and 17:21:27) |

**Cost:** stand-ins 15.35M cache reads, 0.62M cache writes (ROOT 1.72M, BOBs 4.45M + 4.34M, jobs 1.21 + 0.87 + 1.72 + 1.03M); snapshot workers 0.17M; the harness's own share is in BOB #49's row.
