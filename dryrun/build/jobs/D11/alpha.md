# alpha (D11)

**Status** · session_011V7Yi2Fr9EzggtqCyXxoVb · depth 2 · WORKING · handled B2

## J1 · QUESTION

N2, Q1: must abs(-0) be +0? Best reading: yes (R10's absolute value of -0 is +0, as Math.abs gives).

## J2 · QUESTION

N2, Q2 (replaces J1): must abs(-0) be +0, and must abs accept a numeric string? Best reading: +0 (as Math.abs gives), and no: a string such as '-3' throws a TypeError (R11, nothing is coerced).

## J3 · REPORT

Stale generated artifact (mechanics §14): adding abs to alpha/src/index.mjs makes beta/dist/bundle.txt stale. From dryrun/: node beta/scripts/bundle.mjs --verify prints 'bundle: STALE', and beta's test 'R2 the committed bundle is exactly what the bundle script would write' fails (5 pass, 1 fail). Both were fresh/green before my change (checked with it stashed). I have not regenerated it: it is beta's (node beta/scripts/bundle.mjs).
