# Job record: stats (D4)

**Status** · IN PROGRESS. Session `session_01WXWwzMNYQtoREMdzBRQZMW` (STATS #2). Branch `job/D4/stats` (from `tranche/D4` at `246f138`). This record is the job's state: a session resuming this job reads it first.

## Read

`roles/JOB.md`; `PROCESS-MECHANICS.md` whole (§12.2 and §8.3 as revised by BOB #42); `dryrun/build/requirements/stats.md` (both parts); alpha's public part; `dryrun/build/layers.md`; `dryrun/build/modules.json`; `dryrun/build/manifest.md`; stats' code and tests; `legacy/index.mjs`, its bundle script and generated bundle; `checks/ownership.mjs`; my entries N9–N10 in `dryrun/build/plan/current.md`; my D3 record (format).

## QUESTION 1 (sent to BOB)

R4–R7 say what `max` and `min` return for a non-empty list of numbers and that an empty list is refused, but not what they do with an element that is not a number, is `NaN`, or is ±Infinity (legacy's `max` coerced `'3'`, carried `NaN`, and read `null` as `0`; D3's REPORT 1). **My best reading, which I am building on:** as `mean` (R2) and alpha R4 do, `max` and `min` refuse an element that is not a finite number with a `TypeError`, nothing coerced or skipped; the empty list is refused with a `RangeError` first. `+0` and `-0` compare equal; I return what `Math.max`/`Math.min` would (`max([-0, 0])` is `+0`, `min([0, -0])` is `-0`). If you rule otherwise (for example ±Infinity accepted), I change only the element check and its test.
