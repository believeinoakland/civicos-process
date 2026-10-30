PLATFORM #1 · N2 · layer 1 · module platform: complete a fifth time, after the third review's gap and a self-review of the whole change (K14).

**Entries applied** · N2-1 to N2-4 as before; the third review's R12 gap fixed (`TOOLS` holds the platform's whole tool-name list as data; `callsIn` and `callProblems` at the interface; rows for `list_issues`, `enable_pr_auto_merge`, `claude -p`); and the self-review's gaps below.

**Self-review** · build/requirements/platform.md read whole, then `git diff origin/tranche...HEAD` whole; each requirement checked against the code and a test at the interface.
- R1 · tools/platform.mjs (ACTS) · the fold of tools/acts.md dropped rows PLT-9 says are kept: the runner's repository creation, rulesets, rename and shims, the secret picked per owner, the background worker and its stop, a service's API, the grants check's HTTP, `git merge --ff-only`, `push_files` · `P.acts({ id: 'rulesets(process token)' })` refused as not an act · fixed: each restored from its recorded runs (40933605400, 40971833961, 40941547340, 40992502528, 41015721303, 40970557868 …), with its result fields; the test asserts each.
- R1 R12 · tools/proc.mjs:1055 · `proc refused --act <id>` read predicted only on an exact id, so 21 ids of the retired act table (`create_session(job)`, `rulesets(an owner's token)`, `proc issue` …) would have read unpredicted · fixed: `isKnown(id)` (exact id, `ALIASES` for the tool's own commands, or the call name) and `proc refused` uses it; the test checks every one of the table's 60 ids and a made-up one.
- R12 · tools/platform.mjs (TOOLS) · `Agent` and `TaskStop`, acts the process relies on, were outside the vocabulary · fixed: a `code` group in `TOOLS`.
- R4 · tools/platform.mjs (`acts`) · `acts({ id: 'archive_session' })` by its bare name answered "not an act" rather than the classifier refusal · fixed, with a test.
- R6 · tools/proc.mjs:440 · the comment still said the start command fast-forwards the copy · fixed (reads only, R6).
- Comments in tools/platform.mjs (the act table's ids, `callName`) and the retirement note in tools/acts.md said what is no longer true · fixed.
- R2, R3, R5, R7, R8, R9, R10, R11 · none found.

**Not done** · none.

**Found in other modules** · nothing new.

**Met** · R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12

**Evidence**
- `node tools/proc.mjs gate --module platform --product .` → ok true, fails none, tests 15/15
- `node checks/ownership.mjs . platform origin/tranche HEAD` → 9 files changed; proc-legacy: 21 line(s) added, 126 removed; 0 failures
- `node --test checks/test/*.test.mjs tools/test/*.test.mjs` → tests 300, pass 300, fail 0
- tools/test/platform.test.mjs: the R1 R12 test of the act table's ids (`isKnown('made_up_act(anything)')` → false); the R4 R12 test (`callProblems("{ tool: 'mcp__github__made_up_tool', x: 1 }")` → `made_up_tool: printed as a call, and not a platform tool`)

Tests: 15/15. Checks: format, architecture, coverage, fixtures, ownership: no new finding.
Size: test runs 5, module lines 891. Head 8ed57f5.