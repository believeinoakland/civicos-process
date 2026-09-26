# D1 · beta — job record

**Status** · STARTED by BOB #38, 2026-09-26. COMPLETE 2026-09-26: N3 applied.

## Entries

- **N3** · Part one done: `beta/test/beta.test.mjs` now tests `total` as it stands, at the interface, for full compliance: R1 (every list shape against the left-to-right sum, including `0` for empty), R2 (write, `--verify` fresh and STALE, staleness after a change to either module's source, the committed bundle fresh), R3 (`total` does not mutate its input and is deterministic; `--verify` writes nothing; writing touches only `beta/dist/bundle.txt`). Part two was done after BOB's `CHANGE` (15:16 UTC): I merged `tranche/D1` at 673df14, and `total` now returns `alpha.sum(list)` instead of looping over `alpha.add`. I regenerated beta's own generated artifact, `beta/dist/bundle.txt`, with `node beta/scripts/bundle.mjs`, and `--verify` reports `bundle: fresh`.

## Deferred

None.

## Observation for BOB (beta's requirements)

Since N3, `total` inherits alpha's R4: a list with anything that is not a finite number throws a `TypeError` naming its index. Before, `total` coerced such elements through `+`. beta's R1 leaves this case unstated, so the change breaks no requirement. If the behaviour is meant to be part of beta's contract, BOB may want to state it in beta's R1.

## Reported (REPORT on #2)

1. **`checks/ownership.mjs` rejects the dry run's job record.** Its record pattern is `^build/jobs/T\d+/<module>\.md$`, so `build/jobs/D1/beta.md` fails as "outside beta's paths, tests and job record". Every D-tranche job will fail ownership on its own record. Suggested fix: accept the tranche id the check is given (e.g. derive it from the base ref `tranche/<id>`) or `[A-Z]\d+`.
2. **`dryrun/build/manifest.md` test command fails on Node 22.** `node --test beta/test/` exits 1 with `Cannot find module '.../beta/test'` (Node 22 treats a bare directory as a file, not a pattern). `node --test beta/test/*.test.mjs` works; I ran that. The same likely holds for the process repo's own `node --test checks/test/ metrics/test/` in CLAUDE.md.

## Tests and checks

- `node --test beta/test/*.test.mjs` (from `dryrun/`): tests 4, pass 4, fail 0
- `format`: 2 modules, 2 requirements files; 0 failures
- `architecture`: 4 product files, 2 relative imports; 0 failures
- `coverage`: 1 modules, 3 of 3 live requirement ids named by a test; 0 failures
- `ownership`: first run, 1 failure: the job record itself (reported item 1 above). After merging `tranche/D1` at 8f0c844, which has BOB's fix: 2 files changed by beta; 0 failures
- After the merge, `node --test beta/test/*.test.mjs` (the manifest's corrected command): tests 4, pass 4, fail 0

## Channel (BOB's ANSWER, 15:11 UTC, sent by trigger)

- BOB confirmed and fixed both reported items on `tranche/D1` (8f0c844). I checked the diff and merged it. I also read alpha's new public `sum` (R3 and R4, where R4 throws `TypeError` on any element that is not a finite number) ahead of N3 part two.
- BOB found that comments on the pull request do not wake BOB, because every session posts as the same GitHub account. From now on messages to BOB go by a one-shot `create_trigger` into BOB's session, with the same content pushed here first. As asked, I sent `From beta (D1): REPORT channel test`. That is a one-shot message that BOB asked for, not a timer I armed for myself.

Final, after N3 (from the process repository; the tests run from `dryrun/`):

- `node --test beta/test/*.test.mjs`: tests 4, pass 4, fail 0
- `node --test alpha/test/*.test.mjs` (the module beta uses): pass 4, fail 0
- `node beta/scripts/bundle.mjs --verify`: bundle: fresh
- `format`: 2 modules, 2 requirements files; 0 failures
- `architecture`: 4 product files, 2 relative imports; 0 failures
- `coverage`: 1 modules, 3 of 3 live requirement ids named by a test; 0 failures
- `ownership` (run after the commit): see below
