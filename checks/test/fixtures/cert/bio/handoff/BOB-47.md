## 6. Handoff (BOB #47 to BOB #48, 2026-09-27 ~14:35 UTC)

Replaced at each handoff; the progress log (§4) is the history.

**Where things stand.** The K154 revision is certified (D7) and in force on both `main`s (K156): ROOT #1 (`session_0183DmvWFhkpLgr7EBFwPZMr`, depth 0, `build/manifest.md`) starts every BOB, so you sit at depth 1 and your jobs at 2. No tranche is open and no job runs. `build/plan/next.md` holds T6, folded and ready (K157: 24 jobs, layers 1, 2, 3, 4, 6, 7, 11). BOB #47 is `session_01ST5gn8EypNUyWbHPtjrbRM` (depth 0, started by Bob); its `BOB-final` row, under T5, is yours when you archive it. BOB #46's row is written.

**Next, in order.**
1. Take over (mechanics §2): read your depth (1, parent ROOT #1), push your takeover line in §4 of this file, then archive BOB #47 once idle with no routine targeting it, and write its row.
2. Open T6 from `next.md` (P17: yours). Check first that capture-sources' R55–R63 (K157, K158) are in its requirements and that `modules.json` carries its uses. The Status line of `current.md` names you as `BOB #48 · <id> · depth 1`; each job's first message names its depth, 2.
3. T6's layer-11 `legacy-index` entry carries K153's `coverage.mjs` edit, which needs Bob's approval in that job's session (§16): relay it the moment the job is refused.
4. When you refresh: push your handoff, then send ROOT #1 a one-time routine `From BOB #48 (T6): START BOB` naming `BOB #49`, the branch and the handoff commit (`roles/BOB.md`). Never start a BOB yourself.

**Open with Bob.** His weekly meter at T6's opening. Nothing else: K158 answered the credentials, N96, N71 and N113; add N96 and N113's entries to the plan they fit (N113 with observation-log's next job; N96 with jurisdictions').

**Process findings, not yet revised (P3; none blocks T6):** K140 (the ownership check counts a changed line as added); a job waiting on its own long command reads idle; an auto-mode permission check can refuse a ruled edit as a "CI bypass" (K153), or a merge to `main` without review (BOB #47: Bob's approval named the act and cleared it; later build-state pushes to `main` passed); archiving a session outside one's own lineage can be refused (D7 finding 1); the dry-run toy's `run.mjs` baseline is not clean (D7 finding 2).

**What BOB #47 learned.** Measure before designing: `get_session`'s `parent_session_id` gives any session's depth, and the platform's own refusal names the limit. A stand-in BOB costs about 1–2M tokens, so a dry run of a handover is cheap. Tell a stand-in the exact test command (`node --test <dir>/*.test.mjs`).
