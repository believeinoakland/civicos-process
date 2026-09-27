# T4 · promotion — job record

**Session** PROMOTION #2, `session_012BcNihVYcDtYdrcV3nWo8p`, on `job/T4/promotion` (from `tranche/T4` @ `98aeb98fcc`). Process: civicos-process @ `7549c0b`, `roles/JOB.md`, mechanics §6, §13, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T4`.

**Status** · COMPLETE, 2026-09-27. Entries T4-2a, T4-2b and T4-2c applied (layer 2, K118). No open question. One deferral of my own (R45, below), and the coverage check's one failure is that id, red on the base too.

**Read whole:** `roles/JOB.md`, PROCESS-MECHANICS.md, `build/manifest.md`, `build/requirements/promotion.md`, `build/layers.md` (layer table, legacy modules, rulings), my entries in `build/plan/current.md`, K118, LEGACY-CHECKS #1's record (REPORT 2), every file under `bio-plane/src/promotion/`, `bio-plane/src/gate.mjs` and every test under `bio-plane/test/m/promotion/`.

**Baseline:** `node --test test/m/promotion/` on `98aeb98fcc`: 49/50, R18 red with `no probe for ACT_SHAPE_CHECKS.ABSENT (C-33.49, src/promotion/index.mjs #promote > is-promote-absent)`.

## Entries applied

- **T4-2a** · R18's test has an `ABSENT` probe (a revision of a bundle not held, through the store's write path), so every row the catalogue sites at the promote write is met by name again. `write-path.test.mjs`: 50/50.
- **T4-2b** · `CATALOG_VERSION` 1.32.0 → **1.33.0** (MINOR, `src/gate.mjs`, with its note): six arrivals (C-29.11, C-29.12, C-96.10, C-96.11, C-96.12, C-33.49), none departing, one changed (C-33.48, now `LAST_COMMITTED_OWNER`). The d470 suite's own print on this tree: **count 572, sha256 `86ddf728cfe6d389ec3ffb28cd31179cae70bc0f681c8f227c96eda70d95443b`, source `1513f4a898edc422ecff7efebfd2b029e38b899396981092c9d3f2061277e113`, changed `["C-33.48"]`**. `GATE_VERSION` is `plane-gate/1.0 (bio-checks 1.33.0)`.
- **T4-2c** · The 16 DEC-49 regions the catalogue's 17 promotion rows name are marked in `src/promotion/index.mjs`: in `#promote`, `is-promote-cas`, `is-promote-absent`, `is-promote-snapkey`, `is-promote-files`, `is-promote-digest`, `bias-state-edge`, `is-project-creation-ownerless`, `is-project-creation-visibility`, `is-project-id-supplied`, `is-project-id-bytes` (C-59.2 and C-59.4), `is-promoted-type-disagrees`, `is-promote-retypes-bundle`, `is-promoted-title-disagrees` and `is-promoted-state-disagrees`; in `#fork`, `is-project-fork-id-supplied`; in `#reopen`, `is-machine-reopen`. How:
  - Every refusal with a catalogue row is now built by one helper, `refusal("<CODE>", detail, extra)`, which takes the row from the families promotion's Uses name (and promotion's own rows) by the code. The code is a literal at each site, which is what the guard's arm C reads (`refusal("X"`), so each region judges exactly its own code.
  - **`ABSENT` is a region the guard can open:** R1's and R20's two `ABSENT` answers are now one arm, `is-promote-absent`, asked before any other answer that reads the head. Moving R1's arm ahead of R4's snap-key comparison changes no answer: a manifest entry exists only for a held bundle, so a revision of a bundle not held never met R4.
  - STATE_MOVE_UNDECLARED (promotion's own row C-86.6) is kept outside `bias-state-edge`, whose row governs only the bias arm.
- **Found in my module and fixed (legacy-checks' REPORT 2 (d)):** `EXISTS` now carries C-96.4 and `ABSENT` C-33.49; `FILES_DROPPED` (C-33.24) and `MACHINE_CANNOT_REOPEN` (C-32.5), which were bare objects, carry theirs. Every refusal of `promote` that has a catalogue row now carries its check and translation, so the "Errors" line's *(not yet met: `CAS_STALE`, `EXISTS`, `ABSENT` …)* note is met; the refusals left without a row (`MALFORMED`, `NO_BUNDLE_MD`, `OVERSIZE_INLINE`, …) have none in the catalogue. The test "R20: every refusal names a reason, carrying its catalogue row where one exists" now checks this over eleven answers.

## Deferred

- **R45 (`onCommitted`, N63), which the coverage check names.** It needs a notice *after the promotion's transaction has committed*. `promote` is usually called inside the store's own transaction (record-core R32: nested calls join the outer one), and record-core provides no after-commit hook or depth, so a listener called when `promote` returns could fire before the real commit, or for a promotion the outer transaction then rolls back. Meeting it needs a record-core service first. It is N63 in `next.md`; I wrote no test for it, since a test naming R45 over a service that does not exist would claim compliance it cannot check.
- legacy-checks' REPORT 1 (c) (promotion's `#existenceOnly` should call membership's): membership's `existenceAct` is not in membership's Provides, so promotion cannot use it (P7). Left as is (below).

## Found in other modules (REPORT)

1. **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` embeds `src/gate.mjs` and `src/promotion/index.mjs`, so it is stale (it still says 1.32.0). For BOB's regeneration at the layer close (manifest §14).
2. **legacy-tests** (T4-5), measured on this branch:
   - `d470-catalog-census`: 11/2, A3 and A5. The row to add: `"1.33.0": { count: 572, digest: "86ddf728…43b", changed: ["C-33.48"], source: "1513f4a8…113" }` (full figures above), and A5's literal `1.32.0` → `1.33.0`.
   - `machinefences-dec49`: 84/3 (was 78/9 at LEGACY-CHECKS #1). All six ARM D reds for promotion's regions (C-33.49 among them) are green. Left: D-PIN-A, D-PIN-B, D0, the pins legacy-checks' rows moved.
   - `civicos-ui/check-refusal-codes.mjs`: 20 failures (LEGACY-CHECKS #1 recorded 38). All 16 promotion regions resolve, each judging its one refusal (the `arm C:` sites line). None of the 20 names promotion. Left: membership's three regions and record-core's one, the floors and ceilings, arm G's declarations, and the census walks, as legacy-checks' REPORT 4 lists. Arm G counts `ABSENT` at `src/store.mjs` and `src/index.mjs` only, because its walk does not read `src/<module>/`; promotion mints it too.
   - `ratify-authority`: 51/1, its pin on C-57.1's `where` (`src/store.mjs #caseAuthority` → `src/membership/index.mjs caseAuthority`), which legacy-checks' re-pointing moved. Not promotion's.
3. **membership:** to let promotion (and every act) give R44's one answer through membership instead of a copy, `existenceAct(projectId, viewer)` would need to be in membership's Provides. Promotion's `#existenceOnly` builds the same row (C-70.1) with the same words; the region that governs C-70.1 is membership's.
4. **record-core:** R45 above needs an after-commit notice (or a transaction-depth read) from record-core, for N63.
5. **promotion's requirements (BOB's):** the "Errors" line's *not yet met* note can be removed (above).

## Tests and checks run

- My module: `node --test bio-plane/test/m/promotion/`: `tests 50, pass 50, fail 0` (baseline 49/50).
- Layer tests: none named in `build/manifest.md`. No provided service changed (the answers gain the check and translation the requirements already state, and `GATE_VERSION` moves as R34 requires), so no user's tests are due. None of the 22 modules that use promotion has extracted tests yet.
- Old-battery suites that drive `promote`, unchanged and green: ratify 43/0, rec176-snapkey 47/0, rec175-digest 52/0, rec207-bias-debt-settle 37/0, d484-refusal-translation 28/0, machine-attest 36/0, fence-e2e 55/0, refusal-wire 42/0, d168-retired-cite 21/0, rec173-migration-replay 21/0, rec-183-reinstate-retired 14/0. The DEC-49 guards and the census as in REPORT 2.
- A comparison run of `check-refusal-codes.mjs` on a worktree of the base was refused by my session's permission check. I did not retry it by another route; the base figure above is LEGACY-CHECKS #1's.
- `node checks/format.mjs /home/user/bio`: `format: 69 modules, 64 requirements files; 0 failures`
- `node checks/architecture.mjs /home/user/bio promotion`: `architecture: 16 product files, 43 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs /home/user/bio promotion`: `FAIL promotion: 1 of 45 live ids named by no test: R45` / `coverage: 1 modules, 44 of 45 live requirement ids named by a test; 1 failure` (R45, deferred above; red on the base too)
- `node checks/ownership.mjs /home/user/bio promotion tranche/T4`: `ownership: 5 files changed by promotion between tranche/T4 and HEAD; legacy-checks: 0 line(s) added, 0 removed; legacy-store: 0 line(s) added, 0 removed; 0 failures`

Size: test runs 24, module lines 2010
