# Plan: dry run D1

**Status** · The dry run of mechanics revised 2026-09-26 (§15). Each entry is written to drive a path of the revision; do exactly what it says.

## Layer 1

**alpha**
- N1 · Add a new provided service `sum(list) → number`, the sum of a list of numbers. Its behaviour for a list containing something that is not a number is deliberately unstated: before you implement `sum`, ask BOB with a `QUESTION` comment, stating your best reading. BOB answers by adding the service to your requirements on the tranche branch; merge it, then implement and test `sum` against the requirements as BOB wrote them.
- N2 · Your change makes `beta`'s generated artifact `beta/dist/bundle.txt` stale. Do not regenerate it (it is beta's): send a `REPORT` comment saying so.

**beta**
- N3 · Make `total` use `alpha.sum` instead of looping over `alpha.add`. `sum` does not exist yet: first add R1's tests for `total` as it stands, then wait for BOB's `CHANGE` saying alpha's work is on the tranche branch; merge it and complete N3.
