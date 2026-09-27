# Job record: calibration, T5

**Status** · COMPLETE, 2026-09-27. CALIBRATION #1, session `session_01DT2wYuh5pHNvHTYzS5psTF`, branch `job/T5/calibration` (cut from `tranche/T5`; `tranche/T5` @ 1e75fac6b2 merged in). Process: civicos-process @ 7549c0b, `roles/JOB.md`. Entry: T5-1 (extract per map and requirements, K73, K74; D-587, D-668), and every requirement marked *not yet met* in `build/requirements/calibration.md` (R4, R5, R8, R10, R11, R12, R16).

**Read whole:** `roles/JOB.md`; `PROCESS-MECHANICS.md`; `build/manifest.md`; `build/requirements/calibration.md`; `build/extraction/calibration.md`; `build/layers.md`; the public parts of `record-core` (and `legacy-checks`, which has no requirements file); my entry in `build/plan/current.md`; rulings K23, K57, K61, K64, K73, K74; `bio-plane/src/calibration.mjs`; the store's calibration region, its import notes, the `calibration-reprobe` consumer, the four dispatch arms, `#calDriftFor`/`calibrationDrift` and the frontier's use of it; the three tables in `schema.mjs`; C-42 in `bio-checks.mjs`; D-587 and D-668 in the old plan, and D-668's built work on `land/worker/D-668` (5887b36df7, its calibration share); promotion's T3 record and its factory and registration code, membership's factory and `membershipOps`, record-core's `recordOf`, `transact` and `declarePurge`; `extraction`'s R6 and R38–R40, which use this module.

## Questions to BOB

Sent 2026-09-27 as one `QUESTION`. I carry on with every entry on the best reading stated with each.

- **Q1 · `driftObligations` sits in `calibration.mjs`, which only I may edit, and it is extraction's (its R38).** The store's `#calDriftFor` imports it from here until EXTRACTION #1 moves that method, and extraction cannot remove it from my file. **Best reading:** I leave `driftObligations` (and its header) in `calibration.mjs`, unchanged and outside my Provides, until extraction has its own copy and the store no longer imports it from here; then a `CHANGE` from you re-opens this job and I delete it (a removal). Everything else of the map is done now.
- **Q2 · R5: where `measured_by` comes from, and the window until the control plane stamps it.** **Best reading:** `calibrationRecord(pkg, {principal})` takes the stamp as its second argument and ignores any `measured_by` in `pkg`; an empty stamp is refused `CAL_UNATTRIBUTED` (C-42.8, D-668's row). The dispatch arm reads the principal from the control plane's existing `identity` stamp, which `index.mjs` deletes from every request before stamping, so a caller can never supply it; `index.mjs` stamps `identity` only for `IDENTITY_READS` and `POSITIONAL_ACTS` today, so until `calibrate` joins those (one line in `legacy-index`, T5-11's routes; D-587's ruling: a session stamps its member, a machine credential `class:<cls>`, an `ai` credential its principal) every `op=calibrate` through the Worker is refused `CAL_UNATTRIBUTED`. That fails closed, which R5 asks for; it is a REPORT for `legacy-index`. Rows written before the stamp keep the caller's string.

## Answers from BOB

- **Q1, Q2** · ANSWER 06:50 UTC (K136, `tranche/T5` @ 9421d1e8de, merged here): both readings adopted. `driftObligations` is deleted at BOB's CHANGE once extraction holds its own copy; legacy-index's `identity` stamp for `calibrate` is written into T5-11, so it needs no REPORT.

## Provides final (for BOB's early merge, mechanics §4)

At the commit that carries this line, every service `extraction` takes from this module is final, reached as `calibrationOf(ctx)` from `bio-plane/src/calibration/index.mjs` (K61): `liveCalibration({engine, version})` (R10), `worseSupersessions({supersededId, limit})` (R11), `onCalibration(module, fn)` (R12, listeners run in the order given as `calibrationOf(ctx, {order})`, unknown modules last), and `drifted`/`DRIFT` (R2), re-exported there beside the other pure rules. Until extraction registers its own listener, `legacy-store` registers one (`"legacy-store"`) that answers `#calDriftFor(supersedes)` for a `worse` verdict, so `op=calibrate`'s echo is unchanged; extraction removes that registration with `#calDriftFor`. `#calDriftFor` already reads its supersessions through R11. Module suite 41/41; every `test/m/*` suite green on this branch (873 tests, 872 pass, 1 todo not mine).

## Entries applied

- **T5-1 · extraction per the map and requirements (K73, K74).** `bio-plane/src/calibration/index.mjs` holds the store half, reached as `calibrationOf(ctx, {record, order, now})` (K61): `calibrationRecord` (R4, R5), `calibrations` (R6), `calibrationSignalRecord` (R7), `calibrationSubjectRegister` (R8), `calibrationDue`/`calibrationWake(now, graceMs)`/`calibrationTick` (R9, the grace from the caller, K74), and the new `liveCalibration` (R10), `worseSupersessions` (R11) and `onCalibration` (R12). `calibrationOps(c, url, body)` answers `calibrations`, `calibrate`, `calibrationsubject` and `calibrationsignal`, spread into the store's op map as membership's and capture's are; `calibrationdrift` stays the store's until extraction takes it. `calibration/schema.mjs` holds the three tables verbatim, interpolated by `schema.mjs` where they stood; `calibration/checks.mjs` holds C-42 (K64's precedent), removed from `bio-checks.mjs` (87 lines, none added). `calibration.mjs` keeps the pure rules (R1–R3) and imports its rows from the module.
- **Rewired in `legacy-store`:** the imports; the scheduler's `calibration-reprobe` consumer calls R9 with `Store.SCHED_GRACE_MS`; `#calDriftFor` (extraction's) reads its supersessions through R11 (map §3); legacy-store registers the obligation listener (`"legacy-store"`, answering `#calDriftFor(supersedes)` on a `worse` verdict) so `op=calibrate`'s echo is unchanged until extraction registers its own; the four dispatch arms and the whole region (`calibrationSubjects` … `#calibrationTick`, less `#calDriftFor` and `calibrationDrift`) removed.
- **R4, R12 (N41):** the obligations are the listeners', run in the modules' order inside the one `record-core.transact`; null with none registered; a listener that throws or answers anything but a list fails the whole record.
- **R5 (D-587, D-668, K136):** `measured_by` is the control plane's `identity` stamp, passed as `calibrationRecord(pkg, {principal})`; the body's is never read; none is `CAL_UNATTRIBUTED` (C-42.8).
- **R8 (D-668):** `CAL_SUBJECT_UNNAMED` (C-42.9) and `CAL_SUBJECT_NO_PROBE` (C-42.10), in their own DEC-49 region. D-668's built work (`land/worker/D-668` 5887b36df7) judged against R5, R8, R14: its three rows and the two code changes kept, re-sited; the rest of that branch is other modules'.
- **R10, R11 (N41):** as stated; R11 is one bounded join, so an unreadable successor drops out and `truncated` counts only readable pairs.
- **R16 (K23):** the three tables declared to purge as exempt on first reaching the module; the store reaches it in its constructor.
- **Flaws fixed in moving:** the module's clock is its own (`deps.now`), never the body's `nowMs`, so a caller can no longer set a calibration's `at_ms` or a subject's `last_probe_ms` to push its next probe out; two signals for one engine in one millisecond are two rows (was `INSERT OR REPLACE`, where a later signal could replace an earlier one and push its probe out); the next probe reads only the earliest unconsumed signal (one row); the subjects list and the tick's list are bounded with `subjects_truncated`/`truncated` (R15); `calibrations` orders equal instants by the id's number, not its text; `null` arguments to the reads answer rather than throw.

## CHANGE K137 (re-opened 07:05 UTC; `tranche/T5` @ d027f1aaf9 merged)

- **R12 as reworded:** a listener answers a list or `{obligations, truncated}`; R4's answer gains `obligations_truncated` (true when any listener said `truncated`, else false; null with the others when none is registered). A listener's answer of any other shape (including `obligations` not a list, or `truncated` not a boolean) fails the whole record, as a throw does.
- **legacy-store's interim listener** now answers `{obligations, truncated}` from `#calDriftFor`'s own `truncated`, so `op=calibrate`'s echo carries the cut (my REPORT 3). Ownership against the tranche: legacy-store 3 added, 4 removed.

```
ADDED bio-plane/src/store.mjs:855  /* calibration (K61, R16, R12): legacy-store derives each record's obligations until extraction registers its own. */
ADDED bio-plane/src/store.mjs:856  calibrationOf(ctx).onCalibration("legacy-store", ({ supersedes, drift }) => !drift.raises_obligation ? []
ADDED bio-plane/src/store.mjs:857  : ((obligations) => ({ obligations, truncated: !!obligations.truncated }))(this.#calDriftFor(supersedes)));
```

- Tests: `node --test bio-plane/test/m/calibration/` 42/42 (R12 gains the truncation arm and five more malformed answers); `node --test bio-plane/test/m/` 874, 873 pass, 1 todo not mine; the old calibration suite through the Worker with a scratch `identity` stamp (reverted) 107/110, unchanged (D-668's three arms). format, architecture, coverage 17/17, ownership: 0 failures.
- REPORTs 1, 2 and 4 routed by BOB (T5-12, T6, the layer close); nothing new found.

## CHANGE K136 (re-opened 07:24 UTC; `tranche/T5` @ f7854f1b6b merged, extraction merged there)

- `driftObligations` and its section deleted from `calibration.mjs` (a removal; rule 3 in the header now names extraction as the obligation's owner). Nothing in product code imports it from here: the store and extraction use `src/extraction/drift.mjs`; the old `test/calibration.test.mjs` still imports it from here, one more line for legacy-tests' T5-12 (it already fails on its `CALIBRATION_CHECKS` import). `newgroup/src/release.mjs` holds an old embedded copy as a string, regenerated with the bundles.
- Tests: `node --test bio-plane/test/m/calibration/ bio-plane/test/m/extraction/` 100/100; `node --test bio-plane/test/m/` 932, 931 pass, 1 todo not mine. format, architecture, coverage 17/17, ownership (only `calibration.mjs` changed): 0 failures.

## Deferred

- None.

## Found in other modules (REPORT)

1. **legacy-tests.** The old battery against `tranche/T5` @ 1e75fac6b2, 26 suites that touch calibration, both trees: red here and green there, `calibration`, `bounds`, `derivation-bounds`, `rec155-session-routes`, `reextract`; `meaning-bounds` and `d470-catalog-census` are red on both with the same failures. Diagnosed:
   - **The K136 window** (`calibrate` not yet stamped by `legacy-index`): `rec155-session-routes` (calibrate answers `CAL_UNATTRIBUTED`), `reextract` (its calibration is refused, so no chain names one), and `bounds`' calibrate fixture. With a scratch one-line stamp (reverted) `rec155-session-routes` and `reextract` pass whole, and `calibration` passes 107/110.
   - **D-668's intended codes:** `calibration.test.mjs`' three arms (unattributed is `CAL_UNATTRIBUTED`; a subject with no probe is `CAL_SUBJECT_NO_PROBE`; the family now has ten rows), and it imports `CALIBRATION_CHECKS` from `bio-checks.mjs`, which is now `src/calibration/index.mjs`' export. `calibration.control.mjs` anchors on `src/calibration.mjs` and the store's region.
   - **Source-anchored on code that moved:** `bounds` (the walk of `store.mjs` finds 46 capped ops where the pin drove 47: `op=calibrations`' cap is in `src/calibration/index.mjs`); `derivation-bounds` (the census floor fell with the calibration reads, and `#calDriftFor` no longer reads `calibrations` itself). `civicos-ui/check-refusal-codes.mjs` reads C-42 from the catalogue. `d470-catalog-census` counts the catalogue, which lost C-42.1–C-42.7.
2. **promotion: `CATALOG_VERSION`** (`gate.mjs`). Seven departures from the catalogue (C-42.1–C-42.7, now calibration's rows with their ids and translations unchanged; C-42.8–C-42.10 arrive in calibration's family, never in the catalogue). The gate never ran C-42, so what a ratification is judged by is unchanged; 1.34.0's own precedent (PROVENANCE #1's departures) moved the stamp MINOR.
3. **extraction: R40's `truncated` has no carrier.** R40 says the listener returns its obligations "with `truncated` carried", but R12 answers their concatenation, a plain list; the store's interim listener loses it the same way. A requirement for BOB: say where a listener's truncation goes (for example an `obligations_truncated` flag on R4's answer). Also: extraction will meet my rewire of `#calDriftFor`'s first half (R11) and must remove the `"legacy-store"` listener registration when it moves `#calDriftFor`.
4. **Generated artifacts (manifest §14):** `bio-plane/dist/bio-plane.bundled.mjs` (store, schema, catalogue, calibration) and `newgroup/dist/newgroup.bundled.mjs` (embeds the catalogue) are stale; regenerate at the layer close.

## Tests and checks run

- `node --test bio-plane/test/m/calibration/` · tests 41, pass 41, fail 0.
- Layer tests: none named in `build/manifest.md`. Users of a changed service: `extraction` (not yet built against it; the store half it replaces is exercised by the old suites above), `scheduler` (the store's consumer; `scheduler.test.mjs` green on both trees).
- `node --test bio-plane/test/m/` · tests 873, pass 872, fail 0, todo 1 (another module's R37).
- The old battery, 26 suites, both trees, as above.
- `checks/format.mjs` · 69 modules, 64 requirements files; 0 failures.
- `checks/architecture.mjs calibration` · 7 product files, 16 relative imports; 0 failures.
- `checks/coverage.mjs calibration` · 17 of 17 live requirement ids named by a test; 0 failures.
- `checks/ownership.mjs calibration tranche/T5` · legacy-checks 0 added, 87 removed; legacy-store 19 added, 570 removed; 0 failures. The `ADDED` lines, for BOB's review:

```
ADDED bio-plane/src/schema.mjs:4  import { CALIBRATION_SCHEMA } from "./calibration/schema.mjs";
ADDED bio-plane/src/schema.mjs:2468  ${CALIBRATION_SCHEMA}
ADDED bio-plane/src/store.mjs:432  import { driftObligations } from "./calibration.mjs";
ADDED bio-plane/src/store.mjs:433  import { calibrationOf, calibrationOps } from "./calibration/index.mjs";
ADDED bio-plane/src/store.mjs:855  /* calibration (K61): declares its tables exempt from purge (R16); legacy-store derives each record's obligations
ADDED bio-plane/src/store.mjs:856  (calibration R12) until extraction, which owns the drift join, registers its own. */
ADDED bio-plane/src/store.mjs:857  calibrationOf(ctx).onCalibration("legacy-store", ({ supersedes, drift }) =>
ADDED bio-plane/src/store.mjs:858  drift.raises_obligation ? this.#calDriftFor(supersedes) : []);
ADDED bio-plane/src/store.mjs:3685  due:  (now) => calibrationOf(this.ctx).calibrationDue(now) > 0 ? now : null,
ADDED bio-plane/src/store.mjs:3686  wake: (now) => calibrationOf(this.ctx).calibrationWake(now, Store.SCHED_GRACE_MS),
ADDED bio-plane/src/store.mjs:3687  tick: (now) => ({ calibration: calibrationOf(this.ctx).calibrationTick(now) }) },
ADDED bio-plane/src/store.mjs:22204  *  WORSE? The supersessions are calibration's (`worseSupersessions`, its R11)
ADDED bio-plane/src/store.mjs:22205  *  and the join is one indexed read on `reading_text_source.calibrations`; the verdict comes from
ADDED bio-plane/src/store.mjs:22217  const supers = calibrationOf(this.ctx)
ADDED bio-plane/src/store.mjs:22218  .worseSupersessions({ supersededId, limit: Store.TEXT_SOURCE_LIMIT_MAX }).supersessions;
ADDED bio-plane/src/store.mjs:44980  ...calibrationOps(calibrationOf(this.ctx), url, body),
ADDED bio-plane/src/store.mjs:45170  /* CPDF-13 / D-253: `calibrationdrift` is a READ, and takes the viewer
ADDED bio-plane/src/store.mjs:45171  stamp for REC-30's reason exactly — its rows NAME the bundles a capture
ADDED bio-plane/src/store.mjs:45172  is filed in. The other four calibration ops are `calibrationOps`'. */
```

Size: test runs 73, module lines 1063
