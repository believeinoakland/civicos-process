PLATFORM #1 · N2 · layer 1 · module platform: complete a sixth time, after the last review round (K15).

**Entries applied** · N2-1 to N2-4 as before, with the three gaps of the last round fixed.

**Self-review** · the round's three gaps, each fixed and shown by a test at the interface; nothing else changed.
- R12 · tools/platform.mjs (`callsIn`) · a full tool name (`mcp__github__<name>`, `mcp__claude-code-remote__<name>`) was missed: the lookbehind failed on the `_` before the name · fixed: the known prefixes are stripped before matching; `callProblems("{ tool: 'mcp__github__fork_repository' }")` → `fork_repository: printed, and no row`, `callProblems("{ tool: 'mcp__claude-code-remote__interrupt_session' }")` → `interrupt_session: printed, and decided by the classifier case by case (R4)`.
- R12 · tools/platform.mjs (TOOLS, ACTS) · `Skill` was outside the tool list and had no row · fixed: `Skill` in `TOOLS.code`, and the act `Skill(neoprocess)` (every session's start prompt invokes it; counted 1, PLATFORM #1's own start, the rest named and not counted).
- R9 · tools/platform.mjs (`dispatch`) · with no process repository named by the caller the guard did not run · fixed: `processRepo()` reads it from the process clone's remote (any URL ending in `<owner>/<repo>`), else `PROCESS_REPO` (`neobobkrause/neoprocess`); `dispatch('rename', { repo: 'neobobkrause/neoprocess', name: 'x', role: 'job' })` is refused, and the call names the process repository's owner and name.
- Not mine (K15): the reviewer's R6 finding on `processBehind`/`processRefresh` is maintenance's N2-38.

**Not done** · none.

**Found in other modules** · nothing new.

**Met** · R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12

**Evidence**
- `node tools/proc.mjs gate --module platform --product .` → ok true, fails none, tests 15/15
- `node checks/ownership.mjs . platform origin/tranche HEAD` → 9 files changed; proc-legacy: 21 line(s) added, 126 removed; 0 failures
- `node --test checks/test/*.test.mjs tools/test/*.test.mjs` → tests 300, pass 300, fail 0
- tools/test/platform.test.mjs: the R4 R12 test (the two full-name cases above) and the R9 test (`dispatch('rename', { repo: 'neobobkrause/neoprocess', name: 'x', role: 'job' })` → refused, "never takes the process repository as a write target")

Tests: 15/15. Checks: format, architecture, coverage, fixtures, ownership: no new finding.
Size: test runs 6, module lines 907. Head ff3eb6e.