# T6 · legacy-checks — job record

**Session** LEGACY-CHECKS #2, `session_01FUNffcNqviJLVTLYAn267C`, depth 2, on `job/T6/legacy-checks` (from `tranche/T6` @ `039eb27c33`). Process: civicos-process `main`, `roles/JOB.md`, mechanics §6, §13, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T6` (BOB #48, `session_01E4YZNiY3MRoRn59Wr5NnLW`, at the start).

**Status** · COMPLETE again, 2026-09-27, after BOB's CHANGE of 15:13 UTC (K163: the revision stands; `EXTRACT_NO_SCOPE` added as C-104.12). Every entry applied. Nothing of my own deferred. The REPORTs below are work for other modules that my rows make visible.

**Contract** (no requirements file; `build/modules.json`): `bio-plane/checks/bio-checks.mjs`, no `tests` path, no `uses`. My entries: the legacy-checks line of layer 1 in `build/plan/current.md`, with the appendix texts of N81, N87, N94, N97, N118. Per K118 the 1 MB catalogue is read whole in the families this job changes; every other row is resolved by a script that loads the catalogue and checks each `where` against the plane's source.

## QUESTION 1 (sent 2026-09-27)

1. **N118's C-100 share is not in my file.** `PROGRESSION_CHECKS` (C-100) lives in `bio-plane/src/progressions/checks.mjs`, which `progressions` owns; the catalogue holds no C-100 row. I cannot write it. **Best reading:** C-100's two items (one `where` grammar, no `fn1|fn2`; stop minting rows for codes other modules mint) are progressions' share, with N118's progressions share in the next plan. I apply only C-22.1's item (a code of its own for the `NEVER_LOOKED` condition).
2. **Codes run-productions R10/R12 names that other modules also mint.** R13 wants every R10/R12 refusal catalogued. Ten codes are minted only by `extractPropose`/`extractProposals`; four are also minted elsewhere for the same condition: `NO_TARGET` (15 sites: the request names no object), `NO_SUCH_BUNDLE` (26 sites: absent or not visible, answered alike), `NOT_A_DOCUMENT` (2: content's mint door, same words), `NO_BYTES_HELD` (2 + two `null_case`s: no capture held). `NO_SCOPE` has one other site with a different condition (the published case's authored scope, `src/store.mjs` ~6139). **Best reading:** one row per code, in `SUGGEST_CHECKS` (C-27, run-productions' family), `where` the function that mints it now (`src/store.mjs extractPropose` / `extractProposals`, whole: every literal refusal in each is one of these rows; the relayed ones carry their own), each translation worded true at every site that mints the code (T4's `ABSENT`/`EXISTS` precedent). For `NO_SCOPE` the sentence is worded for both sites ("the request did not state the scope it needs"). The four shared codes then count as multi-site DEC-49 codes in the guard's arm G, which legacy-tests re-judges.
3. **`CAPTURE_REQUEST_NOT_RETRYABLE` (K109) is minted nowhere yet**; capture-requests builds `captureRequestRetry` (R42) in T6-8. **Best reading:** C-28.18, `where` `src/capture-requests/index.mjs captureRequestRetry` (whole: R42's only refusal), so it resolves once T6-8 lands; until then the guard names it unresolved.

**Revised while working (point 2 and 3):** reading the catalogue whole in the families I changed showed two things the QUESTION did not weigh. (a) ACT_SHAPE_CHECKS' REC-64 header states the rule for multi-site codes: a row cannot claim one of many sites, so they get no row. I therefore gave **no row to `NO_TARGET` (15 sites), `NO_SUCH_BUNDLE` (26) or `NO_SCOPE` (two conditions)**, and rows only to the codes minted at one site, or at two for one condition (`NOT_A_DOCUMENT`, `NO_BYTES_HELD`, which content's mint door asks in the same words). (b) SUGGEST_CHECKS is the suggest endpoint's own registry, which `suggest.test.mjs` drives whole, and its header says every `where` names a region. So the extract rows are **a family of their own, `EXTRACT_PROPOSE_CHECKS` (C-104)**, each `where` a region run-productions marks. For the same reason C-28.18 names a region (`captureRequestRetry > is-capture-request-retry`), per C-28's REC-71 rule. **Still open for BOB:** the three codes without rows. They need codes of run-productions' own (a change to R10's wording) or a `where` that can name a set of spans. My recommendation is run-productions' own codes, e.g. `EXTRACT_NO_TARGET`, `EXTRACT_NO_SUCH_BUNDLE`, `EXTRACT_NO_SCOPE`. That is a small R10 edit, and those three rows then join C-104.

## Entries applied

All in `bio-plane/checks/bio-checks.mjs`. **71 `where`s re-pointed; 30 rows added; 3 new families.**

- **N87** (layer 3's moves; LEGACY-TESTS #2's list): C-89.1 → `src/provenance/index.mjs attest > is-attest-parts`. C-28.13 → `src/capture/acquire.mjs acquire > is-capture-request-arm`. C-48.1–C-48.7 and C-83.1–C-83.8 → `src/capture/acquire.mjs acquire > <same region>`. C-85.1–C-85.2 → `src/capture/index.mjs #knockRateRefusal > is-knock-rate`. C-85.3–C-85.5 → `src/capture/doorbell.mjs <same fn> > <same region>`. C-34.1–C-34.4 → `src/provenance/index.mjs provenanceRouteAssess`. C-53.1–C-53.6 → `… testify`. C-53.7–C-53.9, C-53.13 → `… #testimonyFence`. KNOCK's header prose now names the new home.
- **N94**: C-75.1–C-75.5 → `src/record-core/index.mjs perItem > is-per-item-*` (the header's `Store.PER_ITEM_MAX` now names record-core's). New rows: **`REGISTRATION_CHECKS` (C-102)**, the K31 registrations' answers:
  - `AUDIT_CHECK_DECLARED` C-102.1 and `AUDIT_CHECK_MALFORMED` C-102.2 (`registerAuditCheck`, whole);
  - `AUDIT_CHECK_FAILED` C-102.3 (`auditPass`, whole: its one code);
  - `FACT_UNAVAILABLE` C-102.4 and `FACT_FAILED` C-102.5 (promotion `fact`, whole; `FACT_UNAVAILABLE` added so that a whole-function `where` is true, and worded true at `#fact` too).
- **N97**: C-45.5–C-45.6 → `src/content/index.mjs #rowFor > is-content-row`. C-52.1–C-52.7 → `… transcribe`. C-52.8 → `#transcriptionOf`. C-52.9 → `transcriptionAttest`. C-80.3 → `passageNotice > is-passage-notice`.
- **Connections** (CONNECTIONS #1's REPORT 3): C-49.1, C-49.2, C-49.4 → `src/connections/pair.mjs`. C-49.3 → `src/connections/index.mjs portionGrade > pair-content-row-present`. C-74.1–C-74.4 → `choose > is-connection-choice`. C-81.2–C-81.10 → `src/connections/themes.mjs` `declare`, `#themeFor`, `place`, `#targetFor`, `propose`. **C-81.11–C-81.14** (R43, K152) are carried into THEME_CHECKS word for word from the module's `THEME_WITHDRAW_CHECKS`, and the family header's list of fences gains the withdrawal.
- **RETRIEVAL #1 REPORT 4**: the two headers (AI_RUNS_CONTEXT_CHECKS, VERSION_CHAIN_CHECKS) now say MEANING_READ_CHECKS lives in `src/retrieval/checks.mjs`.
- **ENTITIES #1 REPORT 3**: `NO_ALIAS` → `src/entities/index.mjs addAlias > is-alias-named`.
- **run-productions R13**: **`EXTRACT_PROPOSE_CHECKS` (C-104.1–C-104.11)**: NO_PROPOSER, NO_RUN, NO_SUCH_RUN, RUN_NOT_RUNNING, NOT_AN_EXTRACT_RUN, NO_MINTS_BOUND, MINTS_BOUND_REACHED, NO_PROPOSALS, NOT_A_DOCUMENT, NO_BYTES_HELD, MINTS_BOUND_WOULD_EXCEED. Regions `is-extract-run`, `is-extract-door`, `is-extract-document`, `is-extract-whole-batch` in `extractPropose`, placed so they exclude the relayed refusals and the two row-less codes. NO_TARGET, NO_SUCH_BUNDLE and NO_SCOPE are open (above).
- **capture-requests R19 (D-584)**: `CAPTURE_FETCH_FAILED` C-28.17, `captureRequestDrain > is-capture-fetch-failed`. `#renderHoldReason` reads C-28, so a held row now carries its check and sentence at once.
- **K109**: `CAPTURE_REQUEST_NOT_RETRYABLE` C-28.18, at the site T6-8 builds (`src/capture-requests/index.mjs captureRequestRetry > is-capture-request-retry`). The "WHAT A `where` MEANS" block now states this one exception and records T6's re-points.
- **N81** (PROVENANCE #1 REPORT 2): **`PROVENANCE_ACT_CHECKS` (C-103.1–C-103.7)**:
  - `PROVENANCE_REGISTER_REFUSED` (`#registerArms`, whole);
  - `ORIGIN_NOT_A_MEMBER` and `NO_BUNDLE` (`declareOrigin > is-origin-act`; `NO_BUNDLE` is worded true at `provenanceChainRebuild` too);
  - `ORIGIN_NOT_A_DOCUMENT` and `ORIGIN_NO_SYSTEM` (`> is-origin-statement`);
  - `RECEIPT_MALFORMED` and `RECEIPT_NO_KEY` (`signReceipt`, whole).
  - R29's `NO_SUCH_BUNDLE` gets no row, by the REC-64 rule.
- **N118 (my share)**: `AI_LOG_NEVER_LOOKED_STORED` C-22.17, the code of its own for a look stating NEVER_LOOKED, at `src/observation-log/vocabulary.mjs checkObservation > is-never-looked-stored`. C-22's header count is now seventeen. C-100 is not in my file (QUESTION 1.1).

## Decisions made in the job (for BOB to record if he wishes)

1. Three new families (C-102, C-103, C-104), against SK-1's floor rule, on KNOCK_CHECKS' reasoning: no existing family's subject fits a module registration, provenance's own acts, or the extract endpoint.
2. Multi-site codes get no row, on the catalogue's REC-64 rule (above). Rows for codes minted at two sites for one condition, each sentence true at both: `NOT_A_DOCUMENT`, `NO_BYTES_HELD`, `NO_BUNDLE`, `FACT_UNAVAILABLE`, `CAPTURE_FETCH_FAILED`.
3. Where the code moved with its markers, a `where` names the file the code lives in now (T4's rule). Where the code is not marked, the `where` names the region its owner marks. C-28.18 is the one row whose site is not written yet.

## Deferred

None of my own.

## Found in other modules (REPORT)

1. **connections**: `src/connections/themes.mjs` should re-export C-81.11–C-81.14 from THEME_CHECKS and delete `THEME_WITHDRAW_CHECKS`. Until it does, the guard fails 8 lines: 4 C-numbers claimed twice and 4 identical translations. Connections has no T6 job, so this wants an entry or BOB's routing.
2. **run-productions (T6-7)**: mark `is-extract-run`, `is-extract-door`, `is-extract-document` and `is-extract-whole-batch` where it moves `extractPropose`, and `is-extract-scope` in `extractProposals`, where it mints `EXTRACT_NO_SCOPE` (R12, K163) in place of `NO_SCOPE`; drive C-104.1–C-104.12. `NO_TARGET` and `NO_SUCH_BUNDLE` stay row-less (R13, K163). When it moves the code, the C-104 and C-27 `where`s go stale again, and only a legacy-checks entry can re-point them.
3. **capture-requests (T6-8)**: mark `is-capture-fetch-failed` in the drain; build `captureRequestRetry` with region `is-capture-request-retry` minting C-28.18; drive both codes. `capturerequests.test` fails its "every code DRIVEN" arm until then (137/2 → 138/1 after my region fix).
4. **provenance**: mark `is-origin-act` and `is-origin-statement` in `declareOrigin`. Its `{ spent: refusal(…) }` in `is-testify-bytes` is now judged (it was unresolved before) and reads as unclassified: guard ceiling 5 → 6.
5. **observation-log** (N118's share, next plan): mint `AI_LOG_NEVER_LOOKED_STORED` at region `is-never-looked-stored` in `checkObservation`, in place of C-22.1's code there. Its module tests are unchanged here (42/42).
6. **record-core, promotion**: their C-102 `where`s resolve now. Promotion's `FACT_MALFORMED` and `STEP_DECLARED` (and every registration's `STEP_DECLARED`, and the `LISTENER_*` codes C-100 claims) still have no catalogue row. The C-100 part is progressions' N118.
7. **promotion (CATALOG_VERSION, R34)**: this job adds 30 rows (C-22.17, C-28.17–18, C-81.11–14, C-102.1–5, C-103.1–7, C-104.1–11), changes no row's code or translation, and moves 71 `where`s. `d470-catalog-census` A3 and A9 are red until the version moves, which is promotion's T6 layer-2 job if BOB routes it there.
8. **legacy-store / content**: the store's `versionNotice` still answers `VERSION_NOTICE_NO_CONTENT` in `is-version-notice-subject`. C-80.3 now names content's `passageNotice` (N97), so the guard reports that store refusal as outside its region's rows. The store's passage arm should delegate to content.
9. **entities**: `is-alias-named` is 4 lines / 99 characters, under the guard's floor.
10. **legacy-tests** (the guard and the old battery), measured against `tranche/T6` @ `039eb27c33`:
    - **Guard** (`civicos-ui/check-refusal-codes.mjs`): **103 failures before, 104 after (the one more is `is-extract-scope`, unmarked until T6-7). 44 cleared** (every stale `where` and missing region of N87/N94/N97, the connections and NO_ALIAS rows, and the 37-orphan-marker line).
    - **The new failures** are:
      - items 1–5 and 8–9 above;
      - capture's six regions, where arm C finds no refusal (`answer(status,…)`, T4's known verdict-reader gap);
      - arm G's multi-site list (the five same-condition codes of Decision 2, to declare MULTI_SITE_CLOSED);
      - the ratchets to re-pin from its print: rows 551→582, families 70→73, census 866→869, governedSites 288→304, regions 246→252, reach 596→623, codesChecked 565→606, refusalsJudged 549→602, untranslated 302→278, multiSiteCodes 64→69.
    - **Old battery, each measured here and on the base:**
      - `airun` ARM D1 (C-22 count 16→17) and D3 (C-22.17's site is observation-log's, not `airun.mjs`);
      - `rec165-production-principal` U2 (NO_SUCH_RUN now carries its code: R13's intended effect);
      - `civicos-ui/test/themes` (THEME_CHECKS count 10→14);
      - `d470` A3/A9 (item 7), `capturerequests` (item 3).
      - Improved: `machinefences-dec49` red → green.
      - Unchanged: 77 other suites that read these families (listed in the run below), including `suggest` 101/0.
11. **Generated artifacts**: `bio-plane/dist/bio-plane.bundled.mjs` and `newgroup/dist/newgroup.bundled.mjs` embed the catalogue, so both are stale. They are regenerated at the layer close (manifest §14).

## Tests and checks run

- My module has no `tests` path and no requirements. Layer tests: none named in `build/manifest.md`.
- **Every module suite** (`node --test bio-plane/test/m/*/*.test.mjs`): **1284 pass, 0 fail**. Each module's count is identical to the base (29 modules, compared one by one).
- **The 85 old-battery suites that name a family or code I changed**, on this branch and on the base: 79 unchanged (4 red on both: bounds, meaning-bounds, owed-controls, skilldoctrine/skillpack), 1 improved, and the reds in REPORT 10.
- **The DEC-49 guard**: REPORT 10.
- `node checks/format.mjs /home/user/bio`: `format: 69 modules, 64 requirements files; 0 failures`
- `node checks/architecture.mjs /home/user/bio legacy-checks`: `architecture: 1 product files, 0 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs /home/user/bio legacy-checks`: `coverage: 0 modules, 0 of 0 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs /home/user/bio legacy-checks tranche/T6`: `ownership: 2 files changed by legacy-checks between tranche/T6 and HEAD; 0 failures`

Size: test runs 340, module lines 14629

## QUESTION 2 (sent 2026-09-27, after reading BOB's ANSWER to QUESTION 1)

BOB's ANSWER (14:39, K162 on `tranche/T6` @ `81320207c2`) accepted QUESTION 1's readings as I first wrote them. It reached this session only after I had revised points 2 and 3 on evidence found while reading the families whole (the "Revised while working" paragraph above), and my COMPLETE (15:08) describes the revised work. **The pushed catalogue therefore differs from K162 in two places:**
- **(2)** The extract rows are `EXTRACT_PROPOSE_CHECKS` (C-104), not C-27. Their `where`s name regions, not whole functions. `NO_TARGET`, `NO_SUCH_BUNDLE` and `NO_SCOPE` have no row. Why:
  - `suggest.test.mjs` drives SUGGEST_CHECKS whole as the suggest endpoint's registry, and pins its three regions. C-27 rows there turned it red (99/2); with C-104 it is green.
  - The catalogue's REC-64 rule (ACT_SHAPE_CHECKS' header) names `NO_SUCH_BUNDLE` itself as a code a single `where` cannot claim.
  - A whole `extractPropose` would conscript those two row-less codes and the relayed refusals.
- **(3)** C-28.18 names `captureRequestRetry > is-capture-request-retry`, a region, because `capturerequests.test.mjs` pins C-28's rule that every `where` is a region. Everything else in (3) is as K162 says.

**Asked of BOB:** either a ruling that replaces K162 (2) and (3) with the revision, or a CHANGE telling me to conform to K162 as written. I will apply either at once. My recommendation is the revision, with run-productions minting its own codes for the three without a row.

## CHANGE of 15:13 UTC (BOB #48; K163)

- **The ANSWER to QUESTION 2:** K163 replaces K162 (2) and (3) with the revision. It accepts C-102–C-104; `NO_TARGET` and `NO_SUCH_BUNDLE` stay row-less, and run-productions R13 excepts them. `NO_SCOPE` becomes run-productions' own `EXTRACT_NO_SCOPE` (R12).
- **Merged `tranche/T6`** @ `9838979006` (merge `e32a9d5157`). Nothing I read changed except R12, R13 and the rulings.
- **Applied:** `EXTRACT_NO_SCOPE` **C-104.12**, `where` `src/store.mjs extractProposals > is-extract-scope` (a region run-productions marks when it moves the code). Its sentence names only this read's condition. The C-104 header now states K163. REPORT 2 lists the region.
- **Re-run:**
  - Every module suite: **1284 pass, 0 fail**.
  - The 85 old-battery suites: the same set red as before the CHANGE (REPORT 10, plus the 4 reds shared with the base), all others green.
  - The DEC-49 guard: **104 failures** (103 + the unmarked `is-extract-scope`). REPORT 10's figures are updated to its print: rows 582, census 869, reach 623, governedSites 304.
  - Checks: below.
- Checks (civicos-process `main` @ `5d77655`), after the merge:
  - `architecture: 1 product files, 0 relative imports (0 naming no tracked file, not judged); 0 failures`
  - `coverage: 0 modules, 0 of 0 live requirement ids named by a test; 0 failures`
  - `ownership: 2 files changed by legacy-checks between tranche/T6 and HEAD; 0 failures`
  - `format: 69 modules, 64 requirements files; 1 failure`. The failure is `build/plan/next.md: entry ids given twice under one module: N118`. It is in BOB's file on `tranche/T6` @ `9838979006` and fails the same with my changes stashed, so it is **REPORT 12, for BOB**.
