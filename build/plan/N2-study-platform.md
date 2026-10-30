# Study: where PLATFORM #1 spent its time and turns

Session `session_01RAN5enucmXTQSLEYL3QPrK` (PLATFORM #1, job for module platform, PR 127). Written for BOB #2 by the study-platform brief, 30 Oct 2026. Everything below is computed by `python3 -I` scripts from the saved event pages; nothing is read by eye except where a row says so.

## Summary in numbers (each is derived in the section named)

- Wall time 91m28s (5488 s), 27 turns, 229 tool calls, 222 model calls, 5 completes accepted (+1 refused), 13 BOB messages, 4 worker restarts after the first process. (0, 1)
- No turn running for 3330 s = 60.7% of wall: 2619 s waiting for the next BOB message (47.7%), 706 s waiting for a background check (12.9%), 5 s start-up. (2a)
- A turn was running for 2158 s = 39.3% of wall: 1480 s with no tool running (model thinking and writing, 27.0%) and 678 s with a tool running (12.4%). The API answering time by the harness's clock is 1656 s. (2a)
- Of the 682 s of foreground tool-call time, tests are 397 s in 19 calls (three calls of 120, 115 and 74 s at 20:36-20:42 are 309 s of it); proc commands 130 s; reads 29 s in 44 calls; searches 16 s; edits 16 s; git 24 s; messages 13 s. (2b)
- The full checks (suite + ownership + gate) ran in the background 7 times at 77-157 s each (mean 125 s, 874 s together, launch to first read); after each, `job complete` re-ran the gate in the background (7-16 s) and `job posted` took 8.7-9.4 s. (2c)
- Reads: the START's eleven files were read whole once each in turn 1 (97,325 bytes); `tools/proc.mjs` was read in ranges 7 times, `tools/platform.mjs` 6, `tools/test/platform.test.mjs` 6, `tools/test/proc.test.mjs` 5, `build/requirements/platform.md` 3 (3 whole/filtered); no file was read in full more than twice. (3)
- Rounds (4, 4b): START to COMPLETE #1 17m35s (it contains BOB's first CHANGE, sent 20:42:40Z); then, first BOB message of the group to the COMPLETE message: 32m45s (six messages, one refused complete), 8m53s, 4m38s, 5m53s; the last message (22:00:57Z) was 1m08s old at the last event, with no complete yet. In the closed rounds 1-4 BOB's wait between a COMPLETE and his next message was 20m48s in all (mean 5m12s) and the job windows 44m53s.
- Restarts: four new worker processes (turns 6, 8, 16, 27), each after 364-575 s idle and woken by a BOB message, each costing about 3 s to the first request; no turn is replayed and no tool call repeated. (5)

## 0. Data and method

| item | value | how computed |
|---|---|---|
| events held | 719 (assistant 457, user 235, result 27) | 11 pages from `list_events` (limit 100, kinds user/assistant/result), paged back with `before_id` until `has_more` was absent; 719 distinct uuids, none repeated |
| pages saved | page01..page11 `.json` (+ `.raw` for 01-10) in `/tmp/claude-0/-home-user-neoprocess/83f6da8d-ee35-55d5-8736-d8fa4e7ce2a2/scratchpad/study/platform-events/` | page 11 holds the one event the oldest page left (the seed message) |
| first / last event | 2026-10-30T20:30:37.593821Z / 2026-10-30T22:02:05.423810Z | min and max `created_at` |
| wall time covered | 5487.8 s = 91m28s | last event minus first event |
| fetched at | about 22:02:25Z (the first page request; epoch in the saved file name 1793397745589) | the newest event is 22:02:05Z, so the session was in a wait at fetch time; `date` when the script ran: 22:08Z |
| tool calls | 229 (every one has a result) | distinct `tool_use` ids; none unmatched |
| model calls (API messages) | 222 | distinct `message.id` over assistant events (an assistant event is one content block) |
| turns | 27 | one per `result` event; turn start = result time minus its `duration_ms` |
| not in the requested kinds | system / hook / restart notices | so restarts in section 5 are read from the `result` fields (`process_turn_index`, `time_to_request_from_spawn_ms`, `warm_spare_claimed`, `time_origin_ms`), not from a restart notice |

Caveats that bear on every number: (a) a tool call's time is `tool_result` event time minus `tool_use` event time, as the brief says; a `tool_use` event is stamped when the model finished writing it, so a call's time is its run time. (b) A `run_in_background` Bash returns in 1-2 s and its real run time is not a tool-call time; it is reported apart in 2c. (c) BOB's messages never appear as `user` events in this transcript: they arrive through the session's `ReadNotifications` tool as "message from another Claude session" (sender `session_01RAN5eo3fxXxLGJQ2rN1rFR`), so "the user message that starts a turn" is, for BOB's messages, the first `ReadNotifications` result of a turn, with the send time from its "queued at" header.

## 1. Turns

27 turns (27 `result` events). Start = result time - `duration_ms`. Idle before = start minus previous turn's end (no turn running). Tool calls = `tool_use` blocks that began inside the turn (sum 229 = 229). Model calls = distinct API message ids in the turn. All 27 turns have `origin.kind = task-notification`; the trigger column is read from the turn's first call and the `producer` field.

| # | start | end | duration s | idle before s | tool calls | model calls | started by (first 120 chars) |
|---|---|---|---|---|---|---|---|
| 1 | 20:30:42Z | 20:44:05Z | 803.2 | 4.6 | 51 | 50 | SESSION START (seed message, 20:30:37Z): /goal proc job state --module platform --product . prints COMPLETE with nothing owed, or a wait of yours (WAITING:, BL |
| 2 | 20:44:05Z | 20:45:15Z | 70.0 | 0 | 15 | 14 | BOB message queued 20:42:40Z: CHANGE: build/modules.json on tranche now gives platform the paths tools/platform.mjs and tools/platform.md and the  |
| 3 | 20:47:08Z | 20:47:35Z | 27.1 | 112.9 | 4 | 5 | background task bqwazm5d7 finished (launched 20:45:09Z: gate/checks local); runId 0mvvfyd0n-59d453ba |
| 4 | 20:47:41Z | 20:48:35Z | 54.3 | 5.8 | 7 | 7 | background task b16oqou2y finished (launched 20:47:31Z: proc command (proc.mjs job/addr/reading)); runId 0mvvg1dzs-0cbd599c |
| 5 | 20:48:35Z | 20:48:44Z | 8.6 | 0 | 1 | 2 | BOB message queued 20:47:47Z: ANSWER: confirmed, and already placed in the plan (build/plan/current.md), no new entry needed: N2-34 (sessions, layer 4 |
| 6 | 20:55:09Z | 20:55:28Z | 19.4 | 385.5 | 3 | 4 | BOB message queued 20:55:04Z: CHANGE (stop 1 of N2, ruling K2, build/rulings.md): the gate red on your pull request 127 (REFUSED: the diff touches se |
| 7 | 20:55:31Z | 20:55:40Z | 8.8 | 2.6 | 1 | 2 | background task bgz989zq0 finished (launched 20:55:25Z: proc command (proc.mjs job/addr/reading)); runId 0mvvgbjjb-37b70503 |
| 8 | 21:05:15Z | 21:08:07Z | 172.5 | 575.1 | 16 | 15 | BOB message queued 21:05:11Z: CHANGE: the review of pull request 127 found gaps (posted on the pull request; jobs/platform/review.md on the state bran |
| 9 | 21:10:08Z | 21:11:29Z | 81.8 | 120.2 | 7 | 8 | background task bua1oscpr finished (launched 21:08:02Z: gate/checks local); runId 0mvvgrsjh-8c399a83 |
| 10 | 21:11:31Z | 21:12:16Z | 45.0 | 1.6 | 5 | 5 | BOB message queued 21:11:31Z: CHANGE (rulings K6 and K7, build/rulings.md): two things, both on tranche at a9617b0; merge origin/tranche into job/plat |
| 11 | 21:14:06Z | 21:14:23Z | 17.7 | 109.6 | 4 | 4 | BOB message queued 21:14:05Z: CHANGE (a measured platform fact for your R1 table, PLT-1; small): get_session on this architecture session at 21:11:4 |
| 12 | 21:16:22Z | 21:16:43Z | 20.8 | 118.8 | 3 | 4 | BOB message queued 21:16:22Z: CHANGE: your gate at 21:14Z on 19be9a4 is red on one finding, yours: ownership: tools/test/proc.test.mjs:560-560: added |
| 13 | 21:19:13Z | 21:19:38Z | 24.8 | 150.3 | 3 | 4 | background task b7omhjy88 finished (launched 21:16:38Z: gate/checks local); runId 0mvvh2uk1-6f6b1093 |
| 14 | 21:19:38Z | 21:19:51Z | 12.8 | 0.1 | 2 | 3 | background task b2metw21o finished (launched 21:19:34Z: proc command (proc.mjs job/addr/reading)); runId 0mvvh6lld-92317604 |
| 15 | 21:19:58Z | 21:20:43Z | 45.7 | 6.9 | 7 | 7 | background task bxm3s0sfi finished (launched 21:19:45Z: proc command (proc.mjs job/addr/reading)); runId 0mvvh6uq5-c0b6026c |
| 16 | 21:26:47Z | 21:28:41Z | 113.5 | 364.0 | 13 | 14 | BOB message queued 21:26:42Z: CHANGE: the second review of pull request 127 found three gaps, all yours (posted on the pull request; jobs/platform/rev |
| 17 | 21:30:55Z | 21:32:39Z | 103.5 | 134.7 | 19 | 13 | BOB message queued 21:30:55Z: CHANGE (ruling K12, from the record job's second review; merge origin/tranche, commit 44c641b): R3 is extended: each act |
| 18 | 21:33:43Z | 21:33:53Z | 10.3 | 64.2 | 2 | 3 | BOB message queued 21:33:43Z: CHANGE (ruling K13, build/rulings.md): confirmed. The add_repo steps of proc repo setup and proc repo transfer (to |
| 19 | 21:34:35Z | 21:34:58Z | 22.3 | 42.0 | 4 | 4 | background task b80v663mz finished (launched 21:32:34Z: gate/checks local); runId 0mvvhnc3f-2bc0862a |
| 20 | 21:35:05Z | 21:35:46Z | 41.0 | 7.6 | 6 | 6 | background task bpvb80zk0 finished (launched 21:34:53Z: proc command (proc.mjs job/addr/reading)); runId 0mvvhqb88-020364c8 |
| 21 | 21:40:28Z | 21:42:07Z | 98.7 | 282.1 | 14 | 10 | BOB message queued 21:40:28Z: CHANGE: the third review of pull request 127 found one gap, yours (posted on the pull request; jobs/platform/review.md o |
| 22 | 21:44:09Z | 21:44:28Z | 18.6 | 122.5 | 3 | 3 | background task btud19pvu finished (launched 21:42:02Z: gate/checks local); runId 0mvvhzick-f557e87f |
| 23 | 21:44:35Z | 21:45:14Z | 39.1 | 7.4 | 6 | 6 | background task bxofmo2vl finished (launched 21:44:23Z: proc command (proc.mjs job/addr/reading)); runId 0mvvi2jgj-faa65588 |
| 24 | 21:48:00Z | 21:50:50Z | 169.4 | 165.9 | 20 | 15 | BOB message queued 21:48:00Z: CHANGE (Bob's direction, ruling K14, build/rulings.md): before your next completion, review your own whole change yourse |
| 25 | 21:52:52Z | 21:53:15Z | 23.4 | 122.1 | 3 | 3 | background task bwqflpou3 finished (launched 21:50:45Z: gate/checks local); runId 0mvviapz0-498ec8ba |
| 26 | 21:53:21Z | 21:54:04Z | 43.0 | 6.1 | 6 | 6 | background task b8yxgq9n6 finished (launched 21:53:10Z: proc command (proc.mjs job/addr/reading)); runId 0mvvidtwv-c282b90c |
| 27 | 22:01:02Z | 22:02:05Z | 63.4 | 417.2 | 4 | 5 | BOB message queued 22:00:57Z: CHANGE (the last review round, ruling K15: after this I verify your fix commits myself and merge; no further review). Th |

Totals: duration 2158.3 s + idle 3329.5 s = 5487.8 s (wall 5487.8 s). Turn kinds: 1 session start; 13 started by a BOB message (turns 2, 5, 6, 8, 10, 11, 12, 16, 17, 18, 21, 24, 27); 13 started by a background task finishing (producer `session-task`: turns 3, 4, 7, 9, 13, 14, 15, 19, 20, 22, 23, 25, 26).

Turn 1 is 803 s with 51 calls (the whole first build of the module); turns 2-27 average 52.1 s and 6.8 calls.

## 2. Wall time by kind

### 2a. Whole session wall time, split

| part | seconds | % of wall | how computed |
|---|---|---|---|
| A. in a turn, a tool running | 678.0 | 12.4 | per turn: union of [tool_use, tool_result] intervals clipped to the turn, summed over turns (parallel calls counted once) |
| B. in a turn, no tool running (model thinking and writing, waiting for the API) | 1480.3 | 27.0 | turn duration minus A |
| C. between turns, nothing running, session waiting for a background task (suite, checks, gate) | 706.4 | 12.9 | idle-before of the 13 turns started by a finished task (and turn 1's 4.6 s start-up excluded) |
| D. between turns, waiting for BOB (previous turn end to message queued-at) | 2592.6 | 47.2 | idle-before up to the message's queued-at time, for the 13 turns started by a BOB message |
| E. BOB message queued, turn not yet started (delivery / worker wake) | 26.1 | 0.5 | turn start minus the later of queued-at and the end of the previous turn (the part of the wait that fell between turns; a message that arrived inside a running turn waited for that turn to end, which is counted in A or B) |
| F. start-up (seed message to turn 1) | 4.6 | 0.1 | 20:30:37.6 to 20:30:42.1 |
| total | 5487.8 | 100 | check: wall = 5487.8 s |

Cross-check with the harness's own clock: cumulative `duration_api_ms` at the last result = 1656.4 s (30.2% of wall, 76.7% of in-turn time); it is the time the API was answering. Thinking blocks carry `thinking_duration_ms`: 127 blocks, 419.7 s in total (part of B). Output tokens summed over the 27 results: 153,115; of them thinking tokens 39,531.

### 2b. Tool-call time by kind (foreground time, tool_use to tool_result)

| kind | calls | of them run_in_background | sum s | % of tool-call time | % of wall | longest call s (start) |
|---|---|---|---|---|---|---|
| reads (Read tool + cat/sed/head/awk/ls of files) | 44 | 0 | 29.3 | 4.3 | 0.53 | 2.5 (21:44:39) |
| searches (Grep tool + grep) | 21 | 0 | 16.5 | 2.4 | 0.30 | 1.4 (20:44:57) |
| edits and writes (Edit, Write, sed -i, node -e rewrite, heredoc) | 40 | 0 | 15.6 | 2.3 | 0.28 | 1.6 (21:07:55) |
| running tests (`node --test`) | 19 | 0 | 396.6 | 58.1 | 7.23 | 119.9 (20:36:23) |
| running the gate or checks locally (`proc.mjs gate`, `checks/`) | 18 | 16 | 32.9 | 4.8 | 0.60 | 3.8 (21:28:23) |
| git (fetch, merge, commit, push, status, log) | 11 | 0 | 23.7 | 3.5 | 0.43 | 4.7 (20:55:17) |
| proc commands (`proc.mjs job ...`, `addr`, `reading`) | 23 | 7 | 130.2 | 19.1 | 2.37 | 9.8 (21:26:58) |
| messages (send_message) | 8 | 0 | 12.9 | 1.9 | 0.23 | 2.5 (21:35:35) |
| anything else | 45 | 1 | 24.5 | 3.6 | 0.45 | 2.5 (20:47:57) |
| all tool calls | 229 | 24 | 682.1 | 100 | 12.43 |  |

Sum of call times 682.1 s vs. union-in-turn A = 678.0 s (difference 4.1 s = parallel calls overlapping, plus 0 outside turns). Classification rule for a Bash call (one class per call, first match): `proc.mjs job|addr|reading` -> proc; `proc.mjs gate` or `node checks/ownership` -> gate/checks; `node --test` -> tests; heredoc / `sed -i` / `cp` / `mkdir` / `pkill` / `node -e` that calls `writeFileSync` -> edits; `until|sleep` -> wait; `git ...` -> git; `grep|rg` -> search; `cat|sed|head|tail|awk|ls|wc` -> read; the rest -> other. Compound commands go to the first matching class, so a `git commit && node --test` background call counts as tests or gate, not git. Calls of 1 s or more, which carry nearly all of the time, are listed in 2d with their class so any other grouping can be recomputed.

"anything else" by name:

| call | n | sum s |
|---|---|---|
| other: github PR comment/update/search | 12 | 18.5 |
| wait/poll (sleep/until) | 2 | 2.4 |
| other: bash (node script) | 1 | 0.9 |
| other: ReadNotifications | 13 | 0.9 |
| other: get_session | 1 | 0.7 |
| other: ToolSearch | 7 | 0.6 |
| other: TaskStop | 7 | 0.3 |
| other: list_events | 1 | 0.2 |
| other: Skill | 1 | 0.1 |

Characters returned by tool results, by kind (sum of `len(result text)`; Read results carry line-number prefixes):

| kind | result chars |
|---|---|
| reads (Read tool + cat/sed/head/awk/ls of files) | 295357 |
| searches (Grep tool + grep) | 45954 |
| edits and writes (Edit, Write, sed -i, node -e rewrite, heredoc) | 13564 |
| running tests (`node --test`) | 9171 |
| running the gate or checks locally (`proc.mjs gate`, `checks/`) | 4292 |
| git (fetch, merge, commit, push, status, log) | 14464 |
| proc commands (`proc.mjs job ...`, `addr`, `reading`) | 50393 |
| messages (send_message) | 176 |
| anything else | 66869 |
| all | 500240 |

### 2c. Background tasks (their run time is not in 2b)

24 background Bash calls. Run time is not logged; the table gives launch to the session's first later use of the task (a `cat tasks/<id>.output` or a `TaskStop`), which is an upper bound on the run time and a lower bound on how long the session was held waiting for it.

| task | launched | class | first later use | launch to use s | command start |
|---|---|---|---|---|---|
| b2wo1j2ms | 20:43:34 | gate/checks local | 20:43:46 read | 12 | (node --test checks/test/*.test.mjs tools/test/*.test.mjs >  |
| bl00fx2ov | 20:43:52 | wait/poll (sleep/until) | 20:44:10  TaskStop | 18 | until grep -q "gate exit" /tmp/claude-0/-home-user-neoproces |
| bsuwo0k1f | 20:44:22 | gate/checks local | 20:44:34 read | 12 | git push -q origin job/platform && node tools/proc.mjs gate  |
| bmkxbxqdo | 20:44:52 | gate/checks local | 20:45:02 read | 10 | git add -A && git commit -q -m "platform test: each fixture  |
| b6yihlcxc | 20:45:02 | gate/checks local | 20:45:12  TaskStop | 10 | until grep -q '"ok"' /tmp/claude-0/-home-user-neoprocess/a33 |
| bqwazm5d7 | 20:45:09 | gate/checks local | 20:47:10 read | 121 | node checks/ownership.mjs . platform origin/tranche HEAD 2>& |
| b16oqou2y | 20:47:31 | proc command (proc.mjs job/addr/reading) | 20:47:43 read | 12 | sed -i 's#platform.test.mjs:28 (R1#platform.test.mjs:26 (R1# |
| bgz989zq0 | 20:55:25 | proc command (proc.mjs job/addr/reading) | 20:55:34 read | 9 | node tools/proc.mjs job state --module platform --product .  |
| bua1oscpr | 21:08:02 | gate/checks local | 21:10:10 read | 128 | sed -n 976,982p tools/test/proc.test.mjs / cut -c1-90; git a |
| buu5jf101 | 21:11:24 | gate/checks local | 21:11:44  TaskStop | 20 | git add -A && git commit -q -m "platform: R13's interim test |
| bclz78tvb | 21:12:12 | gate/checks local | 21:14:10  TaskStop | 119 | grep -c "R13" tools/test/platform.test.mjs; git add -A && gi |
| bhfc9oxpc | 21:14:18 | gate/checks local | 21:16:30 read | 132 | git log -1 --oneline && git status --short && node tools/pla |
| b7omhjy88 | 21:16:38 | gate/checks local | 21:19:16 read | 157 | node -e JS && grep -n "versionCommand" tools/test/proc.test. |
| b2metw21o | 21:19:34 | proc command (proc.mjs job/addr/reading) | 21:19:40 read | 7 | node tools/proc.mjs job complete --module platform --report- |
| bxm3s0sfi | 21:19:45 | proc command (proc.mjs job/addr/reading) | 21:20:01 read | 16 | git fetch -q origin tranche && git merge --no-edit -q origin |
| bmuo6btg4 | 21:28:37 | gate/checks local | 21:31:08  TaskStop | 150 | until grep -q '"ok"' /tmp/claude-0/-home-user-neoprocess/a33 |
| b80v663mz | 21:32:34 | gate/checks local | 21:33:51 read | 77 | git add -A && git commit -q -m "platform R3 (K12): each act  |
| b71q8nlno | 21:33:51 | gate/checks local | 21:34:40  TaskStop | 49 | until [ -s /tmp/claude-0/-home-user-neoprocess/a33cce63-5adf |
| bpvb80zk0 | 21:34:53 | proc command (proc.mjs job/addr/reading) | 21:35:09 read | 16 | git fetch -q origin tranche && git merge --no-edit -q origin |
| btud19pvu | 21:42:02 | gate/checks local | 21:44:12 read | 130 | git add -A && git commit -q -m "platform R12, third review:  |
| bxofmo2vl | 21:44:23 | proc command (proc.mjs job/addr/reading) | 21:44:39 read | 15 | git fetch -q origin tranche && git merge --no-edit -q origin |
| bwqflpou3 | 21:50:45 | gate/checks local | 21:52:54 read | 130 | git add -A && git commit -q -m "platform, self-review (K14): |
| b8yxgq9n6 | 21:53:10 | proc command (proc.mjs job/addr/reading) | 21:53:25 read | 14 | git fetch -q origin tranche && git merge --no-edit -q origin |
| bhskcuv1f | 22:01:59 | gate/checks local | never (transcript ends) | - | git add -A && git commit -q -m "platform, final review (K15) |

The commit-then-full-checks tasks (suite + ownership + gate, started by `git add -A && git commit ... ` in the background) took 77 to 157 s from launch to first read: 7 of them, mean 125 s, sum 874 s (computed from the rows above with wait over 60 s and not stopped). The `job complete` re-run of the gate: launch to read 7-16 s each (class proc command).

### 2d. Every tool call of 5 s or more, and the gaps in a turn of 30 s or more with nothing running

| start | s | class | command start |
|---|---|---|---|
| 20:30:59 | 9.5 | proc command (proc.mjs job/addr/reading) | git log -3 --oneline && git status -sb / head -3 && node tools/proc.mj |
| 20:31:35 | 5.2 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs addr --bob --product . ; node tools/proc.mjs job s |
| 20:31:51 | 6.4 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job state --module platform --set "WAITING: QUESTI |
| 20:36:23 | 119.9 | tests (node --test) | sed -i "s/^import { Refused, processHead, ownerSecret, dispatch,/impor |
| 20:38:24 | 115.1 | tests (node --test) | node --test checks/test/*.test.mjs tools/test/*.test.mjs 2>&1 / grep - |
| 20:40:30 | 73.9 | tests (node --test) | node -e JS && node --test tools/test/proc.test.mjs tools/test/hooks.te |
| 20:44:11 | 7.6 | proc command (proc.mjs job/addr/reading) | git fetch -q origin tranche && git merge -q --no-edit origin/tranche & |
| 20:44:43 | 5.1 | tests (node --test) | node -e JS && for i in 1 2 3; do node --test tools/test/platform.test. |
| 20:48:01 | 8.9 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job posted --module platform --comment 6533146658  |
| 21:05:32 | 6.8 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job state --module platform --set WORKING --produc |
| 21:10:19 | 31.1 | tests (node --test) | node --test --test-name-pattern="the job's life" tools/test/proc.test. |
| 21:20:21 | 9.4 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job posted --module platform --comment 6533695923  |
| 21:26:58 | 9.8 | proc command (proc.mjs job/addr/reading) | git fetch -q origin tranche && git merge --no-edit -q origin/tranche & |
| 21:28:08 | 7.6 | tests (node --test) | S=/tmp/claude-0/-home-user-neoprocess/a33cce63-5adf-52d6-9879-258e34ee |
| 21:35:24 | 9.1 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job posted --module platform --comment 6533950934  |
| 21:40:40 | 8.7 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job state --module platform --set WORKING --produc |
| 21:44:55 | 8.7 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job posted --module platform --comment 6534129279  |
| 21:48:06 | 7.1 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job state --module platform --set WORKING --produc |
| 21:53:42 | 8.8 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job posted --module platform --comment 6534300513  |
| 22:01:16 | 8.7 | proc command (proc.mjs job/addr/reading) | node tools/proc.mjs job state --module platform --set WORKING --produc |
| 22:01:46 | 5.9 | tests (node --test) | S=/tmp/claude-0/-home-user-neoprocess/a33cce63-5adf-52d6-9879-258e34ee |

| from | turn | gap s (no tool running) | what ended the gap |
|---|---|---|---|
| 20:32:55 | 1 | 35.2 | thinking block |
| 20:34:17 | 1 | 94.5 | Write call with 28980 chars of input (model writing it) |
| 20:42:07 | 1 | 52.4 | Write call with 16042 chars of input (model writing it) |
| 21:06:59 | 8 | 33.2 | Bash call with 10208 chars of input (model writing it) |
| 21:48:18 | 24 | 40.0 | thinking block |

## 3. Files the session read

Rule: a read is "full" when it is a `Read` with no offset/limit, a `cat` of the file with no filter after it, or the process text printed by `proc.mjs reading` (sizes from its `=== file (N bytes) ===` headers). It is "partial" when it is a `Read` with offset/limit, a `sed -n` range, an `awk` range, `head`, or a `cat` piped into `head/grep/sed`. One Bash call that names a file several times (four `sed -n` ranges of tools/proc.mjs in one call) counts as one read of that file. "Bytes of full reads" is the characters returned for that file when its content could be separated from the rest of the call result (a single `cat`, a `Read`, or a result split on its own markers); "shared result" is the whole result of a call that also ran other statements, so it is an upper bound. "Result chars of partial reads" is the length of the whole call result (upper bound, shared). `Read` results carry a line-number prefix on every line, so they are ~1% longer than the file (PERMISSIONS.md: 38,131 chars returned, 37,851 bytes by `wc -c`). The session's own background-task output and scratch files are left out (below).

| file | full reads | partial reads | all reads | bytes of full reads | result chars of partial reads (upper bound) | flag | when and how |
|---|---|---|---|---|---|---|---|
| `tools/proc.mjs` | 0 | 7 | 7 | - | 53145 | READ 7 TIMES | 20:31:33 sed -n \| filter; 20:32:09 sed -n x4 ranges; 20:32:13 Read of the persisted full output of the 20:32:11 `sed -n 2195,2500p`; 20:34:11 sed -n x2 ranges; 20:36:23 sed -n; 21:40:40 sed -n \| filter; 21:49:37 sed -n |
| `tools/platform.mjs` | 0 | 6 | 6 | - | 41330 | READ 6 TIMES | 21:06:26 Read offset 118 limit 62; 21:31:46 sed -n \| filter; 21:31:49 Read offset 36 limit 50; 21:32:08 sed -n \| filter; 21:49:41 Read offset 15 limit 6; 21:50:21 Read offset 150 limit 200 |
| `tools/test/platform.test.mjs` | 0 | 6 | 6 | - | 14359 | READ 6 TIMES | 21:06:57 Read offset 76 limit 80; 21:27:44 Read offset 219 limit 22; 21:27:51 sed -n; 21:41:38 Read offset 244 limit 25; 21:41:40 Read offset 268 limit 4; 21:50:36 sed -n |
| `tools/test/proc.test.mjs` | 0 | 5 | 5 | - | 8316 | READ 5 TIMES | 20:32:45 sed -n; 21:07:55 sed -n; 21:08:02 sed -n \| filter; 21:10:52 sed -n \| filter; 21:11:00 sed -n |
| `build/requirements/platform.md` | 2 | 1 | 3 | 3526 (+ shared result 4757) | 4063 | READ 3 TIMES | 20:31:11 cat; 21:05:22 cat \| filter; 21:48:06 cat |
| `tools/test/hooks.test.mjs` | 0 | 2 | 2 | - | 5432 |  | 21:05:56 sed -n; 21:07:55 sed -n |
| `(git diff origin/tranche...HEAD, whole diff: output of the 21:48:15 command, not a file)` | 1 | 0 | 1 | 37656 | - |  | 21:48:18 Read of persisted tool-result file |
| `.github/workflows/repo-rename.yml` | 1 | 0 | 1 | 2080 | - |  | 20:31:14 cat (loop) |
| `.github/workflows/repo-setup.yml` | 1 | 0 | 1 | 2280 | - |  | 20:31:14 cat (loop) |
| `.github/workflows/repo-shims.yml` | 1 | 0 | 1 | 2661 | - |  | 20:31:14 cat (loop) |
| `.github/workflows/repo-transfer.yml` | 1 | 0 | 1 | 2175 | - |  | 20:31:14 cat (loop) |
| `GRANTS.md` | 1 | 0 | 1 | 5195 | - |  | 20:31:14 cat (loop) |
| `JOB-LIFE.md` | 0 | 1 | 1 | - | 9871 |  | 20:31:35 cat \| filter |
| `PERMISSIONS.md` | 1 | 0 | 1 | 38131 | - |  | 20:31:15 Read |
| `PROCESS-DESIGN.md` | 1 | 0 | 1 | 14203 | - |  | 20:30:51 proc.mjs reading (process text) |
| `REQUIREMENTS.md` | 0 | 1 | 1 | - | 7743 |  | 20:33:31 awk |
| `SETUP-STEPS.md` | 1 | 0 | 1 | 11384 | - |  | 20:31:16 cat |
| `build/grants.json` | 1 | 0 | 1 | shared result 2730 (upper bound) | - |  | 21:06:13 cat |
| `build/layers.md` | 1 | 0 | 1 | 1703 | - |  | 20:31:11 cat |
| `build/manifest.md` | 1 | 0 | 1 | shared result 2776 (upper bound) | - |  | 20:32:54 cat |
| `build/modules.json` | 0 | 1 | 1 | - | 2427 |  | 20:31:21 cat \| filter |
| `checks/coverage.mjs` | 0 | 1 | 1 | - | 1692 |  | 20:41:48 sed -n |
| `checks/ownership.mjs` | 1 | 0 | 1 | 12629 | - |  | 20:31:25 cat |
| `lane-neoprocess/HANDOFF.md` | 0 | 1 | 1 | - | 4209 |  | 20:30:54 cat \| head -60 |
| `permissions.json` | 1 | 0 | 1 | 2532 | - |  | 20:31:14 cat (loop) |
| `rulebooks/building.md` | 1 | 0 | 1 | 3181 | - |  | 20:30:51 proc.mjs reading (process text) |
| `rulebooks/integration.md` | 1 | 0 | 1 | 3113 | - |  | 20:30:51 proc.mjs reading (process text) |
| `rulebooks/sessions.md` | 1 | 0 | 1 | 3390 | - |  | 20:30:51 proc.mjs reading (process text) |
| `tools/acts.md` | 1 | 0 | 1 | 31264 | - |  | 20:31:18 Read |
| `tools/hooks.mjs` | 0 | 1 | 1 | - | 1058 |  | 21:40:40 sed -n \| filter |

Bytes read in full: 177,103 characters returned in separable full reads (20 full reads of 19 items), plus 10,263 characters in results shared with other statements. Partial reads: 33 reads, 153,645 result characters (upper bound). Files read more than twice: `tools/proc.mjs` (7x: 0 full, 7 partial), `tools/platform.mjs` (6x: 0 full, 6 partial), `tools/test/platform.test.mjs` (6x: 0 full, 6 partial), `tools/test/proc.test.mjs` (5x: 0 full, 5 partial), `build/requirements/platform.md` (3x: 2 full, 1 partial). The START told the job to read whole: build/requirements/platform.md, build/layers.md (head and layer 1's row), the four repo-*.yml workflows, GRANTS.md, PERMISSIONS.md, SETUP-STEPS.md, permissions.json, tools/acts.md. All eleven were read whole at 20:31:11-20:31:18 (a `wc -c` in that first call shows their sizes: 97,325 bytes in all, of which PERMISSIONS.md 37,851 and tools/acts.md 31,103). `build/requirements/platform.md` was read whole twice more (3 reads).

Not repo files: 16 reads of the session's own background-task output / scratch files (`cat tasks/<id>.output` and the like), 16,565 result chars in all (some results are shared with a statement after the `cat`). Also at the start: the process text printed by `proc.mjs reading --role job` is one result of 24,255 chars (it is in the table above by file; its header says 'your process text: 23887 bytes of 26624'), and `proc job start` printed the START and the PR record (2,894 chars). Total characters returned by all 229 tool results: 500,240 (2b); the reads class alone returned 295,357.

## 4. Rounds: from each BOB message to the job's next `proc job complete`

"Sent" is the notification's "queued at" time (BOB's send time, server clock). "Read" is the `ReadNotifications` result (the session saw the text). `job complete` = the Bash call that launched `proc.mjs job complete` (a background call). `posted` = the `proc job posted --comment ... --ready` call. `COMPLETE msg` = the `send_message` "COMPLETE #n" to BOB (the moment BOB can see the round done). Elapsed columns are minutes:seconds from "sent".

| BOB message | sent | read | text (70 chars) | sent to read | next job complete (launch) | sent to complete | COMPLETE msg | sent to COMPLETE msg |
|---|---|---|---|---|---|---|---|---|
| START (round 0) | 20:30:37Z | 20:30:42Z | seed message | - | 20:47:31Z | 16m54s | 20:48:12Z | 17m35s |
| 20:42:40Z CHANGE | 20:42:40Z | 20:44:06Z | CHANGE: build/modules.json on tranche now gives platform the paths `to | 1m27s | 20:47:31Z | 4m51s | 20:48:12Z | 5m32s |
| 20:47:47Z ANSWER | 20:47:47Z | 20:48:36Z | ANSWER: confirmed, and already placed in the plan (build/plan/current. | 0m50s | 21:19:34Z | 31m47s | 21:20:32Z | 32m45s |
| 20:55:04Z CHANGE | 20:55:04Z | 20:55:11Z | CHANGE (stop 1 of N2, ruling K2, build/rulings.md): the gate red on yo | 0m08s | 21:19:34Z | 24m30s | 21:20:32Z | 25m28s |
| 21:05:11Z CHANGE | 21:05:11Z | 21:05:17Z | CHANGE: the review of pull request 127 found gaps (posted on the pull  | 0m06s | 21:19:34Z | 14m23s | 21:20:32Z | 15m21s |
| 21:11:31Z CHANGE | 21:11:31Z | 21:11:32Z | CHANGE (rulings K6 and K7, build/rulings.md): two things, both on tran | 0m02s | 21:19:34Z | 8m03s | 21:20:32Z | 9m01s |
| 21:14:05Z CHANGE | 21:14:05Z | 21:14:07Z | CHANGE (a measured platform fact for your R1 table, PLT-1; small): `ge | 0m02s | 21:19:34Z | 5m29s | 21:20:32Z | 6m27s |
| 21:16:22Z CHANGE | 21:16:22Z | 21:16:23Z | CHANGE: your gate at 21:14Z on 19be9a4 is red on one finding, yours: ` | 0m02s | 21:19:34Z | 3m12s | 21:20:32Z | 4m10s |
| 21:26:42Z CHANGE | 21:26:42Z | 21:26:49Z | CHANGE: the second review of pull request 127 found three gaps, all yo | 0m08s | 21:34:53Z | 8m12s | 21:35:35Z | 8m53s |
| 21:30:55Z CHANGE | 21:30:55Z | 21:30:57Z | CHANGE (ruling K12, from the record job's second review; merge origin/ | 0m02s | 21:34:53Z | 3m59s | 21:35:35Z | 4m40s |
| 21:33:43Z CHANGE | 21:33:43Z | 21:33:45Z | CHANGE (ruling K13, build/rulings.md): confirmed. The `add_repo` steps | 0m02s | 21:34:53Z | 1m11s | 21:35:35Z | 1m52s |
| 21:40:28Z CHANGE | 21:40:28Z | 21:40:30Z | CHANGE: the third review of pull request 127 found one gap, yours (pos | 0m02s | 21:44:23Z | 3m56s | 21:45:05Z | 4m38s |
| 21:48:00Z CHANGE | 21:48:00Z | 21:48:02Z | CHANGE (Bob's direction, ruling K14, build/rulings.md): before your ne | 0m02s | 21:53:10Z | 5m11s | 21:53:53Z | 5m53s |
| 22:00:57Z CHANGE | 22:00:57Z | 22:01:03Z | CHANGE (the last review round, ruling K15: after this I verify your fi | 0m07s | none yet | open at 1m08s (22:02:05Z) | none yet | - |

Rounds, grouped by the complete that closed them (a message that arrives while a round is open is part of that round):

| first message of the round (all messages in it) | first `job complete` | sent to it | accepted `job complete` | COMPLETE msg | first message to COMPLETE msg |
|---|---|---|---|---|---|
| 20:42:40Z (1 message: 20:42:40) | 20:47:31Z | 4m51s | 20:47:31Z | 20:48:12Z | 5m32s |
| 20:47:47Z (6 messages: 20:47:47, 20:55:04, 21:05:11, 21:11:31, 21:14:05, 21:16:22) | 21:19:34Z | 31m47s | 21:19:45Z | 21:20:32Z | 32m45s |
| 21:26:42Z (3 messages: 21:26:42, 21:30:55, 21:33:43) | 21:34:53Z | 8m12s | 21:34:53Z | 21:35:35Z | 8m53s |
| 21:40:28Z (1 message: 21:40:28) | 21:44:23Z | 3m56s | 21:44:23Z | 21:45:05Z | 4m38s |
| 21:48:00Z (1 message: 21:48:00) | 21:53:10Z | 5m11s | 21:53:10Z | 21:53:53Z | 5m53s |
| 22:00:57Z (1 message) | - | - | - | - | open: 22:02:05Z last event, 1m08s after the message; a check run was launched at 22:01:59Z |

Round 0 (START to COMPLETE #1) took 17m35s; the first group above (message 20:42:40) is the same `job complete` and shares it. Mean over the five closed message-groups (first message of the group to its COMPLETE message): 693 s (the first group is 5m32s; it is the end of round 0).

Note on the first `job complete` of round 2 (21:19:34Z): it was refused (`REFUSED: merge tranche into your branch first: BOB has changed build/requirements/gate.md ...`) because BOB had pushed to tranche in the meantime; the session merged and ran it again at 21:19:45Z, accepted. Every other `job complete` was accepted at first attempt. Five completes were accepted in the 91 minutes; each was followed by `job posted` (8.7-9.4 s) and a COMPLETE message.

BOB sent 13 messages between 20:42:40Z and 22:00:57Z (78m17s, mean gap 6.5 min): 12 CHANGE, 1 ANSWER. Sent-to-read is 1-8 s when the session was idle, 87 s for the first (the session was in turn 1) and 50 s for the ANSWER (it arrived inside turns 3-4).

### 4b. Who held each round (computed from the same events)

The session is cut into consecutive rounds at its COMPLETE messages (round k = previous COMPLETE message to this one). Each round is split at the first BOB message queued after the previous COMPLETE: before it the session was waiting for BOB ("BOB wait"); after it the job was working ("job window", to its COMPLETE message). Within the job window: tool = union of tool-running time; model = turn time with no tool running; no turn running = the rest (waiting for a background check, or for a further BOB message).

| round | round length | BOB wait (COMPLETE msg to his next message) | job window | tool s | model s | no turn running s |
|---|---|---|---|---|---|---|
| 0 (START to COMPLETE #1; the 20:42:40 CHANGE falls inside) | 17m35s | - | 17m35s | 408 | 524 | 123 |
| 1 (COMPLETE #1 to #2) | 32m20s | 6m52s | 25m28s | 105 | 333 | 1091 |
| 2 (COMPLETE #2 to #3) | 15m03s | 6m10s | 8m53s | 63 | 217 | 254 |
| 3 (COMPLETE #3 to #4) | 9m30s | 4m53s | 4m38s | 34 | 113 | 131 |
| 4 (COMPLETE #4 to #5) | 8m47s | 2m54s | 5m53s | 40 | 185 | 129 |
| 5 (open: COMPLETE #5 to last event 22:02:05Z) | 8m12s | 7m04s | 1m08s so far | 17 | 46 | 5 |

Over rounds 1-4 (closed): BOB wait 20m48s (mean 5m12s), job windows 44m53s; round 0 job window 17m35s. The open round: BOB waited 7m04s before the 22:00:57Z message.

## 5. Restarts of the session's worker

No turn is replayed: no tool call is repeated across a turn boundary and no `result` repeats. What does show is the worker process being replaced: `process_turn_index` (count of turns the current process has run) is reset to 0 at five results, and exactly those five results carry `warm_spare_claimed: true` and `time_to_request_from_spawn_ms`. `time_origin_ms` of those results is the process start time.

| process # | first turn | process started | that turn started | spawn to first API request s | idle gap before (previous turn end to this turn start) s | turns the previous process had run | cache_creation tokens in the turn | cache_read tokens in the turn |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 20:29:17Z | 20:30:42Z | 2.4 | - | - | 177,792 | 7,879,846 |
| 2 | 6 | 20:55:06Z | 20:55:09Z | 3.1 | 385 | 5 | 4,350 | 1,014,259 |
| 3 | 8 | 21:05:13Z | 21:05:15Z | 2.4 | 575 | 2 | 34,608 | 4,105,756 |
| 4 | 16 | 21:26:45Z | 21:26:47Z | 2.5 | 364 | 8 | 16,269 | 4,672,168 |
| 5 | 27 | 22:00:59Z | 22:01:02Z | 2.7 | 417 | 11 | 9,185 | 2,266,782 |

Each new process starts 2-3 s before its turn and within 2-3 s of the BOB message that woke it (messages queued 20:55:04, 21:05:11, 21:26:42, 22:00:57; processes started 20:55:06.8, 21:05:13.3, 21:26:45.4, 22:00:59.5). All four restarts follow an idle gap of 364 s or more (385, 575, 364, 417 s); idle gaps up to 282 s (turn 21) did not restart it. Process 1 was started 20:29:17.3, 80 s before the seed message. Cost visible in the events: spawn-to-request 2.4-3.1 s and `ttft_ms` 1.9-2.2 s, versus `time_to_request_ms` 62-210 ms for turns in a running process, so about 3 s per restart; cache_creation in the first turn after a restart is not larger than in neighbouring long turns (4,350 / 34,608 / 16,269 / 9,185 tokens). No gap of minutes with nothing running exists inside a turn (largest gap with no tool running in a turn: see 2d). The idle gaps between turns are the waits in 2a (C and D), not restarts.

DONE study-platform · turns, time by kind, reads, rounds, restarts