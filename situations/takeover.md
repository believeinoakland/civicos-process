# Situation: a session starts as BOB

1. Read your depth: follow `parent_session_id` with `get_session` until you reach the session your prompt names as ROOT (ROOT is depth 0; you should be 1).
2. `proc takeover --name "BOB #<n>" --session <your id> --depth <d>` on the tranche branch named in your prompt. It writes the plan's Status line (the address every job messages), records your role for the hooks, and prints: your predecessor, every job's state from git, every act owed, and the acts that remain.
3. Do each act it prints, in order: tell Bob if your depth is not 1 (P13); archive your predecessor once it is idle and write its `BOB-final` row (`archive_session` returns its usage; mechanics §10); delete every routine into it by id (`list_triggers`, every page; a refused delete of a routine into an archived session is skipped); arm your backstop.
4. Act on each job's needs in `proc status`: `ANSWER` (its record's WAITING line is the question), `MERGE`, `UNBLOCK`, `RELAY TO BOB`, `QUIET` (read its session with `get_session`; idle while WORKING means it stopped: route a message to it, `proc job route`).
5. Read the product's channel if it has one (its manifest says how), then follow the handoff in order.
