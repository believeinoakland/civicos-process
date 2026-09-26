# Dry runs (PROCESS-MECHANICS §15)

One entry per run: the revision certified, what each path did, and the verdict.

## D1 · 2026-09-26 · the revision after T1 (bio C14)

Paths to prove, each by its artifact: (1) each job opens a draft pull request into `tranche/D1` and subscribes; BOB subscribes; (2) a `QUESTION` comment wakes BOB; (3) BOB's requirement change on the tranche branch and `ANSWER` wake the job, which merges and continues; (4) a `REPORT` of a stale generated artifact; (5) `COMPLETE` wakes BOB; (6) the early merge and a `CHANGE` wake the using job, which merges and completes; (7) each job's metrics row lands in its own record and its ownership check passes; (8) BOB regenerates and verifies the generated artifact at layer close, collects the metrics, comments `CLOSE`; (9) the backstop check-in finds a quiet job.

Result, 2026-09-26 15:25Z: **NOT CERTIFIED: the run found flaws, each now fixed; a clean second run (D2) certifies.** What each path did:

1. **Pull request as the channel: FAILED.** Both jobs commented on time (15:01, 15:02); neither comment woke BOB (every session posts as the same GitHub account). Replaced by (2).
2. **Channel: firing a standing routine: FAILED** (it started a new, empty session instead of reaching the named one; both strays archived, nothing written). **A one-time routine into the named session at the next whole minute: WORKS both ways**, as the old process measured (bio ORCHESTRATION.md): BOB to alpha and beta delivered at 15:11 as turns in their sessions; alpha and beta to BOB delivered at 15:14–15:18, about 2 minutes after scheduling.
3. **QUESTION → requirement change on the tranche branch → ANSWER → merge: WORKS** (alpha merged 8f0c844, implemented `sum` to R3–R4).
4. **REPORT of a stale generated artifact: WORKS** (alpha, N2).
5. **COMPLETE: WORKS** (alpha 15:15, beta 15:18).
6. **Early merge and CHANGE: WORKS** (alpha into the tranche at 673df14; beta merged and completed N3).
7. **Metrics in the job's own record: WORKS**, after a fix (the recorder resolved `--record` from the working directory). **Ownership check: WORKS**, after two fixes (it knew only `T<n>` job records; it needed `origin/<base>` in a job's checkout).
8. **Layer close: WORKS.** Ownership clean; merge clean; `beta/dist/bundle.txt` regenerated with no change and verified fresh; metrics collected in `build/metrics/D1.csv` (alpha 1,828,000 tokens processed, beta 2,618,000, each counted when it recorded; its session's final totals were higher); both job sessions archived. No `CLOSE` message was sent: archiving ends the job, so the mechanics now say so and drop `CLOSE`.
9. **Backstop check: not exercised** (no job went quiet); the channel made it unnecessary this run.

Also found: the manifest's test command failed on the jobs' Node 22 (fixed: name the test files); beta noted that `total` now inherits `sum`'s refusal of non-numbers, which beta's R1 does not state. BOB should have reviewed the user's requirements when the provider's meaning changed (mechanics §7 says so); a lapse of BOB's, not a gap in the mechanics.

## D2 · 2026-09-26 · the revision after D1

The same toy tranche, from the toy's starting state on `main`, on the mechanics as revised after D1 (the channel of §13, archiving in place of `CLOSE`, the tool fixes). Paths to prove: (1) BOB to a job and a job to BOB by one-time routines, both ways; (2) QUESTION, requirement change, ANSWER, merge; (3) REPORT of a stale generated artifact; (4) COMPLETE; (5) early merge and CHANGE; (6) metrics in the job record and ownership, run exactly as `roles/JOB.md` writes them; (7) layer close.

Result, 2026-09-26 15:35Z: **every path of this run worked as written, with no fix to the process.** QUESTION 15:23 → requirement change and ANSWER 15:25 → alpha merged and implemented; alpha's REPORT (stale bundle) 15:27; COMPLETE 15:28; early merge (f5e700f) and CHANGE 15:31; beta COMPLETE 15:33; layer close clean (ownership, merge, bundle fresh, 8 tests, format, architecture, coverage 8 of 8); metrics collected (`build/metrics/D2.csv` on `tranche/D2`: alpha 1,653,000 tokens processed at recording, beta 1,739,000). Messages arrived 1–2 minutes after scheduling. BOB reviewed the user's requirements when the provider's meaning changed (B2), which BOB had missed in D1. The jobs' first messages were minimal: `roles/JOB.md` was enough. Beta fixed two flaws in its own module (untested R2–R3; `--verify` crashing on a missing bundle) and pointed out stale wording in its requirements' Uses, which BOB corrected at the close. D2 proves only its own rows of `CERTIFICATION.md`; D3 proves the rest.

BOB's own slip after D2, recorded because it is the kind of fault the process must survive: merging the D3 preparation into `main` hit a conflict, and BOB's command committed and pushed it with conflict markers in `dryrun/build/modules.json` (0738700). The format check caught it at once (the file did not parse); it was resolved forward in the next commit, with no history rewritten. BOB's commands that merge now stop on the first failure (`set -e`) and look for markers in the files before committing.

## D3 · 2026-09-26 · the rows D1 and D2 did not reach

The plan in `build/plan/current.md` (D3) and the design in `CERTIFICATION.md`. The toy's `main` is the branch `dryrun-main/D3`.

Result, 2026-09-26 16:02Z: **every row D3 was designed for is proven, except C6 at three jobs (two ran; three-way scale stays with T1). Findings below; none needed a fix to the process mid-run.** BOB #38 ran layer 1 and started layer 2. BOB #39 (the successor) took over during layer 2, closed it and closed the tranche: `dryrun-main/D3` = `tranche/D3` = `a76ba70`. Plan archived at `build/plan/archive/D3.md` on that branch. What each path did, with its evidence (commits on `tranche/D3`):

- **C1, C2 · the channel, both ways: WORKS again.** Every message in both layers arrived as a turn in the session it named, 1–2 minutes after scheduling. For example, stats's COMPLETE and REPORT were scheduled at 15:56Z and delivered to BOB #39 at 15:58:21Z and 15:58:22Z.
- **C3 · a message never sent: WORKS.** alpha pushed REPORT 1 (the stale legacy bundle) in its record without sending it (`c82dff7`, 15:36). BOB #38 found it in the record and regenerated the bundle at layer 1's close (`4ef678e`).
- **C4 · a job's session dies mid-job: WORKS.** BOB #38 archived beta's first session (`session_01TQpjjNikfAHshU4qPFuGqb`) after it had pushed a QUESTION and a BLOCKED. A new session (`session_014VNyoK4tprbsgzVKycE9P3`) on `job/D3/beta` read the record, merged BOB's answers (`07a6224`, 15:39) and completed (`13c2ee6`). Detection was BOB's own, since BOB injected the fault. A backstop finding a death nobody caused is not yet exercised.
- **C5 · BOB refreshed mid-tranche: WORKS.** BOB #39 wrote its id into the Status line first and verified it on the remote (`f9471d4`, 15:55:41; `f5f19a2`, 15:55:50: one id only). Then it sent stats a takeover CHANGE (delivered 15:57). stats had already re-read the Status line before it sent COMPLETE and REPORT at 15:56Z, so both reached the successor, **before the CHANGE announcing it arrived**: state drove and the message only accelerated (its record, `417a363`). Nothing went to the old BOB.
- **C6 · many jobs at once: PARTLY.** Layer 1 ran two jobs whose messages crossed (15:36–15:52: two QUESTIONs, a BLOCKED, three REPORTs, three COMPLETEs), and every one was answered (both records). The design's three concurrent jobs did not happen, because layer 2 had one job.
- **J1 · QUESTION → requirement → ANSWER → merge: WORKS again** (alpha Q1 → `ebfa39f` R3–R4).
- **J2 · carrying on through a question: WORKS.** alpha did N2 and implemented `sum` on its best reading (`a3b7232`) before the answer, and the answer accepted that reading. beta's QUESTION 1 and alpha's Q2 went the same way.
- **J3 · BLOCKED: WORKS.** beta made three documented attempts at N4 (Neumaier, exact BigInt, decimal scaling), then sent BLOCKED (`290eabb`). BOB #38 dropped N4 (`caa0f42`) and beta completed the rest.
- **J4 · the four checks in the record: WORKS again** (all three records).
- **J5 · extraction from legacy: WORKS.** stats removed `mean` from `legacy/index.mjs` and added nothing there: ownership reports 4 files and 0 failures. BOB #39 committed one added line to legacy on a throwaway copy of the branch (never pushed), and ownership failed with `legacy/index.mjs: stats may only remove code from legacy, and this diff adds 1 line(s)`, exit 1.
- **J6 · metrics: WORKS, with a finding** (below). Every job row in `build/metrics/D3.csv` is read from `archive_session`'s final usage, including the dead session's.
- **B2 · a service's meaning changes, users reviewed: WORKS again** (beta R4, `ebfa39f`).
- **B3 · REPORT → forward → CHANGE re-opens a completed job: WORKS.** beta reported `alpha.add('1', 2)` returns `'12'` (`13c2ee6`). BOB #38 confirmed it and wrote alpha R5 (`a709075`). The CHANGE re-opened alpha, which had completed at `b2dc984`, and alpha completed again (`22f0b16`, `7dbe985`).
- **B4 · REPORT about a module with no job → next work: WORKS.** stats reported `legacy.max([])` is `-Infinity`, plus four more flaws. BOB #39 confirmed them on the code and entered them as N8 under the plan's Next (`323ac62`); nothing changed in legacy. What `max([])` should return is a question of meaning, so BOB records that it would bring it to Bob, with a recommendation (throw `RangeError`).
- **B5 · a job stales a no-job module's generated artifact; BOB regenerates at close: WORKS, twice.** Layer 1: alpha's `sum` staled `legacy/dist/legacy.bundle.txt`, regenerated in `4ef678e`. Layer 2: stats's removal staled it again; verify printed `legacy bundle: STALE` on the merge, and `fresh` after `node legacy/scripts/bundle.mjs` (`323ac62`).
- **B6 · layer close: WORKS**, both layers. Layer 2: ownership 0 failures, merge `70b8f3e` with no conflict markers, both bundles verified fresh, 14 of 14 tests, `checks/run.mjs dryrun` with format, architecture and coverage (12 of 12) all at 0 failures, stats archived, metrics row `1f38542`.
- **B7 · two layers: WORKS.** stats branched from `19f8ff2`, layer 1 closed and merged, and uses `alpha.sum`, which only layer 1 put there.
- **B8 · tranche close: WORKS.** The plan was archived with each entry's outcome and the jobs' usage (9,041,883 tokens processed; BOB rows are appended separately). Then `dryrun-main/D3` fast-forwarded to `tranche/D3` by a plain push: `bab815f..7fc7412`, then `a76ba70` after a correction to the archive's arithmetic. The two branches are equal.
- **B9: T1.** D3 records what would go to Bob (N8's `max([])`, above) and decides no meaning itself.

**Findings** (BOB #38's, then BOB #39's):

1. **Messages can arrive out of order,** so a recipient acts on the newest state they name, not on the order of arrival (BOB #38). Seen again in C5: stats's messages reached the successor before the takeover message reached stats.
2. **A job's metrics are best read from `archive_session`'s usage,** not from the job's own transcript (BOB #38). A dead session's transcript is lost; the transcript id is not the session id; and a job records before its last turns. stats recorded 1,032,506 tokens processed, and its archived usage was 1,899,013.
3. **BOB must not archive a job with a message to it still in flight** (BOB #38 archived a job seconds after answering it: alpha's ANSWER to Q2, `6299605`, pushed at 15:52:57, before archiving). BOB #39 checked before archiving stats: no enabled routine into its session, and its last message recorded in `417a363`.
4. **A wording question from one job can force a change on another running job** (BOB #38): beta's QUESTION 1 changed alpha's R3 (`caa0f42`) and needed a CHANGE to alpha. A new row, below.
5. **`metrics/record.mjs` names the transcript id, not the cloud session id** (alpha's REPORT 3). This was fixed on `main` during D3 (`253b20b`), but the job branches, cut from the tranche, ran the old tool. A tool fix reaches a running tranche only if it is merged into the tranche branch.
6. **The Status line must name exactly one session id** (BOB #39). The first takeover commit named both BOBs, and a job that searches the line for an id could take the wrong one. It was corrected at once (`f5f19a2`).
7. **B8's order** (BOB #39). Fast-forwarding `main` first and archiving the plan after leaves `main` one commit behind the tranche. Archive first, then fast-forward, so `main` carries the archive.
8. **The successor was started as BOB #38's child** (BOB #39: its session's `parent_session_id` is BOB #38's). Mechanics §2 says a successor is a fresh top-level session started by a routine.
9. **"Arm no timers" (`roles/BOB.md`) conflicts with the 20-minute backstop** (mechanics §5, a `send_later`). BOB #39 armed the backstop as the mechanics require and deleted it at the tranche's close.

**Changes BOB #39 would make** (not made; the mechanics and roles change only as a process change, with Bob where a principle is touched):

- Mechanics §13 and `roles/JOB.md`: act on the newest state a message names, never on the order messages arrive in (finding 1).
- Mechanics §10 and `roles/BOB.md`, layer close: BOB writes each job's row from `archive_session`'s final usage, keyed by the cloud session id. The job's own row stays in its record as a cross-check (findings 2, 5).
- `roles/BOB.md`, layer close: before archiving a job, check that no routine into its session is still enabled and that its record shows the last message processed (finding 3).
- Mechanics §4: a tool fix made on `main` during a tranche is merged into the tranche branch and announced to running jobs as a CHANGE (finding 5).
- Mechanics §13 (M1): the Status line names exactly one session id, the current BOB's (finding 6).
- Mechanics §5 and `roles/BOB.md`, tranche close: archive the plan first, then fast-forward `main` (finding 7).
- Mechanics §2: say how a successor BOB is started so that it is not BOB's child, or accept the parent link (it did no harm here) and say so (finding 8).
- `roles/BOB.md`: make the 20-minute backstop an explicit exception to "arm no timers", deleted when the tranche closes (finding 9).
- `CERTIFICATION.md`: the new row C7 (finding 4), and C6 at three concurrent jobs in a later run or T1.

## D4 · 2026-09-26 · an extraction that rewires the legacy caller (J8)

The revision: mechanics §12.2 and §8.3 and the ownership check (`589f08a`), after BOB #41 found that BIO's legacy store calls the code its extractions move (bio TRANSITION §6). The toy's `main` is `dryrun-main/D4`: the toy after D3, `legacy` placed after `stats` in the order (as BIO's `legacy-store` sits after the modules extracted from it), and `legacy.range` calling `legacy.max` and `legacy.min`. One job, `stats` (STATS #2, `session_01WXWwzMNYQtoREMdzBRQZMW`), extracted both and rewired `range`.

Result, 2026-09-26 18:20Z: **J8 PROVEN; certified.** The job moved `max` and `min` into `stats` (R4–R7), asked one QUESTION (non-finite elements, answered as its best reading, R8, `3c6d25b`), completed, took the answer and completed again (`ac3ad37`). Its legacy diff: 11 lines removed, one added, `import { max, min } from '../stats/src/index.mjs';`; ownership printed that line `ADDED` and passed, 0 failures. BOB, on throwaway commits of the job's head (never pushed): a delegating block `spread` using `max` and `min` passes and is listed; `export const unrelated = 1;` fails, exit 1; an added import of `alpha` fails; twelve delegating lines (13 added, 11 removed) fail on the net. Layer close: ownership 0 failures; merge with no conflict markers; the legacy bundle STALE, then fresh; beta's fresh; 19 of 19 tests; format, architecture, coverage (17 of 17) at 0 failures; no routine into the job's session enabled; the session archived and its row in `build/metrics/D4.csv` (3,145,809 tokens processed); the plan archived with outcomes and usage; `dryrun-main/D4` = `tranche/D4` = `88fa651`.

**Findings:**

1. **The rewiring was one import**, because `range` already called the moved names. The delegating-block path (a caller whose name or shape changes) was proven by BOB's injection and the checks' own tests, not by the job; BIO's store methods that delegate (`promote(…) { return promote(this, …); }`) take that path, and BOB reads every `ADDED` line at T3's layer close.
2. **A generated artifact that concatenates a legacy module's source must carry the extracted module's too** (stats's note): `legacy/scripts/bundle.mjs` gained `stats/src/index.mjs`. BIO's bundler resolves imports, so it needs no such change.
3. **The rewired caller inherits the moved code's behaviour** (`range([])` now refuses). A job states that in its record; BOB accepts it or routes it.

## D5 · 2026-09-26 · an extraction from two legacy modules (J9)

The revision: `from` may name several legacy modules (`ffce973`), after PROMOTION #1 found in bio T3 (Q7) that the checks behind its R30–R32 sit in the check catalogue (`legacy-checks`, first in the order), not the store. The toy's `main` is `dryrun-main/D5`: D4's toy plus `catalog`, a legacy check catalogue first in the order, whose duplicate check `legacy.validate` reaches through `checkList`. One job, `stats` (STATS #3, `session_01Ppv9EDuf4zdKF7vuxaCycj`), `from` both.

Result, 2026-09-26 18:50Z: **J9 PROVEN; certified, after one finding fixed.** The job moved the duplicate check into `stats.distinct` (R9), removed it from `catalog` adding nothing (11 removed), and rewired `legacy.validate` to add the finding from `stats.distinct`, equal to the old `validate` on 2,406 inputs. It tried the negative case itself: one line added to `catalog` fails. REPORT (stale bundle) and COMPLETE arrived in about five minutes.

**Finding 1 (fixed):** the net removal was judged per legacy module, so the job had to fold an honest two-line rewire onto one line: the caller sat in `legacy` and lost nothing, while the moved code left `catalog`. The check now judges the net removal over all of a job's legacy modules together (`383f070`), and was re-run on the job's head (0 failures), on a throwaway unfolded rewire (0 failures: legacy 4 added, 3 removed; catalog 11 removed) and on a throwaway addition to `catalog` (1 failure, exit 1).

**Finding 2:** a job's own throwaway commit with `-a` swept up BOB's uncommitted edits in the same checkout (BOB's slip at this close; recovered from the throwaway commit before anything was lost or pushed). BOB commits before making throwaway commits.

Layer close: merge clean, no markers; the tranche's tooling brought to `main`'s (mechanics §4); the legacy bundle regenerated with `catalog` in its parts, verified fresh; 20 of 20 tests; format, architecture, coverage (18 of 18) at 0 failures; no routine into the job's session; archived; row in `build/metrics/D5.csv` (1,975,064 tokens processed); plan archived; `dryrun-main/D5` = `tranche/D5` = `ba63c5c`.
