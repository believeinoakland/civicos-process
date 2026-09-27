# Job record: record-core, T5

**Status** · COMPLETE, 2026-09-27. RECORD-CORE #2, session `session_014SH9wUytqUzw3oKoJhPj7C`, branch `job/T5/record-core` (cut from `tranche/T5`; `tranche/T5` @ e717124b06 merged in). Process: civicos-process @ 7549c0b, `roles/JOB.md`. Entries: N40, N51, N58, N64 (its share), N66 (its share), N74, N83, and every requirement marked *not yet met* in `build/requirements/record-core.md`.

**Read whole:** `roles/JOB.md`; `build/manifest.md`; `build/requirements/record-core.md`; `build/layers.md`; `build/extraction/record-core.md`; my entries in `build/plan/current.md`; my T3 record; the module's code (`src/record-core/index.mjs`, `schema.mjs`) and tests (`test/m/record-core/`); rulings K31, K64, K65, K72, K85, K87, K91, K93, K96, K99, K118, K126–K128; the legacy code that moves (store.mjs: `EMPTY_STRING_SHA`, `stampInstant`/`instantOrder` and their D-543 header, `#migrate`'s first-boot witness, `#fileDigestOf`, `#inlineBytesOf`, `digestCensus`, `#manifestFiles`, `snapKeyCensus`, `#perItem` with its D-126 header, the `capture-completed-unattended` producer's manifest reads); `affordances.mjs`' `PER_ITEM_MAX`/`PER_ITEM_ACTS` block; `PER_ITEM_CHECKS` (C-75) in the catalogue; promotion's `fileDigestOf`/`inlineBytesOf`/`EMPTY_STRING_SHA`/`recordAudit`; provenance's `provenanceAudit` and its SQL over `files`, `history`, `bundles`; LEGACY-CHECKS #1's REPORT 3 and PROVENANCE #1's REPORT 5.

## Questions to BOB

**Q1 (N51: no requirement states it yet).** `auditPass` "offers a registration for later modules' audit checks (the K31 pattern)". Step 5 says BOB states a new service first. **Best reading, on which I build:** a new **R59**, `registerAuditCheck(module, check) → {ok}`:
- A later module registers, once at start, an audit check, `check({bundleId, files, elidedPaths, sha256, sha512, resolveTarget, ...context}) → findings` (sync or async), over the same image `checkBundle` gets, `resolveTarget` being R19's whole-corpus resolution and `context` R45's.
- `auditPass` runs the catalogue and then every registered check, in registration order, over each bundle on the page; a bundle's errors from all of them are counted once in `clean`/`withErrors`, and each error once in `tally`/`tallyDetail`; `offenders` lists its first five.
- A second registration by the same module is refused `AUDIT_CHECK_DECLARED`; an unnamed module or a check that is not a function, `AUDIT_CHECK_MALFORMED`. A registered check that throws counts as one error finding for that bundle, `check: "<module>"`, code `AUDIT_CHECK_FAILED`, so a broken check never reads as clean.
- Its users: `promotion` (`recordAudit` becomes a registration of `recordChecks`) and `provenance` (`provenanceAudit` likewise); each is a change in its own module (a REPORT), and until they make it their wrappers keep working unchanged.

**Q2 (N83: R37's widening).** R37 is approved text; N83 adds columns. **Best reading, measured in provenance's SQL (`src/provenance/index.mjs`):** R37's read contract gains `files` (`bundle_id`, `path`, `sha256`), `history` (`bundle_id`, `snap_key`, `path`, `sha256`) and `bundles.created`, `bundles.last_updated` (provenance also reads `criticality`, `current_state` and `object_type`, already in R37). Proposed wording appended to R37: "The tables `files` and `history`, with their columns `bundle_id`, `path` and `sha256` (and `history.snap_key`), and the columns `bundles.created` and `bundles.last_updated`, are part of it too, on the same terms (N83: `provenance` reads them)." R37's "not yet met: N64" flag can then be dropped: I test every stated column at the interface.

**Q3 (N64's share, for BOB to route).** R49 says `affordances` re-exports `PER_ITEM_MAX` unchanged; `affordances.mjs` is `affordances`' (layer 11, not in this job's `from`), so it keeps its own `PER_ITEM_MAX = 100` until its job. Reading: I define `PER_ITEM_MAX` and `perItem` here, `perItem` takes the identity groups as its argument (R51), and `legacy-store` calls it with `affordances`' `PER_ITEM_ACTS`. `affordances`' re-export is a REPORT, not mine.

## Provides final (for BOB's early merge, mechanics §4)

At the commit that carries this line, every service `membership` and `promotion` take from this module is final: the module-level `fileDigestOf`, `inlineBytesOf` and `EMPTY_STRING_SHA` (R58, R57's creation marker), `stampInstant`/`instantOrder` (R47–R48), `PER_ITEM_MAX`/`perItem` (R49–R52), and the instance's `isFirstBoot` (R54), `manifestByAuthor` (R53), `digestCensus`/`snapKeyCensus` (R56–R57) and `registerAuditCheck` (R59 as read in Q1). A user imports the module-level ones from `../record-core/index.mjs`. Module suite 46/46; every `test/m/*` suite green on this branch.

## Entries applied

- **N40** · R56–R58: `digestCensus` and `snapKeyCensus` moved from `legacy-store` as instance methods, reading only `files`, `history`, `manifest` and `bundles`; `fileDigestOf`, `inlineBytesOf` and `EMPTY_STRING_SHA` are module-level exports, the one computation the censuses and (after its CHANGE) `promotion` read. The store's `#fileDigestOf`, `#inlineBytesOf`, `#manifestFiles`, `EMPTY_STRING_SHA` and both census bodies are removed; its `op=digestcensus` and `op=snapkeycensus` routes delegate to `recordOf(this.ctx)`. Each census now never throws (a table it cannot read is counted as far as it was read), as R56–R57 state.
- **N51** · R59 as read in Q1: `registerAuditCheck(module, check)`; `auditPass` runs each registered check after the catalogue over the same image (`files`, `elidedPaths`, `image`, `sha256`, `sha512`, R19's `resolveTarget`, R45's context), and counts the bundle once. No module registers yet (promotion's and provenance's wrappers are theirs to switch).
- **N58** · R47–R48: `stampInstant` and `instantOrder` are module-level exports with their D-543 header; `legacy-store` imports them and re-exports them, so `index.mjs` and the old suites that import them from `store.mjs` are unchanged. `stampInstant` now refuses a bad precision before it reads `when`.
- **N64** (its share) · R49–R52, R55: `PER_ITEM_MAX` and `perItem(act, body, stamped, one, {itemKeys, sharedKeys})`, the D-126/REC-205 header and the four C-75 DEC-49 regions moved with it; the store's `#perItem` delegates, passing `affordances`' `PER_ITEM_ACTS` groups. Two small corrections in moving: an item's `index`, `outcome` and `asked` are written after the act's answer, so an answer carrying a field of those names cannot falsify the outcome count (R50's `applied + retained = count`); and the item is handed to `one` with no `items` key at all (R50's "no `items`"), where the store passed `items: undefined`. R53 `manifestByAuthor` (the prefix compared as a literal, never a GLOB pattern). R37's added columns (`current_state`, `title`, `criticality`) tested at the interface.
- **N66** (its share) · R54: `isFirstBoot()`, decided once when the instance is made (the store makes it in its constructor, before `#migrate`); `#migrate`'s witness now reads it.
- **N74** · `/* DEC-49 REGION is-allocid-prefix-gated */` around `allocIdOp`'s refusal; C-59.5's `where` (`src/record-core/index.mjs allocIdOp > is-allocid-prefix-gated`) now resolves.
- **N83** · R37's widened read contract as read in Q2, tested at the interface (column names, types, keys and meaning, and a join from another module's table).
- **Requirements marked not yet met:** R16 and R26 were met in T3 (the requirements file still flags them, BOB's to clear); R37, R47–R58 met here; R38's remaining part is its callers' (K49: provenance and capture reach the evidence binding directly), not this module's.

## Answers

**Q1–Q3 answered** by BOB (ANSWER, K130; `tranche/T5` @ 06098f939b, merged). Built as stated. R59 as K130 words it calls `check(image, context)`, two arguments, where my early-merged commit (174eadf64c) passed one object: brought in line at 1a7fa3efa5 (REPORT sent, so promotion's CHANGE builds on the two-argument form).

## CHANGE applied

**K133 (R32, nested rollback).** `transact` no longer runs a nested call inline: every call, nested or not, runs in `transactionSync`, which a Durable Object nests as a savepoint (measured in Miniflare: an inner `transactionSync` that throws inside an outer one leaves the outer's rows and none of the inner's). A nested call that throws or refuses rolls back its own writes, allocations and mints and nothing else; the outer decides the rest. Tested under R32: an inner refusal and an inner throw inside an outer commit leave no row, no bundle, no spent counter number and no minted id, while the outer's rows and a committed inner call's stand. At fd8e7e9e64.

## Deferred

Nothing in this module. (The store still imports `PER_ITEM_CHECKS`, now unused there: removing it changes a line of `legacy-store` that is no import from my paths, so it is left for that module's next job.)

## Found in other modules (REPORT)

1. **promotion** · its own `fileDigestOf`, `inlineBytesOf` and `EMPTY_STRING_SHA` give way to R58's (its planned R58 entry), and `recordAudit` becomes an R59 registration (K130's CHANGE). Both are promotion's T5 job; noted here for completeness.
2. **provenance** · `provenanceAudit` becomes an R59 registration (N92, already in next.md).
3. **affordances** · re-export `PER_ITEM_MAX` from record-core (N91, already in next.md); its D-126 header still names `store.mjs #perItem` as the mechanism.
4. **legacy-checks** · the five C-75 rows (`PER_ITEM_CHECKS`) name `src/store.mjs #perItem > is-per-item-…`; the code and its four regions are now `src/record-core/index.mjs perItem > is-per-item-set-shape | -malformed | -failed | -retained`. `check-refusal-codes` reports the four regions as unclaimed and the four `where`s as unresolved. C-59.5's `where` (`allocIdOp > is-allocid-prefix-gated`) now resolves (N74). The three codes R59 mints (`AUDIT_CHECK_DECLARED`, `AUDIT_CHECK_MALFORMED`, `AUDIT_CHECK_FAILED`) have no catalogue row; with promotion's `FACT_FAILED` they raise the guard's `census` and `untranslated` counts by 4 each.
5. **legacy-tests** · old-battery suites that name moved code, 60 files, run on this branch and on `tranche/T5` before record-core's early merge (a0de49af04). Red on this branch and green there: `peritem.test.mjs` 49/2 (51/0 there; its two STRUCTURAL arms read `store.mjs #perItem`'s source); `migrate-released.control.mjs` (its `firstbootalways`/`firstbootnever` anchors quote the store's old first-boot witness, now `recordOf(this.ctx).isFirstBoot()`); `check-refusal-codes.mjs` 25 → 31 failures (report 4, and the ratchet floors). Red on both, with anchors this job also moves: `instance-group.control.mjs` (the same first-boot witness line), `rec178-bytes.control.mjs` (patches `Store.#inlineBytesOf` in `store.mjs`), `queue-peritem.control.mjs` (`#perItem`), `suggest.control.mjs` (not this job's). All the others pass on both: rec175-digest, rec176-snapkey, rec178-bytes, d543-instant-precision, d573-lastchange-tie, instance-group, migrate, migrate-released, purge, opaque-ids, mint-ledger, project-mint, store, rec180-promote-rollback and the rest of the list.
6. **queue** (when extracted) · its `capture-completed-unattended` producer reads `manifest` in its own SQL; R53 `manifestByAuthor` is the read to take.
7. **Generated artifact** · `bio-plane/dist/bio-plane.bundled.mjs` (`not_product`) is stale against the plane's source; BOB regenerates at the close.

## Tests and checks

- Module tests `node --test bio-plane/test/m/record-core/`: tests 46, pass 46, fail 0 (every live id R1–R59 named).
- Users and neighbours on this branch after K133: membership 77/0, promotion 50/0, provenance 54/0, capture 46/0, capture-sources 53/0, host-governor 28/0; every other `test/m/*` suite green.
- Layer tests: none named in `build/manifest.md`.
- Checks (civicos-process 7549c0b), against `tranche/T5`: format: 69 modules, 64 requirements files; 0 failures · architecture: 4 product files, 6 relative imports; 0 failures · coverage: 59 of 59 live requirement ids named by a test; 0 failures · ownership: 0 failures (my `legacy-store` share, measured before the early merge: 7 lines added, 285 removed, listed below).

## ADDED lines in legacy-store (ownership check)

```
bio-plane/src/store.mjs  import { recordOf, stampInstant, instantOrder, perItem } from "./record-core/index.mjs";
bio-plane/src/store.mjs  export { stampInstant, instantOrder } from "./record-core/index.mjs";
bio-plane/src/store.mjs  const firstBoot = recordOf(this.ctx).isFirstBoot();
bio-plane/src/store.mjs  const a = PER_ITEM_ACTS.find((x) => x.id === act);
bio-plane/src/store.mjs  return perItem(act, body, stamped, one, { itemKeys: a && a.item_keys, sharedKeys: a && a.shared_keys });
bio-plane/src/store.mjs  snapkeycensus: () => recordOf(this.ctx).snapKeyCensus({ limit: url.searchParams.get("limit") }),
bio-plane/src/store.mjs  digestcensus: () => recordOf(this.ctx).digestCensus({ limit: url.searchParams.get("limit") }),
```

Size: test runs 24, module lines 988
