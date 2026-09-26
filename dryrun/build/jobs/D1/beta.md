# D1 · beta — job record

**Status** · STARTED by BOB #38, 2026-09-26. IN PROGRESS: N3 part one done; waiting for BOB's `CHANGE` that alpha's `sum` is on `tranche/D1`.

## Entries

- **N3** · Part one done: `beta/test/beta.test.mjs` now tests `total` as it stands, at the interface, for full compliance: R1 (every list shape against the left-to-right sum, including `0` for empty), R2 (write, `--verify` fresh and STALE, staleness after a change to either module's source, the committed bundle fresh), R3 (`total` does not mutate its input and is deterministic; `--verify` writes nothing; writing touches only `beta/dist/bundle.txt`). Part two (switch `total` to `alpha.sum`, regenerate beta's own bundle) waits for BOB's `CHANGE`.

## Reported (REPORT on #2)

1. **`checks/ownership.mjs` rejects the dry run's job record.** Its record pattern is `^build/jobs/T\d+/<module>\.md$`, so `build/jobs/D1/beta.md` fails as "outside beta's paths, tests and job record". Every D-tranche job will fail ownership on its own record. Suggested fix: accept the tranche id the check is given (e.g. derive it from the base ref `tranche/<id>`) or `[A-Z]\d+`.
2. **`dryrun/build/manifest.md` test command fails on Node 22.** `node --test beta/test/` exits 1 with `Cannot find module '.../beta/test'` (Node 22 treats a bare directory as a file, not a pattern). `node --test beta/test/*.test.mjs` works; I ran that. The same likely holds for the process repo's own `node --test checks/test/ metrics/test/` in CLAUDE.md.

## Tests and checks (so far)

- `node --test beta/test/*.test.mjs` (from `dryrun/`): tests 4, pass 4, fail 0
- `format`: 2 modules, 2 requirements files; 0 failures
- `architecture`: 4 product files, 2 relative imports; 0 failures
- `coverage`: 1 modules, 3 of 3 live requirement ids named by a test; 0 failures
- `ownership`: 1 failure, the job record itself (reported item 1 above)
