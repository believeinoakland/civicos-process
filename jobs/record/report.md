RECORD #1 · module record · N2 layer 1 · entries N2-5 to N2-9

**Met** · R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13

What was done
- N2-5: `tools/record.mjs` takes from proc-legacy `repo`, `ghRepo`, `readRole`, `unpushed`, `commitPush`, `pruneRef`, `epoch`, `stateRead/List/Write`, `epochOpen/Close`, `parsePlan`, `fmtPlan`, `planEdit`, `metricsRow`, `jobFiles`; `tools/proc.mjs` imports and re-exports them, and keeps `planEdit` as a wrapper that drops a stale lane start. The path tables are data (`paths()`), with a test that no path is in both. `status(o)` reads the whole record for any role: plan, jobs, lanes, open asks, open refusals, undelivered messages, owed acts, stop, resume, pin, with each file's size.
- `commitPush` refuses a push to any branch but the role's own, as `.git/proc-role.json` names it (R4).
- N2-6: `REFRESH_FILE` and `keepRefresh` are removed. `proc process archived` writes its row only from what `archive_session` returned (`actDone`) or from the refusal's words. The owed sessions come from the handoff's From line and the idle lane rows. The hooks' pre event no longer writes the reader or worker records; the post event writes them through `recordLocal`. The two tests of that proc-legacy behaviour are in tools/test/hooks.test.mjs (ruling K1), so record's own tests import nothing later in the order (the architecture check: 0 failures). `recordAct` clears an owed act only on a success result (R8).
- N2-7: `addr` reads at the moment of use: BOB, a job or a lane from the state branch; the neoProcess lane only from `main`'s `lane-neoprocess/HANDOFF.md`. A test shows an address on a side branch is not read.
- N2-8: `status` on a fresh clone of a halted build lists open, idle, merged, unmerged and owed.
- N2-9: `stop(R, why, choices, version)` writes `STOPPED <why> · <version>` in the plan's Status line, with each unmerged job's choice on a `**Choices**` line; `resume(R, version)` writes `RESUMED <version>`. Record's `status` shows both, and so does proc's (`stopOf`).
- R7: `contextShare` reads `ccr.external_metadata.context_usage { max_tokens, used_tokens }`. I measured that field on my own `get_session` on 30 Oct. It prints REFRESH past the role's threshold (BOB 40, job and lane 50, ROOT 55) and never reads `session_status`.

Gaps and notes, for BOB
- N2-8's fixture is synthetic. It is built from REC-7's measured description of Civicsmith's halt (one open PR, three idle merged job sessions, one archived unmerged job). Civicsmith's repository is not in this session's scope, so its state branch and handoff could not be copied.
- R1's "every other module reaches git only through it" holds for the code moved here. `tools/mail.mjs` (mine, retired in part, still used by `checks/channels.mjs`), `tools/lib.mjs`, `tools/hooks.mjs` and `checks/` still call git themselves, until their own jobs or the mail module's retirement.
- `processStart`'s printed text still says "the Stop hook holds you to them" (tools/proc.mjs:419). No hook does now. The line is a template literal, so the ownership check counts any edit to it as an addition. Left for sessions' N2-34, which rewrites that text.
- The checks show three format failures and a coverage failure for platform's paths (`tools/platform.mjs`, `tools/platform.md`, `tools/test/platform.test.mjs`). Those belong to platform's job, which is still running; record shows none.

**Evidence**
- `node --test checks/test/*.test.mjs tools/test/*.test.mjs` → tests 305, pass 305, fail 0
- `node --test tools/test/record.test.mjs` → tests 19, pass 19, fail 0
- `node checks/ownership.mjs . record origin/tranche` → ownership: 5 files changed by record between origin/tranche and HEAD; proc-legacy: 86 line(s) added, 256 removed; 0 failures
- `node checks/coverage.mjs . record` → coverage: 1 modules, 13 of 13 live requirement ids named by a test; 0 failures
- tools/record.mjs:72 (commitPush's own-branch refusal); tools/record.mjs:178 (parsePlan's stop and resume); tools/hooks.mjs:300 (the post event's reader and worker records)

Tests: 50/50. Checks: format, architecture, coverage, fixtures, ownership: no new finding.
Size: test runs 1, module lines 1031. Head 6cf0f58.