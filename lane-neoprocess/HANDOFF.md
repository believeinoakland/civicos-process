# neoProcess lane: handoff

**From** · neoProcess #5 (on Bob's second account), started 2026-10-29 from `START-5.md`; holds the lane now. #4 (`session_018BhcefACF9wymZAZpDS2Pz`): 47 % at its handoff (~03:40Z, the account move), 31,261,550 / 560,848 / 151,378 / 130,284 (cache-read / cache-write / input / output, from its handoff line; the archive's final figures are Bob's to read). #3 (`session_018BhcedCh1TpUJaGQh5up8c`): 49 %, 49,144,573 / 1,464,445 / 45,593 / 335,704. #2 (`session_018BhceegtREhWFPW6rnCrDC`): 50 %, 13,854,613 / 497,976 / 14,873 / 113,987. #2, #3 and #4 unarchived on the first account, Bob's (a session cannot archive a parent, nor reach another account). All pushed on `claude/modest-brahmagupta-vvaann` (PR #36, draft).

**Meter** · The first account's weekly meter read 97 % at ~02:50Z on 29 Oct (resets 2026-10-30 ~19:00Z); that limit no longer binds the lane. The second account's meter is unknown until Bob reads it (P14) or a `rate_limit_info` shows it; until then new sessions and probes are started only when the work needs one (rulebook USE 5, 6, 8). Bob's words stand: keep working.

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `DRYRUN.md`, `SETUP-STEPS.md`, `rulebooks/*.md` (not `rulebooks/work/`); `tools/neo.mjs`, `tools/neo-hooks.mjs` and `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs`, not the pages' HTML (change a line found by `grep -n`; a worker republishes), not a probe's transcript (a Haiku worker reads it).

## Where things stand

The design is here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v25; companion https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). Bob, 29 Oct: do not stop working; the principles' wording is trimmed later. The tool is built beside the old one, in force until the commit point (P3): `tools/neo.mjs` (48 commands), `tools/neo-hooks.mjs`, fixture tests against a real remote (~2 min); every rulebook's CODE claim read against it. The ten rulebooks are drafted in `rulebooks/` (each under 4 KB; the accounting in `rulebooks/work/`). #3 decided: the tool alone deletes a merged job branch and a closed epoch's state branch; BOB writes `tranche` for what is no job's; a move starts only on Bob's word; release specifics belong to the product's procedure; `rulings-active.md` retires at the commit point.

## What remains, in order

1. **Bob's setup act** (`SETUP-STEPS.md`, ten steps, verified by `neo steps`): Bob decided 29 Oct the toy is public in the organization; BOB decided the process repository goes public, no secret. Creating the toy from a session was refused (404), so the ten steps are his, on whichever account owns the organization; once the toy exists, `add_repo` it and seed (`n1/SEED.md`). Also next: `allowReason` in the hooks (PERMISSIONS §8.6).
2. **The dry run** (`DRYRUN.md`; the seed, plan, charters and rows in `n1/`, prepared by #4 and rehearsed on a scratch copy: checks and tests green) on the toy's own repository, once Bob's act exists; the queue measured there (JOB-LIFE §12).
3. **Permissions** (`PERMISSIONS.md`; Bob, 29 Oct: robust; his standing approval on record in §6; best practice and best of breed for every project under neoProcess): built by #4: `tools/acts.md`, `neo refused` / `refused routed` (queue item, metrics row), `permissions.json` applied by `neo shims`, the start self-check; rows X1–X5. Left: §8 written from Claude Code's permissions documentation (a reader was sent 29 Oct), REP 9–10 and GOV 9 rewritten at the commit point.
4. **The commit point**: `neo` takes the `proc` name; the old tool, skills and mechanics rewritten from these files; the rulebooks moved to `rulebooks/` at the root; the page final.

## Acts that are Bob's, when the time comes

Archive neoProcess #2. The `neoProcess`, `civicsmith` and `neoprocess-dryrun` repositories; on each product repository, once: the ruleset (merge queue and the check `gate` required on `tranche`, one rule on `main`), **Allow auto-merge**, the secret `NEOPROCESS_DEPLOY_KEY` (or the process repository made public); a ROOT on a new account at a move. Probe branches `probe/N2-*` to delete by BOB.
