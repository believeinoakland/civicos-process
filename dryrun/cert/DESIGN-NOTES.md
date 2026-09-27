# K164 design notes (DRAFT, a worker for BOB #48)

The rules are in `PROCESS-MECHANICS.md` and `roles/*.md` on `revision/K164-design`, each marked *K164*. One line per gap: the rule; alternatives rejected; the `SUITE.md` scenarios that prove it.

| gap | rule chosen (§) | rejected | scenarios |
| --- | --- | --- | --- |
| X1 / F1 start | creation prompt is `START B<n>`; confirmed by the job's first push of its record Status; BOB looks at the first backstop ≥5 min after creation, never re-sends; unconfirmed at 15 min with no turn ⇒ restart (§5) | a separate START routine (K160: doubles the start); polling `get_session` (reads idle for 1–2 min) | B1, B2, B3, C1 |
| X2 / F2 wait classes | job ends a waiting turn on the line `Waiting on BOB (J<n>). Nothing for Bob to do.`; BOB relays only a `NEEDS BOB` line, or `needs_action` with no open wait in the record (§5, §6) | trying to keep `status_bucket` off BLOCKED (platform decides) | E1, E3, H5 |
| X3 / F3 / F5 envelope | first line `From <sender> (<T>): <KIND> <id> [re <id>] [replaces <id>]`, ids `J<n>`/`B<n>` per job; receipt idempotent against `handled` marks in record and plan; an ANSWER applies only to the newest version (§13, §6) | version numbers inside the question text; per-tranche global ids (marks stop being monotonic per recipient) | D3, D4, D5, D6, C-common |
| X4 / F4 ROOT | ROOT sends nothing on success (the takeover push is the sign); ignores a title it already started; `REFUSED` to the still-live requester; requester re-sends once at 20 min, then `NEEDS BOB: start ROOT` (§2) | `STARTED` to the successor (it already knows) | A1–A4, D9, C11, C12 |
| X5 BOB liveness | dead-man `WATCH`: BOB moves a one-time routine into ROOT 60 min ahead at each backstop; if it fires ROOT starts `BOB #<n+1>` (session archived/failed) or sends `WAKE` (idle) (§2, §5) | ROOT polling (a recurring timer, costly turns); jobs arming timers (every waiting job wakes) | H7 |
| X6 quiet | record state `WORKING` / `RUNNING until <time>` / `WAITING…` / `NEEDS BOB` / `COMPLETE`; quiet = not running, state `WORKING` or `RUNNING` expired, no push for 20 min ⇒ `RESUME`, then restart (§5, §6) | a periodic heartbeat push (costs turns; a job cannot push mid-command) | E6, H4 |
| X7 durable reviews | relays to Bob and each job's ownership result and `ADDED` count go in the plan's `Jobs` line (§5, §16) | a separate review log file | E2, G1 |
| X8 K140 | §8.3: a line changed only by removal is a removal; the tool fix is the harness worker's | — | G5 |
| X9 close | two pushed steps; archived plan Status `CLOSING`; closed exactly when `main` is at it; refused ff is §16's; no tranche opens behind a `CLOSING` (§5) | a CLOSED status commit (would put `main` behind again) | E5, H1 |
| X10 backstop handover | successor arms its own backstop and `WATCH`; deletes the predecessor's routines, `WATCH` included (§2) | — | H2, H6 |
| X11 takeover | successor pushes Status, then reads every running record and handles all above the plan marks; the takeover notice to jobs is deleted (§2, §13) | keeping the notice (a turn per job, no gain: jobs read the address before each send) | A5, A8, H2 |
| X12 restart | archive the old session (row written) before creating `<M> #k+1`; archive refused and session not failed ⇒ §16, no new session (§5) | — | B3, H3 |
| X13 log | job messages are record headings; BOB's are tranche commits whose subject is the envelope, `sent` mark in the same commit; the log is rebuilt from git, never from triggers (§13) | reading `list_triggers` (deleted ones may leave no trace) | D1, D2, C-common |
| X14 job context | past half its window (`get_session`), the job pushes its next step, sends `BLOCKED J<n>: context`; BOB restarts it; threshold corrected by metrics (§6) | BOB polling context (BOB spends its own turns) | F7 |
| X15 toy baseline | no mechanics change: `run.mjs dryrun` is fixed in the harness (P3, §15) | — | H8 |
| X16 ack | a job is complete only when its newest `COMPLETE` has handled BOB's newest message; merge at that commit (§5) | — | D7, G3, G4, C7 |

| lost message | at a check ≥20 min after BOB last sent, record `handled` < plan `sent`, start confirmed, session not failed ⇒ BOB re-sends its newest message, same id, never a `START`; the job reads earlier ones from the tranche (§5, §13; P9, P10) | a per-kind rule for ANSWER only (a lost CHANGE or RESUME hangs the same way) | D1, D2, model `resend` |

**Rule fixes found by the protocol model** (`rules-revised.mjs`; each also a negative control in `model.test.mjs`):
- WATCH is created when BOB opens the tranche or takes over, not at its first check: a BOB dying before its first check was unwatched (takeover-pair: `die BOB1`; switch `watchAtOpen`).
- ROOT moves the WATCH 60 min ahead when it sends `WAKE`: a lost backstop then a lost `WAKE` left BOB unchecked for the tranche, and a later lost `QUESTION` hung it (backstop-triple; `wakeMovesWatch`).
- A restarted job first reads every BOB message above its record's mark, not `handled` = its `START` id: an `ANSWER` sent to the dead session was skipped (job-pair; `restartReads`).
- `REFUSED` is acted on exactly as the second silence: ROOT never pushes, so its content must add nothing to state (contentInStateFirst).
- A job is complete only when the plan's `handled` is also at its record's `sent`, and a layer closes only with no routine to or from its jobs (closeClean with a duplicated `COMPLETE` in flight).
- One KIND per message; BOB→job envelopes name the module (`to <module>`), so the log is rebuilt from tranche commits alone (X13).

**Notes for BOB (yours, P17):** SUITE C13 and A8's "takeover notice" go (X11). D6's "# rulings replaced = 0" is not reachable when the answer crosses the revision; suggest "the replacing ruling cites both question ids, and the job applies neither answer to a stale version". D7 f1 (A10) needs no new rule: §16 and the restart rule cover a refused archive.

## Questions for Bob (P17: policy only) — ANSWERED: yes to both (bio K167, 2026-09-27)

1. **Unattended routines.** Your rule is that nothing runs unattended except the 20-minute backstop while a layer runs. The revision adds two related to it: the backstop also runs while a successor BOB is starting, and each check pushes a one-hour "dead-man" routine into ROOT that fires only if BOB has died. *Recommend yes:* otherwise a dead BOB waits for you to notice.
2. **ROOT's duty.** You designed ROOT to do only one thing, start a BOB when asked. The revision has it also start a successor when a BOB's dead-man routine fires (or wake an idle BOB). *Recommend yes:* no other session is alive to notice.
