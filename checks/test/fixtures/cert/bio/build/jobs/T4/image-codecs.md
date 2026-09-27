# Job record · T4 · image-codecs

Session: `session_01GytnXWpaAYBtTx3b9cEHwE` (IMAGE-CODECS #1). BOB: `session_01PcJjeNeDjQeced6Yphu5r9` (BOB #44), read from `origin/tranche/T4`.

## Status

**COMPLETE** (again, after BOB's ANSWER to Q1). T4-0a and N34 applied. `tranche/T4` @ ab6a700 is merged (K117). The low-memory wavelet is deferred, with why.

## Early merge (K115)

- `pdf-worker/src/ccittdecode.mjs` is a copy of the CCITT block of `pagepixels.mjs` (its lines 695–931: the code books, `BitReader`, `readRun`, `ccittDecode`, `b1`, `b2`), unchanged except for a header comment. `pagepixels.mjs` is untouched. It exports only `ccittDecode`, with the same signature and results as the copy in `pagepixels.mjs`, so `pdf-pixels` swaps its import with no other change. Checked against libtiff: all 19 fixtures in `test/codecs/fixtures/ccitt-variants.json` (G4, G3 one-dimensional, byte-aligned MH, and the scan page's own G4 stream) decode to libtiff's picture.
- **The JPX memory refusal key (N34):** `JPX_REFUSES["an image past the memory bound"]`. It is thrown as `JpxRefusal` code `UNSUPPORTED` with `feature` = that key and `detail` `{ working_set_bytes, bound_bytes, width, height, components }`, before any plane is allocated. Until `pdf-pixels` maps it, its existing mapping turns it into `UNSUPPORTED_FILTER`. `pdf-pixels`' `jpx.test.mjs` check "every refusal JPX_REFUSES declares was driven" fails until that job drives the new key. That is expected under K115.

## Questions and reports for BOB

- **Q1 · answered (K117): my reading stands, and R1, R3, R4 and R7 are reworded to it.** I merged `tranche/T4` @ ab6a700. The tests now also check that every `DctRefusal` carries a `detail` saying why (R1), and that each codec's refusal codes are all reached and pinned (R7). My reading, as asked:
  - **R1** lists `UNSUPPORTED_JPEG_PROCESS`, `UNSUPPORTED_SAMPLES`, `TRUNCATED_IMAGE_DATA` and `DECODE_FAILED`. Those are `pdf-pixels`' `REFUSALS` reasons, not this module's. `DctRefusal` carries its own `code`: `NOT_A_JPEG`, `TRUNCATED`, `UNSUPPORTED_PROCESS`, `UNSUPPORTED_PRECISION`, `UNSUPPORTED_FRAME`, `CORRUPT_DATA`, `UNSUPPORTED_COMPONENTS`, `COMPONENT_MISMATCH`, `COLOR_TRANSFORM_CONFLICT`, `UNSUPPORTED_SAMPLING` or `UNSUPPORTED_ROTATION`, and `pdf-pixels`' `DCT_TO_REFUSAL` maps each code to one of the four. I test R1 as: every refusal is a `DctRefusal` whose code is one of these eleven, and the four named reasons are what `pdf-pixels` maps them to. **Recommendation:** reword R1 to name the codec's own codes. I have not added a `DCT_REFUSES` export, because that would change a provided service (R7 speaks of "that codec's declared refusal set", and today the DCT codec declares none).
  - **R4, R7 (JPX and JBIG2):** "a key of `JPX_REFUSES`/`JBIG2_REFUSES`" is the `feature` of an `UNSUPPORTED` refusal. The other codes (`UNSUPPORTED_SAMPLES`, `TRUNCATED`, `CORRUPT`) are classes a decode can fail in, not features, and they carry no key. I test R4 and R7 that way.
  - **R2 (CCITT)** declares no refusal set. It refuses by throwing an `Error` (mixed mode, or a row that cannot end), and `pdf-pixels` maps any throw to `DECODE_FAILED`. I keep that, so the copy stays a drop-in.
- **R1 · report: generated artifact stale.** `ocr-worker/dist/ocr-worker.bundled.mjs` inlines `jpxdecode.mjs`, which this job changed (N34, and the memory work below), so it is stale until BOB regenerates it at the layer close. `pdf-worker`'s own bundle does not include the codecs.

## Entries

- **T4-0a · applied.**
  - `ccittdecode.mjs` created per K115 (see "Early merge").
  - Requirement-named tests at the interface for every live id, R1–R9, in `pdf-worker/test/codecs/`, each written against an independent decoder's digest:
    - `dct.test.mjs` (R1): every fixture matches libjpeg-turbo. All 11 `DctRefusal` codes are driven, each by a one-field change to a fixture's markers.
    - `ccitt.test.mjs` (R2): new fixtures `fixtures/ccitt-variants.json`, from `fixtures/make-ccitt-fixtures.py`, checked against libtiff 4.7.1 through Pillow 12.3.0. They cover G4, G3 one-dimensional and byte-aligned MH, odd widths, runs past 2560, and the scan page's own G4 stream, whose libtiff digest equals the page fixtures' reference `e54f0706…`. The tests also cover mixed mode refused, a row that cannot end refused, and cut streams returning exactly the reference's leading rows.
    - `jbig2.test.mjs` (R3): all 94 decodable fixtures match jbig2dec, with padding cleared where jbig2dec's digest carries its own padding. Every `JBIG2_REFUSES` key is driven, with the segment type named.
    - `jpx.test.mjs` (R4, N34): all 114 decodable fixtures match OpenJPEG. Every `JPX_REFUSES` key is driven, and the memory bound's edges are tested (below).
    - `mq.test.mjs` (R5): T.88 Annex H.2's test sequence decodes to the standard's 256 decisions. An MQ encoder written in the test from T.88 E.2 reproduces H.2's coded bytes, and its random multi-context streams (up to 60,000 decisions, 512 contexts) round-trip.
    - `invariants.test.mjs` (R6–R9): references named, refusal sets pinned, purity (same answers in any order, with the clock, randomness, network and crypto removed, input unchanged), and no place named.
- **N34 · applied: the declared memory refusal.** `JPX_REFUSES["an image past the memory bound"]`, raised from the SIZ header before any plane is allocated.
  - **What the bound counts.** A decode's working set: 4 bytes a sample for every component of the largest tile, plus a tiled image's 8-bit output.
  - **The bound: 61.3 MB,** the largest working set CPDF-15 measured completing in the OCR member's isolate (D-312: a workload size, never a share of 128 MB).
  - **Measured** (`test/codecs/jpx-memory.probe.mjs`, node, decoder isolate's heap plus external memory sampled every 2 ms, above idle):

    | image | working set | live peak | result |
    | --- | --- | --- | --- |
    | 1280×1680 grey 5/3 | 8.6 MB | 20.8 MB | decoded |
    | 1280×1680 colour 9/7 | 25.8 MB | 39.4 MB | decoded |
    | 1700×2200 colour 9/7 | 44.9 MB | 56.6 MB | decoded |
    | 2550×3300 grey 5/3 | 33.7 MB | 45.4 MB | decoded |
    | 2550×3300 colour 9/7, 1024 tiles | 37.8 MB | 49.6 MB | decoded |
    | 2000×2600 colour 9/7 | 62.4 MB | — | refused |
    | 2550×3300 colour, one tile | 101 MB | 119 MB before this job | refused |

    The live peak is the working set plus 12–14 MB throughout, so the header formula predicts the decode.
  - **The platform itself was not measured.** That would need a probe deployed to the Cloudflare account, which is outside a module job. If BOB wants the bound confirmed on the platform, that is the next step.
- **Improvements made in the module (N34's memory):** the decoder no longer allocates a fresh tier-1 flags array per code-block, and tiled images reuse one set of plane buffers across tiles. Before, collectable garbage added 10–40 MB to the live peak. The tiled 2550×3300 colour page fell from 92 MB to 50 MB. Every OpenJPEG digest is unchanged.

## Deferred

- **The low-memory (line-based) wavelet (N34's second half).** It would let a single-tile colour page past the bound decode instead of being refused. That means rebuilding the transform stage to decode in strips across every resolution level, in OpenJPEG's exact operation order (bit-exactness on the 9/7 path depends on that order), with the coefficients held more compactly than one int32 per sample. It is a job of its own, not an addition to this one. Tiled images already decode with the working set of one tile row, and the refusal removes the hazard: an oversized image is now refused by name instead of ending the isolate. Recommended for `next.md`, with a platform measurement of the bound.

## Found in other modules

- **pdf-pixels:** `jpx.test.mjs`'s check "every refusal JPX_REFUSES declares was driven" fails (196 passed, 1 failed) until its job drives and maps the new key (K115). Its `jbig2.test.mjs` (179 passed), `pagepixels.test.mjs` (173) and `imagecrop.test.mjs` (54) pass against this branch.
- **ocr-worker's bundle** is stale (report R1).
- **An observation, not a flaw:** a JBIG2 stream cut exactly after its page-information segment decodes as a blank page. T.88 allows a page with no regions, and an embedded PDF stream need not end with an end-of-page segment, so this module cannot tell such a stream from a cut one.

## Tests and checks run

- `node --test pdf-worker/test/codecs/<file>`, each: ccitt 7 pass, dct 7 pass, jbig2 6 pass, jpx 7 pass, mq 6 pass, invariants 8 pass; 0 fail.
- Layer tests: none named in `build/manifest.md`.
- Users' suites (read only): pdf-pixels `jbig2` 179/0, `pagepixels` 173/0, `imagecrop` 54/0, `jpx` 196/1 (the expected K115 check).
- Checks (civicos-process @ 7549c0b), after merging `tranche/T4` @ ab6a700: `format` 0 failures (69 modules, 64 requirements files); `architecture image-codecs` 0 failures (20 product files, 20 relative imports); `coverage image-codecs` 9 of 9 live ids named, 0 failures; `ownership image-codecs tranche/T4` 8 files changed, 0 failures.
- After the merge, each test file re-run: ccitt 7, dct 7, invariants 8, jbig2 6, jpx 7, mq 6 pass; 0 fail.

Size: test runs 30, module lines 2840
