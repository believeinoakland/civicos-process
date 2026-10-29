# neoProcess lane: handoff

**From** · neoProcess #3 (`session_018BhcedCh1TpUJaGQh5up8c`), 2026-10-29, at about half its window (490 k tokens entered; `get_session` shows no context figure for a session another session created). #2 (`session_018BhceegtREhWFPW6rnCrDC`) ended idle at 50 %, usage 13,854,613 / 497,976 / 14,873 / 113,987 (cache-read / cache-write / input / output). The archive calls were refused to #3 by the permission classifier: archiving #2 and #3 is Bob's, #4 records their usage from `get_session`. All pushed on `claude/modest-brahmagupta-vvaann` (PR #36, draft). #3 starts #4 (R10).

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `DRYRUN.md`, `SETUP-STEPS.md`, `rulebooks/*.md` (not `rulebooks/work/`); `tools/neo.mjs`, `tools/neo-hooks.mjs` and `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs` (neo imports the gate from it), not the pages' HTML (change a line found by `grep -n`; a worker republishes), not a probe's transcript (a Haiku worker reads it).

## Where things stand

The design is here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v25; companion https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). Bob, 29 Oct: do not stop working; the principles' wording is trimmed later.

The tool is built beside the old one, in force until the commit point (P3): `tools/neo.mjs` (48 commands) and `tools/neo-hooks.mjs`, six fixture tests green against a real remote (~2 min). Done: the state branch, epochs, takeover, status (`SIZE`), handoff, addr, the asks, the lanes, the job's whole life, the hooks, `reading`, `gate` (one function for `job complete` and CI), `shims`, `round open|close`, `tranche open|close|merged` (the close PR to `main` at CLOSING; the branch deleted by the tool after its merge), `footprint`, `ruling`, `steps` (the old tool's, with BOB's Stop hook check). Every rulebook was read once against the tool; each CODE claim now names a command that exists or reads TEXT. The ownership check allows a job's own `*(not yet met: T)*` strike only. JOB-LIFE §4: a job never commits a generated artifact (two jobs of a layer would conflict); the gate regenerates for its run, `layer close` commits.

The ten rulebooks are drafted in `rulebooks/` (32 KB together, each under 4 KB; BOB's text 46 of 55 KB, a job's 23 of 26), eight by Sonnet workers from the canon, the active rulings and searches of the log, each with its accounting in `rulebooks/work/`. #3 decided: the tool alone deletes a merged job branch and a closed epoch's state branch; BOB writes `tranche` for what is no job's; a move starts only on Bob's word (PROTOCOL §7a); release specifics belong to the product's procedure; `rulings-active.md` retires at the commit point (DESIGN-STAGE §3).

## What remains, in order

1. **Bob's setup act**, put to him in plain words from `SETUP-STEPS.md` (verified against GitHub's pages by `neo steps`, 26 labels), with the one decision it carries: the toy repository public in the organization, since GitHub offers a merge queue only there (DRYRUN §1); the same for `civicsmith` later. BOB makes the deploy key pair at that moment, or Bob makes the process repository public and no key is needed.
2. **The dry run** (`DRYRUN.md`): every row of PROTOCOL §10, JOB-LIFE §13, DESIGN-STAGE §5 on the toy's own repository; the queue measured once Bob's ruleset exists (JOB-LIFE §12).
3. **The commit point**: `neo` takes the `proc` name; the old tool, skills and mechanics rewritten from these files; the rulebooks moved to `rulebooks/` at the root; the page final.

## Acts that are Bob's, when the time comes

Archive neoProcess #2. The `neoProcess`, `civicsmith` and `neoprocess-dryrun` repositories; on each product repository, once: the ruleset (merge queue and the check `gate` required on `tranche`, one rule on `main`), **Allow auto-merge**, the secret `NEOPROCESS_DEPLOY_KEY` (or the process repository made public); a ROOT on a new account at a move. Probe branches `probe/N2-*` to delete by BOB.
