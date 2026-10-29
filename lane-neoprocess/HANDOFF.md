# neoProcess lane: handoff

**From** · neoProcess #6 (`session_01RAN5emD7S5EJrZnC5QgPJC`), the lane's address from 2026-10-29; it took over from neoProcess #5 (`session_01RAN5emC6AY4niGLmqFz54m`), whose handoff this is: 2026-10-29 14:13Z, at 59 % of its window (Bob's word: refresh); usage 99,506,947 / 1,492,301 / 59,012 / 240,316 (cache-read / cache-write / input / output; final figures in its archive, Bob's). #4 (`session_018BhcefACF9wymZAZpDS2Pz`): 47 %, 31,261,550 / 560,848 / 151,378 / 130,284. #3 (`session_018BhcedCh1TpUJaGQh5up8c`): 49 %, 49,144,573 / 1,464,445 / 45,593 / 335,704. #2 (`session_018BhceegtREhWFPW6rnCrDC`): 50 %, 13,854,613 / 497,976 / 14,873 / 113,987. #6 was started by Bob from `START-6.md`; BOB #2 reads its lane's address from this line. All pushed on `claude/modest-brahmagupta-vvaann` (PR #36, draft).

**Standing** · Bob, 29 Oct: keep working until there is no way to; nothing stops for him (P19, GOV 2, code); a detail is never his (DES 1); plain words; his approval of all development and testing acts is PERMISSIONS §6. This account's meter: unknown until he reads it.

## Read whole, and nothing else at start

`PROCESS-DESIGN.md`; this folder's `README.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PERMISSIONS.md`, `PRODUCT-SUPPLIES.md`, `DRYRUN.md`, `SETUP-STEPS.md`, `COMMIT-POINT.md`, `n1/START-BOB.md`, `rulebooks/*.md` (not `rulebooks/work/`); `tools/neo.mjs`, `tools/neo-hooks.mjs`, `tools/acts.md`, `tools/test/neo*.test.mjs`. Not the mechanics, not `tools/proc.mjs`, not the pages' HTML, not a transcript (a Haiku worker reads one).

## Where things stand

**The dry run N1 is closed** (29 Oct 14:39Z; DRYRUN §5): every row of `dryrun/N1/CERTIFICATION.md` (copied from the toy's `main` 3dcd423, the post-merge evidence written here) reads PROVEN or names its product run (P15, X4, X6–X8). Twenty-one flaws found and fixed with tests (DRYRUN §4; 21 is fixed at the commit point); suite green (289). BOB #3 archived by #6; BOB #2 (`session_01RAN5emQV3q3LnPm2Ft8oMN`) idle, its archive Bob's. REP 9–10 and GOV 9 rewritten for the permissions as built. Commit point step 1 (`neo` → `proc`, `tools/lib.mjs`; 262 tests green, the 27 of the retired tool gone) is local commits on the worktree branch `worktree-agent-a8187b29f2e92d6ed` of this checkout, merged with the lane's tip, not yet pushed.

## What remains, in order

1. **The commit point** (`COMMIT-POINT.md` §2): step 1 fast-forwarded from the worktree branch onto the lane (the toy follows this branch: its `CLAUDE.md` and `gate.yml` name `neo.mjs`; step 7 refreshes it); flaw 21 (`refused routed --tranche`; `epoch close` on an OPEN refusal); then steps 2–8, each one commit with the suite green. `mechanics-citations.md` is step 5's input.
2. **Permissions**: rows X1–X8 from `dryrun/N1/CERTIFICATION.md` into PERMISSIONS §4 and `acts.md`'s measured column.
3. **The page** (v25) final at the commit point; the lane's `README.md` table folded into the root README (step 6).

## Acts only Bob can take (nothing waits on them)

A repository's two rulesets, once (SETUP-STEPS); the Claude app's access to a new repository; a ROOT on a new account at a move; the renames; archiving #2–#5 and the dry run's BOB #2 (`session_01RAN5emQV3q3LnPm2Ft8oMN`, refused to #6); the toy's `seed-*`/`probe-*` branches.
