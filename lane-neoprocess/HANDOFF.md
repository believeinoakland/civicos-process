# neoProcess lane: handoff

**From** · neoProcess #4 (`session_018BhcefACF9wymZAZpDS2Pz`), 2026-10-29. #3 (`session_018BhcedCh1TpUJaGQh5up8c`) handed off at 49 % of its window; usage 49,144,573 / 1,464,445 / 45,593 / 335,704 (cache-read / cache-write / input / output, from `get_session`). #2 (`session_018BhceegtREhWFPW6rnCrDC`) ended idle at 50 %, usage 13,854,613 / 497,976 / 14,873 / 113,987. Neither is archived: that is Bob's (the call is refused to sessions). All pushed on `claude/modest-brahmagupta-vvaann` (PR #36, draft).

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `DRYRUN.md`, `SETUP-STEPS.md`, `rulebooks/*.md` (not `rulebooks/work/`); `tools/neo.mjs`, `tools/neo-hooks.mjs` and `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs`, not the pages' HTML (change a line found by `grep -n`; a worker republishes), not a probe's transcript (a Haiku worker reads it).

## Where things stand

The design is here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v25; companion https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). Bob, 29 Oct: do not stop working; the principles' wording is trimmed later. The tool is built beside the old one, in force until the commit point (P3): `tools/neo.mjs` (48 commands), `tools/neo-hooks.mjs`, fixture tests against a real remote (~2 min); every rulebook's CODE claim read against it. The ten rulebooks are drafted in `rulebooks/` (each under 4 KB; the accounting in `rulebooks/work/`). #3 decided: the tool alone deletes a merged job branch and a closed epoch's state branch; BOB writes `tranche` for what is no job's; a move starts only on Bob's word; release specifics belong to the product's procedure; `rulings-active.md` retires at the commit point.

## What remains, in order

1. **Bob's setup act** (`SETUP-STEPS.md`, verified by `neo steps`): Bob decided 29 Oct the toy repository is public in the organization (GitHub offers a merge queue only there; the same for `civicsmith` later) and left the key question to BOB, which decided the process repository goes public, no secret. Creating the toy from a session was refused (404 on the organization endpoint), so steps 1–10 are his; once the toy exists, `add_repo` it and seed (`n1/SEED.md`).
2. **The dry run** (`DRYRUN.md`; the seed, plan, charters and rows in `n1/`, prepared by #4 and rehearsed on a scratch copy: checks and tests green) on the toy's own repository, once Bob's act exists; the queue measured there (JOB-LIFE §12).
3. **Permissions** (`PERMISSIONS.md`, Bob's direction of 29 Oct): the act table `tools/acts.md`, `neo refused` with its `REFUSED` queue item and metrics row, `permissions.json` applied by `neo shims`, the start self-check; rows X1–X5 in `n1/CERTIFICATION.md`; REP 9–10 and GOV 9 rewritten at the commit point. Bob's: the standing list (§6).
4. **The commit point**: `neo` takes the `proc` name; the old tool, skills and mechanics rewritten from these files; the rulebooks moved to `rulebooks/` at the root; the page final.

## Acts that are Bob's, when the time comes

Archive neoProcess #2. The `neoProcess`, `civicsmith` and `neoprocess-dryrun` repositories; on each product repository, once: the ruleset (merge queue and the check `gate` required on `tranche`, one rule on `main`), **Allow auto-merge**, the secret `NEOPROCESS_DEPLOY_KEY` (or the process repository made public); a ROOT on a new account at a move. Probe branches `probe/N2-*` to delete by BOB.
