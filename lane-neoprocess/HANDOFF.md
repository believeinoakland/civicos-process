# neoProcess lane: handoff

**From** · neoProcess #2 (`session_018BhceegtREhWFPW6rnCrDC`), 2026-10-29, at 43 % of its window (a lane refreshes at half, SESSIONS §2). Everything is pushed on `claude/modest-brahmagupta-vvaann` (PR believeinoakland/civicos-process#36, draft; it contains #34). Nothing is half done. Bob started #2; #2 starts #3 itself (R10); #3 archives #2 once it is idle and records its usage.

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `rulebooks/*.md`; `tools/neo.mjs` and `tools/test/neo.test.mjs`. Not the mechanics, not `tools/proc.mjs` (import what the gate needs from it: `runTests`, `moduleChecks`, `withArtifacts`, `evidenceItems`, `history`), not the pages' HTML (edit the page with the Artifact tool's `edits`, never read it into context), not a probe's transcript (a Haiku worker reads it and returns the turn table). #2 spent 390 k tokens, half on those three.

## Where things stand

The design is drafted here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v22) with its companion (https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). Measured 29 Oct (SESSIONS §1a–1b, PROTOCOL §6, JOB-LIFE §12): rules by path and `/goal` in cloud sessions, a check's failure, success and a merge waking the subscriber, auto-merge's setting, the second repository's checkout. Decided 29 Oct: a goal on every job and lane session (SESSIONS §1b); concise by code (SESSIONS §6: handoffs generated, 4 KB caps, reading budgets per role). Bob, 29 Oct: do not stop working; the principles' wording is trimmed later, once the full set is known.

The tool is being rebuilt beside the old one, which stays in force until the commit point (P3): `tools/neo.mjs`, tests in `tools/test/neo.test.mjs` (green, `node --test tools/test/neo.test.mjs`). Done: the state branch by plumbing (orphan, one writer per file, a lost push re-applied), `epoch open|close`, `takeover`, `status` (the queue of PROTOCOL §6), `handoff` (generated, 4 KB), `addr`, the asks (`open`, `route`, `dispatch`, `ask`, `decided`, `close`), the lanes (`open`, `started`, `start`, `charter`, `route`, `archived`, `close`).

## What remains, in order

1. **The job's life in `neo.mjs`** (JOB-LIFE): `layer start` (branches `job/<m>` at the `tranche` tip; a START ≤ 4 KB whose `create_session` prompt begins with `/goal`; the draft PR call printed and owed, `job pr --number` recording it), `job start`, `job state`, `job complete` (the gate by the old tool's functions; the `**Met**` marks struck in the job's own commit; the report as a PR comment and "ready for review" printed and owed), `review decide`, `merge` (prints `enable_pr_auto_merge`, owed), `merged`, `job reopen`, `job retire`, `layer close`, `defect`, `job archived` and `bob archived` (metrics rows). Each with a test in the same file.
2. **`tools/neo-hooks.mjs`** (PROTOCOL §9, JOB-LIFE §11): the role from `.git/neo-role.json`, refusing every act until one is recorded; `send_message` only to BOB's address, and only with nothing unpushed; no `gh pr merge|ready|review`, no force, no push but to the session's own branch, nothing merged, tagged or branched from `state/*`; a `create_session` only as printed; the Stop hook refusing while `status().gate` is non-empty.
3. **`shims`**: one skill `neoprocess` taking the role as `$ARGUMENTS`; the product's `CLAUDE.md` under thirty lines; `.github/workflows/gate.yml` (a working one is on `probe/N2-gate-base`).
4. **The budgets** of SESSIONS §6 measured by `status` (`SIZE`) and failed by the format check.
5. Then the handoff's items 3 (the ten rulebooks; needs `add_repo believeinoakland/bio`, read, and Sonnet workers) and 4 (the dry run on `dryrun/`, every row of PROTOCOL §10, JOB-LIFE §13, DESIGN-STAGE §5),; then the commit point.

## Acts that are Bob's, when the time comes (none now)

The `neoProcess` and `civicsmith` repositories; on each product repository, once: the ruleset (merge queue and required checks on `tranche`, one rule on `main`), **Allow auto-merge**, the process repository's read-only deploy key as a secret; a ROOT on a new account at an account move.

Probe branches to delete by BOB, never by force from a session: `probe/N2-rules`, `probe/N2-gate-base`, `probe/N2-gate` (PR #35, merged into the probe base).
