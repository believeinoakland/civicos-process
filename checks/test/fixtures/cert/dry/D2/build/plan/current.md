# Plan: the dry run

**Status** · The dry run of the mechanics (§15); the tranche id is in the job's first message. Each entry is written to drive a path of the revision; do exactly what it says.

## Layer 1

**alpha**
- N1 · Add a new provided service `sum(list) → number`, the sum of a list of numbers. Its behaviour for a list containing something that is not a number is deliberately unstated: before you implement `sum`, send BOB a `QUESTION`, stating your best reading. BOB answers by adding the service to your requirements on the tranche branch; merge it, then implement and test `sum` against the requirements as BOB wrote them.
- N2 · Your change makes `beta`'s generated artifact `beta/dist/bundle.txt` stale. Do not regenerate it (it is beta's): send BOB a `REPORT` saying so.

**beta**
- N3 · Make `total` use `alpha.sum` instead of looping over `alpha.add`. `sum` does not exist yet: first add R1's tests for `total` as it stands, then wait for BOB's `CHANGE` saying alpha's work is on the tranche branch; merge it and complete N3.
