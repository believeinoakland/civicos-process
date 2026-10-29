# The dry run that certifies neoProcess (P3)

**Status** · Draft, neoProcess #3, 2026-10-29. The rows it proves are in `PROTOCOL.md` §10, `JOB-LIFE.md` §13 and `DESIGN-STAGE.md` §5; each becomes a row of the toy's `CERTIFICATION.md`. This file says what the run needs and in what order it goes.

## 1. What it needs (Bob's acts, P17): done 29 Oct

A toy product repository of its own, `believeinoakland/neoprocess-dryrun` (the toy lives in `dryrun/` here, but a product's `CLAUDE.md`, skill and workflow sit at a repository root, and a ruleset targets a repository's branch). Bob made it 29 Oct, public under his personal account; GitHub offers a merge queue only on a repository owned by an organization, so there is none and the tool merges (JOB-LIFE §1, §6, decided by #5 from what it measured there, §12). On it, once, by Bob: the ruleset on `tranche` (no force push, no deletion; its required check `gate` removed, because a required check refuses every direct push, SETUP-STEPS) and the one on `main` (a pull request required); no auto-merge, no secret: the process repository is public (Bob's act, 29 Oct). The seed was pushed to `main` by #5 the same day (SEED step 5). Everything below the rulesets was rehearsed on fixture tests first (`tools/test/neo*.test.mjs` run the whole life against a real git remote).

## 2. The order

1. **Seed.** As `n1/SEED.md` says, step by step: BOB clones the toy repository, copies `dryrun/` into its root and `n1/overlay/` over it (the requirements written ahead with `*(not yet met: N1)*` marks, the canon of the two areas, `build/areas.md`, the two area rulebooks, the manifest), removes the old mechanics' runs, runs `neo shims`, pushes `main`, and opens the tranche with `n1/plan.md`: every entry drives a row of `n1/CERTIFICATION.md` (one row per path of PROTOCOL §10, JOB-LIFE §13 and DESIGN-STAGE §5, each naming its driver and its evidence). The seeded toy was built in a scratch directory on 29 Oct (#4): the checks green, 20 module tests green, every START under 4 KB.
2. **Open.** From the toy's BOB session (`/neoprocess bob`): `neo epoch open`, `neo takeover`, `neo lane open` for ARITH (started at once) and STATISTICS (left dormant: its first ask starts it, row P19; two lanes because one row is a lane's question to another lane through BOB), `neo layer start --layer 1`; the printed PR and session calls, one by one, each recorded by its `neo` command.
3. **Run the rows.** Each row is driven by an entry or by an act of BOB's (listed at the end of `n1/SEED.md`) (a refresh with a `Working` line out, a lane past half its window, a killed worker, a message before its push, a duplicate number), and proved by what git and GitHub show, never by a session's report (P20): the ask file's stages, the PR's comments and checks, the state branch's lines, the metrics rows. The account move row is recorded as §15 allows, between Bob's two real accounts only.
4. **Close.** `neo layer close`, the archives, `neo epoch close` (the state branch gone, every durable file on `tranche`), the close PR to `main` merged by BOB with the plan reading CLOSING; `CERTIFICATION.md` with one row per proof, each naming its evidence.
5. **The commit point.** Only when every row holds: `neo` takes the `proc` name, the old tool, skills and mechanics are rewritten from the lane's files, and the rulebooks move to `rulebooks/`.

## 3. What is measured only here (JOB-LIFE §12)

The tool's merge on `tranche` (JOB-LIFE §6): the gate on a pull request, a branch behind the tranche updated by `update_pull_request_branch` and the gate run on it, the merge by the printed call, the `pull_request.closed` event after it. (Whether a `/goal` message sets a goal again after a wait was measured on 29 Oct: it does not, SESSIONS §1b.)

## 4. Flaws the run found (P3: each fixed in the tool before the run went on, with a fixture test)

1. **An empty pull request is refused** (BOB #1, R-BOB-1-1, SEED step 8): GitHub refuses a PR with no commit between base and head, and `layer start` made job branches at the tranche tip. Fix `b3ff809`: an opening commit on every job branch; a START made and not yet opened is remade by the same call; the gate reads an empty diff as nothing yet.
2. **A lane started before any ask could not meet its goal** (ARITH #1 via BOB #1): the goal named an ask, and no command recorded a lane's wait. Fix `cba1554`: `neo lane state --set`; the goal is met with no ask open, so such a lane idles until a message.
3. **The proxy refuses every remote ref delete** (BOB #1, R-BOB-1-2; confirmed by #5 on a probe branch: `unexpected disconnect`, the branch kept). Fix `164445b`: no command deletes a branch; a job branch is remade by an opening commit over what is there (a merged tip takes both parents); `merged` and `epoch close` print the dispatch of the product's `prune.yml` (`workflow_dispatch`; `state/*` and merged `job/*`), measured on the toy: run 40827749216 deleted `job/probe` in 11 s. Leftover toy branches `seed-*`, `probe-delete` are Bob's to delete in the UI; harmless.
4. **A re-dispatch could not be recorded** (BOB #1, row P10): `ask dispatch` refused while work was out. Fix: `--again [--why]` re-dispatches from the recorded brief, the replaced Working line kept under the new one.
5. **The gate's base in CI was the event's base sha** (BOB #1: PR #4's ownership failed on a file alpha never touched, the tranche having moved between the event and the run). Fix: `--base HEAD^1`, the merge ref's own first parent; the shims on `tranche` regenerated by BOB.
6. **J8 had no driver**: plan N8 asked beta's test to copy alpha's error words, which BLD 5 forbids (BOB #1's A3 answered that the test reads them at run time). J8 is redefined as the update-and-rerun mechanism (CERTIFICATION); a red on the merged result is J3's path.
7. **A job waiting on another's merge could not end its turn** (BETA #1's REPORT 2): `ready after <m>` sat in the job's owed list and its Stop hook counted it. Fix: it is BOB's act (cleared by `neo merged`), left out of the job's gate; the job's COMPLETE message says it waits.
8. **A review could not be posted** (BOB #1, R-BOB-1-3): GitHub refuses REQUEST_CHANGES and APPROVE on one's own pull request, and every session is Bob's one user. Fix: the review is posted as a COMMENT review carrying the verdict; the approval the merge reads is the Review line.
9. **The metrics row's `reviewed` read the last Review line** (BOB #1, at layer 1's close: alpha's reviewed runs counted `no` after its unreviewed re-open). Fix: the job line keeps `Reviews` and `Merges` (each merge with the review count then), and the row reads `reviewed merges/merges`; alpha's N1 row stands as written (`no`), noted here.
10. **A lane id equal to a module's name** (BOB #1, R-BOB-1-4: lane `STATS` against module `stats`): session names `<ID> #k` are one namespace for jobs and lanes, and the hook read the job `STATS #1` as the lane's. Fix: `neo lane open` refuses such an id; the seed's lane is `STATISTICS` (BOB #1 closed STATS and opened STATISTICS); `--dormant` opens a lane with no start owed.
11. **A dormant lane's start was not owed by `ask ask`** (BOB #1, R-BOB-1-5), so the hook refused the printed create_session. Fix: `ask ask` owes `start lane <ID>` when it prints the start; `lane route` is the recovery for an ask already ASKED.
12. **A closed lane's id still named a lane in the tool** (BOB #2, R-BOB-2-1: `ask close` routed the reply for STATS #1 to the closed lane STATS). Fix: only an OPEN lane's id is a lane, in `ask route`, `ask close` and `lane open`'s session text; the hook already read it so.
13. **A job's clone started on a detached HEAD** at its branch's tip (STATS #2, R-STATS-2-1): `job start` refused, and the hook refuses a checkout before a role is recorded. Fix: the start commands (`job start`, `lane start`, `takeover`) make the branch at a detached tip themselves.

## 5. The run's log (29 Oct 2026, UTC)

- 05:55 BOB #1 started by #5 (`session_01RAN5eoszaGr1kRy9xrnNMK`, START-BOB.md); tranche N1 opened, epoch E1, ARITH #1 live, STATISTICS dormant.
- 06:18 layer 1 running (PRs #4, #5); the lanes and jobs waiting on asks; BOB at 17 %.
- 06:40 layer 1 CLOSED: alpha merged twice (PRs #4, #6), beta once (#5); both archived with rows; 19 rows PROVEN.
- 07:00 BOB #1 handed over at 23 rows, with A6's worker out and A5 ASKED (rows P5, P14); BOB #2 (`session_01RAN5emQV3q3LnPm2Ft8oMN`) started by #5 from START-BOB.md; BOB #1 archived by #5 at 47 % of its window after 66 min (its row written by BOB #2).
- 07:19 layer 2 CLOSED by BOB #2: stats merged (R10; R11's even length to the completion round, alpha N13 then stats N14); STATS #1 archived by BOB #2 though BOB #1 created it, no refusal (X2); the completion round opens.
- 07:29 completion round R2, layer 1 CLOSED by BOB #2: alpha's midpoint (R10, R11) merged after an approving review (J5), ALPHA #2 archived; layer 2 started (STATS #2, PR #9, N14).
- 08:08 completion round layer 2: stats N14 merged (R11 on alpha.midpoint; STATS #3 replaced the stuck STATS #2); 32 rows PROVEN; the layer stays open for A4's answer, then the layer close, the epoch close and the close PR to main.
- A4 (mean([]), rows P4/D3) asked of Bob by #5 at 06:50; awaiting his a/b, to reach stats' completion-round job.

