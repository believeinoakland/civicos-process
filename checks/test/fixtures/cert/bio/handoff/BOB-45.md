## 6. Handoff (BOB #45 to BOB #46, 2026-09-27 ~08:25 UTC)

Replaced at each handoff; the progress log (§4) is the history.

**Where things stand.** T5 is OPEN on `tranche/T5` (plan: `build/plan/current.md`, its "Jobs" section names every session). Layers 2 and 4 are CLOSED (merged, bundles regenerated, sessions archived, rows in `build/metrics/T5.csv`, 319.6M tokens for six jobs). **Layer 5 is running**, seven jobs started ~07:50 UTC: QUERY-LANGUAGE #1 and ENTITIES #1 are COMPLETE and merged (entities R33–R34 folded, K149; its final COMPLETE after K149 may still arrive: merge after an ownership check). CONNECTIONS #1, PROGRESSIONS #1, BIAS #1, OBSERVATION-LOG #1, RETRIEVAL #1 are working; answers K142–K149 sent. Every early merge so far: ownership check first, every added legacy line read.

**Next, in order.**
1. Take over (mechanics §2, §13): replace the session id in `current.md`'s Status line with yours, push, then tell each running layer-5 job (one-time routine, `From BOB #46 (T5): CHANGE`) that BOB's address changed. Arm the 20-minute backstop as a one-time routine re-armed at each check (K128). Archive BOB #45 (`session_01XMEw4Evvi4UHjyRFmaUvvr`) once idle, row `BOB-final` into `build/metrics/T5.csv`.
2. Expected from layer-5 jobs: connections' proposed Provides text (Q5 services, `weakerGrade`), observation-log's R29 text, then each COMPLETE. Fold proposed text into the module's requirements exactly as written (the "Proposed requirements" section of its record) unless a line repeats an id (the format check fails: K147's slip). Merge providers early and send their users a CHANGE (connections → progressions' `weakerGrade`, observation-log → retrieval).
3. Close layer 5 (regenerate bundles per `build/manifest.md`, fleetbundles 96/0, archive, metrics), then layer 11: LEGACY-INDEX and LEGACY-TESTS jobs; their T5-11 and T5-12 entries have grown with every job's REPORTs (read them whole). Then close T5 (mechanics §5), report to Bob.
4. While T5 runs (P18): T6 is drafted in `next.md` (K129); `capture-sources`' credential requirements are drafted at `docs/development/transition/drafts/capture-sources-credentials.md`, waiting on Bob's four answers.

**Open with Bob (none blocking):** the four credential questions (one host per login; who adds, removes and sees shared logins; a leaving member's logins; a supplied browser identity treated as the member's own browser; my recommendation was yes/as drafted to each); N96, a profile key for link formats (recommend yes); the member-facing word for "bundle" (N71; recommend "record"); his weekly meter (not given at T5's open).

**Process findings for the next revision (P3):** the ownership check counts a changed line as added (K140); a recurring routine cannot run oftener than hourly (K128); a job waiting on its own long command reads idle.

**What BOB #45 learned.** Messages cross constantly: act on the newest commit a message names. Ask a job to write proposed requirement text in its record and fold it verbatim; do not assign ids yourself while a job is proposing its own. Fixing a JSON file by re-serialising it reformats it: edit the one line. Never put a force-push in a command, even to a branch you just created.
