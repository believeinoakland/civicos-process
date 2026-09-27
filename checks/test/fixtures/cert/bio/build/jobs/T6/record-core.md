# Job record: record-core, T6

**Status** · COMPLETE, 2026-09-27. RECORD-CORE #3, session `session_019pNVf5zMt4wodgEg4ecanZ`, depth 2, branch `job/T6/record-core` (cut from `tranche/T6` @ dddfafdfa9, layer 1 merged). Process: civicos-process, `roles/JOB.md`. Entry: N117 (its share).

**Read whole:** `roles/JOB.md`; `PROCESS-MECHANICS.md`; `build/manifest.md`; `build/requirements/record-core.md`; `build/layers.md` (layer 2's contract, the legacy modules); the public part of `id-spaces` (`legacy-checks` has no requirements file: it is a legacy module); `bio-plane/src/record-core/index.mjs` and `schema.mjs`; `bio-plane/test/m/record-core/record-core.test.mjs` and `storage.mjs`; my entry and N117's text in `build/plan/current.md`. No entry names built work on the snapshot branch.

## Questions to BOB

- None.

## Entries applied

- **N117 (record-core's share): `auditPass`'s cursor read carries an SQL `LIMIT`.** The cursor read now takes the ids after `after` a page's worth at a time (`… ORDER BY bundle_id LIMIT <page>`), skipping those `visible` refuses, and reads the next chunk from the last id it saw only while the page is short; it stops as soon as the page is full or the table is exhausted. The page, its order, the cursor (R20) and the tallies are unchanged.
- **Also bounded, in the same method:** the reference resolver no longer loads every bundle id into a `Set` at the start of each pass (an unbounded read of the whole table). It asks `bundles` by its primary key for each reference a check resolves (`SELECT 1 … WHERE bundle_id=? LIMIT 1`), which is still the whole corpus, never the viewer's slice (R19).
- **Test:** `R18 R19 R20 (N117)`, at the interface: over a storage that records every read, a corpus of 23 bundles of which a viewer sees 4, each citing one the viewer does not see. Paged at 3, the pass gives the 4 visible bundles in two pages, in id order, with R20's cursor, and no read the module makes returns more than a page's rows; the unseen cited bundle still resolves (no C-6.2). It fails on the code before this change (a read returned all 23 rows) and passes after.

## Deferred

- None.

## Reports (other modules)

- **R1 · the plane bundle is stale** (`bio-plane/dist/bio-plane.bundled.mjs`, `not_product`; manifest §14): `fleetbundles.test.mjs` reports `STALE BUNDLE — the source src/record-core/index.mjs has changed`. Expected; regenerate at the layer close (`bio-plane/`: `npm run build`).
- **R2 · legacy-store, the other half of N70's "auditPass's unbounded sighted scan":** `store.mjs` `auditPass` (~13954) still builds `sighted` from `SELECT b.bundle_id FROM bundles b WHERE (<viewer gate>)` with no `LIMIT`, every bundle the viewer may see, before it calls `provenanceAudit` with `visible: (id) => sighted.has(id)`. record-core's read is now bounded, but this one is not. A per-id predicate (the gate's SQL with `AND b.bundle_id=?`) would bound it. Legacy-store's; for the job that next extracts from it (the `op=audit` route's owner), or `next.md`.
- **R3 · legacy-tests, `meaning-bounds.test.mjs`:** its pinned OPAQUE roster wants `projectfork->forkProject` and `projectowneradd->projectOwnerAdd` and not `audit->auditPass`; it is red identically on `tranche/T6` without my change (the walk reads `store.mjs`'s wrapper, not record-core). `bounds.test.mjs` is also red on the base, unchanged by this job. Both are legacy-tests' (N70).

## Tests and checks

- `node --test bio-plane/test/m/record-core/*.test.mjs`: tests 47, pass 47, fail 0 (before the source change: the new test fails, 46 pass, 1 fail).
- Users of `auditPass`: `bio-plane/test/m/promotion/`: pass 56, fail 0; `bio-plane/test/m/provenance/`: pass 54, fail 0; `audit.test.mjs` 1/0; `audit-inheritance.test.mjs` 1/0. `bounds.test.mjs` and `meaning-bounds.test.mjs`: 0 pass, 1 fail each, the same on the base (R3).
- Layer tests: none (manifest).
- `format`: 69 modules, 64 requirements files; 0 failures.
- `architecture record-core`: 4 product files, 6 relative imports; 0 failures.
- `coverage record-core`: 59 of 59 live requirement ids named by a test; 0 failures.
- `ownership record-core tranche/T6`: 3 files changed; legacy-store: 0 line(s) added, 0 removed; 0 failures.

Size: test runs 14, module lines 996
