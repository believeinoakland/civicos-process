# T4 · pdf-pixels — job record

**Session** PDF-PIXELS #1, `session_012XRqCG31gxW9i9Uyf3x6KX`, on `job/T4/pdf-pixels` (from `tranche/T4` @ `f290c217aa`). Process: civicos-process `roles/JOB.md`, mechanics §6, §13, §16. Entry: T4-0b (`build/plan/current.md`), sequenced by K115.

## Baseline

Before any change, run by file from the repository root: `pagepixels.test.mjs` 173/0, `imagecrop.test.mjs` 54/0, `jbig2.test.mjs` 179/0, `jpx.test.mjs` 197/0. Coverage: 24 of 25 live ids named (R41 not). Architecture, ownership, format: 0 failures.

## Status

**COMPLETE**, 2026-09-27. Part 1 (tests) before the CHANGE; part 2 after BOB's CHANGE (01:46 UTC: `image-codecs` on `tranche/T4` @ `ab6a700`), merged from `tranche/T4` @ `da482a1d63`.

## Part 1 · tests (T4-0b)

- **R41** new, in `pagepixels.test.mjs`: no refusal text (`REFUSALS`, `CROP_REFUSALS`) and no answer the file drives names a place; no place in the module's three source files with comments removed (layers.md rule 6, the reading pdf-worker's R38 test uses), with a control that the reading does see one.
- **R22** the DCT variant corpus (12 decodable, 4 refused) now goes through `renderPageToPixels` with `decodeDct` and each variant's turn as the page's `/Rotate`, checked against Pillow's hash, instead of calling `image-codecs`' decoder directly (that is `image-codecs`' test now); the unrotated picture of the scan is checked by re-wrapping the pass-through bytes on an unrotated page.
- The CCITT stream the suite re-wraps is read through `pdf-reader`'s services (`openPdf`, `pdfPageImages`, `imagePlacementSource`), not this module's internal `analyzePage`.
- Test headers cite `build/requirements/pdf-pixels.md`.
- `pagepixels-corpus.probe.mjs` read `doc._pageOrder`, a private field of `PdfDoc` (against N9); it reads `pageCount` (pdf-reader R19).

## Questions to BOB

### Q1 · 2026-09-27 · which `REFUSALS` reason the JPX memory key maps to (R25)
R25 lets the module map a codec refusal key to a `REFUSALS` reason other than `UNSUPPORTED_FILTER`. Every key today maps to `UNSUPPORTED_FILTER` (the codec lacks a feature). A decode that would exceed the isolate's memory is not a missing feature. **My reading, on which I carry on:** add one reason to `REFUSALS`, `IMAGE_TOO_LARGE` ("decoding the image would need more memory than a decode may use here"), and map N34's key to it, carrying the codec's feature and measured figures in the detail; every other key stays `UNSUPPORTED_FILTER`. Callers pass reasons through (`ocr-worker` wraps any render refusal as `PAGE_NOT_RENDERABLE` with the reason and its `why`), so nothing downstream branches on it. The alternative is `UNSUPPORTED_FILTER` naming the feature, which adds nothing to the vocabulary.

**A1 (BOB, 01:36 UTC):** the reading stands; written into R25 on `tranche/T4` @ `0db159e` (K116), merged into this branch. Applied in part 2 with the mapping, once the codec's key is on the tranche branch.

## Part 2 · after the CHANGE (K115, K116)

- **CCITT moved out:** `pagepixels.mjs`'s CCITT block (the T.4 code tables, `BitReader`, `readRun`, `ccittDecode`, `b1`, `b2`; 237 lines, byte-identical to `image-codecs`' `ccittdecode.mjs`) is removed; `decodeImage` imports `ccittDecode` from `./ccittdecode.mjs`. `getBit`/`setBit` stay with the rotation. The CCITT page still matches Pillow's hashes (R23, R40), in node and workerd.
- **R25's mapping, total by construction:** the reason for each `UNSUPPORTED` feature is built from the keys of `JBIG2_REFUSES` and `JPX_REFUSES` themselves, each `UNSUPPORTED_FILTER` unless named; "an image past the memory bound" is named `IMAGE_TOO_LARGE` (new in `REFUSALS`, K116), carrying the codec's `feature`, `working_set_bytes`, `bound_bytes`, `width`, `height`, `components`. A key `image-codecs` adds later is mapped without a change here.
- **Driven in `jpx.test.mjs`:** a grey and a colour bare codestream patched to a one-tile 5000x5000 SIZ answer `IMAGE_TOO_LARGE` with working sets of 100,000,000 and 300,000,000 bytes against the 61,300,000 bound, no bytes; "every refusal JPX_REFUSES declares was driven" passes with the new key.

## Deferred

Nothing.

## Found in other modules (REPORT)

1. **ocr-worker's generated bundle is stale** (mechanics §14): `ocr-worker/dist/ocr-worker.bundled.mjs` and `.bundle.json` were built from the old `pagepixels.mjs` and `jpxdecode.mjs`, and the bundle now also takes `ccittdecode.mjs`. `ocr-worker.test.mjs` R19 fails on that alone (194 passed, 1 failed); BOB regenerates it at the layer's close.
2. **ocr-worker's staleness message names retired tooling:** its R19 failure text says to run `node tools/bundles.mjs`; the regenerate command is now `npm run build` in `ocr-worker/` (`build/manifest.md`).

## Tests and checks (final, on the job branch)

- `node pdf-worker/test/pagepixels.test.mjs`: pagepixels: 178 passed, 0 failed
- `node pdf-worker/test/imagecrop.test.mjs`: imagecrop: 54 passed, 0 failed
- `node pdf-worker/test/jbig2.test.mjs`: jbig2: 179 passed, 0 failed
- `node pdf-worker/test/jpx.test.mjs`: jpx: 201 passed, 0 failed
- Users of the module: `node ocr-worker/test/ocr-worker.test.mjs`: 194 passed, 1 failed (REPORT 1 above, the stale bundle only). `content` has no tests yet (`bio-plane/test/m/content/` does not exist).
- No layer tests (`build/manifest.md`).
- `checks/format.mjs`: 0 failures · `architecture.mjs … pdf-pixels`: 0 failures · `coverage.mjs … pdf-pixels`: 25 of 25 live ids named, 0 failures · `ownership.mjs … pdf-pixels tranche/T4`: 7 files changed, 0 failures.

Size: test runs 15, module lines 1074
