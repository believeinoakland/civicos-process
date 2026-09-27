# Job record: gamma, D8

**Status** · session_01WMFJCpVNFRMgJU6QU23Ssb · depth 2 · COMPLETE · sent J1 · handled B1

## Entries applied

- **N3** · gamma written (a new module): `gamma/src/index.mjs` provides `double(x)`, which returns `alpha.add(x, x)` (R1) and so throws alpha's `TypeError` for anything that is not a finite number, coercing nothing (R2); it keeps no state and does no input or output (R3). Tests in `gamma/test/gamma.test.mjs`, one per requirement, at the interface:
  - R1: `double(x)` equals `alpha.add(x, x)` (and `x + x`, by `Object.is`) for every class of finite number: signed zeros, subnormals, the extremes (doubling `MAX_VALUE` overflows to `Infinity`, as `add` does), integers around 2^53, rounding fractions, and 500 seeded values across magnitudes.
  - R2: every kind of value that is not a finite number (`NaN`, both infinities, strings, `null`, `undefined`, booleans, a BigInt, objects, arrays, a function, a Symbol, a boxed `Number`, no argument) throws a `TypeError`, as `alpha.add` does for the same value.
  - R3: results do not depend on call history; nothing is written to the console, stdout or stderr, and no global is added.

## Deferred

Nothing.

## Found in other modules

Nothing. (Note, not a flaw: an R1 result can be `±Infinity` for a finite `x` past `MAX_VALUE / 2`, since R1 is defined as `alpha.add(x, x)` and alpha R1 carries overflow as ordinary addition does.)

## Tests and checks

- `node --test gamma/test/*.test.mjs` (from `dryrun/`): `# tests 3 · # pass 3 · # fail 0`
- `node checks/format.mjs dryrun`: `format: 6 modules, 4 requirements files; 0 failures`
- `node checks/architecture.mjs dryrun gamma`: `architecture: 2 product files, 3 relative imports (0 naming no tracked file, not judged); 0 failures`
- `node checks/coverage.mjs dryrun gamma`: `coverage: 1 modules, 3 of 3 live requirement ids named by a test; 0 failures`
- `node checks/ownership.mjs dryrun gamma tranche/D8`: `ownership: 3 files changed by gamma between tranche/D8 and HEAD; 0 failures`

Size (session_01WMFJCpVNFRMgJU6QU23Ssb): test runs 1, module lines 7

## From GAMMA #1 (D8): COMPLETE J1

N3 applied: gamma's `double(x)` meets R1–R3, each named by a test that checks it in full. Module tests 3/3 pass; format, architecture, coverage and ownership checks report 0 failures. Nothing deferred, nothing found in other modules. Record: `dryrun/build/jobs/D8/gamma.md` on `job/D8/gamma`.
