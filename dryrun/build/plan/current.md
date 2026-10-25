# Plan: dry run D18

**Status** · OPEN · BOB #294 · session_01XtZDGYwxYSYJSAoejQAGGw · depth 1

**Jobs** · alpha: ALPHA #1 session_01D6urVCwYA9jso1Zm2NvAuS

## Size gate scoped to reading sets; the refused-act rule (bio K5123, K5120; mechanics §13, §17; roles/JOB.md)

Two jobs in one layer, one small change each. The dry run proves the gate's scope and JOB.md's refused-act rule, not the arithmetic: do exactly what each entry says, and no more. BOB writes both requirement lines on the tranche branch before the START (a new requirement, §7); the job meets them.

**alpha**
- N1 · Meet alpha R6 (`add(a, 0)` is `a`), as written in `build/requirements/alpha.md` on the tranche branch: a test named R6. `add` already meets it; change no code unless the test finds otherwise.

**beta**
- N2 · Meet beta R5 (`total([x])` is `x`), as written in `build/requirements/beta.md` on the tranche branch: a test named R5. `total` already meets it; change no code unless the test finds otherwise, and then regenerate `beta/dist/bundle.txt`, which is beta's.

## Notes

- Planted (SG6-SG8): `build/rulings-active.md` is over BOB's limit and `build/handoff.md` is over 95 % of it; neither is a job's reading set.
