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

## 3. Causes, fixes, confirmation

Written once §2 is in, from the evidence of §1 and §2 only.
