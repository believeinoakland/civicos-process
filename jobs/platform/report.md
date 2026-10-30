PLATFORM #1 · N2 · layer 1 · module platform: complete a fourth time, after the third review's one gap.

**Entries applied** · N2-1 to N2-4 as before; the third review's gap fixed:
- R12 · the vocabulary is complete by construction: `TOOLS` in tools/platform.mjs holds the platform's whole tool-name list as data (54 GitHub tools, 30 session tools, and the `git push`, `git fetch` and `claude -p` acts, from this session's tool list, 30 Oct); `callsIn(text)` finds each call name a text holds however printed, and `callProblems(text, inherited)` reports a `tool: '<name>'` that is no platform tool, a platform call with no row, and a classifier-judged call not inherited. The test runs it over every module file (no problems) and shows a made-up printed call, a printed platform call with no row (`fork_repository`) and an uninherited classifier call each fail.
- New rows: `list_issues` (an act: `GET /repos/…/issues` 200 through the proxy, #13), `enable_pr_auto_merge` (count 0: never seen, auto-merge off and staying off), `claude -p(headless session)` (an act: 49 passes, #13 and #14's 48 writers). A call name is now a row's id up to its parenthesis, so `git push` matches `git push(own branch)`.

**Not done** · none.

**Found in other modules** · nothing new.

**Met** · R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12

**Evidence**
- `node tools/proc.mjs gate --module platform --product .` → ok true, fails none, tests 14/14
- `node checks/ownership.mjs . platform origin/tranche HEAD` → 9 files changed; proc-legacy: 18 line(s) added, 123 removed; 0 failures
- `node --test checks/test/*.test.mjs tools/test/*.test.mjs` → tests 299, pass 299, fail 0
- tools/test/platform.test.mjs, the R4 R12 test: `callProblems("{ tool: 'mcp__github__made_up_tool', x: 1 }")` → `made_up_tool: printed as a call, and not a platform tool`; `callProblems('then fork it with fork_repository, by hand')` → `fork_repository: printed, and no row`

Tests: 14/14. Checks: format, architecture, coverage, fixtures, ownership: no new finding.
Size: test runs 4, module lines 840. Head aff178a.