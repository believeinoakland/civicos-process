# Plan: dry run D5

**Status** · OPEN. The fifth dry run of the mechanics (§15; `CERTIFICATION.md`, J9): an extraction from two legacy modules, one of them earlier in the order than the target. BOB's session: `session_01LM8ikCqJDLwMhvuHS6F78s`. Each entry is written to drive a path of the mechanics: do exactly what it says.

## Layer 2

**stats** (`from`: `catalog` and `legacy`)
- N11 · Extract the duplicate check from `catalog` into `stats` as `distinct` (R9). `catalog` is earlier in the order than `stats` and cannot import it: remove `hasDuplicate` and its use from `catalog/index.mjs`, adding nothing there. `legacy.validate` calls `catalog.checkList` and must still return exactly the findings it returned before for every input: rewire it in `legacy/index.mjs` to add the `'duplicate'` finding from `stats.distinct` (mechanics §12.2). Run the ownership check and copy its `ADDED` lines and summary into your record.
- N12 · Your change makes `legacy/dist/legacy.bundle.txt` stale; send BOB a `REPORT` naming it, and do not regenerate it.
