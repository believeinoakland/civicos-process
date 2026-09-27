# T4 · legacy-checks — job record

**Session** LEGACY-CHECKS #1, `session_01LyPKBsWNrm3uhcjWAvUmhN`, on `job/T4/legacy-checks` (from `tranche/T4` @ `b9f92f767e`). Process: civicos-process @ `7549c0b`, `roles/JOB.md`, mechanics §6, §13, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T4`.

**Status** · COMPLETE, 2026-09-27. Entries N44 and N36 applied, and my module's own flaw that N70 names (the stale `where`s) fixed. No open question. Nothing of my own deferred. The REPORTs below are work for other modules that my rows make visible.

**Contract** (no requirements file; `build/modules.json`): `bio-plane/checks/bio-checks.mjs`, no `tests` path, no `uses`. Read whole: JOB.md, the mechanics, `build/manifest.md`, my entries, `build/layers.md` (layer 1 and the legacy modules' rules), the T3 records of membership, promotion and legacy-tests, and the catalogue families I changed (AI_CREDENTIAL, ACT_SHAPE, CUSTODIAL, MEMBER_ID, SIGNER_ENROLMENT, PROJECT_*, CASE_AUTHORITY, GOVERNING_LAW), with the "WHAT A `where` MEANS" block. **The rest of the 1 MB catalogue (about 375k tokens) I did not read line by line.** I located every other row by a script that loads the catalogue and resolves each row's `where` against the plane's source, the way the DEC-49 guard does, and read whole every family whose rows it found stale. I report this departure from "read in full" so BOB can rule on it for a file of this size.

## Entries applied

- **N44** · membership's new refusal codes now have catalogue rows, each with a check id and a translation:
  - `C-29.11 AI_CREDENTIAL_PRINCIPAL_NOT_THE_MINTER` (R29) and `C-29.12 AI_CREDENTIAL_ORG_NOT_ADMIN` (R62), in AI_CREDENTIAL_CHECKS, `where` = membership's existing region `aiCredentialMint > is-ai-credential-mint`.
  - `C-96.10 RESIGN_AT_TWO` (R10), `C-96.11 NO_HOLDERS` (R11), `C-96.12 PAIRING_NOT_YOURS` (R19), in CUSTODIAL_CHECKS.
  - **`LAST_COMMITTED_OWNER` (R35, R40) is C-33.48**, the same check under the code its site now mints. `LAST_OWNER_CANNOT_LEAVE` is minted nowhere since REC-224, so the row was translating a code no member can meet. The number, site and region stay the same, and the translation is rewritten to be true at both of membership's sites. It still says "Add another owner first" and "Nothing was recorded", which `rec-186-leave-join` asks for; that suite is now 8/0.
  - The control plane's `dec49Decorate` already attaches a row's check and translation at the wire to any refusal carrying the code. So `LAST_COMMITTED_OWNER`, `RESIGN_AT_TWO`, `NO_HOLDERS` and `PAIRING_NOT_YOURS` now reach a caller translated, with no change to membership. R29 and R62 do not, until membership stops sending `check: "membership.Rn"` (REPORT 1).
- **N36** · promotion's `EXISTS` and `ABSENT`:
  - **`EXISTS` is served by the existing row C-96.4.** One code holds one row (arm A), and that row's header already says its sentence is true at `memberAdd` and at `promote`. I noted N36 there. The translation is unchanged.
  - **`C-33.49 ABSENT`** is new, in ACT_SHAPE_CHECKS beside `CAS_STALE` (R1's third answer). Promotion mints it by one literal, its module-level `ABSENT` helper, for R1 and R20. `src/store.mjs gateFacts` (op=ratify) and `src/index.mjs` op=monitor mint the same code with the same meaning. The translation is written to be true at all three, and its row comment says so.
- **My module's flaw (N70's legacy-checks share: the stale `where` of `MACHINE_CANNOT_REOPEN` and of promotion's refusals).** Every row whose `where` named code that T3 moved out of `store.mjs` now names the file, function and region the code lives in. That is 60 rows:
  - **35 to `src/membership/index.mjs`.** The markers moved with this code, so these resolve now. Four functions changed name on the way: `#caseAuthority`→`caseAuthority`, `#projectAuthority`→`projectAuthority`, `#visibilitySettingRefusal`→`visibilitySettingRefusal`; `#custodialBar` and the rest are as before.
  - **8 to `src/store.mjs #promoteChecks`**, where these checks now run as legacy-store's registered promotion step (K31). Each also says ", reached from op=promote". Without that, promotion's R18 test, which selects rows by `/promote\b/`, would silently have stopped probing them.
  - **16 to `src/promotion/index.mjs`**, as `#promote`, `#reopen` or `#fork`, keeping each region's name. Promotion's code carries no DEC-49 markers, so these need promotion to mark them (REPORT 2).
  - **1 to `src/record-core/index.mjs allocIdOp`** (REPORT 3).
  - A paragraph in the "WHAT A `where` MEANS" block now states the rule: a `where` names the file the code lives in now. The C-29 header's count is corrected (twelve).

## Decisions made in the job (for BOB to record if he wishes)

1. **C-33.48 renamed to the minted code** rather than a new row for `LAST_COMMITTED_OWNER` and a retired one for the old code. The check is the same (the leave floor, `is-leave-owner-floor`), R35 only raised it from one owner to one committed owner, and a check is removed only by a ruling. R40's second site, `projectOwnerRemove`, lies outside every region. The translation is true there too.
2. **The new membership rows' `where`s name regions membership has not marked yet** (`adminResign > is-admin-resign-floor`, `hostingAccessSet > is-hosting-access-holders`, `memberPairingSet > is-pairing-yours`). A whole-function `where` cannot serve. Each of those functions also refuses with codes whose rows name other sites (`NOT_AN_ADMIN`) or that have no row (`NO_SUCH_MEMBER`), and arm C would fail them there.
3. **ABSENT in ACT_SHAPE_CHECKS, `where` = `#promote > is-promote-absent`.** The `ABSENT` helper is a `const` arrow function, which the guard cannot open as a function. Promotion either marks a region or makes the helper a declared function (REPORT 2).
4. **`ROOT_OF_TRUST` gets no row in this job.** R10 refuses the founder with it, but the code already existed at `adminRemove`, so it is not one of membership's *new* codes. With R10 it is minted at two sites. That is the multi-site case the ACT_SHAPE header routes to consolidation rather than a row.
5. **No new family.** Each new code went into the family its condition belongs to. A new `*_CHECKS` family is a floor in the guard.

## Deferred

None of my own.

## Found in other modules (REPORT)

1. **membership** (`src/membership/index.mjs`):
   - (a) `#ownRefusal` answers R29 and R62 with `check: "membership.R29"`/`"R62"` and its own sentence. It should build them from `AI_CREDENTIAL_CHECKS` like the other mint refusals, since `dec49Decorate` does not override a `check` already present.
   - (b) Mark the DEC-49 regions the new rows name: `is-admin-resign-floor` around `RESIGN_AT_TWO`, `is-hosting-access-holders` around `NO_HOLDERS`, `is-pairing-yours` around `PAIRING_NOT_YOURS`. Build those three refusals, and `LAST_COMMITTED_OWNER` at both sites, from their rows.
   - (c) `PROJECT_SEEN_NOT_A_PARTICIPANT` is minted in membership's `#existenceOnly` and in a copy in `src/promotion/index.mjs` `#existenceOnly`. Promotion should call membership's copy.
2. **promotion** (`src/promotion/index.mjs`, `src/gate.mjs`):
   - (a) **Its own test goes red from N36:** `write-path.test.mjs` "R18: every refusal the catalogue sites at the promote write…" fails with `no probe for ACT_SHAPE_CHECKS.ABSENT`. It needs an `ABSENT` probe (R1's revision of a bundle not held); 49/50 here, 50/50 on the base.
   - (b) **CATALOG_VERSION** (R34, `gate.mjs`): this job adds six checks and changes one check's code (C-33.48). The catalogue census is now 572, with 1.32.0 pinned at 566. The version must move, and `d470-catalog-census` (A3, A9) re-pins after it.
   - (c) Mark the DEC-49 regions its 16 rows now name in `#promote`, `#reopen` and `#fork`: `is-promote-cas`, `is-promote-absent`, `is-promote-snapkey`, `is-promote-files`, `is-promote-digest`, `bias-state-edge`, `is-machine-reopen`, `is-project-creation-ownerless`, `is-project-creation-visibility`, `is-project-id-supplied`, `is-project-id-bytes`, `is-project-fork-id-supplied`, `is-promoted-type-disagrees`, `is-promote-retypes-bundle`, `is-promoted-title-disagrees`, `is-promoted-state-disagrees`. For `ABSENT`, a region around R1's and R20's answers, or the helper as a declared function.
   - (d) Attach C-96.4 to `EXISTS` and C-33.49 to `ABSENT` in its own answers. Its "Errors" line says "where the catalogue has a row for it"; `dec49Decorate` already does this at the wire.
3. **record-core** (`src/record-core/index.mjs`): mark `is-allocid-prefix-gated` in `allocIdOp` for C-59.5 `ALLOCID_PREFIX_GATED`.
4. **legacy-tests** (the old battery and the DEC-49 guard). Pins and censuses that my rows move, each measured here against `tranche/T4` @ `b9f92f767e`:
   - `d134-custodial-refusals` 16/0 → 14/2 and `civicos-ui/test/custodial-acts` 49/49 → 48/49 (C-96 holds 12 rows, not 9);
   - `aicredential` 95/0 → 94/1 (C-29.11 and C-29.12 are driven by membership's own suite, not this one);
   - `machinefences-dec49` 80/6 → 78/9. Fixed: C-33.48. New: D-PIN-A and D-PIN-B (C-33.48's name, C-33.49), D0 (68 → 69), and ARM D for C-33.49, a region promotion owes. Its five other ARM D reds are promotion's regions, as before;
   - `d470-catalog-census` 13/0 → A3 and A9 red until promotion moves CATALOG_VERSION (2b);
   - `civicos-ui/test/refusal-codes.control.mjs`: its two basis-version arms anchor on the old `where` text (`src/store.mjs promote > basis-version-…`) and need re-anchoring;
   - `civicos-ui/check-refusal-codes.mjs`: **65 → 38 failures**. Gone: every stale-`where` failure whose code moved with its markers. Left:
     - the 21 regions owed by modules 1b, 2c and 3;
     - floors and ceilings to move from its own print: rows 501→507, governedSites 263→267, reachGap 43→37, multiSiteCodes 60→59, and the arm C and F floors, which were already short at the base;
     - arm G's declarations: `ABSENT` multi-site; `CASE_SIGNER_NOT_AN_OWNER` and `PROJECT_ACT_NOT_A_PARTICIPANT` now single-site; stale `MULTI_SITE_CLOSED` entries for `NOT_AN_ADMIN`, `CONSENSUS_REQUIRED` and `EXISTS`;
     - the plane census and reach walks, which read only `src/*.mjs` and so no longer see the codes in `src/<module>/` (already red at the base).
   - Improved: `rec-186-leave-join` 7/1 → 8/0 and `refusal-wire` 41/1 → 42/0.
5. **affordances** (`src/affordances.mjs` 1766, 1783) and `src/gate.mjs` 168: their comments still name `LAST_OWNER_CANNOT_LEAVE`. For affordances this is part of N45.
6. **Generated artifacts:** `bio-plane/dist/bio-plane.bundled.mjs` and `newgroup/dist/newgroup.bundled.mjs` embed `bio-checks.mjs`, so both are stale. They are regenerated at the layer close (manifest §14).

## Tests and checks run

- Layer tests: none named in `build/manifest.md`. My module has no requirements, so no `tests` path.
- Modules that use `legacy-checks`, their own suites on this branch: `text-chain` 86/86, `record-core` 33/33, `membership` 73/73, `promotion` 49/50 (REPORT 2a; 50/50 on the base).
- The old-battery suites that read the families I changed, here and on the base: listed in REPORT 4. Unchanged and green: ratify 43/0, rec176-snapkey 47/0, rec175-digest 52/0, rec207-bias-debt-settle 37/0, d484-refusal-translation 28/0, rec-183-reinstate-retired 14/0, machine-attest 36/0, d168-retired-cite 21/0, rec173-migration-replay 21/0, d463-confined-credential 49/0, fence-e2e 55/0. Also unchanged: d311-roster-affordances 20/1, both here and on the base (N45).
- `node checks/format.mjs .`: `format: 69 modules, 64 requirements files; 0 failures`
- `node checks/architecture.mjs . legacy-checks`: `architecture: 1 product files, 0 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs . legacy-checks`: `coverage: 0 modules, 0 of 0 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs . legacy-checks tranche/T4`: `ownership: 1 files changed by legacy-checks between tranche/T4 and HEAD; 0 failures`

Size: test runs 62, module lines 15773
