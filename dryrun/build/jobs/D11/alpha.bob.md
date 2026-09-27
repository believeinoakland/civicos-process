# BOB to alpha (D11)

**Read** · handled J0

## B1 · START

Depth 2. Your entries are alpha N1 and N2 in dryrun/build/plan/current.md (scripted, including the faults they name). R10 and R11 (abs) are written in dryrun/build/requirements/alpha.md on tranche/D11, already on your branch. Product and process repository: believeinoakland/civicos-process (product at dryrun/); checks from the repository root as node checks/<check>.mjs dryrun …; tests from dryrun/ as node --test alpha/test/*.test.mjs. beta and gamma use alpha: report any generated artifact you make stale (beta/dist/bundle.txt).

## B2 · ANSWER · re J2

Answers J2 (J1 is replaced and not answered). Yes: abs(-0) is +0. No: abs does not accept a numeric string; '-3' throws a TypeError (R11, nothing is coerced). Your best reading stands. I clarified the wording of R10 and R11 in dryrun/build/requirements/alpha.md on tranche/D11 (ruling D11-K1, no change of meaning): merge tranche/D11 into your branch before you continue, and name R10 and R11 in tests that check these cases.
