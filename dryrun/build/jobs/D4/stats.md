# Job record: stats (D4)

**Status** · COMPLETE (2026-09-26), QUESTION 1 answered on my best reading unless BOB rules otherwise. Session `session_01WXWwzMNYQtoREMdzBRQZMW` (STATS #2). Branch `job/D4/stats` (from `tranche/D4` at `246f138`). This record is the job's state: a session resuming this job reads it first.

## Read

`roles/JOB.md`; `PROCESS-MECHANICS.md` whole (§12.2 and §8.3 as revised by BOB #42); `dryrun/build/requirements/stats.md` (both parts); alpha's public part; `dryrun/build/layers.md`; `dryrun/build/modules.json`; `dryrun/build/manifest.md`; stats' code and tests; `legacy/index.mjs`, its bundle script and generated bundle; `checks/ownership.mjs`; my entries N9–N10 in `dryrun/build/plan/current.md`; my D3 record (format).

## QUESTION 1 (sent to BOB)

R4–R7 say what `max` and `min` return for a non-empty list of numbers and that an empty list is refused, but not what they do with an element that is not a number, is `NaN`, or is ±Infinity (legacy's `max` coerced `'3'`, carried `NaN`, and read `null` as `0`; D3's REPORT 1). **My best reading, which I am building on:** as `mean` (R2) and alpha R4 do, `max` and `min` refuse an element that is not a finite number with a `TypeError`, nothing coerced or skipped; the empty list is refused with a `RangeError` first. `+0` and `-0` compare equal; I return what `Math.max`/`Math.min` would (`max([-0, 0])` is `+0`, `min([0, -0])` is `-0`). If you rule otherwise (for example ±Infinity accepted), I change only the element check and its test.

## Entries

| entry | state |
| --- | --- |
| N9 · extract `max` and `min` into `stats`, rewire `legacy.range` | applied |
| N10 · `legacy/dist/legacy.bundle.txt` stale | applied: REPORT 1 below, sent to BOB; not regenerated |

**N9** · `stats.max(list)` and `stats.min(list)` share one loop (`extreme`): an empty list throws `RangeError` first (R5, R7); each element must be a finite number or it throws `TypeError` (QUESTION 1's reading); the running extreme is kept with `Math.max`/`Math.min` of two values, so ±0 come out as `Math` gives them. legacy's bodies were not kept: `max` spread the list (RangeError past ~10⁵ elements, `-Infinity` for `[]`), `min` returned `Infinity` for `[]`, and both coerced or carried non-numbers (D3's REPORT 1). `max` and `min` are removed from `legacy/index.mjs`; `range` stays there, unchanged, and now calls `stats`'s through one added import. No other product file imports legacy (grep), so nothing called `legacy.max`/`legacy.min`; they are not re-exported.

Behaviour of `legacy.range` that changes with the rewiring (legacy has no requirements, so noted for BOB, not judged): `range([])` was `-Infinity` and is now `RangeError: max: empty list`; an element that is not a finite number was coerced or carried (`range(['3', 1])` was `2`) and is now a `TypeError`; a list past the spread limit threw `RangeError` and now works.

**Ownership check's ADDED lines** (copied from its output):

```
ADDED legacy/index.mjs:2  import { max, min } from '../stats/src/index.mjs';
ownership: 4 files changed by stats between tranche/D4 and HEAD; legacy: 1 line(s) added, 11 removed; 0 failures
```

## Found in stats itself

- The tests covered only `mean`. Now also: R4/R6 check `max`/`min` on 900+ lists (every prefix and suffix of 22 edge classes and 200 seeded values, both directions), each result an element that no element exceeds (undercuts), equal (`Object.is`) to a reference loop and to `Math.max`/`Math.min`, with ±0, subnormals, duplicates and a list of 10⁶ elements; R5/R7 the `RangeError` on an empty list; one test (R4 R6) the `TypeError` for 16 kinds of non-finite element in 5 positions each; R3's purity test now covers all three functions.

## REPORT 1 (N10; about legacy, sent to BOB): `legacy/dist/legacy.bundle.txt` is stale

My change to `legacy/index.mjs` (removing `max` and `min`, importing them from `stats`) makes `legacy/dist/legacy.bundle.txt` stale: `node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`. legacy has no job; per mechanics §14 I did not regenerate it. BOB regenerates it at the layer close (`node legacy/scripts/bundle.mjs`, from `dryrun/`). Note for BOB: the bundle script concatenates only `alpha/src/index.mjs` and `legacy/index.mjs`, so the regenerated bundle will hold legacy's import of `../stats/src/index.mjs` without stats' source; if the bundle is meant to be self-contained, `legacy/scripts/bundle.mjs` needs `stats/src/index.mjs` in its parts (legacy's file, not mine).

## Completion

**Entries applied** · N9, N10 (above).

**Deferred** · Nothing.

**Found in other modules** · REPORT 1 (legacy bundle stale; bundle script omits stats' source). legacy.range's changed behaviour, above.

**Tests** (from `dryrun/`)
- `node --test stats/test/*.test.mjs` · 8 tests (R1, R2, R3, R4, R5, R6, R7, R4 R6 refusal) · `# pass 8`, `# fail 0`.
- I provide no service used by another module and changed none; legacy (no tests) calls `max` and `min`: `range([3,1,7])` is `6`. alpha's and beta's tests as a cross-check: `# pass 11`, `# fail 0`. No layer tests (manifest).
- The checks' own tests (process repository): `# pass 26`, `# fail 0`.

**Checks** (from the process repository)
- `node checks/format.mjs dryrun` · `format: 4 modules, 3 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun stats` · `architecture: 2 product files, 3 relative imports (0 naming no tracked file, not judged); 0 failures`; whole product: `architecture: 11 product files, 7 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun stats` · `coverage: 1 modules, 7 of 7 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun stats tranche/D4` · `ownership: 4 files changed by stats between tranche/D4 and HEAD; legacy: 1 line(s) added, 11 removed; 0 failures`

## Metrics

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
session_01WXWwzMNYQtoREMdzBRQZMW,job,stats,1465299,86688,36,10891,18,3,31
```
