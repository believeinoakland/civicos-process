# Job record: alpha, D8

**Status** · session_01ALPHAoneAAAAAAAAAAAAAA · depth 2 · COMPLETE · sent J3 · handled B3

## From ALPHA #1 (D8): QUESTION J1

R3 says `sum` of an empty list "fails"; does it throw, or return `null`? Best reading: it throws `RangeError`. Carrying on with the rest.

## From ALPHA #1 (D8): QUESTION J2 replaces J1

Revised on evidence: `stats` already calls `sum([])` and expects `0`. Does R3 mean `0`? Best reading: `0`, and R3's wording is stale. Only R3's test waits on it.

ANSWER B2 re J1 handled, not applied (J1 replaced by J2). ANSWER B3 re J2: `0`; R3 reworded on `tranche/D8` @ 1234567890, merged.

## From ALPHA #1 (D8): COMPLETE J3

**Entries applied:** N1 (empty list returns `0`, R3 as reworded).
**Deferred:** none.
**Reports:** none.
**Tests and checks:** `node --test test/alpha/*.test.mjs`: tests 4, pass 4, fail 0. `format`: 0 failures. `architecture alpha`: 0 failures. `coverage alpha`: 4 of 4 live ids named. `ownership alpha tranche/D8`: 0 failures.

Size (session_01ALPHAoneAAAAAAAAAAAAAA): test runs 3, module lines 57
