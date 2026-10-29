# neoProcess lane: handoff

**From** · neoProcess #5 (Bob's second account, from `START-5.md`, 29 Oct) holds the lane. #4 (`session_018BhcefACF9wymZAZpDS2Pz`): 47 % at its handoff (~03:40Z, the account move), 31,261,550 / 560,848 / 151,378 / 130,284 (cache-read / cache-write / input / output, its handoff line; final figures Bob's, in its archive). #3 (`session_018BhcedCh1TpUJaGQh5up8c`): 49 %, 49,144,573 / 1,464,445 / 45,593 / 335,704. #2 (`session_018BhceegtREhWFPW6rnCrDC`): 50 %, 13,854,613 / 497,976 / 14,873 / 113,987. #2–#4 unarchived on the first account, Bob's. All pushed on `claude/modest-brahmagupta-vvaann` (PR #36, draft).

**Meter** · The first account read 97 % on 29 Oct and no longer binds the lane; the second account's is unknown until Bob reads it (P14), so a session or probe is started only when the work needs one (rulebook USE 5, 6, 8). Bob: keep working.

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `DRYRUN.md`, `SETUP-STEPS.md`, `rulebooks/*.md` (not `rulebooks/work/`); `tools/neo.mjs`, `tools/neo-hooks.mjs` and `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs`, not the pages' HTML (change a line found by `grep -n`; a worker republishes), not a probe's transcript (a Haiku worker reads it).

## Where things stand

The design is here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v25; companion https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). The tool is built beside the old one, in force until the commit point (P3): `tools/neo.mjs` (48 commands), `tools/neo-hooks.mjs`, fixture tests on a real remote (~2 min); each rulebook's CODE claims read against it. The ten rulebooks are drafted in `rulebooks/` (each under 4 KB; the accounting in `rulebooks/work/`). #3 decided: the tool alone deletes a merged job branch and a closed epoch's state branch; a move starts only on Bob's word; `rulings-active.md` retires at the commit point.

## What remains, in order

1. **Bob's setup act** (`SETUP-STEPS.md`). Done by Bob 29 Oct; the toy seeded to `main` by #5 (SEED 1–5). Measured there: a required check refuses every direct push to `tranche`, so the tool merges and the ruleset keeps no check (JOB-LIFE §1, §6, §12; `neo merge --head --gate`; tests green). The toy's `main` is settled (its PRs #1, #2). Bob's ruleset edit and the app's access done ~05:00Z (the access had lapsed ~04:30Z: pushes 403; a copy on the toy was refused by the classifier, not worked around). SEED step 6 on is BOB #1's (`session_01RAN5eoszaGr1kRy9xrnNMK`, started 05:55Z by #5 from `n1/START-BOB.md`; it reports to #5 by message). Done: `allowReason` in the hooks (PERMISSIONS §8.6), tested; the settings list keeps its acts until row X7.
2. **The dry run** (`DRYRUN.md`; seed, plan, charters and rows in `n1/`, rehearsed by #4 on a scratch copy, green) on the toy, once Bob's act exists; the queue measured there (JOB-LIFE §12).
3. **Permissions** (`PERMISSIONS.md`; Bob, 29 Oct: robust, best of breed for every project; his standing approval in §6): built by #4: `tools/acts.md`, `neo refused` / `refused routed` (queue item, metrics row), `permissions.json` applied by `neo shims`, the start self-check; rows X1–X5. §8 (Claude Code's documentation) written by #4, its §8.6 built by #5. Left: rows X1–X8 on the dry run; REP 9–10 and GOV 9 rewritten at the commit point.
4. **The commit point**: `neo` takes the `proc` name; the old tool, skills and mechanics rewritten from these files; the rulebooks moved to `rulebooks/` at the root; the page final.

## Acts that are Bob's, when the time comes

Archive neoProcess #2–#4 (first account). The `neoProcess`, `civicsmith` and `neoprocess-dryrun` repositories; on each product repository, once: the two rulesets (SETUP-STEPS), nothing else (no queue, no auto-merge, no secret); a ROOT on a new account at a move. Probe branches `probe/N2-*` to delete by BOB.
