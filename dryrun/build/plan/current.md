# Plan D19

**Status** · OPEN · BOB #1 · session_01WPPHiKWTxangtKbuuHat16 · depth 1
**Owed** · start alpha; start beta
**Round** · R1 · layer 1 OPEN

The dry run D19 of the process redesign (lane-process-redesign/DESIGN.md §5; dryrun/CERTIFICATION.md, D19).

## Layer 1

**alpha**
- N1 · Add the provided service `mul(a, b) → number` that meets alpha R6 (in alpha's requirements, marked not yet met; replace the `test.todo` for R6 with a real test). R6 does not say what `mul` does when an argument is not a finite number: ask BOB (set your state WAITING with the question and your best reading, then message BOB), carry on with your best reading, and meet BOB's answer.
- N2 · Once, before you complete, run `git push origin HEAD:refs/heads/tranche/D19` and quote in your report what refused it.

**beta**
- N3 · Add the line `// D19` at the top of `beta/src/index.mjs`, then complete. BOB will later send you a CHANGE in this same session: apply it, then complete again.
