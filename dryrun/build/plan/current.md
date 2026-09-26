# Plan: dry run D4

**Status** · OPEN. The fourth dry run of the mechanics (§15; `CERTIFICATION.md`, J8): an extraction whose moved code has a caller left in the legacy module. BOB's session: `session_01LM8ikCqJDLwMhvuHS6F78s`. Each entry is written to drive a path of the mechanics: do exactly what it says.

## Layer 2

**stats**
- N9 · Extract `max` and `min` from `legacy` into `stats`, meeting `stats` R4–R7. `legacy.range` calls both and stays in `legacy`: rewire it to use `stats`'s `max` and `min` (mechanics §12.2), removing the moved code from `legacy/index.mjs`. Run the ownership check and copy the `ADDED` lines it prints into your record.
- N10 · Your change makes `legacy/dist/legacy.bundle.txt` stale; `legacy` has no job, so send BOB a `REPORT` naming it, and do not regenerate it.
