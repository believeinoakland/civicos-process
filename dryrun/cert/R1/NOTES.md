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
