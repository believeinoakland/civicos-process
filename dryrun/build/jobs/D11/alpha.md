# alpha (D11)

**Status** · session_011V7Yi2Fr9EzggtqCyXxoVb · depth 2 · COMPLETE · handled B2

## J1 · QUESTION

N2, Q1: must abs(-0) be +0? Best reading: yes (R10's absolute value of -0 is +0, as Math.abs gives).

## J2 · QUESTION

N2, Q2 (replaces J1): must abs(-0) be +0, and must abs accept a numeric string? Best reading: +0 (as Math.abs gives), and no: a string such as '-3' throws a TypeError (R11, nothing is coerced).

## J3 · REPORT

Stale generated artifact (mechanics §14): adding abs to alpha/src/index.mjs makes beta/dist/bundle.txt stale. From dryrun/: node beta/scripts/bundle.mjs --verify prints 'bundle: STALE', and beta's test 'R2 the committed bundle is exactly what the bundle script would write' fails (5 pass, 1 fail). Both were fresh/green before my change (checked with it stashed). I have not regenerated it: it is beta's (node beta/scripts/bundle.mjs).

## J4 · COMPLETE

Entries applied: N1 (abs(a) in alpha/src/index.mjs: Math.abs of a finite number, abs(-0) is +0; a TypeError for anything else, numeric strings and Number objects included) and N2 (J1 posted and rung, J2 replacing it posted and rung at once; applied only B2, the answer to J2; merged tranche/D11 for D11-K1's wording of R10, R11).
Deferred: nothing.
Other modules: beta/dist/bundle.txt is stale from this change (REPORT J3); beta's R2 test fails until beta regenerates it. gamma and stats tests pass unchanged.
Tests (from dryrun/): node --test alpha/test/*.test.mjs: tests 11, pass 11, fail 0 (new: R10, R11; R2's purity test now covers abs). Users of alpha: beta pass 5 fail 1 (the stale bundle, R2), gamma pass 5 fail 0, stats pass 10 fail 0.
Checks (from the repository root): format: 6 modules, 4 requirements files; 0 failures. architecture: 2 product files, 1 relative imports (0 naming no tracked file, not judged); 0 failures. coverage: 1 modules, 11 of 11 live requirement ids named by a test; 0 failures. ownership: 3 files changed by alpha between tranche/D11 and HEAD; 0 failures.
Size (session_011V7Yi2Fr9EzggtqCyXxoVb): test runs 7, module lines 35
