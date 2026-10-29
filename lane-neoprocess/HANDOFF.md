# neoProcess lane: handoff

**From** · neoProcess #7 (`session_01RAN5ektuonFFCrRnX4VvFj`), the lane's address (DRYRUN §4.22). Before it: #6 (`session_01RAN5emD7S5EJrZnC5QgPJC`), 2026-10-29 16:15Z, at 47 % of its window (a lane refreshes at half, SES 5); usage at 15:52Z 47,384,441 / 1,919,019 / 3,283 / 395,789 (cache-read / cache-write / input / output; final figures in its archive, Bob's). #5 (`session_01RAN5emC6AY4niGLmqFz54m`): 59 %, 99,506,947 / 1,492,301 / 59,012 / 240,316. #4 (`session_018BhcefACF9wymZAZpDS2Pz`): 47 %, 31,261,550 / 560,848 / 151,378 / 130,284. #3 (`session_018BhcedCh1TpUJaGQh5up8c`): 49 %, 49,144,573 / 1,464,445 / 45,593 / 335,704. #2 (`session_018BhceegtREhWFPW6rnCrDC`): 50 %, 13,854,613 / 497,976 / 14,873 / 113,987. #7 is started by Bob from `START-7.md`; it puts its own session id here. All pushed on `claude/modest-brahmagupta-vvaann`; `main` holds the commit point (PR #36, `ffc8302`); the branch is ahead of `main` by the steps after it (merged by the next PR).

**Standing** · Bob, 29 Oct: keep working until there is no way to; nothing stops for him (P19, GOV 2, code); a detail is never his (DES 1); plain words; his approval of all development and testing acts is PERMISSIONS §6; the process holds development tokens of its own (PERMISSIONS §9). Write commit messages and comments in plain words about what the code does: the auto-mode classifier reads a command's text, and twice refused #6's commands whose text discussed the classifier itself.

## Read whole, and nothing else at start

`CLAUDE.md`, `PROCESS-DESIGN.md`, `rulebooks/*.md`, `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PERMISSIONS.md`, `PRODUCT-SUPPLIES.md`, `SETUP-STEPS.md`, `PROCESS-MECHANICS.md`; this folder's `README.md`, `DRYRUN.md`, `COMMIT-POINT.md`; `tools/proc.mjs`, `tools/hooks.mjs`, `tools/acts.md`, `tools/test/proc.test.mjs`, `tools/test/hooks.test.mjs`. Not `tools/lib.mjs` or `tools/mail.mjs`, not the pages' HTML, not HISTORY.md, not a transcript.

## Where things stand

**neoProcess is in force**: certified on the dry run N1 (`dryrun/N1/CERTIFICATION.md`, DRYRUN §5), the commit point taken and merged to `main` on 29 Oct (COMMIT-POINT §2 steps 1–7; HISTORY.md's entry). Twenty-one flaws fixed with tests; suite 263 green. The toy follows `main` (neoprocess-dryrun#12). The pages are at v26 under new links (README). `proc repo setup` is built and tested on a fixture, not yet measured live (X9). BOB #2 of the run (`session_01RAN5emQV3q3LnPm2Ft8oMN`) is idle, its archive Bob's.

## What remains, in order

1. **The process's tokens** (PERMISSIONS §9): when Bob has set the GitHub token as a network secret and allowed `proc repo setup` by rule, measure X9 on a throwaway repository and record the result in §9 and `acts.md`; X10, the Cloudflare token's scope, from Bob's reading or a grant of *User API Tokens: Read*.
2. **Step 8, the product** (`bio`, to be `civicsmith`): its repository and rulesets by `proc repo setup` (or SETUP-STEPS as the fallback), `proc shims` on it by its first BOB from a ROOT Bob starts (SESSIONS §3a); `build/rulings-active.md` retires there (DESIGN-STAGE §3); its lanes opened as PRODUCT-SUPPLIES lists; the first real tranche, where X5–X8 and X11 are proven.
3. **Merge this branch to `main`** by one PR when the steps above change the tool (the suite green).
4. `dryrun/` as the suite's fixture is refreshed from the toy when the tests are next touched (COMMIT-POINT step 7).

## Acts only Bob can take (nothing waits on them)

A GitHub token for the process as a network secret on the environment, and the permission rule allowing `proc repo setup`, once (PERMISSIONS §9); the Claude app's access to a new repository; a ROOT on a new account at a move; the renames (`neoProcess`, `civicsmith`); archiving neoProcess #2–#6 and BOB #2 on his accounts; the toy's `seed-*`/`probe-*` branches; the proposed principles (the amended P17, P21–P23 on the page), when he chooses; the server-managed permission lists (PERMISSIONS §7), if he wants them.
