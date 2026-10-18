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

## D6 · 2026-09-27 · the K111 revision (A1–A4)

The revision: mechanics §2 (a successor BOB archives its predecessor), §10 (usage from archives; the recorder retired), §16 (acts only Bob can approve; written by Bob), on `revision/K111`. Tranche `tranche/D6`: a stand-in predecessor `D6-BOB #1` (`session_012Dxuxjs4AK7Jo4hNUYJLsF`) and one job `ALPHA #1 (D6)` (`session_01MhYh8xxCnNRRKVTHQJA9Lr`).

Result, 01:40Z: **A1, A2 PROVEN; A4 proven with a finding; A3 not reachable; certified.** BOB #44 pushed its takeover (`3300fe0`), found the routine planted into the predecessor, deleted it, archived the idle predecessor and wrote its row from the archive (`6af4ea6`). The job built alpha R3 with passing tests, but the safety check refused its ordinary commit, most likely because D6's own entries (plant a hook, change permissions) made the branch look like an attempt on the check. The job did not work around it; it asked in its own window and sent BOB nothing, so Bob found it himself and brought it to BOB, which relayed the act to him in one line. Bob was stepping away, so BOB stopped D6 there and archived the job (row from its archive).

**Findings:** (1) a refused job must message BOB before asking in its own window, and BOB's backstop reads each job's session state for blocked: both folded (mechanics §5, roles). (2) A dry run built to provoke the safety check makes it distrust ordinary work too; a later run should test one thing at a time. (3) An approval clears a refusal only when it names the act (K112).


## D7 · 2026-09-27 · the K154 revision (L1–L7)

The revision: session depth (mechanics §2, §5, §6, §13; `roles/ROOT.md`), after bio T5 found the lineage cap (K154): every BOB had started its successor, so BOB #46 sat at depth 7 and its job LEGACY-INDEX #3, at depth 8, was refused `create_trigger` ("lineage depth 8 (limit 8)"). BOB #47's first draft bounded the chain (a BOB starts its successor only at depth 5 or less; Bob restarts it every seven BOBs); Bob proposed a ROOT session as the parent of every BOB, which replaced it (K156). Tranche `tranche/D7`, from the revision branch; BOB #47 (depth 0, started by Bob) plays ROOT.

Result, 14:12Z: **L1, L3, L4, L5 PROVEN; certified.** A probe routine with `create_new_session_on_fire` started a session with no parent but no connector, session or routine tools: it could not reply (L3). BOB #47 started D7-BOB #2 (`session_01CVr6oZ…`), which read depth 1 and pushed it in the Status line (`b18750f`), started ALPHA #2 (`session_01ManYyU…`) telling it depth 2; the job built `mul` (R3), recorded its chain with depth 2 matching, and sent COMPLETE by routine (14:02:55Z). D7-BOB #2 merged it (`fcca882`), pushed its handoff (`624827e`) and sent ROOT `START BOB` (14:05:53Z); ROOT checked the handoff and started D7-BOB #3 (`session_01GyJEGW…`) as its own child, a sibling at depth 1, which took over (`d503ba1`), archived D7-BOB #2 with no routine targeting it and wrote its row (`6a92da0`). BOB #47 took the tranche back, archived ALPHA #2, D7-BOB #3 and the probe, and wrote their rows (`65ca768`): 3.78M tokens processed by the D7 sessions.

**Findings:**

1. **Archiving a session outside one's own lineage can be refused by the permission check.** BOB #47's `archive_session` of BOB #46 (started by BOB #45, not by BOB #47) was refused as an irreversible deletion; D7-BOB #3's archive of its sibling predecessor, named in the handoff, passed, as did BOB #47's of its own children. Under ROOT every BOB's predecessor is a sibling it is told to archive, so §2 stands; a refusal goes through §16.
2. **The dry-run toy's full check run is not clean** (`d6/plant-hook.sh` owned by no module; beta and stats coverage): a baseline left by earlier runs, none of it alpha's. D7-BOB #2 merged anyway, rightly (§7). A later run starts by cleaning it.
3. **`node --test <directory>/` fails on Node 22**: the command in BOB #47's first message to the stand-in was wrong, not a mechanics flaw; name the test files (`<dir>/*.test.mjs`).
4. **`archive_session` returns the same usage as `get_session` read just before it** for an idle session: a row can be drafted before archiving, but only the archive's is written.

## D8–D10 · 2026-09-27 · the K164 revision, live runs R1–R3 (superseded by K168)

R1 (D8, start and takeover) and R2 (D9, messages and faults) passed the K164 rules (evidence: branches `cert/R1`, `cert/R2`, `dryrun/cert/R1|R2/NOTES.md`); R2's one failure (a BOB hand-wrote extra session ids into the Status line) showed that sessions hand-writing protocol is the weak point. R3 (D10, refusals) was stopped when Bob asked for an architectural review; its one observation: a job refused `delete_trigger` of a routine another session created wrote `NEEDS BOB`, told BOB, and BOB relayed it to Bob with the link and the words to type (§16 works). Bob then approved the simplification K168. Platform facts measured: a session starts its first turn in ~20 s; a routine fires 7–60 s after its minute; a routine into an archived session is disabled (`auto_disabled_session_gone`), never delivered; a deleted routine leaves no trace; `update_trigger` re-arms a fired one-time routine; a waiting session reads COMPLETED or BLOCKED, never reliably; the harness may not archive a session its own child started (refused, as D7 f1).

## D11 · 2026-09-27 · the K168 revision: mailbox and doorbell

The revision: mechanics §2, §5, §6, §13, §16 and the roles rewritten around `tools/mail.mjs` (bio K168). Tranche `tranche/D11` from `dryrun-main/D9`; stand-ins D11-ROOT #1 (`session_01NXws5gVpwuD1pvBCYafWjY`), D11-BOB #1 (`session_01H3XDB9goUxVa4G4Ma1HJep`, started by ROOT), jobs ALPHA #1 and BETA #1.

Result, 23:24Z: **certified.** Started 23:16 (START BOB to ROOT), BOB's Status by `mail bob` 23:18:05, both STARTs posted and both jobs' addresses by `mail addjob` 23:18:42–23:19:01, both jobs confirmed by `mail start` within 20 s. Every message and cursor move is a `mail …` commit; no session hand-wrote a mailbox, cursor or address.
- **A question revised in flight:** ALPHA posted J1 and J2 (replacing it) within 11 s and rang twice; BOB answered J2 only (`B2 ANSWER re J2`, with a wording ruling D11-K1) and read through J2; ALPHA applied it.
- **A lost doorbell:** BETA posted COMPLETE and did not ring; BOB read it 59 s later, woken by ALPHA's doorbell, because a woken side reads every mailbox past its cursor.
- **Duplicate doorbells:** the harness rang BOB and BETA again at 23:23 with nothing new: no commit, no reply from either.
- **Close:** both jobs COMPLETE with nothing unread either way; merged, both stale bundles regenerated and verified, jobs archived with rows from their archives, close in two steps (`dryrun-main/D11` = ac15dc2), BOB's backstop and WATCH deleted.
- **Not exercised live:** killing a job mid-work (the harness may not archive its grandchildren, refused); the restart path is unchanged from K164 (proven in D8) and a restarted job keeps its cursor (`tools/test/mail.test.mjs`).

Cost: stand-ins 4.8M (BOB) + 0.6M (ROOT) + two jobs; the whole run 23 minutes.

## D12 · 2026-10-01 · the K954 revision: the cross-account channel (PENDING)

The revision: mechanics §13.1 (across accounts) and §8.5 (the channels check), `tools/mail.mjs` (`xwriter`, `xpost`, `xinbox`, `xdone`, `xcheck`) and `checks/channels.mjs` (bio K954), on `prep/channel`. Under §15, the cross-account step can be proven only between Bob's two real accounts (secondary: BOB; primary: UX-DESIGN), so the proof is in two parts.

| path | evidence | result |
| --- | --- | --- |
| Tool and check on fixtures | `checks/test/channels.test.mjs`: a bare origin with the registry on `main`, a BOB clone (on a tranche branch) and a UX-DESIGN clone; `xwriter` creates each mail branch as an orphan holding only its outbox, Writer line first, working tree untouched; `xpost` appends `B1`, `B2`, `U1 · ACK · re B1`; `xinbox` reads only past the cursor; `xdone` moves it, never back, never past what was posted; `xcheck` lists unread entries both ways; a successor's `xwriter` replaces only the Writer line. The check passes the clean history and fails a rewritten entry, a removed entry, a skipped number, another's letter, a backward or removed cursor, and a forced rewrite. Negative controls in `checks/README.md`. | PROVEN: 11 of 11; whole suite `node --test checks/test/` 103 of 103 |
| Live exchange across accounts | BOB seeds `build/channels.md` on `main`, runs `xwriter` and posts B1 `NOTICE` (the UX-relevant rulings since K859) on `mail/BOB`; UX-DESIGN, from its own clone on the primary account, runs `xwriter`, `xinbox --from BOB`, posts `U1 · ACK · re B1` on `mail/UX-DESIGN` and `xdone`; BOB's `xcheck` shows `U1` unread, it reads and moves its cursor; `node checks/channels.mjs` on the product passes. | PROVEN 2026-10-01: registry on bio `main` 2b0c5fc1c0; BOB's `xwriter` da1ccb1, B1 NOTICE 5636d3c, B2 DEFER cf1c02a (~22:50 UTC); UX-DESIGN (primary account, `session_01TNeXM2Qvi7zMXT6BntbENE`) read through B2 and posted U20 ACK re B1, B2; BOB's `xcheck` showed U1–U20 unread, `xdone` through U20 (ec27e8a), B3 ACK (85364aa); `node checks/channels.mjs` on bio: 2 participants, 20 outbox commits, 0 failures |

Result: **certified** (both rows proven); the mechanics' Status line names D12.

## D13 · 2026-10-01 · the K1007 revision: the cleanup, the legacy census and the missing-file check

The revision: history moved to `HISTORY.md`; mechanics §5 as procedures §5.1–§5.9; the audit's contradictions settled (bio K1008); the legacy census (§5.2) and owed acts as plan entries (§9); the format check fails a module path naming no file (§8). Under §15:

| path | evidence | result |
| --- | --- | --- |
| Missing-file check on fixtures | `checks/test/checks.test.mjs`: a passing tree and a module naming a deleted path; negative control (rule disabled) fails the test | PROVEN: `node --test checks/test/` 108 of 108 |
| Missing-file check on the product | `node checks/format.mjs` on bio `tranche/T21`: exactly legacy-tests' 11 deleted paths, nothing else | PROVEN |
| The legacy census and owed-act entries | only a plan can show them: T22's opening plan carries the census (legacy-tests retired, N478; legacy-ui's hard reason) | PENDING: T22's opening |
| Meaning otherwise unchanged | BOB #89's line-by-line review of the diff against c00b0cf; removed text verbatim in `HISTORY.md` | PROVEN |

## D14 · 2026-10-07 · the K2060 revision: reading sets (mechanics §17, P20)

The revision: P20 and mechanics §17 (bio K2060). Under N746 the run is bio T36's own layer-1 STARTs (bio K2072), proving RS1 on real jobs rather than a toy.

| path | evidence | result |
| --- | --- | --- |
| Every START measures its job's set | bio `build/plan/starts-T36/*.txt`: each of the six L1 STARTs names its size from `build/plan/reading-sets.py` (connection-grammar 83 KB, signatures 139, bundler 205, office-readers 248, file-scanner 53: under 300 KB, read whole) | PROVEN |
| A set over its limit is fixed in §17's order before the session starts | doctypes, 436 KB: the START records (1) nothing to trim, (2) no split (3,461 lines, under ~4,000), (3) a task summary: the job reads ~130 KB whole and its own workers, told the task (T36-4, R35's measure), the requirement it changes (R35, R25–R34 if re-scoped) and what follows (BOB's re-scope), read the rest in full | PROVEN |
| The job completes reading its set whole, the summary citing its sections | DOCTYPES #3's record (bio `build/jobs/T36/doctypes.md`, "Reading set"): read whole ~140 KB; two worker summaries (~20 KB, ~18 KB), every statement citing file and line or requirement id; one point mattered (registry precedence) and was checked against the source; the job completed (bio K2079, K2082) | PROVEN |

Finding: the workers described doctypes' large JSON test fixtures from their structure rather than reading them whole. They are data, not code, as K2053 already treats generated artifacts and vendored data (never read); no rule changes, but a later START names such fixtures as outside the set.

Result: **RS1 certified.** Cost: the run was the tranche's own work; no extra sessions.

## V6 · 2026-10-08 · a tranche closed by a pull request (bio T38)

T38's close was the first under §5.7 (3) as K2273 changed it. BOB #143 searched the rulings for a refusal of the act (none since K2273, bio K2338), opened PR #17 from `tranche/T38` to `main` and merged it with the GitHub merge tool (method `merge`, the expected head pinned) under the standing list's `mcp__github__merge_pull_request`. No permission prompt and no auto-mode refusal. `main` @ `147f356dfe` (a merge commit) contains the closing commit `318fafd71b`; `tranche/T39` was created from it (bio K2339).

Result: **V6 proven.** Cost: one tool call; no extra sessions.

## W1 · 2026-10-14 · the Writer-line revision, fixtures (bio K3361)

BOB #179's worker added `bobWriter` to `mail bob` and `xcheckWarnings` to `xcheck`, with `tools/test/bob-writer.test.mjs` (5 tests). Suite before 124/0, after 129/0. Live `xcheck --as BOB --tranche T49` over bio: no warning. WL1, WL2 proven; WL3 waits on BOB #180's takeover.

WL3 (BOB #180's takeover, 2026-10-14 ~22:32Z, bio `tranche/T49`): `mail bob` printed "plan Status written (7b41802521)" and "BOB's Writer line written (325a687)" in one command; `xcheck --as BOB` printed no WARNING (UX-DESIGN read through U257, they read B218 of B218). WL3 proven; WL1–WL3 all proven.

## D15 · 2026-10-18 · the K3923 revision: mechanical passes, the completion round, the words check and next.md's reasons (bio K3923, K3927)

Tranche `tranche/D15` from `dryrun-main/D15` (now `cf36354`), run by BOB #214 (`session_01GSmA9F4nLx4fViJzQfU6f7`). The toy gained a word table (`docs/development/ux-substrate/screens/words.json`) and `setup-words`; planted: an inline sentence in alpha and in beta (each a table row), a test copying each, a sentence stitched from `+` pieces in stats with no row, and a `next.md` entry deferred for "the order".

| path | evidence | result |
| --- | --- | --- |
| §8.4: `next.md` refuses a deferral for another reason | `checks/run.mjs` on the planted state: `next.md:7: N9 names no P19 hard reason … "the order (layer 2 has closed)"`; N10 ("Bob's") passed; fixture tests in `checks.test.mjs` | PROVEN |
| §8.6: the words check finds inline sentences and test copies, and runs in `run.mjs` | the planted state: inline alpha ×2, beta ×1 (`copy`), testcopy alpha, beta; `run.mjs` printed the `words:` line and exited 1 | PROVEN |
| §8.6: a stitched sentence | **missed on the first run** (finding F1): no piece was a sentence on its own. Fixed in the run (`8838251`, tightened `ee5ec8e`: a `+` chain whose joined text is a sentence, one piece of 3+ words); re-run: `stats/src/index.mjs:48 [stitched]` | PROVEN after the fix |
| §5.10: one pass, no job running, modules from the check's findings, judgment cases handed to their own job, one full run | haiku worker in BOB's session: alpha and beta read `word(key)`, their tests compare `word(key)`, `uses` gained setup-words, bundles regenerated; stats listed (stitched, no row); all four modules' tests green, `run.mjs` left only stats and N9 (`c7fab68`) | PROVEN |
| §5.7 step 0: the completion round, run as a layer | N9 re-placed into the round (CR-2) and stats' judgment case (CR-1) after the design batch added its row; `job/D15/stats` pushed, START B1 posted, STATS #1 (`session_01H4fMDeELs9MJCQ6WaeJKbB`, haiku, depth 2) confirmed, COMPLETE (J2) in 4 minutes; ownership 0 failures, merged; legacy bundle regenerated; `run.mjs` 0 on format, architecture, coverage, words | PROVEN |

Findings: F1 above. F2: the job's checkout carried the process repository's `main` before the fix, so it saw a developer `TypeError` message as a finding and reported it (J1) as alpha's; a check changed during a tranche reaches jobs only through `main` (§4's tool-fix rule, already stated): BOB answered (B2). Built-in error messages are developer text, not counted (bio K3927).

Result: **§5.10, §5.7 step 0, §8.4's `next.md` arm and §8.6 certified.** Cost: STATS #1 3.26 M tokens; two workers in BOB's session.
