# Lane: the process redesign (PROCESS-REDESIGN)

**Status** · Open. Chartered by BOB #314, 2026-10-26, on Bob's direction (bio K5334): "start a separate lane for the process update that is coming. Doing the update separate from BOB allows the development moving toward the alpha release the opportunity to proceed without delaying the process update. I think that there's a very high chance that the current process won't be able to do the release in it's current state."

**Evidence (P21).** Every report entry this lane writes carries `Evidence:` (a command run with its result, a file:line, or a test run with its totals); state as fact only what you read or ran.

## The job
Redesign how CivicOS is built so it stops failing (bio K5319, K5321, K5322), following Claude Code's best practices as Bob directed (K5326: "Step that must aways happen belong in code, not instructions! Follow all of these best practices."), build it, and certify it by a dry run (P3) so it is ready to replace today's process the moment T51 closes, or sooner if Bob so decides.

## Read first, whole (from `believeinoakland/bio`, branch `tranche/T51`)
- This repository's `PROCESS-DESIGN.md`, `PROCESS-MECHANICS.md`, `roles/BOB.md`, `roles/JOB.md`, `roles/ROOT.md`, `tools/mail.mjs`'s header.
- bio `build/plan/draft-process-redesign.md` (the plan, BOB #313) and `build/plan/draft-process-inventory.md` (140 rules classed CODE/SKILL/INDEX/PRODUCT/RETIRE; read by a worker told the task if it will not fit).
- bio `build/rulings.md` K5317-K5334 (today's diagnosis and Bob's direction) and `build/rulings-active.md`.
- bio `build/plan/premerge.mjs`, `build/plan/watch-job.sh`, `build/plan/bob-rulings-check.mjs` (procedures already moved into code).

## Work, in order (the draft's, kept)
1. Settle the inventory's conflicts; class every rule.
2. CODE first (mail tool and scripts, each with a fixture test): COMPLETE moves the cursor or refuses; `ring` (the next whole minute, the live address, refusing an archived session); `takeover` (§5.1 whole); `merge` (premerge, push, ruling stub, row, retire); a predecessor BOB that keeps acting after a takeover is refused by the tool.
3. Hooks for what tools cannot see: written here, added by Bob to the settings files (K1702), BOB walks him through it.
4. Skills, one per situation, under `.claude/skills/`; the role files become a short index by situation; Bob's product rulings apart from process rules (K5323).
5. Certify (P3, mechanics §15): a dry run in `dryrun/`, recorded in `dryrun/RUNS.md`.
6. A rendered report for Bob through BOB: what changed against today's failure list, the hooks he adds, any principle text changed, with options and a recommendation.

## How the lane works
- Its record is this folder, on branch `lane/process-redesign` of this repository; its code, skills and dry run are written on that branch too. It never changes this repository's `main`, the bio repository, a running job, or the process BOB is using: the redesign reaches use only after certification, by BOB's merge at a tranche boundary (P3, P12), or sooner only on Bob's ruling.
- It reports to BOB in `HANDOFF.md` here (entries `R<n>`, newest last), read by BOB at takeover and each backstop check; a question for Bob goes there with an explanation, options and a recommendation, and BOB puts it to him (P17). Mechanics and tool text that change no principle are decided by the lane and BOB, never asked of Bob (K5036).
- If it sees a fault in how BOB is carrying the alpha release, it writes it in `HANDOFF.md` at once, marked `RELEASE`.
- No credential is printed or committed. A refused act is never worked around: it is recorded in `HANDOFF.md`.
- Workers name model and effort (bio K3518): haiku at low for mechanical work, sonnet at medium for reading. Reading is whole, never scanned (P20).
- The lane hands over when its context passes half its window: `HANDOFF.md` names the next steps, and BOB starts PROCESS-REDESIGN #n+1.
