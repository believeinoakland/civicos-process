# T6 · promotion — job record

**Session** PROMOTION #5, `session_01427pQXmQ6fgyFr7aVbmuBL`, depth 2 (parent BOB #48), on `job/T6/promotion` (from `tranche/T6` @ `dddfafdfa9`; merged `0ead6e17ad` at the start and `892a7450cb` before completing, neither touching a file this job reads except the plan's Status and Jobs lines). Process: civicos-process `main` @ `5d77655`, `roles/JOB.md`, mechanics §6, §13, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T6` (BOB #48, `session_01E4YZNiY3MRoRn59Wr5NnLW`).

**Status** · COMPLETE, 2026-09-27. Every entry applied. Nothing deferred. No QUESTION was needed: where a requirement left a detail open, the reading taken is under "Decisions" for BOB to record if he wishes.

**Read whole:** `build/requirements/promotion.md`; the public parts of record-core, membership and signatures, and legacy-checks' contract in `modules.json` (it has no requirements file); `build/layers.md`; the module's code (`src/gate.mjs`, `src/promotion/*.mjs`) and tests (`test/m/promotion/*`); my entries in `build/plan/current.md` and LEGACY-CHECKS #2's record (REPORTs 6 and 7).

## Entries applied

- **N62 (`onReopened`, R46, K157).** `promotion.onReopened(module, fn)`, beside `onCommitted`. After an accepted `reopen` has committed, and never for a refused one, each listener is called once, in the modules' total order, with `{target, from, at, author, viewer}`. A listener's object answer joins the reply under its module id and never replaces one of reopen's own keys; `null`, `undefined` or a non-object adds nothing. A listener that throws, rejects or answers with a promise adds nothing and changes neither the reply nor the record. A second registration by one module is `LISTENER_DECLARED`, and one naming no module or no function is `LISTENER_MALFORMED`. Both registrations now go through one private `#listen`, so this module mints `LISTENER_DECLARED` at one site.
  - **legacy-store rewired** (mechanics §12.2): its `reopen` no longer wraps promotion's answer. It now delegates in one line, and the constructor registers the `reevaluation` arm with `promotionOf(ctx).onReopened("reevaluation", …)`, answering the `{source: "reopened", since, raised}` it answered before. The op's reply is unchanged byte for byte.
  - The store's 58-line REC-31 comment on reopening moved to promotion's `reopen`, the code it explains, with one clause corrected: `REOPENABLE_FROM` is exported by this module, not imported by the store.
  - Legacy-store net change: 3 lines added, 59 removed. The three added lines are listed under the ownership check below.
- **N118, promotion's share.** Every `PROMOTION_CHECKS` row now carries a `where`. There are twelve: C-86.5–C-86.14, C-1.1 `BUNDLE_ID_DISAGREES` and C-2.1 `BUNDLE_MD_UNREADABLE`. Each `where` names a marked region of `#promote`: `is-promote-request-named` (the four codes for what a request must name, C-86.10–13), `is-promote-readable`, `is-promoted-type-unstated`, `is-promoted-field-unstated`, `is-revision-redates-creation`, `is-revision-regroups-bundle`, `is-promote-bundle-id`, `is-promoted-dates-disagree` and `is-state-move-undeclared`. The file's header states the rule. The guard's twelve failures for these rows are cleared.
- **Forwarded: LEGACY-CHECKS #2 REPORT 7, `CATALOG_VERSION` (R34).** Moved 1.35.0 → **1.36.0**, MINOR: 31 arrivals, no departures, none changed. The 71 moved `where`s change no condition, code or translation. The census comes from the d470 suite's own print on this tree: **550 checks**, sha256 `d35d735ccace42ab30a04939c19caa764e252f3e28d50b7b213bfd48d9d62c05`, behaviour source `66baec44ad8ce11923787ac18b567062257490ff00d7fd699a6acb426693bc5c`. The note is in `gate.mjs`. The suite's re-pin is legacy-tests' (REPORT 3).
- **Forwarded: LEGACY-CHECKS #2 REPORT 6, the rows promotion's codes owe.** These are legacy-checks' to add, so they are in REPORT 1 below.
- **A flaw of my own that the guard showed, fixed.** `FACT_UNAVAILABLE` (C-102.4) was minted at two literal sites, `fact` and `#fact` (arm G, one code at one site). Both now go through one helper, `factUnavailable`. The answers are unchanged.

## Decisions made in the job (for BOB to record if he wishes)

1. **legacy-store registers the `reevaluation` arm under the module id `reevaluation`**, not `legacy-store`, because R46 puts a listener's answer under its module id. The op's reply therefore keeps its `reevaluation` key. When `reevaluation` is extracted (layer 7), it registers its own arm under that id and the store's line goes. Until the store's line is gone, R46's `LISTENER_DECLARED` refuses the second registration, which makes the handover loud.
2. **"After an accepted reopen has committed."** Listeners run once `reopen`'s promotion has returned accepted from its own `record.transact`. R46's answer must join `reopen`'s synchronous reply, so unlike R45 it cannot wait for a microtask. Today `reopen`'s only caller is the store's op handler (`store.mjs` `reopen`, reached from the op table), which runs in no outer transaction, so "returned accepted" and "committed" are the same moment. If a later caller ever reopens inside its own transaction, the listener would run before that outer commit. Such a caller should be told.
3. **A promise answer adds nothing.** R46 says a listener that "throws or rejects adds nothing". A promise that resolves settles after the reply has gone, so it is also treated as adding nothing, and its rejection is swallowed. `reevaluation` R7's `{raised}` is synchronous, as the store's `#reevalRaisedBy` is.

## Deferred

None.

## Found in other modules (REPORT)

1. **legacy-checks** (LEGACY-CHECKS #2 REPORT 6, re-confirmed on this tree): promotion's registration codes with no catalogue row are `FACT_MALFORMED`, `STEP_DECLARED`, `STEP_MODULE_UNNAMED` and `LISTENER_MALFORMED`. `LISTENER_DECLARED` has a row, C-100's in `PROGRESSION_CHECKS`, but it is minted at 12 sites in 12 modules, one of them promotion's, for one condition: "this module has already registered". The guard's arm G fails it. That is a structural call, not a sentence: either one `REGISTRATION_CHECKS` row, with the code declared in `MULTI_SITE_CLOSED` as one condition, or a code per registry. It is legacy-checks' and legacy-tests' to settle, with progressions' N118 share. `STEP_DECLARED` is also in arm F4's multi-site list.
2. **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` (and its `.bundle.json`), because `store.mjs`, `src/promotion/index.mjs`, `src/promotion/checks.mjs` and `src/gate.mjs` changed. `fleetbundles.test.mjs` fails only on the bio-plane arm ("no staleness"). `newgroup-bundle-fresh` is unaffected (1/0). BOB regenerates it at the layer close (manifest §14).
3. **legacy-tests (T6-14, or wherever its next job lands under K165):**
   - **d470:** record `"1.36.0": { count: 550, digest: "d35d735c…9d62c05", source: "66baec44…693bc5c" }` (full values above) in `d470-catalog-census.test.mjs`, and its A5 literal if one pins the version. A3 and A9 are red on the base and here until then (5 failing lines on both).
   - **The DEC-49 guard** (`civicos-ui/check-refusal-codes.mjs`): **104 failures on the base, 91 here.** Cleared: the 12 `PROMOTION_CHECKS` `where` failures and `FACT_UNAVAILABLE`'s arm G failure. No failure is new. The ratchet figures my change moves, to re-pin from its print:
     - regions 252 → 261; governedSites 304 → 313; codesChecked 606 → 617; refusalsJudged 602 → 613; regionLines 4574 → 4666; multiSiteCodes 69 → 68.
     - outcomeReturns 183 → 182: `fact()`'s unprovided answer is now a call to the one helper, which the return reader does not read as an outcome.
4. **reevaluation (layer 7, T6-12 or its successor):** register `onReopened("reevaluation", ({target, viewer}) => ({raised: …}))` (its R7) and remove the store's registration line (`store.mjs` ~795). The store answers `{source: "reopened", since, raised}` today. If reevaluation R7's `{raised}` is meant to drop `source` and `since`, that is a reply-shape change for its job to state.

## Tests and checks run

- **Module tests** (`node --test bio-plane/test/m/promotion/*.test.mjs`): **60 pass, 0 fail.** New tests:
  - three for R46 (`reopen.test.mjs`): order, arguments and the committed state; the answer joining under the module id; never for any refusal; a throwing, rejecting or late listener);
  - one for R20/N118 (`promote.test.mjs`): every `PROMOTION_CHECKS` row's check, translation and `where` form, each code driven at the interface.
  - Every live id, R1–R46, is named by a test.
- **Every module suite** (`node --test bio-plane/test/m/*/*.test.mjs`): **1282 pass, 0 fail** (the base: 1278/0; the four new tests are the difference).
- **Old-battery suites that touch reopen, reevaluation, the gate version or the bundles** (55 files), each run here and on `origin/tranche/T6`: identical results, except `fleetbundles` (REPORT 2).
  - Red on both, each with the same count of failing lines: `affordances`, `airun`, `d311-roster-affordances`, `project-sight`, `rung-ladder`, `skillpack` and `d470-catalog-census`.
  - `reopen`, `reevaluation`, `rec118-reeval-earned`, `case-opened`, `ratify`, `conclude` and the UI's `reopened-finding` all pass.
- **DEC-49 guard:** REPORT 3.
- Checks (civicos-process `main` @ `5d77655`), re-run after the final merge of `tranche/T6` (which touched only `build/`; ownership now counts 7 files, this record included, 0 failures):
  - `format: 69 modules, 64 requirements files; 0 failures`
  - `architecture: 16 product files, 49 relative imports (0 naming no tracked file, not judged); 0 failures`
  - `coverage: 1 modules, 46 of 46 live requirement ids named by a test; 0 failures`
  - `ownership: 6 files changed by promotion between tranche/T6 and HEAD; legacy-checks: 0 line(s) added, 0 removed; legacy-store: 3 line(s) added, 59 removed; 0 failures`. The three lines it lists for BOB:
    - `bio-plane/src/store.mjs:795` `/* promotion R46: reevaluation's answer to a reopening (REC-17), registered in its name until reevaluation is extracted. */`
    - `bio-plane/src/store.mjs:796` `promotionOf(ctx).onReopened("reevaluation", ({ target, viewer, at }) => ({ source: "reopened", since: at, raised: this.#reevalRaisedBy(target, viewer) }));`
    - `bio-plane/src/store.mjs:5867` `return promotionOf(this.ctx).reopen({ target, reason, viewer, author });`

Size: test runs 376, module lines 2170
