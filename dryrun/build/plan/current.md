# Plan D27
**Status** · OPEN · BOB #1 · session_018BhcegBQhMDe3ZuS4tV1VQ · depth 3
**Jobs** · delta: DELTA #1 session_018Bhcegm41crCkEtNB3Fbs1
**Owed** · archive delta
**Round** · R1 · layer 1 CLOSED

The dry run D27 of the process repair's Phase 1 (`dryrun/CERTIFICATION.md` RP1-RP6; `lane-process-repair/CHARTER.md`): a list merge in one background run, the one-fetch Stop check, sessions on whole history, two new modules' first jobs, a superseded BOB.

## Layer 1

**alpha**
- N1 · Add the line `// D27: alpha touched` as the first line of `alpha/src/index.mjs`, then complete.

**gamma**
- N2 · gamma is a new module (its row in `build/modules.json` names no paths or tests yet). Write `gamma/src/index.mjs` exporting `gamma(x)`, which returns `alpha`'s `add(x, 1)` (import it from `../../alpha/src/index.mjs`), and `gamma/test/index.test.mjs`, a `node:test` test that `gamma(1)` is 2. Complete with `--paths gamma/src/ --tests gamma/test/`.

**delta**
- N3 · delta is a new module (its row in `build/modules.json` names no paths or tests yet). Write `delta/src/index.mjs` exporting `delta()`, which returns the string `delta`, and `delta/test/index.test.mjs`, a `node:test` test that `delta()` is `delta`. Complete with `--paths delta/src/ --tests delta/test/`.
