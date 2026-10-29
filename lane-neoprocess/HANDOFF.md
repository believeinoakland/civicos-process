# neoProcess lane: handoff

**From** · neoProcess #3 (`session_018BhcedCh1TpUJaGQh5up8c`), 2026-10-29, in progress. #2 (`session_018BhceegtREhWFPW6rnCrDC`) ended idle at 50 % of its window, usage 13,854,613 cache-read / 497,976 cache-write / 14,873 input / 113,987 output tokens (read from `get_session`); the archive call was refused by the session's permission classifier, so archiving #2 is Bob's act. Everything is pushed on `claude/modest-brahmagupta-vvaann` (PR believeinoakland/civicos-process#36, draft; it contains #34).

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `rulebooks/*.md`; `tools/neo.mjs` and `tools/test/neo.test.mjs`. Not the mechanics, not `tools/proc.mjs` (neo imports the gate from it), not the pages' HTML (edit the page with the Artifact tool's `edits`, never read it into context), not a probe's transcript (a Haiku worker reads it and returns the turn table).

## Where things stand

The design is drafted here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v23) with its companion (https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). Measured and decided 29 Oct: SESSIONS §1a–1b, §6; PROTOCOL §6; JOB-LIFE §12. Bob, 29 Oct: do not stop working; the principles' wording is trimmed later, once the full set is known.

The tool is being rebuilt beside the old one, which stays in force until the commit point (P3): `tools/neo.mjs`, tests in `tools/test/neo.test.mjs` (green: `node --test tools/test/neo.test.mjs`, three fixture tests against a real remote). Done: the state branch, epochs, takeover, status, handoff, addr, the asks, the lanes, and (#3) the job's whole life per JOB-LIFE: `layer start|close`, `job pr|started|route|start|state|complete|posted|reopen|retire|archived`, `review decide|result`, `merge`, `merged`, `defect`, `bob archived`. The ownership check now allows a job's own `*(not yet met: T)*` strike and nothing else in its requirements file (`checks/ownership.mjs`, tested).

## What remains, in order

1. **`tools/neo-hooks.mjs`** (PROTOCOL §9, JOB-LIFE §11): the role from `.git/neo-role.json`, refusing every act until one is recorded; `send_message` only to BOB's address, and only with nothing unpushed; no `gh pr merge|ready|review`, no force, no push but to the session's own branch, nothing merged, tagged or branched from `state/*`, no remote delete but `state/*` and a merged `job/<m>`; a `create_session` only as printed; the Stop hook refusing while `status().gate` is non-empty.
2. **`shims`**: one skill `neoprocess` taking the role as `$ARGUMENTS`; the product's `CLAUDE.md` under thirty lines; `.github/workflows/gate.yml` (a working one is on `probe/N2-gate-base`).
3. **The budgets** of SESSIONS §6: `MODULE_SET` is measured by `layer start` and `job start`; the process-text budgets per role (`status` `SIZE`) and the format check in CI remain.
4. Then the ten rulebooks (needs `add_repo believeinoakland/bio`, read, and Sonnet workers) and the dry run on `dryrun/` (every row of PROTOCOL §10, JOB-LIFE §13, DESIGN-STAGE §5); then the commit point.

## Acts that are Bob's, when the time comes

Archive neoProcess #2 (above). The `neoProcess` and `civicsmith` repositories; on each product repository, once: the ruleset (merge queue and required checks on `tranche`, one rule on `main`), **Allow auto-merge**, the process repository's read-only deploy key as a secret; a ROOT on a new account at an account move. Probe branches to delete by BOB, never by force from a session: `probe/N2-rules`, `probe/N2-gate-base`, `probe/N2-gate` (PR #35, merged into the probe base).
