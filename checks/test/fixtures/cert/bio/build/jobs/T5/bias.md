# Job record: bias, T5

**Status** · COMPLETE, 2026-09-27 (Q1–Q7 answered as read, K146; R25 wired to the merged entities module). BIAS #1, session `session_018B4eA3jst9ZcAUibKhY5FK`, branch `job/T5/bias` (cut from `tranche/T5`; `tranche/T5` @ f05090bcad merged in). Process: civicos-process @ 7549c0b, `roles/JOB.md`. Entry: T5-7 (the debt mechanism with it, K82 (3), K87; reading work products `ai-runs` registers in T6, and until then the store's arm registers them), extracting per `build/extraction/bias.md` and `build/requirements/bias.md` (mechanics §12.2), and every requirement marked *not yet met* (R11's instance scope, R24, R25, R26, R33–R41).

**Read whole:** `roles/JOB.md`; `PROCESS-MECHANICS.md`; `build/manifest.md`; `build/requirements/bias.md`; `build/extraction/bias.md`; `build/layers.md`; the public parts of `record-core`, `membership`, `promotion`, `entities` (and `legacy-checks`, which has no requirements file); `ai-runs` R13, R19, R30 and `scheduler` R5, R9, `queue` R8, R12 (the users of this module's services); my entry in `build/plan/current.md`; rulings K3, K4, K6, K23, K31, K61, K62, K64, K78, K82, K86, K87, K90, K96, K102, K140; CALIBRATION #1's record (the precedent for this shape); in `store.mjs`: the bias import header, `SETTLED_BY_AN_ACT`, the store constructor's purge declaration and registrations, the `bias-debt` consumer and `onAlarm`, the bias-set refusal in `#promoteChecks` and the projection and re-pin in `#promoteProjections`, `publishCase`'s manifest stamp, `#counts`, `aiRunOpen`'s lens at the open, `aiRunClose`'s discharge, `aiRunRead` and `#biasForRun`, the whole D-86 sweep and REC-207 settlement region, `#obligationsBiasDebt`, the PL-12 region (`biasAdopt`, `biasManifest`, `biasInhale`), `#memberTextAtSha`, `#bundleGate`, and the dispatch arms; in `schema.mjs` the five bias tables; in `bio-checks.mjs` `BIAS_STATEMENT_KINDS`, the three predicates, `checkBiasExtension`, its call in `checkBundle`, and `BIAS_CHECKS` (C-26.1–C-26.19); `promotion/index.mjs` (its registry, `onCommitted`, the step context, R15's `bias-state-edge`, `promotionOf`), `gate.mjs`'s `runGate`, `record-core/index.mjs` (`readFile`, `readImage`, `head`, `registerAuditCheck`, `auditPass`, `declarePurge`), `membership/index.mjs` (`viewerPredicate`, `inSight`, `existenceAct`, `projectAuthority`, `positionalMember`, `isAdministrator`, `memberFacts`, `projectOwners`), `calibration/index.mjs` (the factory and ops shape).

## Questions to BOB

Sent 2026-09-27 as one `QUESTION`. I carry on with every entry on the best reading stated with each.

- **Q1 · R8 and C-26.12 are already promotion's.** Promotion's R15 enforces the bias state edge in its own `bias-state-edge` region, before any registered check runs, and reads `BIAS_CHECKS.BIAS_ILLEGAL_TRANSITION` (C-26.12) from the catalogue. Promotion is layer 2 and cannot import `bias`, and I may only remove from the catalogue. **Best reading:** C-26.12's row stays in the catalogue, the only row of `BIAS_CHECKS` left there, so promotion keeps its import; `bias` re-exports that row inside its own family (one row, one object) and registers no second edge check (one predicate, one place, R31's rule). R8 is tested at this module's interface through `promote` with this module's step registered. Every other C-26 row (C-26.1–C-26.11, C-26.13–C-26.19) moves here (R29).
- **Q2 · The ratification gate.** `checkBundle` in the catalogue calls `checkBiasExtension` for every bundle; the catalogue cannot import `bias`, and the gate's call (`runGate` in `index.mjs`, legacy-index) is not mine to rewire. **Best reading:** the check moves here whole (R1–R7, R31); the write path runs it as my registered step (R9); the audit runs it through record-core R59 (`registerAuditCheck("bias", …)`); and I export `withBiasChecks(image, gate)`, which adds C-26.1–C-26.7 findings to a `runGate` answer, for legacy-index to wrap the ratification gate with, as it does provenance's `withRegisterChecks` (one line in T5-11, a REPORT). Until that line, the ratification gate does not run C-26.1–C-26.7; a malformed bias set is refused at the write, so only a replayed one could reach the gate.
- **Q3 · R25 needs `entities.has`.** `entities` is being extracted beside me. **Best reading:** I build against its Provides (`has(entityId)`, R7), reached through a dependency `biasOf(ctx, {entities})`; until `entities` is merged and your `CHANGE` lets me import `entitiesOf`, the manifest answers R25's list as undetermined, stated, never empty. The catalogue's `ENTITY_ID_RE` is not exported, so C-26.2's key pattern is spelled once in this module.
- **Q4 · R11's instance-scope refusal has no row.** **Best reading:** I mint `BIAS_ADOPTION_NOT_AN_ADMINISTRATOR` as C-26.20 in this module's family: an instance-scope adoption whose stamped identity is not an administrator (membership R64) is refused after C-26.9 and C-26.10; the adoption stays signed by the stamped author.
- **Q5 · The interim work-product arm.** The store may add only calls to my names, so the adapter that turns an AI run (its row and `aiRunRead`'s answer) into a work product is in this module, in `bias/interim.mjs`, marked as `ai-runs`' until its T6 job registers its own (K78 (3)'s pattern: the later module then deletes the copy here through a `CHANGE`).
- **Q6 · `bias_debt_sweeps`.** R30 calls it "an instance setting"; today the whole-store purge clears it. **Best reading:** declared exempt from purge, as record-core R23 treats settings.
- **Q7 · R24 and R25's shape.** **Best reading:** the manifest gains `interactions` (each project statement in force whose subject is also an instance statement's and which nullifies nothing: both statements with their justifications, for review) and `unregistered_subjects` (each statement in force whose subject the registry does not hold); both always present when a lens is computed, each with a sentence saying what it means, and never refusing anything (R28).

## Answers from BOB

- **Q1–Q7** · ANSWER 08:07 UTC (K146, `tranche/T5` @ 9e8dc29840): every reading adopted; C-26.20 allocated in this family; legacy-index wraps `runGate` with `withBiasChecks` in T5-11; ai-runs deletes `bias/interim.mjs` in T6.

## Entries applied

- **T5-7 · extraction per the map and requirements.** `bio-plane/src/bias/` holds the module, reached as `biasOf(ctx, {record, membership, promotion, entities, env})` (K61): `index.mjs` (the acts, the manifest, the inhale, the promotion step and projection, the lens fingerprint and notice, the whole debt mechanism, and `biasOps` for `biasmanifest`, `biasadopt`, `biasinhale`, `biasdebtresolve`, `biasdebt`, spread into the store's op map as calibration's are); `checks.mjs` (`BIAS_STATEMENT_KINDS`, the three predicates, the set's checks as `checkBiasSet`, `checkBiasImage`, `withBiasChecks`, and the C-26 family); `schema.mjs` (the five tables, interpolated by `schema.mjs` where the first stood); `interim.mjs` (the AI run as a work product, Q5). On first reaching it the module declares its tables to purge (R30), registers its step and post-commit notice with promotion (R8–R10, R23) and its checks with record-core's audit (R59).
- **Removed from `legacy-checks`** (480 lines, none added): `BIAS_STATEMENT_KINDS`, the predicates, `checkBiasExtension` and its call in `checkBundle`, and every C-26 row but C-26.12 (Q1).
- **Rewired in `legacy-store`** (1,413 removed, 24 added): the imports; the purge list filters the module's tables; `biasOf(ctx, {env})` before legacy-store's step, the AI runs registered as work products through `aiRunWorkProducts` (Q5) and a lens-change listener that arms the scheduler; the promote arm and the `bias-debt` consumer ask R41 and tick R33; `aiRunClose` tells R38 of a close; five delegating methods (`biasAdopt`, `biasManifest`, `biasInhale`, `biasDebtResolve`, `biasDebtRead`) keep the store's callers (`publishCase`, `aiRunOpen`, `#biasForRun`) as they were; the whole PL-12 region, the D-86 sweep, the REC-207 settlements, `SETTLED_BY_AN_ACT`, the bias-set refusal and the projection and re-pin in the promotion step, and the five dispatch arms removed. `#obligationsBiasDebt` (queue's) and `#counts` still read the debt and bias tables by name.
- **R11 (K102):** an instance-scope adoption asks administrator authority (membership R64 through `positionalMember`), refused `BIAS_ADOPTION_NOT_AN_ADMINISTRATOR` (C-26.20, Q4) after C-26.9 and C-26.10; an internal caller that stamps neither identity nor viewer is not asked.
- **R24, R25 (K102):** the manifest's `interactions` and `unregistered_subjects`, each with its sentence (Q7); R25 undetermined until `entities` is reached (Q3).
- **R26:** deferred by K102 (its trigger: evaluation findings in `strength` and `review`); named by a `todo` test.
- **R33–R39 (K82 (3), K87):** the debt reads registered work products (`registerWorkProducts(kind, source)`), never `ai_runs`; the lens now is this module's own manifest read as the administrator; a pin that cannot be read is undetermined (R33; before, the sweep read it as "no lens in force"); recipients through membership R65, R68 and the source's `visible`; `biasDebtRerun` for R38; the sweep's cursor names its kind.
- **R40:** met by the registration: any later module (inquiry) registers a kind, and its work products carry a debt (tested with a second kind).
- **R41 (N63):** `biasDebtDue`, `biasDebtWake` as stated, the delay from `BIAS_DEBT_DELAY_MS` (an empty or non-numeric binding is the default).
- **Flaws fixed in moving:** the sweep no longer compares through `aiRunRead`'s reader for a lens it cannot read (R33's undetermined); `bias_debts` is created with `settled_kind` (the store's additive column stays for old stores); a failing registry never throws out of the manifest.

## Deferred

- R26, by K102.

## Found in other modules (REPORT)

1. **promotion's tests** (`test/m/promotion/write-path.test.mjs`, R18's two arms): they read the catalogue for the rows sited at the promote write (floor 40, now 38) and call `C.checkBiasExtension`, which moved here. The bias rows are this module's R9, tested here; promotion cannot import this module, so its R18 arms drop the bias relay and the floor moves to 38. (1,027 module tests: 1,023 pass, these 2 fail, 2 todo.)
2. **promotion: `CATALOG_VERSION`.** Eighteen rows left the catalogue for this module's family (C-26.1–C-26.11, C-26.13–C-26.19; C-26.20 is new here); the gate never ran C-26.8–C-26.11 or C-26.13–C-26.19, and C-26.1–C-26.7 leave the gate's `checkBundle` (Q2). A MINOR move, 1.34.0's precedent; `d470-catalog-census` A1/A3/A5 follow it.
3. **legacy-index (T5-11):** wrap the ratification gate with `withBiasChecks(image, gate)` beside provenance's `withRegisterChecks` (Q2).
4. **legacy-tests (T5-12):** against `tranche/T5` @ f05090bcad, both trees: `d86-bias-debt` 20/20, `d84-case-manifest` 44/44, `publish`, `publishedcase`, `casesign`, `scheduler`, `airun`, `d85-surface-run`, `gate-reads`, `d526-refusal-order`, `rec180-promote-rollback`, `machine-fences`, `project-authority` identical. Differ, each source-anchored or K102's: `bias.test.mjs` (imports the moved names from the catalogue; its instance adoption by an ordinary member is now refused by K102, which cascades through its blocks 8–16; its source arms I0/I5 read `store.mjs`); `rec207-bias-debt-settle` C1/C2 (read `BIAS_CHECKS` from the catalogue); `run-conditions` W3b (names the three removed private methods); `identity-claims` (f) (reads the `biasdebtresolve` fence in `store.mjs`); `derivation-bounds` (by-name pins of the bias methods in `store.mjs`, 2 → 11 fails); `d470-catalog-census` (item 2); `nc-pl12`, `bounds`, `hygiene`'s TABLES list and `civicos-ui/check-refusal-codes.mjs`/`check-semantics.mjs` read the moved rows or source (map §4).
5. **queue:** `#obligationsBiasDebt` and `#counts` read `bias_debts`, `bias_statements`, `bias_adoptions` by name in the store; when queue is extracted it needs a read of the uncleared debts from this module (queue's Uses already name it).
6. **entities:** R25 reaches the registry through `has` (R7); a `CHANGE` when entities is merged lets me import `entitiesOf` (Q3). The catalogue's `ENTITY_ID_RE` is not exported, so C-26.2's pattern is spelled here too.
7. **Generated artifacts (manifest §14):** `bio-plane/dist/bio-plane.bundled.mjs` (store, schema, catalogue, bias) and `newgroup/dist/newgroup.bundled.mjs` (embeds the catalogue) are stale; regenerate at the layer close.

## Tests and checks run

- `node --test bio-plane/test/m/bias/` · tests 46, pass 45, fail 0, todo 1 (R26).
- `node --test bio-plane/test/m/` · tests 1,027, pass 1,023, fail 2 (promotion's R18 arms, REPORT 1), todo 2.
- Layer tests: none named in `build/manifest.md`. Users of the services (ai-runs, scheduler, queue, case-authoring) are later layers; their old suites above.
- `checks/format.mjs` · 69 modules, 64 requirements files; 0 failures.
- `checks/architecture.mjs bias` · 10 product files, 23 relative imports; 0 failures.
- `checks/coverage.mjs bias` · 41 of 41 live requirement ids named by a test; 0 failures.
- `checks/ownership.mjs bias tranche/T5` · legacy-store 24 added, 1,413 removed; legacy-checks 0 added, 480 removed; 0 failures. The `ADDED` lines, for BOB's review (line 739 is the content filter line whose closing moved to the next line):

```
ADDED bio-plane/src/schema.mjs:5  import { BIAS_SCHEMA } from "./bias/schema.mjs";
ADDED bio-plane/src/schema.mjs:1853  ${BIAS_SCHEMA}
ADDED bio-plane/src/store.mjs:442  import { biasOf, biasOps, BIAS_TABLES, aiRunWorkProducts } from "./bias/index.mjs";
ADDED bio-plane/src/store.mjs:739  .filter((t) => !CONTENT_TABLES.includes(typeof t === "string" ? t : t.name))
ADDED bio-plane/src/store.mjs:740  .filter((t) => !BIAS_TABLES.includes(typeof t === "string" ? t : t.name)));   /* each extracted owner declares its own (K23) */
ADDED bio-plane/src/store.mjs:771-772  (a two-line comment)
ADDED bio-plane/src/store.mjs:773  const bias = biasOf(ctx, { env });
ADDED bio-plane/src/store.mjs:774-776  bias.registerWorkProducts("ai-run", aiRunWorkProducts({ row, list, read }))  (three readers over ai_runs and aiRunRead)
ADDED bio-plane/src/store.mjs:777  bias.onLensChange("legacy-store", () => (biasOf(ctx).biasDebtDue(Date.now()) === null ? null : this.#armScheduler()));
ADDED bio-plane/src/store.mjs:782  if (monitored || biasOf(ctx).biasDebtDue(Date.now()) !== null) await this.#armScheduler();
ADDED bio-plane/src/store.mjs:3450-3452  the bias-debt consumer's due, wake and tick through biasOf
ADDED bio-plane/src/store.mjs:38115  const discharge = await biasOf(this.ctx).biasDebtRerun({ kind: "ai-run", key: run, at: now });
ADDED bio-plane/src/store.mjs:40525-40530  a comment and five delegating methods
ADDED bio-plane/src/store.mjs:40566  ...biasOps(biasOf(this.ctx), url, body),
```

Size: test runs 24, module lines 1690

## After K146 (re-opened 08:25 UTC; `tranche/T5` @ 5af5183f89 merged, entities merged there)

- Merge conflict in the store's purge filter (entities' filter beside mine) resolved by keeping both lines.
- **R25 met against the real registry:** `biasOf` reaches `entitiesOf(ctx)` by default (a test may pass its own, or `null` for none); the R25 test gains an arm over the real entities module. REPORT 6 (the CHANGE for entities) is no longer needed.
- Tests: `node --test bio-plane/test/m/bias/` 46, 45 pass, 1 todo (R26); `node --test bio-plane/test/m/` 1,085, 1,081 pass, 2 fail (promotion's R18 arms, REPORT 1), 2 todo; `d86-bias-debt` 20/20, `d84-case-manifest` 44/44, `scheduler` 51/51, `publish` 99/99.
- format 0 failures; architecture 10 files, 25 imports, 0 failures; coverage 41/41; ownership legacy-store 23 added, 1,412 removed, legacy-checks 0 added, 480 removed, 0 failures.

Size: test runs 30, module lines 1694

## CHANGE from BOB #46 (08:24 UTC; `tranche/T5` @ 9132702d02 merged, progressions merged there)

- BOB #46 took over (`session_01Q3WyZBMy4MH1Acpgtw9awA`). The merge was clean (no conflict in `store.mjs`).
- Tests: `node --test bio-plane/test/m/bias/` 45 pass, 1 todo (R26); `node --test bio-plane/test/m/` 1,126, 1,121 pass, 2 fail (promotion's R18 arms, REPORT 1, re-opened as PROMOTION #4 by K150), 3 todo; `d86-bias-debt` 20/20, `d84-case-manifest` 44/44, `scheduler` 51/51.
- format 0 failures; architecture 10 files, 25 imports, 0 failures; coverage 41/41; ownership legacy-store 23 added, 1,412 removed, legacy-checks 0 added, 480 removed, 0 failures.

Size: test runs 32, module lines 1694

## ANSWER K150 (BOB #46, 08:26 UTC)

- REPORTs 1–2 decided: the rows stay moved; promotion's two failing R18 arms and `CATALOG_VERSION` 1.35.0 are PROMOTION #4's, started once this branch is merged. Known, not this job's. BOB #45's CHANGE of 08:26 (merge, `entitiesOf(ctx).has` for R25) was already met at e4e61d4e6b, which contains `tranche/T5` @ 9132702d02 (progressions 79a9b525d9 included); the COMPLETE sent at 08:28 stands.
