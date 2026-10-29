# neoProcess lane: handoff

**Continued by** · neoProcess #2 (session `session_018BhceegtREhWFPW6rnCrDC`), 2026-10-29, on `claude/modest-brahmagupta-vvaann` (fast-forwarded from the branch below; the measurements of item 1 are its first work).

**From** · neoProcess #1 (session `session_018BhcedU3jBTbxWihNyEffQ`), 2026-10-29, at 44 % of its context window (the design's refresh point for a hub is 40 %, SESSIONS §2). Everything below is pushed on `claude/hopeful-edison-abv0sv` (PR believeinoakland/civicos-process#34, draft). Nothing is half done.

## Where things stand

The design of neoProcess is drafted in this folder and reported to Bob on the rendered page (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, v20) with its companion for Civicsmith (https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E, v2). The page's §8 is the ledger of what differs from the old process and what needs Bob's approval at commit time; §9 is the tracker of what remains. The sources are the files in this folder (README.md lists them). The page is published from `neoprocess.html` here: edit the file, publish it to the same artifact URL (`url` parameter), and commit the file; never let the two drift.

Bob's standing words, all on the page: P17 amended (he defines the project: values and policies, mission and purposes, audiences and use cases, requirements, principles, high-level architecture, UX, doctrine; BOB does everything else; a middle ground where both offer and value opinions, options and recommendations); his values (urgency; a model and effort sufficient for quality; token efficiency; speak to the audience directly); this is a discussion, not a change, and approval is asked only when we commit; the architecture ROOT → BOB → jobs and lanes with BOB translating; lanes are each project's own, opened by BOB without approval; "complete on the record"; review by judgment against real cost; the names neoProcess (process, repository `neoProcess`) and civicsmith (product repository); `civicos` retired.

## Measured (28 Oct, four Haiku probes, transcripts read)

Messages to a session are queued and delivered whole, in order, as one turn once the session is free (2 and 10 messages, idle and busy); a background worker's completion wakes its session (6–14 s); a cloud session refuses a foreground `sleep`; a cross-session message is data unless the receiver's standing instruction binds messages from BOB's address. Details with times in PROTOCOL.md §6.

## What remains (page §9), in order

1. **Measure before the dry run relies on it.** Done 29 Oct by neoProcess #2 (SESSIONS §1a–1b, PROTOCOL §6, JOB-LIFE §12): path-scoped `.claude/rules/` in a cloud session; `/goal` in a cloud session; a check's failure event waking the subscriber; Actions running the suite on a pull request; auto-merge needing the repository setting; a second private repository's checkout needing a secret; archive usage figures (three times now). Left, and only once Bob's ruleset exists: the merge queue, the required checks, auto-merge queuing a PR, the `merge_group` run. Not re-measured: a child session's failure waking its parent (measured once by the earlier lane).
2. **The tool rebuilt to this design** (`tools/proc.mjs`, `tools/hooks.mjs`): asks (`open`, `route`, `dispatch`, `ask`, `decided`, `close`), lanes (`open`, `charter`, `route`, `start`, `close`, `archived`), epochs and the state branch (`epoch open|close`), the PR-based job life (`layer start` opening draft PRs; `job complete` striking marks and marking ready; `review decide`; `merge` enabling merge-when-ready; `merged`; `job reopen`; `job retire`; `defect`), captures to storage, `proc shims` writing the product's CLAUDE.md, the one skill `neoprocess` taking the role as its argument, its hooks reading the role from the record and gate workflow, the hooks of PROTOCOL §9 and JOB-LIFE §11, and `proc status` as the queue in the order of PROTOCOL §6. Each command with a fixture test (`tools/test/`). This is days of work; do it in a successor whose only job it is, in the new `neoProcess` repository once Bob creates it (or here under `tools/` on this branch until then).
3. **The ten rulebooks in full**, every one of the ~5,800 rulings in bio's `build/rulings.md` accounted for (kept, folded, coded, superseded, retired). Needs the product repository attached (`add_repo believeinoakland/bio`, read) and workers (Sonnet, medium, one per area, briefs per SESSIONS §4). Two of ten are written (`rulebooks/`). The process areas' rulings slice is smaller than the product's; do the process areas first.
4. **The dry run** on the toy product (`dryrun/`), which is also the second-project trial (PRODUCT-SUPPLIES.md): every row of PROTOCOL §10, JOB-LIFE §13 and DESIGN-STAGE §5, recorded in `dryrun/CERTIFICATION.md` and `RUNS.md`.
5. **The commit point:** Bob reads the ledger (page §8) rendered and approves what is his; the principles (P17 amended, P21–P23), mechanics, roles and tools are rewritten in the `neoProcess` repository; the companion's order of work runs for Civicsmith.

## Acts that are Bob's, when the time comes (none now)

- Create the `neoProcess` repository (or rename this one) and, later, `civicsmith` (a rename of `bio` keeps installed copies updating; a new repository needs them told the address first).
- The ruleset on each repository: a merge queue and the required checks on `tranche`; one rule on `main`; in the same sitting, **Allow auto-merge** on, and the secret holding the process repository's read-only deploy key (JOB-LIFE §4).
- Start a ROOT on a new account at an account move.

## For the successor's first turn

Read whole: `PROCESS-DESIGN.md`, this folder's README.md, PROTOCOL.md, JOB-LIFE.md, SESSIONS.md, DESIGN-STAGE.md, PRODUCT-SUPPLIES.md, `rulebooks/*.md`, and the page's HTML (`neoprocess.html`) for what Bob has been shown. Then take item 1 or 2 above unless Bob says otherwise. Keep the page and the files in step; commit each step; report in plain words; ask Bob nothing that is BOB's by P17.
