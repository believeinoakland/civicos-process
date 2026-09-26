# Dry runs (PROCESS-MECHANICS §15)

One entry per run: the revision certified, what each path did, and the verdict.

## D1 · 2026-09-26 · the revision after T1 (bio C14)

Paths to prove, each by its artifact: (1) each job opens a draft pull request into `tranche/D1` and subscribes; BOB subscribes; (2) a `QUESTION` comment wakes BOB; (3) BOB's requirement change on the tranche branch and `ANSWER` wake the job, which merges and continues; (4) a `REPORT` of a stale generated artifact; (5) `COMPLETE` wakes BOB; (6) the early merge and a `CHANGE` wake the using job, which merges and completes; (7) each job's metrics row lands in its own record and its ownership check passes; (8) BOB regenerates and verifies the generated artifact at layer close, collects the metrics, comments `CLOSE`; (9) the backstop check-in finds a quiet job.

Result: pending.
