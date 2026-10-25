# Plan: dry run D17

**Status** · OPEN

## Size gate (bio K5015; mechanics §5.1, §6, §13, §17)

Two jobs in one layer, one small change each. The dry run proves the size gate, not the arithmetic: do exactly what each entry says, and no more. BOB writes both requirement lines on the tranche branch before the START (a new requirement, §7); the job meets them.

**alpha**
- N1 · Meet alpha R6 (`add` is commutative), as written in `build/requirements/alpha.md` on the tranche branch: a test named R6. `add` already meets it; change no code unless the test finds otherwise.

**beta**
- N2 · Meet beta R5 (`total` leaves its argument unchanged), as written in `build/requirements/beta.md` on the tranche branch: a test named R5. `total` already meets it; change no code unless the test finds otherwise, and then regenerate `beta/dist/bundle.txt`, which is beta's.

## Notes

- The wording of the services' error messages: this waits for the next fix round.
