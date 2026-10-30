# N2 · why layer 1 was slow and costly: the study Bob asked for (30 Oct 2026)

Bob, 30 Oct, 22:0xZ: "It's imperative that development be efficient, productive, AND FAST! The process being used here is none of those 3. So let's study what's causing these problems - to the point that we really understand. Then let figure out how to fix them, fix them, then confirm that they're fixed." Every number below names its source; what is not measured is called unknown.

## 1. Measured so far (BOB #2, 22:0xZ)

**Layer 1's wall clock** (state branch `state/E1`, commit times): opened 19:51; sessions created 20:30 (after the BOB #1 → #2 handoff); first completions platform 20:47, record 20:52; then review rounds to 22:00 and still open: platform reviewed 4 times (gaps 7, 3, 1, 4), record twice (18, 5).

**Tokens processed per session** (`get_session` usage, 22:00Z; the architecture session's from its own transcript):

| session | cache read | cache write | input | output | context now |
| --- | --- | --- | --- | --- | --- |
| BOB #2 (architecture) | 177,386,670 | 2,596,953 | 13,735 | 738,260 | 505,418 of 1,000,000 (past its 40 % refresh line) |
| PLATFORM #1 (job) | 73,139,939 | 578,891 | 10,193 | 150,339 | 448,984 (worker restarted 4 times: epoch 5) |
| RECORD #1 (job) | 60,935,851 | 761,530 | 4,625 | 169,621 | 441,360 (epoch 4) |
| five reviewers | about 112,000 to 162,000 each (the harness's own count per worker) | | | | fresh each |

So about 311 million cache-read tokens for one layer of two modules of about 900 and 1,100 lines; the architecture session alone is 57 % of it. P13 names the cause in general: cost grows with context size times turns.

**Where the architecture session's 97 minutes of tool time went** (its transcript, tool call to tool result):

| kind | calls | minutes |
| --- | --- | --- |
| the message check before each message to Bob (`proc say`: a fresh-reader model and an evidence-judge model, rerun on every refusal) | 62 | 19.0 |
| other shell work (reading, git, the tool's commands) | 98 | 13.9 |
| the code checks | 24 | 3.7 |
| sessions and messages | 28 | 3.4 |
| GitHub | 29 | 2.8 |
| the test suite | 3 | 1.6 |

The message check took more of the architecture session's time than any other kind of work, and REQUIREMENTS.md MSG-5 (accepted) already says no model judge sits between a session and Bob.

## 2. Being measured (helpers, from each job's transcript)

Each job's turns, time by kind of work, files read and how often, time per review round, restarts: `study-platform`, `study-record`.

- **record** (helper `study-record`, done 22:1xZ; whole result `build/plan/N2-study-record.md`): of 89 minutes, 44 % idle between turns (30 minutes of it waiting on a message from BOB, the longest 9.5, 8.2 and 5.2 minutes), 56 % inside 13 turns; of the turns' tool time, 78 % ran the test suite (11 full-suite runs of about 92 to 130 seconds, plus 3 inside `job complete`), 2 % read files; 58 % of turn time was the model writing with no tool running. A CHANGE sent while a turn ran waited 380 seconds to be read. No restart visible in the events read.
- **platform** (helper `study-platform`, done 22:1xZ; whole result `build/plan/N2-study-platform.md`): of 91 minutes, 48 % idle waiting for BOB's next message and 13 % idle waiting for a background check run; 27 % the model writing with no tool running; 12 % a tool running, of which the tests were 397 of 682 seconds. 27 turns: 13 started by a BOB message, 13 by a background task finishing. The worker was replaced four times, each after an idle gap of 6 to 10 minutes, each costing about 3 seconds. BOB's wait from a COMPLETE to his next message averaged 5 minutes 12 seconds over rounds 1 to 4.

**Read across both jobs (BOB #2, for BOB #3 to carry to causes):** about half of each job's wall clock was waiting on the architecture session; the architecture session's own time went most to the message check before each message to Bob; inside the jobs, full test-suite runs, repeated after every change, dominate tool time; review rounds multiplied all of it.

## 3. Causes, fixes, confirmation

Written once §2 is in, from the evidence of §1 and §2 only.
