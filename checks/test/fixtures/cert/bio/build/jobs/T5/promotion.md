# T5 · promotion — job record

**Session** PROMOTION #3, `session_01CBqvRerSWp68oj6TfvGgfi`, on `job/T5/promotion` (from `tranche/T5`, merged up to `e717124b06`). Process: civicos-process @ `7549c0b`, `roles/JOB.md`, mechanics §6, §12.2, §13, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T5`.

**Status** · COMPLETE, 2026-09-27. Every entry applied: N56 (with D-592 answered by K132), R58, N73's share, N86, N63's share; R59 (K130) with record-core's. No open question, nothing of my own deferred.

**Read whole:** `roles/JOB.md`, PROCESS-MECHANICS.md, `build/manifest.md`, `build/requirements/promotion.md`, the public parts of `record-core`, `membership` and `signatures` (legacy-checks has no requirements file), `build/layers.md`, my entries in `build/plan/current.md` (and N56, N63, N86 in full in `next.md` history), K83, K90, K96, K126–K128, the T3 and T4 promotion records, every file under `bio-plane/src/promotion/`, `bio-plane/src/gate.mjs` and every test under `bio-plane/test/m/promotion/`. D-592's row (old-plan index) and its source (`app.html` UI-109 note on the snapshot branch).

**Baseline:** `node --test test/m/promotion/` on `e717124b06`: tests 50, pass 50, fail 0. Coverage: 44 of 45 (R45 unnamed).

## Questions to BOB

- **Q1 · N56: `fact(name, ...args)` is not stated in Provides.** R40 states only `registerFact`, and how an act that needs an unprovided fact is refused. A public read needs its answer shape, and a fact's value may itself be `false` or `null`, so a bare value could not say "unavailable". Best reading, which I am building: `fact(name, ...args) → {ok: true, fact, value} | {ok: false, reason: "FACT_UNAVAILABLE", fact, detail}`; a provider that throws answers `{ok: false, reason: "FACT_FAILED", fact, detail}`; it never throws and writes nothing. Tested under R40. Please fold it into R40's wording (or tell me otherwise).
- **Q2 · D-592 is not `reopen`'s.** The row (SCHEDULER #21, 2026-09-25) is about a finding *reopened by a revision of a declared flow*: `op=queue`'s `prior_disposition` names who decided, and nothing publishes who revised the flow. Its own scope line: "`proposalsFeed` publishes, from `progression_def_versions`, the revising version's number, `declared_by` and `at` beside `prior_disposition`". That is the queue's feed over progressions' definition versions, not promotion's `reopen` (K83 (4) re-targeted it on the word "reopen"). Promotion's `reopen` already records and answers who reopened (R25: the `state_history` entry's `author`, the Session Log line, the answer's `author`). Best reading: nothing to build here; re-target D-592 to `queue` (its `op=queue` feed, K91) with `progressions` providing the definition version's author and time.

## Answers and changes from BOB

- **Q1, Q2** · ANSWER by K132 (merged @ `406681de0b`): R40 states `fact` as built; D-592 is not promotion's (inquiry's R19, T6).
- **CHANGE 05:52 UTC** · membership's R77 merged into `tranche/T5`; merged here @ `406681de0b`. Applied (below, N73).
- **ANSWER 06:01 UTC** (K133): the four reports handled; the stale marks cleared. **CHANGE 06:02 UTC** (R58, N51/R59): already applied at `7dafc506f6` on record-core's early merge. Merged `tranche/T5` @ `4cab05f8ab` here (`d4db2e0728`): record-core's R59 now calls `check(input, context)` with the context as a second argument (RECORD-CORE #2 @ `1a7fa3efa5`), so promotion's registration reads the release registry from `context`; the test now fails on the one-argument form.
- **record-core merged early** (`fd80cd117e`, Provides final; its CHANGE message had not yet arrived, so I acted on the tranche's state, mechanics §13): merged here @ `6b2ce97ddc`. R58 and R59 applied (below).

## Decisions made in the module (P17: recorded, not asked)

- **R45 without a record-core hook.** `promote` is often called inside a caller's transaction, which record-core joins (R32), so `promote` cannot tell when the real commit happens. Record-core's `transact` is synchronous (`transactionSync`), so the outermost transaction has either committed or rolled back before any microtask runs. Promotion therefore queues an accepted promotion's notice and delivers it in a microtask, first confirming that the promotion's own manifest entry (its snap key, base and `bundle.md` digest) is held: a rolled-back promotion has none, so it is never announced. No record-core service is needed.
- **The arm moves to a listener (R45's Suggestion).** The store's `promote` route armed the scheduler itself after `op=promote` (a monitored bundle; bias debt pending). It becomes `legacy-store`'s registered listener on `onCommitted`, so every committed promotion arms it, not only those through that one route.

## Entries applied

- **N86** · `CATALOG_VERSION` 1.33.0 → **1.34.0** (MINOR, `src/gate.mjs`, with its note): four departures (C-18.1, C-18.3, C-18.4, C-18.9, moved to `provenance` by PROVENANCE #1 after 1.33.0 was minted), no arrivals. The plane still judges a ratification by them: the store wraps the gate with `provenance.withRegisterChecks`. The d470 suite's own print on this tree: **count 568, sha256 `4f93c5f65a5d7444ca59f172ae598905f3c440fc9c5d0b222431335edc003f14`, source `4fa025acf0d59e03324c294d5225adea40c826afaa031b1d8bb71dd6c76fff31`**. `GATE_VERSION` is `plane-gate/1.0 (bio-checks 1.34.0)`.
- **N56** · `fact(name, ...args)` on Q1's reading: `{ok: true, fact, value}`, or `FACT_UNAVAILABLE` (no value key, so an unprovided fact is never read as false), or `FACT_FAILED` for a provider that throws. Tested under R40.
- **N56 · D-592** · nothing to build in promotion (Q2): `reopen` already records and answers who reopened (R25).
- **N63 (promotion's share) · R45** · `onCommitted(module, fn)`: registered once per module (`LISTENER_DECLARED`), sorted in the modules' total order; each accepted, written promotion (never a refusal, never `wrote: false`) is announced once, after the transaction it committed in has committed, with `{bundleId, bundleSha, type, replay}`; a listener that throws or rejects is contained. Mechanism in "Decisions" above. `legacy-store`'s arm (REC-26's monitored bundle, D-86's bias debt) moved from the `promote` route into its registered listener; the route now only delegates. So every committed promotion arms it (reopen, fork and internal writes included), where before only `op=promote` did: arming only schedules, and the scheduler reconciles.
- **N73 (promotion's share)** · `promote` (R20) and `forkProject` (R42) answer a caller at existence with `membership.existenceAct` (R77); promotion's own copy of C-70.1 is gone, so it is minted only in membership. The answer's keys are unchanged (`reason`, `code`, `check`, `translation`, `detail`, `project`, `name`); its `detail` is now membership's words. The tests assert the answer is membership's own, byte for byte. `machinefences-dec49` 87/0, as on the base; `project-discoverable` and `project-join-request` green; membership's suite 77/0.
- **R58** · promotion's own `fileDigestOf`, `inlineBytesOf` and `EMPTY_STRING_SHA` are gone (and `history.mjs`'s second copy of the marker); the door's digest and size checks (R5, R6), the idempotence comparison (R4), a creation's base (R3) and the two rewritten documents (a minted project id, a stamped group) all use record-core's, so the door and the census compute one digest. `EMPTY_STRING_SHA` is no longer exported by promotion (nothing imported it). `rec175-digest`, `rec178-bytes`, record-core's own suite green.
- **R59 (K130)** · `recordAudit`'s second pass (re-running the catalogue on a bundle the moved checks found in error) is gone: promotion registers C-4.2, C-17.2, C-18.8 and C-20.1 once with record-core's audit when it is reached, with the caller's release registry from the audit's context (R59's second argument), and `recordAudit` is now record-core's `auditPass` after that registration (kept by name, so `legacy-store` and `provenance` call it unchanged). Test: "R30, R32: the audit runs the moved checks too". `audit`, `audit-inheritance`, provenance's suite green.
- **The *not yet met* marks** on R11–R15, R17 and R30–R32 in the requirements' header and body are stale: all were met and tested in T3 (PROMOTION #1), and every one is green here. R45 is met now. For BOB to clear.

## Deferred

- Nothing of this module's own.

## Found in other modules (REPORT)

1. **record-core, R32 (nested transactions):** `transact` at depth > 0 runs `fn` and returns its answer, so a refusal returned by an inner call is not rolled back until (unless) the outer call also refuses. R32 says a refusal rolls back every row written inside `fn`. For promotion this matters where a refusal follows a write: a project creation mints its id (`mintOpaqueId`, R7) before `NAME_TAKEN` and the later checks, and a registered projection may refuse after `commit`. Called inside a caller's transaction that then commits, those rows stay (promotion R2 not met in that case). A savepoint per nested call (the test double does this) would meet it.
2. **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` embeds `src/gate.mjs`, `src/promotion/index.mjs` and `src/store.mjs` (still 1.33.0). For the layer close (manifest §14).
3. **legacy-tests** (T5-12): `d470-catalog-census` A3 and A9 (11 pass, 2 fail here, as on the base): the row to add is `"1.34.0": { count: 568, digest: "4f93c5f6…3f14", changed: [], source: "4fa025ac…ff31" }` (full figures above), and A5's literal `1.33.0` → `1.34.0`.

## Tests and checks run (on the merged branch, `tranche/T5` @ `4cab05f8ab` merged)

- My module: `node --test bio-plane/test/m/promotion/`: `tests 55, pass 55, fail 0` (baseline 50/50; five new: R40's `fact`, three R45, the audit registration under R30/R32).
- Layer tests: none named in `build/manifest.md`. `onCommitted` and `fact` are additions and no existing service's answer changed; the extracted users and providers' suites, run anyway: record-core 46/0, membership 77/0, provenance 54/0.
- Old-battery suites that drive `promote` or the arm, green on this branch (and those that touch the arm, green on the base too): d86-bias-debt, monitor-cadence, monitor-assess, monitor-address, scheduler, bias, rec207-bias-debt-settle, projection, airun, drive, run-conditions, ratify, audit, audit-inheritance, rec178-bytes, project-discoverable, project-join-request, machinefences-dec49 (87/0), rec176-snapkey, rec175-digest, d484-refusal-translation, machine-attest, fence-e2e, refusal-wire, d168-retired-cite, rec173-migration-replay, rec-183-reinstate-retired, store.
- `node checks/format.mjs /home/user/bio`: `format: 69 modules, 64 requirements files; 0 failures`
- `node checks/architecture.mjs /home/user/bio promotion`: `architecture: 16 product files, 47 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs /home/user/bio promotion`: `coverage: 1 modules, 45 of 45 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs /home/user/bio promotion tranche/T5`: `ownership: 10 files changed by promotion between tranche/T5 and HEAD; legacy-checks: 0 line(s) added, 0 removed; legacy-store: 6 line(s) added, 21 removed; 0 failures`. The added lines, for BOB:

```
ADDED bio-plane/src/store.mjs:887  /* promotion R45: REC-26's and D-86's producer arms, for every committed promotion (a monitored bundle, a lens moved). */
ADDED bio-plane/src/store.mjs:888  promotionOf(ctx).onCommitted("legacy-store", async ({ bundleId }) => {
ADDED bio-plane/src/store.mjs:889  const monitored = this.#monitorConfigured() && this.#one(`SELECT monitor_enabled FROM bundles WHERE bundle_id=?`, bundleId)?.monitor_enabled === 1;
ADDED bio-plane/src/store.mjs:890  if (monitored || this.#biasDebtPending()) await this.#armScheduler();
ADDED bio-plane/src/store.mjs:891  });
ADDED bio-plane/src/store.mjs:45682  promote: () => promotionOf(this.ctx).promote(body),
```

Size: test runs 72, module lines 2037

# PROMOTION #4

**Session** PROMOTION #4, `session_01W2PTadnDKxA16EUS4CW7Bz`, on `job/T5/promotion` (re-cut from `tranche/T5` @ `a31fe1aabd`, bias merged). Re-opened by K150 (P10's service-change exception). Process: civicos-process @ `7549c0b`, `roles/JOB.md`. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T5` (BOB #46, `session_01Q3WyZBMy4MH1Acpgtw9awA`).

**Status** · COMPLETE, 2026-09-27. K150 applied; available until layer 5 closes for any further row a layer-5 job moves (it joins 1.35.0 by CHANGE).

**Read whole:** `roles/JOB.md`, `build/manifest.md`, `build/requirements/promotion.md`, K142, K146, K150, this record, `write-path.test.mjs`, `promote.test.mjs`, `src/gate.mjs`'s version notes; the old-plan rows the requirements' header carries (D-546, D-578, D-615, D-628, D-673, D-692, D-695, D-700, D-707, D-717, D-718, D-726, D-738, D-741).

**Baseline** on `a31fe1aabd`: `node --test test/m/promotion/`: tests 55, pass 54, fail 1 (R18's floor: "the catalogue's rows sited at the promote write: 38").

## Entries applied (K150)

- **R18** · the write-path suite drops the bias relay (the `checkBiasExtension` arm of `RELAYED`, C-26.1–C-26.7) and the `BIAS_REFUSED` probe (C-26.11): both rows left the catalogue for `src/bias/` (layer 5), which promotion cannot import. The floor moves 40 → **38**, counted against the catalogue as it stands: 46 rows sited at the promote write at 1.34.0's commit, 38 now; the eight gone are exactly C-26.1–C-26.7 and C-26.11. C-26.12 (`BIAS_ILLEGAL_TRANSITION`, R15) stays and is still probed.
- **R34** · `CATALOG_VERSION` 1.34.0 → **1.35.0** (MINOR), with its note in `src/gate.mjs`. Derived from `bio-plane/checks/bio-checks.mjs`'s diff between `3ec9dbc533` (the commit that set 1.34.0) and `a31fe1aabd`: 830 lines, all removals; both catalogues loaded and every row's `check` id compared. **49 departures, no arrivals, no row changed** (45 at `a31fe1aabd`; four more after BOB's CHANGE, measured again at `508920f1c1`):
  - CALIBRATION #1 (`94547e7dd7`): C-42.1–C-42.7 (`CALIBRATION_CHECKS`)
  - EXTRACTION #1 (`5637083691`): C-51.1–C-51.5 (`REEXTRACT_CHECKS`)
  - ENTITIES #1 (`7105bd5dbb`): C-91.1–C-91.3 (`IDSPACE_CHECKS`)
  - PROGRESSIONS #1 (`e72e3563bb`): C-33.26 `UNKNOWN_AFTER`, C-33.42 `NO_DEFINITION_VERSION`, C-33.43 `DEFINITION_MOVED`
  - OBSERVATION-LOG #1 (`6d44967ab5`, K142): C-54.2–C-54.10 (`LEAD_CHECKS`)
  - BIAS #1 (`4a0220de10`, K146, K150): C-26.1–C-26.11, C-26.13–C-26.19, with `checkBiasExtension` and `BIAS_BAR_PHRASING`, `BIAS_STATEMENT_KINDS`, `BIAS_VERDICT_SPEAKER`, `BIAS_VERDICT_WHOLESALE`
  - RETRIEVAL #1 (`64e6242334`, RETRIEVAL #1 REPORT 3): C-23.1 `MEANING_ROWS_NO_ARM`, C-23.2 `MEANING_ROWS_UNKNOWN_ARM` (`MEANING_READ_CHECKS`), C-33.20 `NO_SUCH_SELECTION`, C-33.32 `SET_MOVED`
  - CONTENT #1 (`108ba93457`) moved the helpers `imagePageUndetermined`, `legContentId`, `mintUndetermined`, which carry no check id.
  The d470 suite's own print on this tree: **count 519** (568 − 49, agreeing with the row diff), **sha256 `e4d92a7e563ee9a0052239476766b449021eee501a6d2d7547a2e53c370c56bf`**, **source `18a618723fe7fce4936badcd595fb1158fd8dc6bb01e456656ffeb244fd823b1`** (on `508920f1c1` merged; superseding 523 / `ac5d8ad6…` / `38f86aa4…` measured at `a31fe1aabd`). `GATE_VERSION` is `plane-gate/1.0 (bio-checks 1.35.0)`.

## Improvements made in the module

- **R15's test covered five types by a hand list.** It now iterates every type a record can hold, read from the catalogue's `STATES` through `normalizeType`: focus and problem are inquiries there, so the five are the whole set today, and a new type joins without an edit.
- **R17's test covered three types by a hand list** (with `void type` in two arms). It now runs every `STATES` type; and a new write-path test drives an action revision that sends nothing readable through the store with legacy-store's registered fences present (D-741's repro shape: no files, no `bundle.md`, a blob-held `bundle.md`, no front matter) and gets the readability refusal each time, never a registered fence's.

## The *not yet met* marks (for BOB to clear)

Each checked against a test at the interface, on this tree, all green:

| mark | carried rows | met? | the test |
| --- | --- | --- | --- |
| R11 | D-578, D-628, D-707 | met | `promote.test.mjs` "R11: missing fields are refused by name or carried forward and said so…" (typeless revision carried; `PROMOTED_TYPE_UNSTATED`, `PROMOTED_FIELD_UNSTATED`; snap key, path, content and bytes each by name) |
| R12 | D-615, D-692 | met | "R12: created and last_updated come from the document…" (`ENVELOPE_DATES_DISAGREE` C-86.7, `REVISION_REDATES_CREATION` C-86.9) |
| R13 | D-726, C-64.1 | met | "R13: a creation takes the recorded producing group…" (`REVISION_REGROUPS_BUNDLE` C-86.14, `GROUP_UNDETERMINED` C-64.1, replay keeps its group) |
| R14 | D-738 | met | "R14: a non-replay promotion whose document's id differs…" (C-1.1 at the door, creation and revision) |
| R15 | D-546 | met | "R15: a state move along an undeclared edge is refused…" (every from→to pair of every type, now read from the catalogue) |
| R17 | D-741 | met | "R17: readability is judged first…" (every type) and write-path "R17: through the whole write path…" (new, D-741's shape) |
| R18 | D-695, D-717 | met as worded | write-path "R18: every refusal the catalogue sites…" (38 rows, each by name) and the relay test. R18 itself says D-695 (C-2.10) and D-717 (five action arms) arrive with `actions`' extraction through R39 (K64): not promotion's to build, so the carried-row list may drop them from the mark |
| R30 | D-700, D-718 | met | `history.test.mjs` "R30: C-20.1 walks write order…", "R30: C-17.2 classifies…", "R30, R32: the audit runs the moved checks too" |
| R31 | N8, K10 | met | `release.test.mjs` the three R31 tests |
| R32 | D-673 | met | `history.test.mjs` "R32: an undeclared edge in the document's own state_history…" |
| R45 | N63 | met | `registry.test.mjs` the three R45 tests |
| R1–R20 "Errors" line | D-578, D-628, D-707 | met | `promote.test.mjs` "R20: every refusal names a reason, carrying its catalogue row…; NO_BODY; never throws for any JSON package", with R11's test for the three rows' raw-stack cases |

None is unmet.

## Deferred

- Nothing of this module's own.

## Found in other modules (REPORT)

1. **legacy-tests (T5-12), d470-catalog-census:** 10 pass, 3 fail here (A1, A3, A5), as expected. Re-pin: `"1.35.0": { count: 519, digest: "e4d92a7e563ee9a0052239476766b449021eee501a6d2d7547a2e53c370c56bf", changed: [], source: "18a618723fe7fce4936badcd595fb1158fd8dc6bb01e456656ffeb244fd823b1" }` (after the retrieval CHANGE; re-read at layer close if connections moves rows), and A5's literal (still `1.33.0`) → `1.35.0`. It supersedes PROMOTION #3's 1.34.0 row, which was never pinned; whether both rows are kept is legacy-tests'.
2. **legacy-index (T5-11), the ratification gate without bias's checks:** `checkBundle` no longer runs `checkBiasExtension`, and nothing outside `src/bias/` calls `withBiasChecks` yet (`src/index.mjs` wraps `runGate` with provenance's `withRegisterChecks` only). Until T5-11 lands K146's wrap, `op=ratify` does not judge C-26.1–C-26.7.
3. **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` embeds `src/gate.mjs` (now 1.35.0). For the layer close (manifest §14).

## Tests and checks run (on `a31fe1aabd` + this job)

- My module: `node --test bio-plane/test/m/promotion/`: `tests 56, pass 56, fail 0` (baseline 54/1; one new: R17 through the write path).
- Layer tests: none named in `build/manifest.md`. No service's answer changed beyond the version string; users and providers run anyway: record-core 46/0, membership 77/0, provenance 54/0, bias 45/0. No other suite names `1.34.0`.
- `node checks/format.mjs /home/user/bio`: `format: 69 modules, 64 requirements files; 0 failures`
- `node checks/architecture.mjs /home/user/bio promotion`: `architecture: 16 product files, 47 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs /home/user/bio promotion`: `coverage: 1 modules, 45 of 45 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs /home/user/bio promotion tranche/T5`: `ownership: 3 files changed by promotion between tranche/T5 and HEAD; legacy-checks: 0 line(s) added, 0 removed; legacy-store: 0 line(s) added, 0 removed; 0 failures`

Size: test runs 12, module lines 2048 (superseded below)

## Message to BOB not delivered (for BOB's backstop check, mechanics §5, §13)

- **COMPLETE could not be sent**, 2026-09-27 08:37 UTC: `create_trigger` into BOB #46 (`session_01Q3WyZBMy4MH1Acpgtw9awA`) was refused with `caller session is at lineage depth 8 (limit 8); cannot spawn or re-arm further child sessions`. That is a platform limit on this session, not a permission prompt Bob could approve here (§16), so there is no workaround: this record, pushed, is the COMPLETE. Its content is the "PROMOTION #4" section above.
- **REPORT, process (mechanics §2, "Session depth stays minimal"):** each BOB successor is recorded as its predecessor's child, so the lineage grows by one per BOB. BOB #46 sits at depth 7, and its jobs sit at the limit (8). Consequences: (a) a job at depth 8 cannot reach BOB through the §13 channel at all; (b) a BOB #47 started by BOB #46 with `create_session` would be at depth 8, and could neither start jobs nor send a routine. BOB can reach this session (a routine from depth 7 into it); a CHANGE still re-opens this job.

## CHANGE 08:39 UTC (BOB #46: retrieval merged)

- Merged `origin/tranche/T5` @ `508920f1c1` (past the named `376d77c047`; only K152's rulings commit follows it, which touches no catalogue file). Catalogue diff re-taken from `3ec9dbc533` to the merged tip: retrieval's C-23.1, C-23.2, C-33.20, C-33.32 join the 1.35.0 note (49 departures, census 519, figures above). Calibration's C-42.1–.7 and entities' C-91.1–.3 left after 1.34.0 was minted (in the diff) and were already in the note. R18's sited rows are still 38: none of retrieval's four is sited at the promote write.
- Tests on the merged branch: promotion `tests 56, pass 56, fail 0`; record-core 46/0, membership 77/0, provenance 54/0, bias 45/0, retrieval 56/0. d470 10 pass, 3 fail (A1, A3, A5: legacy-tests' re-pin, REPORT 1, figures updated).
- Checks: format `69 modules, 64 requirements files; 0 failures`; architecture `16 product files, 47 relative imports …; 0 failures`; coverage `45 of 45 live requirement ids named by a test; 0 failures`; ownership `4 files changed by promotion between tranche/T5 and HEAD; legacy-checks: 0 line(s) added, 0 removed; legacy-store: 0 line(s) added, 0 removed; 0 failures`.
- COMPLETE again. Waiting on: a CHANGE if connections moves rows.

Size: test runs 20, module lines 2048
