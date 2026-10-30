PLATFORM #1 · N2 · layer 1 · module platform: complete.

**Entries applied**
- N2-1 (PLT-1, PLT-3, PLT-12): `tools/platform.mjs` holds the constraints (29 rows: fact, day last confirmed, count, evidence, workaround; the classifier-judged acts marked) and the acts the process depends on (17 rows with pass counts and roles) as data; `tools/platform.md` is its rendering (`node tools/platform.mjs render`), held equal by a test. The act table `tools/acts.md` is retired: its rows are folded in, and the file now says so and points to git history. Pass counts measured in this session: 89 merged pull requests and 44 workflow-dispatch runs on neobobkrause/neoprocess, 149 remote branches; rows below PLT-3's twenty are marked "(below 20)" in the rendering, counted only from named evidence.
- N2-2 (PLT-9, PLT-10): the runner workflows' dispatch (`dispatch(kind, args)`, `ownerSecret`, `WORKFLOWS`) and `grants check` (`grantsCheck`, `grantsHeld`) moved from proc.mjs unchanged in behaviour; proc.mjs imports them and re-exports what its tests read.
- N2-3 (PLT-13, PLT-14): `dispatch` refuses any role but the neoProcess lane a call whose target is the process repository; the product's route to the process is a recorded value (`ROUTES`, `processRoute`).
- N2-4 (MNT-3): `processHead` and `versionCheck(pin)` (one line, PROCESS OK or PROCESS STALE <head>) moved here; the start prompt's shell form is `versionCommand`, used only by `versionLine`.
- GRANTS.md §1 and PERMISSIONS.md §2.1, §10.1 now name the platform table in place of the act table. `Refused` moved here so every module refuses with one class.

**Not done** · none of the entries. The P9 report sent to BOB stands: `proc process start` and `process status` print `archive_session` and `update_trigger` as owed, and hooks.mjs holds the lane's turn for them (tools/proc.mjs:572, :782; tools/hooks.mjs:285-287), against R4; those are other modules' to fix.

**Found in other modules** · as above (sent as REPORT). Found and fixed in my own test: two fixture repositories made in one second shared their commits, so the STALE case passed by chance in one run and failed in the gate; each fixture now has its own history.

**Met** · R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12

**Evidence**
- `node tools/proc.mjs gate --module platform --product .` → ok true, tests 13/13, checks format, architecture, coverage, fixtures
- `node checks/ownership.mjs . platform origin/tranche HEAD` → 7 files changed; proc-legacy: 15 line(s) added, 75 removed; 0 failures
- `node --test checks/test/*.test.mjs tools/test/*.test.mjs` → tests 298, pass 298, fail 0
- tools/test/platform.test.mjs:26 (R1 R2 R12 row format), tools/test/platform.test.mjs:77 (R6), the R12 test enumerating every printed platform call against the rows

Tests: 13/13. Checks: format, architecture, coverage, fixtures, ownership: no new finding.
Size: test runs 1, module lines 747. Head b7b8bea.