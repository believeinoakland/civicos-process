# T5 · query-language — job record

**Session** QUERY-LANGUAGE #1, `session_012jSiJ21iiBkFYdQgY49Gbe`, on `job/T5/query-language` (from `tranche/T5`). Process: civicos-process `main`, `roles/JOB.md`, mechanics §6, §12.2, §13, §14, §16. BOB: read from the Status line of `build/plan/current.md` on `origin/tranche/T5`.

**Status** · COMPLETE (Q1 answered by K143 as built; K144's CHANGE merged). Entry T5-9: N37 (`viewerPredicate`, `GATE_MARK` re-exported from membership); `content:ocr` reads `mixed` as containing machine-read text (content R14, DEC-4); `CONTENT_EXTENT_KINDS` from content with `envelope` (CONTENT #1 REPORT 6); every requirement marked not yet met (R9, R24).

**Read whole:** `roles/JOB.md`, PROCESS-MECHANICS.md §3, §6, §12–§16, `build/manifest.md`, `build/requirements/query-language.md`, `build/layers.md` (layer 5 and the legacy modules), `build/plan/current.md`, the public parts of `membership`, `content`, `text-chain` (legacy-checks has no requirements file), `bio-plane/src/query.mjs` 1–2665, `content/extent.mjs`'s kinds and `unitChainKind`, D-686/D-710/D-723 in the old queue, and `land/worker/D-710`'s `query.mjs` change (kept: `mixed` is a word of `content:chain`). The module has no extraction map (its requirements: nothing of it sits in a legacy file).

## Questions to BOB

- **Q1 · which step kinds does `mixed` join?** Content R14 says every reader that labels machine-read text treats `mixed` as containing it; the plan entry names `content:ocr`. `text-chain` classifies no step kind as a machine reading. Best reading, which I am building: `ocr` and `ai` (an engine read or rewrote the text) are the machine readings, so `content:ocr` and `content:ai` select `chain_kind IN (<kind>, 'mixed')`; `layer`, `typed`, `convert`, `pixels` stay exact. The list is this module's constant `MACHINE_READ_KINDS`, filtered to kinds `STEP_KINDS` declares, and published on `meaningVocabulary().content.fields.chain.selects`. If you would rather `text-chain` own the classification (R22), that is a text-chain entry; say which and I will read it from there.

## Entries applied

- **N37 (R9).** `viewerPredicate` and `GATE_MARK` are imported from `membership` and re-exported unchanged; `query.mjs`'s own copy (its three mint sites) is gone, so the gate is minted only in membership (R8, R21).
- **`CONTENT_EXTENT_KINDS` from content, with `envelope` (R6).** `CONTENT_EXTENT_KINDS`, `CONTENT_MINTED_BY_PLANE` and `contentCitedAs` now come from `content` (its public face, `src/content/index.mjs`), no longer from the catalogue: `content:envelope` is a word.
- **`content:ocr` reads `mixed` (content R14, DEC-4).** `mixed` (text-chain's `CHAIN_KIND_MIXED`) is a word of `content:chain` (kept from `land/worker/D-710`), and a machine reading (`MACHINE_READ_KINDS`: `ocr`, `ai`; Q1) selects `chain_kind IN (<kind>, 'mixed')`. The `chain` sub-field publishes this in `selects` (R18).
- **R24, NEAR (K105).** `NEAR(a b …)` / `NEAR(a b …, n)` in free text, `text:` and `passage:`, capitals only; terms are R1's words, phrases and prefixes; `n` defaults to 10, clamped to 0–100 with a warning; fewer than two terms, no closing parenthesis, or an `n` that is not a whole number reads as the terms joined by AND with a warning naming why. It compiles to FTS5's `NEAR(...)`, bound as an argument (R7).

## Flaws fixed in the module (found in this job)

- **R10/R11: a negated term ranked the answer.** Relevance, the page snippet and `rows=passage`'s match were built from every text atom, negated ones included, so `-water state:open` ordered by relevance to "water" (every score 0: bundle_id order, not `updated` descending). They now take the positive terms only.
- **R1/R13: an explicit `AND` took `implicitOp`.** `a AND b` compiled to OR under `implicitOp: "or"` and was `widenable`. An explicit AND is now a conjunction (the node carries `explicit: true`, read by `widenable`).
- **R5: `passage:>=x` compiled to a MATCH on `x`** instead of being dropped as a comparison on `passage:`. Dropped with the warning now.
- **R12: a non-numeric `snippetChars` bound NaN.** Now 12, as when absent.

## Deferred

None.

## Found in other modules (REPORT to BOB)

1. **legacy-tests (N46 with N37; T5-12).** Newly red against `tranche/T5`, every one a source anchor on `query.mjs` or a pin of what this entry changes (measured: each suite run on the base and on this branch, failures diffed):
   - `aicredential`: "viewerPredicate recognises class:ai" reads `QUERY_SRC` (now membership's source).
   - `meaningquery`: "the gate is minted in exactly ONE function…" counts mints in `query.mjs` (now 0; membership holds them); "every arm and every sub-field…" probes `passage:>=B`, which R5 now drops.
   - `meaningread`: the same gate count, and its STRIP GUARD's known code line (it was in `viewerPredicate`).
   - `passage-arm` S71: `/b\.object_type <> 'project'/` over `QUERY_SRC` (now in membership).
   - `query`: the FTS5-syntax sweep's `x"" NEAR(p q)` now compiles to R24's `NEAR` (compiler syntax, not member text); the atom-key pin lacks `explicit` (read by `widenable`).
   - `content-arm`: `kind`'s and `chain`'s vocabularies pinned to the old copies (without `envelope`, `mixed`).
   - `content-chain-kind`: "`content:ocr` compiles to an equality" (now `IN (ocr, mixed)`).
   Unchanged (same failures on the base): affordances, airuns, bounds, frontier-chunk, hygiene, project-sight, rec108-cache-asof. Green: daemon-token, gate-reads, inquirystrength, leadslug, observation-content, projects, readingname, rec114-leg-earned, rec121-chain-bytes, rec127-cap-bytes, risk-tier, run-conditions, search, strength, versionchain; agent-worker's six suites.
2. **Generated artifact:** `bio-plane/dist/bio-plane.bundled.mjs` is stale (query.mjs changed); BOB regenerates at the layer close.
3. **text-chain (Q1):** no classification of which step kinds are a machine reading; `MACHINE_READ_KINDS` states it here until text-chain owns it, if BOB so rules.

## Provides

Final for `retrieval`: the plan's shape and every statement are unchanged except the behaviour above (`explicit` on an AST node; NEAR; positive-only relevance); the gate is `membership`'s.

## Tests and checks

- Module tests: `node --test bio-plane/test/m/query-language/` — tests 24, pass 24, fail 0 (every live id R1–R24 named in a test title; statements run against node:sqlite with FTS5).
- Layer tests: none named in `build/manifest.md`. Users: agent-worker's 6 suites pass (as on the base); retrieval is not yet merged.
- `node checks/format.mjs` — 69 modules, 64 requirements files; 0 failures.
- `node checks/architecture.mjs … query-language` — 5 product files, 19 relative imports; 0 failures.
- `node checks/coverage.mjs … query-language` — 24 of 24 live requirement ids named by a test; 0 failures.
- `node checks/ownership.mjs … query-language tranche/T5` — 0 failures.

Size: test runs 9, module lines 2636

## ANSWER K143 and CHANGE K144 (08:05 UTC; `tranche/T5` @ 9e8dc29840 merged here)

- K143: Q1 adopted as built (`ocr`, `ai`; `MACHINE_READ_KINDS`); text-chain stating the list is N104, later. No code change.
- K144: the projection columns and `fts_id` stay on `bundles` in T5; the statements already read `b.<column>` of `bundles b`. No code change.
- Module tests 24/24. Checks: format 0 failures; architecture 0 failures; coverage 24 of 24; ownership 0 failures.

Size: test runs 10, module lines 2636
