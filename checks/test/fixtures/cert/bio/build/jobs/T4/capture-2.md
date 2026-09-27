# T4 · capture — repair job record (CAPTURE #2)

**Session** CAPTURE #2, `session_01T2Ek9JphkWwCkqAd6pVhzo`, on `job/T4/capture-2` (from `tranche/T4` @ `b4fbb0b9b5`). Process: civicos-process `roles/JOB.md`, mechanics §6, §13, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T4` (`session_01PcJjeNeDjQeced6Yphu5r9`).

**Status** · COMPLETE, 2026-09-27. T4-6 applied (code @ `0476818fdf`); 46 capture tests green; format, architecture, coverage and ownership pass. No question, nothing deferred, no NEEDS BOB.

**Read whole:** `roles/JOB.md`, PROCESS-MECHANICS §6, §13, §16, `build/manifest.md`, `build/requirements/capture.md`, my entry in "## Layer 11 re-opened" of `build/plan/current.md` (K125), `bio-plane/src/capture/acquire.mjs`, the C-48 rows of `DRIVE_CAPTURE_CHECKS`.

## Entries applied

- **T4-6** · `driveRow` is exported from `bio-plane/src/capture/acquire.mjs` (it was a private `const` since the extraction), unchanged in behaviour: it answers `{code, check, translation}` from the C-48 row, read from the catalogue, and throws on a code with no row or sentence (DEC-49). This is what `op=monitor`'s Drive tick in `index.mjs` calls for C-48.2–C-48.4 and C-48.8–C-48.9; importing it there is legacy-index's T4-7, not mine. Tested at the interface in `bio-plane/test/m/capture/acquire.test.mjs`, "R4 R37: driveRow answers every C-48 code's own catalogue row …": every key of `DRIVE_CAPTURE_CHECKS` (the two tick codes included) answers exactly its own row, and four non-C-48 codes throw.

## Found in other modules

- Generated artifact: `bio-plane/dist/bio-plane.bundled.mjs` (`not_product`, BOB regenerates at the layer close) bundles `acquire.mjs`; the change is an `export` keyword only, so the bundle's behaviour is unchanged, but its input hash is now stale.

## Tests and checks run

- My module: `node --test bio-plane/test/m/capture/`: `tests 46, pass 46, fail 0`.
- Checks (civicos-process `main` @ `7549c0b6cc`): `format: 69 modules, 64 requirements files; 0 failures`; `architecture: 10 product files, 43 relative imports (0 naming no tracked file, not judged); 0 failures`; `coverage: 1 modules, 56 of 56 live requirement ids named by a test; 0 failures`; `ownership: 2 files changed by capture between tranche/T4 and HEAD; legacy-store: 0 line(s) added, 0 removed; legacy-index: 0 line(s) added, 0 removed; 0 failures`.
- Layer tests: none named in the manifest.

Size: test runs 1, module lines 2730
