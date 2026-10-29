# neoProcess lane: handoff

**From** · neoProcess #6 (`session_01RAN5emD7S5EJrZnC5QgPJC`), the lane's address from 2026-10-29; it took over from neoProcess #5 (`session_01RAN5emC6AY4niGLmqFz54m`), whose handoff this is: 2026-10-29 14:13Z, at 59 % of its window (Bob's word: refresh); usage 99,506,947 / 1,492,301 / 59,012 / 240,316 (cache-read / cache-write / input / output; final figures in its archive, Bob's). #4 (`session_018BhcefACF9wymZAZpDS2Pz`): 47 %, 31,261,550 / 560,848 / 151,378 / 130,284. #3 (`session_018BhcedCh1TpUJaGQh5up8c`): 49 %, 49,144,573 / 1,464,445 / 45,593 / 335,704. #2 (`session_018BhceegtREhWFPW6rnCrDC`): 50 %, 13,854,613 / 497,976 / 14,873 / 113,987. #6 was started by Bob from `START-6.md`; BOB #2 reads its lane's address from this line. All pushed on `claude/modest-brahmagupta-vvaann` (PR #36, draft).

**Standing** · Bob, 29 Oct: keep working until there is no way to; nothing stops for him (P19, GOV 2, code); a detail is never his (DES 1); plain words; his approval of all development and testing acts is PERMISSIONS §6. This account's meter: unknown until he reads it.

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PERMISSIONS.md`, `PRODUCT-SUPPLIES.md`, `DRYRUN.md`, `SETUP-STEPS.md`, `COMMIT-POINT.md`, `n1/START-BOB.md`, `rulebooks/*.md` (not `rulebooks/work/`); `tools/neo.mjs`, `tools/neo-hooks.mjs`, `tools/acts.md`, `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs`, not the pages' HTML, not a transcript (a Haiku worker reads one).

## Where things stand

The dry run N1 runs on `believeinoakland/neoprocess-dryrun` (public, Bob's personal account; log DRYRUN §5). BOB #3 (`session_01RAN5emPdCiSTDkQW4nz7cb`, started by #6 at 14:24Z on `tranche` @ 35e4920) closes it: the completion round R2 is closed; the lanes' archives, `tranche close`, the close PR to `main`, `tranche merged`, `epoch close`; rows P20, J10, D4, X3 and X1's last acts. The rows proven after the merge are written by the lane in `dryrun/N1/CERTIFICATION.md` here (nothing is pushed to `tranche` once `main` holds it). BOB #2 handed off at 67 % and is idle; its archive was refused to #6 by the classifier (Bob's); its row is from `get_session` (sent to BOB #3). Eighteen flaws fixed with tests (DRYRUN §4: 16 the last BOB's row, `bob archived --tranche`; 17 every role's Stop hook enforces its context threshold; 18 a BOB's goal counts its handoff as met); suite green (289). REP 9–10 and GOV 9 rewritten for the permissions as built. Commit point step 1 (`neo` → `proc`) is being prepared by a worker in a worktree, not pushed: merged only after the run closes.

## What remains, in order

1. **The run's close**: BOB #3's report; archive BOB #3 (#6 created it) and record its row in DRYRUN §5 (no next tranche on the toy); write the post-merge rows into `dryrun/N1/CERTIFICATION.md` from the toy's `main`, with their evidence.
2. **The commit point** (`COMMIT-POINT.md`): step 1 from the worker's commit, then steps 2–8. `mechanics-citations.md` is step 5's input.
3. **Permissions**: rows X1–X8 from the toy's certification into PERMISSIONS §4 and acts.md.
4. **The page** (v25) final at the commit point.

## Acts only Bob can take (nothing waits on them)

A repository's two rulesets, once (SETUP-STEPS); the Claude app's access to a new repository; a ROOT on a new account at a move; the renames; archiving #2–#5 and the dry run's BOB #2 (`session_01RAN5emQV3q3LnPm2Ft8oMN`, refused to #6); the toy's `seed-*`/`probe-*` branches.
