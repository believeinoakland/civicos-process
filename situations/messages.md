# Situation: a message from a job; a change to a running job (P5, P7, P9)

A job's message arrives as a turn. Its record in git holds the state that matters (`proc status`); the message carries the words.

- **Question** (record `WAITING: …`): answer by `send_message` (to the session `proc job route` names). If the answer clarifies a requirement's wording, edit the requirement on the tranche branch first and say "merge the tranche". A change to what a requirement means, or to a provided service, is Bob's (P17): bring it to him; meanwhile the job carries on with its best reading.
- **Report** (a flaw or improvement in another module, a stale artifact): confirm it against that module's requirements; then (P9, P10) send it to that module's running job, else add it to the entries of its job not yet started, else to the next round's plan; record a ruling when you decide anything.
- **Complete:** `proc merge --module <m> --context <%>` at once (`situations/merge-close.md`).
- **Blocked** (`BLOCKED: tests|context|reading …`): tests: work it with the job (clarify, route a cause, re-scope); context: archive and start its successor by `proc job route`; reading: trim or split the document (mechanics §17), then message the job.
- **NEEDS BOB:** tell Bob at once in one line: the session's name and link, and the one act to approve there (`situations/refused.md`).
- **A change to a running job** (you changed a file it reads; a provided service changed; a routed report): `send_message` naming what changed and whether to merge the tranche. A provider's change is merged first, then its users told (mechanics §4).
