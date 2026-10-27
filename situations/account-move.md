# Situation: moving the work to Bob's next account (P13, P17; Bob, K5417, K4790)

**When.** `get_session` (yours) shows `rate_limit_info` with `rateLimitType` `seven_day` and `status` not `allowed`, at a backstop check or before starting any session; or Bob says to move. Bob has three accounts; the next is the one after the current in the manifest's "Starting a session". A five-hour limit is never a move: wait it out.

**At once, then at the next point where no step is half done** (no module job live: a running layer finishes or its jobs hand off first, K4790):

1. **Spin down.** `send_message` to every session in `LANES.md` §3 and to the UX design stream: `SPIN DOWN: finish or abandon the current step cleanly, rewrite your HANDOFF section 0 and NEXT-SESSION-PROMPT.md, push, reply SPUN DOWN, then stop.` Record each reply's commit in `LANES.md` §3. No reply after 20 minutes and one more message: record it unanswered; its successor starts from the last pushed prompt.
2. **Merge** every lane branch's folder into the tranche branch (as at every backstop), and the UX stream's last MERGE if posted.
3. **Archive** each spun-down session and stop every routine of yours but the backstop. Sessions left on the old account get no `BOB-final` row (K4790).
4. **Hand off** (`situations/refresh.md`), the handoff naming: the next account; every lane and the UX stream to restart, each from its `NEXT-SESSION-PROMPT.md` at the recorded commit; the ROOT prompt below, filled in. `proc handoff` as usual, but its text is not sent to ROOT (no message crosses accounts).
5. **Tell Bob in one line**, and walk him through the one act in plain steps on a rendered page: sign in to the next account, start a new Claude Code session on `believeinoakland/bio` at the tranche branch, paste the ROOT prompt.

**The ROOT prompt** (the precedent K4789, filled in by the outgoing BOB):

> You are ROOT #<m>, started by Bob on his <next> account, depth 0. Attach believeinoakland/civicos-process and clone it to /home/user/civicos-process; read `roles/ROOT.md` there and follow it. Your first act: check that `build/handoff.md` on `<tranche branch>` says in its Status line that it is BOB #<n>'s for BOB #<n+1>; if not, answer "Not yet" and wait for Bob's "check again". When it does, act as on `START BOB #<n+1>: <tranche branch> @ <its commit>`, the prompt adding: "BOB #<n> is on the <old> account and unreachable; record its routines as `--unanswered "another account"`."

**The next BOB, on the new account, at takeover:** `proc bob cleared --unanswered "another account"` for the predecessor; restart every lane and the UX stream from the prompts the handoff names (`create_session`, model as `LANES.md` §2), recording each in §3; set the manifest's ROOT entry and `build/channels.md`'s `BOB` account (K4790); run `xwriter --as BOB` with the new account. Then the handoff's next steps.
