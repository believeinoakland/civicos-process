# neoProcess lane: handoff

**From** · neoProcess #3 (`session_018BhcedCh1TpUJaGQh5up8c`), 2026-10-29, in progress. #2 (`session_018BhceegtREhWFPW6rnCrDC`) ended idle at 50 % of its window, usage 13,854,613 cache-read / 497,976 cache-write / 14,873 input / 113,987 output tokens (read from `get_session`); the archive call was refused by the session's permission classifier, so archiving #2 is Bob's act. Everything is pushed on `claude/modest-brahmagupta-vvaann` (PR believeinoakland/civicos-process#36, draft; it contains #34).

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PRODUCT-SUPPLIES.md`, `rulebooks/*.md`; `tools/neo.mjs`, `tools/neo-hooks.mjs` and their tests in `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs` (neo imports the gate from it), not the pages' HTML (change a line found by `grep -n`, never read whole), not a probe's transcript (a Haiku worker reads it and returns the turn table).

## Where things stand

The design is drafted here and on the page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v24) with its companion (https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E). Measured and decided 29 Oct: SESSIONS §1a–1b, §6; PROTOCOL §6; JOB-LIFE §4 (artifacts under a queue), §12. Bob, 29 Oct: do not stop working; the principles' wording is trimmed later, once the full set is known.

The tool is built beside the old one, which stays in force until the commit point (P3): `tools/neo.mjs` (40 commands) and `tools/neo-hooks.mjs`, tests green (`node --test tools/test/neo.test.mjs tools/test/neo-hooks.test.mjs`, five fixture tests against a real remote, ~1 min). Done: the state branch, epochs, takeover, status (with `SIZE`), handoff, addr, the asks, the lanes, the job's whole life (JOB-LIFE), the hooks (PROTOCOL §9, JOB-LIFE §11), `reading` (a role's process text whole, against its budget: the one skill prints it), `gate` (one function for `job complete` and CI), `shims` (`CLAUDE.md` under thirty lines, the skill `neoprocess`, `.github/workflows/gate.yml`; drift fails the gate). The ownership check allows a job's own `*(not yet met: T)*` strike and nothing else in its requirements file.

## What remains, in order

1. **The ten rulebooks** (SESSIONS §3 names the roles' sets: Governance, Sessions, Usage, Building, Integration, Design and the rest): drafted by Sonnet workers from the canon, each at most ten rules and 4 KB, into `rulebooks/` (`reading` reads `rulebooks/` once it exists, else the two drafts in this folder). Needs `add_repo believeinoakland/bio` for the product's rulebook sources.
2. **The dry run** on `dryrun/`: every row of PROTOCOL §10, JOB-LIFE §13 and DESIGN-STAGE §5, each a row of `dryrun/CERTIFICATION.md`; the shims written into the toy by `neo shims`; the merge queue measured once Bob's ruleset exists (JOB-LIFE §12).
3. The commit point: `neo` takes the `proc` name, the old tool and skills retired, the mechanics rewritten from these files.

## Acts that are Bob's, when the time comes

Archive neoProcess #2 (above). The `neoProcess` and `civicsmith` repositories; on each product repository, once: the ruleset (merge queue and required checks on `tranche`, one rule on `main`), **Allow auto-merge**, the process repository's read-only deploy key as the secret `NEOPROCESS_DEPLOY_KEY`; a ROOT on a new account at an account move. Probe branches to delete by BOB, never by force from a session: `probe/N2-rules`, `probe/N2-gate-base`, `probe/N2-gate` (PR #35, merged into the probe base).
