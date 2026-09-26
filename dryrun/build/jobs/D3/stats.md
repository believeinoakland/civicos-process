# Job record: stats (D3)

**Status** · COMPLETE (2026-09-26). Branch `job/D3/stats` (from `tranche/D3` at `19f8ff2`). This record is the job's state: a session resuming this job reads it first.

## Read

`roles/JOB.md`; `PROCESS-MECHANICS.md` §6, §12–§15; `dryrun/build/requirements/stats.md` (both parts); alpha's public part; `dryrun/build/layers.md` (layer 2: pure functions over layer 1); `dryrun/build/modules.json`; `dryrun/build/manifest.md`; stats' code and tests (empty stubs); `legacy/index.mjs`, its bundle script and generated bundle; stats' entries N6–N7 in `dryrun/build/plan/current.md`; beta's job record (format).

No ambiguity found; no QUESTION sent.

## Entries

| entry | state |
| --- | --- |
| N6 · extract `mean` into `stats` | applied |
| N7 · `legacy.max([])` REPORT | applied: REPORT 1 below, sent to BOB |

**N6** · `stats.mean(list)` returns `alpha.sum(list) / list.length`, and `0` for an empty list. `alpha.sum` is called first, for every list, so its refusal (alpha R4) is stats' R2 exactly, same `TypeError` and message. legacy's `mean` did not meet R2 (it added a string element by concatenation and carried `NaN`), so none of its body was kept, only its empty-list rule. `mean` is removed from `legacy/index.mjs`, which gains nothing (only `max` remains). No snapshot entry names built work for stats.

## Found in stats itself

- The tests were a bare stub naming no requirement. Now: R1 checks `mean` against `alpha.sum(list) / list.length` (`Object.is`) for 900+ lists (every prefix and suffix of 22 edge classes and 200 seeded values, both directions), the empty list (`+0`), overflow to `Infinity`, and a list of 10⁶ elements; R2 checks 16 kinds of non-finite-number element in 5 positions each, requiring the same error class and message as `alpha.sum`; R3 checks purity (same results after interleaved calls, nothing printed, no new globals, the argument unchanged).

## REPORT 1 (N7; about legacy, sent to BOB)

`legacy.max([])` returns **`-Infinity`** (`Math.max()` of no arguments). legacy has no requirements and no job, so this is judged against what a statistic over a list should give: a non-finite value that a caller cannot tell from a real maximum without checking, where `stats.mean([])` answers `0` by requirement. Also found while checking, same function: `max(['3', 2])` returns `3` (coerces a string), `max([NaN, 1])` returns `NaN`, `max([null])` returns `0`, and a list of 10⁶ elements throws `RangeError` (the spread passes each element as an argument). Suggestion (binds nothing): when `max` is extracted, give it a requirement for the empty list (throw, or a stated value) and alpha R4's refusal of non-finite elements, and compute it with a loop, not a spread.

## REPORT 2 (sent to BOB): `legacy/dist/legacy.bundle.txt` is stale

My removal of `mean` from `legacy/index.mjs` makes `legacy/dist/legacy.bundle.txt` stale (`node legacy/scripts/bundle.mjs --verify` prints `legacy bundle: STALE`). legacy has no job; per mechanics §14 I did not regenerate it. BOB regenerates it when the layer closes (`node legacy/scripts/bundle.mjs`, from `dryrun/`). No other generated artifact reads stats' or legacy's source.

## CHANGE (BOB, 15:57Z): BOB takeover

BOB #38's successor, `session_01CwZ4uAzLd9wAPzEWVpNVRY`, took over; only the plan's Status line changed on `tranche/D3` (`f5f19a2`), so nothing I read changed and no merge was needed. My REPORT and COMPLETE (15:56Z) were already addressed to that session, read fresh from the Status line. Nothing to redo.

## Completion

**Entries applied** · N6, N7 (above).

**Deferred** · Nothing.

**Found in other modules** · REPORT 1 (legacy `max`), REPORT 2 (legacy bundle stale).

**Tests** (from `dryrun/`)
- `node --test stats/test/*.test.mjs` · 3 tests (R1, R2, R3) · `# pass 3`, `# fail 0`.
- I provide no service used by another module, and changed none. alpha's and beta's tests as a cross-check: `# pass 11`, `# fail 0`. No layer tests (manifest).

**Checks** (from the process repository)
- `node checks/format.mjs dryrun` · `format: 4 modules, 3 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun stats` · `architecture: 2 product files, 3 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun stats` · `coverage: 1 modules, 3 of 3 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun stats tranche/D3` · `ownership: 4 files changed by stats between tranche/D3 and HEAD; 0 failures` (stats/src, stats/test, the removal in legacy/index.mjs, this record)

## Metrics

```csv
session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines
1a7b0127-d4bc-501e-baa8-4bb3d305aca1,job,stats,953091,72635,26,6754,13,2,8
```
