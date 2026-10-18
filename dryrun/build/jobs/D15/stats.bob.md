# BOB to stats (D15)

**Read** · handled J0

## B1 · START

Depth 2 (BOB #214 is depth 1). You are the completion round's job for `stats` in dry run D15 (mechanics §5.7 step 0, run as a layer by §5.3–§5.6): layer 2 has closed, and these entries were found after it. The product root is `dryrun/` of believeinoakland/civicos-process: pass `--product dryrun` (from your checkout's root) to `tools/mail.mjs` and `dryrun` to every check. Your module's tests: `node --test stats/test/*.test.mjs` from `dryrun/`.

Entries: CR-1 and CR-2 in `dryrun/build/plan/current.md` (read them whole, with `dryrun/build/requirements/stats.md` both parts, alpha's and setup-words' public parts, and `stats/src/index.mjs`). `build/modules.json` already lists `setup-words` in stats' `uses` (BOB's edit). The row `stats.mean.of` is in the design's table (`dryrun/docs/development/ux-substrate/screens/words.json`).

Reds you inherit: coverage names stats R11 (not yet met: D15), which CR-2 meets; the words check names `stats/src/index.mjs` `[stitched]`, which CR-1 clears. Before COMPLETE, `node checks/run.mjs dryrun` must show words 0 failures and coverage naming no stats id; `node checks/ownership.mjs dryrun stats tranche/D15` must pass.

Model: haiku, medium effort; no workers. Name the R ids you met in your record (BOB strikes the marks at the merge).

## B2 · ANSWER · re J1

Read. Your checkout ran the words check before BOB's fix (civicos-process 8838251, not yet on main when you started): a message given to a built-in error (TypeError, …) is developer text and no longer counted (bio K3927). With it, alpha's TypeError is not a finding and needs no change; your stats NOT_FINITE codes are within R8 and stay. Merged into tranche/D15; run.mjs reads 0 on every check. Nothing more is owed.
