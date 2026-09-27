# T4 · pdf-worker — job record

**Session** PDF-WORKER #3, `session_014eJmEBtn1ryR23AYPmxd89`, on `job/T4/pdf-worker` (cut from `tranche/T4` @ `b9f92f767e`). Process: civicos-process `roles/JOB.md`. Owns `pdf-worker/src/index.mjs` and the rest of `pdf-worker/` not listed for `image-codecs` or `pdf-pixels` (K114).

## Entries applied

- **T4-0c** ·
  - `test/structure.test.mjs` now reads only this module's files and its declared uses (`pdf-reader`, `test-support`): the imports of `pdf-pixels`' `pagepixels.mjs` (`REFUSALS`) and `imagecrop.mjs` (`CROP_REFUSALS`) are gone, which cleared the architecture check's two failures.
  - **R38 per module:** the source check reads `src/index.mjs` alone, comments removed. The refusal-text check now covers every answer this member gives: the 400s, the 404s, the 422, tier 1 over the envelope, the tier-2 failure, tier 2, `/version`, the unknown route, and the 503 with no binding. The decoders' and pixel refusals are `image-codecs`' and `pdf-pixels`' own R38.
  - **R41, new tests:** eleven calls cover every kind of answer. Each gives byte-identical status and body when repeated twice in a row and when the whole set runs in reverse order (no state carried between requests). They answer the same again under a clock skewed ten years forward, with `Math.random`, `performance.now`, `crypto.getRandomValues` and `crypto.randomUUID` returning other values (no clock, no randomness). Under workerd, tier 2 and the tier-2 failure give the same bytes twice and the same bytes as node.
  - **The bundle:** `src/index.mjs` is unchanged, so this job stales no artifact. BOB regenerates and verifies it at the layer's close, as the entry says.

## Deferred

- `BAD_SHA`'s `detail` says "64 lowercase hex", but R2 lower-cases the sha first, so an upper-case sha is accepted. The wording is wrong, and no requirement or test binds it. I have not changed it: the suite tests the committed bundle, and this job does not regenerate it, so the fix could not be tested here. It is a one-line fix for the next job that changes `index.mjs` alongside a bundle rebuild.

## Found in other modules (REPORT)

1. **`pdf-pixels`' tests import `pdf-worker/test/make-pdf.mjs`**, which this module owns (the most specific path assigned it none), and `pdf-worker` comes after `pdf-pixels` in the order. The importers are `pagepixels`, `imagecrop`, `jbig2` and `jpx.test.mjs`. `checks/architecture.mjs … pdf-pixels` reports 0 failures, so either the check does not judge test-to-test imports across modules, or it does so on purpose. Either way the helper belongs with its earliest user: move `make-pdf.mjs` to `pdf-pixels`' `tests` (or to `test-support`). That is BOB's call on file ownership. If it moves, `structure.test.mjs` would import it from an earlier module, which needs a `uses` edge `pdf-worker → pdf-pixels` or `test-support`'s ownership.
2. **`pdf-worker/package.json`'s `npm test`** still chains all five suites (`structure`, `pagepixels`, `imagecrop`, `jbig2`, `jpx`), three of which belong to `pdf-pixels`. It is harmless while jobs run their tests by file (K114). If BOB wants `npm test` to mean "this module", it should run `structure.test.mjs` alone. I left it alone because other modules' runs may rely on it.

## Tests and checks

- `node pdf-worker/test/structure.test.mjs` (from the repository root): **structure: 83 passed, 0 failed** (baseline before the change: 78 passed, 0 failed).
- Layer tests: none (`build/manifest.md`).
- From civicos-process:
  - `node checks/format.mjs`: `format: 69 modules, 64 requirements files; 0 failures`
  - `node checks/architecture.mjs … pdf-worker`: `architecture: 13 product files, 8 relative imports (0 naming no tracked file, not judged); 0 failures` (2 failures before)
  - `node checks/coverage.mjs … pdf-worker`: `coverage: 1 modules, 17 of 17 live requirement ids named by a test; 0 failures` (R41 missing before)
  - `node checks/ownership.mjs … pdf-worker tranche/T4`: `ownership: 2 files changed by pdf-worker between tranche/T4 and HEAD; 0 failures`

Size: test runs 3, module lines 223

**COMPLETE** · 2026-09-27. Sent to BOB as `COMPLETE`. Waiting on: BOB's answer to the two REPORT items, and the layer close.

**BOB ANSWER, 2026-09-27 01:36 UTC (K116):**
- REPORT (1) was my mistake. `make-pdf.mjs` is already `test-support`'s by path (K114), so `pdf-pixels` importing it is legal and nothing moves. I had read only the three split modules' entries in `modules.json`.
- REPORT (2) stays as it is.
- The BAD_SHA deferral is accepted.

Waiting on: the layer close.
