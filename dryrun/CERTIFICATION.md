# Certification matrix (P3, mechanics §15)

**Status** · Written by BOB #38, 2026-09-26, after Bob asked whether the dry runs test enough to know the process meets its requirements. They did not: D1 and D2 prove the channel and one layer's happy path only. This matrix lists every path the principles and mechanics define, the evidence that proves it, and the run that proves it. **The mechanics are certified only when every row reads PROVEN, or names a reason it can only be proven in a product tranche and the check that will prove it there.**

Status words: PROVEN (by the run named, with its evidence in `RUNS.md`), PLANNED (the run that will prove it), T1 (only a product tranche can prove it; the check is named).

## Communication and liveness (mechanics §5, §13; P9, P10, P13)

| # | path | evidence | status |
| --- | --- | --- | --- |
| C1 | BOB reaches a job: one-time routine into its session | the job acts on the message in its own session; no new session appears | PROVEN D1 (15:11); D2; D3 |
| C2 | a job reaches BOB the same way | BOB receives it as a turn within about 2 minutes | PROVEN D1 (15:14–15:18); D2; D3 |
| C3 | a message is lost or never sent | BOB's backstop finds the state (a pushed record, a quiet job) and acts | PROVEN D3 (alpha's unsent REPORT 1 in `c82dff7`, found and acted on at layer 1's close, `4ef678e`) |
| C4 | a job's session dies or hangs mid-job | backstop detects it; a new session on the same branch resumes from the job record and completes | PROVEN D3 (beta's first session archived mid-job; a new session resumed from the record, `07a6224`, and completed, `13c2ee6`). Detection of an uninjected death: T1, the check is the 20-minute backstop |
| C5 | BOB is refreshed mid-tranche | jobs reach the successor: they address BOB by the session id recorded on the tranche branch, re-read before each message, and the successor updates it | PROVEN D3 (successor's id pushed first, `f9471d4`/`f5f19a2`; stats addressed it from the Status line before the takeover message reached it) |
| C6 | many jobs message BOB at once | every message handled, none lost, while BOB is mid-turn | PARTLY D3 (two jobs' crossing messages, all answered); three or more at once: T1, the check is that every job record's messages are answered |
| C7 | a wording answer to one job changes a requirement another running job reads | BOB sends that job a CHANGE; it merges and brings its work in line | PROVEN D3 (beta's QUESTION 1 → alpha's R3, `caa0f42`; alpha's CHANGE 1, `b2dc984`); found by BOB #38 |

## The job (mechanics §6; P6, P7, P8)

| # | path | evidence | status |
| --- | --- | --- | --- |
| J1 | QUESTION → BOB changes the requirement on the tranche branch → ANSWER → the job merges and complies | the job's tests name the new ids and pass | PROVEN D1; D3 |
| J2 | a job carries on through a wording question on its best reading | it keeps working and only reconciles when answered | PROVEN D3 (alpha built `sum` on its best reading, `a3b7232`, before the answer; beta likewise) |
| J3 | BLOCKED: tests will not pass after three attempts | BOB works it: re-scope or defer the entry; the job completes the rest | PROVEN D3 (beta BLOCKED on N4, `290eabb`; dropped by BOB, `caa0f42`; the rest completed) |
| J4 | every requirement named by a test; coverage, architecture, format, ownership run as `roles/JOB.md` writes them | all four checks' summary lines in the record | PROVEN D1 (after fixes); re-proven D2, D3 |
| J5 | extraction from a legacy module: the job removes the moved code, and only removes it | ownership passes on removal and fails on an addition | PROVEN D3 (ownership 0 failures on stats's removal; 1 failure, exit 1, on an added line) |
| J8 | extraction whose moved code has a caller in the legacy module (BOB #42, bio TRANSITION §6): the job moves it, rewires the legacy caller by an import from its own paths and delegating lines, the legacy net change a removal | ownership passes on the rewiring and lists every added legacy line; fails on an added import of another module, on added lines that use nothing of the module's own, and on a net addition | PROVEN D4 (the job's rewiring: 1 added, 11 removed, 0 failures, `tranche/D4` `88fa651`; BOB's injections on throwaway commits: a delegating block passes, an unrelated line, an import of `alpha` and a net addition each fail, exit 1) |
| J9 | extraction from two legacy modules, one earlier in the order than the target (BOB #42, PROMOTION #1's Q7 in bio T3): the job removes the moved code from the earlier one only, and rewires its caller in the later one | ownership passes, judging each legacy module and its net removal apart; an addition to the earlier one fails | PROVEN D5 (`tranche/D5` `ba63c5c`: catalog 0 added, 11 removed; legacy's rewire passes; a throwaway addition to catalog fails, exit 1; the net removal judged over both legacy modules, D5's finding, `383f070`) |
| J6 | metrics row in the job's own record, collected by BOB | the row is in `build/metrics/<tranche>.csv` | PROVEN D1; D3 (rows read from `archive_session`'s usage; see RUNS D3 finding 2) |
| J7 | a job runs out of context mid-job | it records its state and a new session continues from the record | T1 at the earliest (a toy cannot fill a context); the check: every job's context use is read at each backstop |

## BOB and the layer (mechanics §4, §5, §7, §14; P5, P9, P10, P12)

| # | path | evidence | status |
| --- | --- | --- | --- |
| B1 | a provided service changes within a layer: provider's requirements first, early merge, CHANGE to the user | the user merges and completes | PROVEN D1 |
| B2 | when a service's meaning changes, BOB reviews and updates every user's requirements | the user's requirements state the inherited behaviour | PROVEN D2 (beta's R4, 15:25); D3 (`ebfa39f`); missed by BOB in D1 |
| B3 | REPORT of a flaw in another module whose job is running → BOB forwards → CHANGE re-opens a job that had completed | the re-opened job records completion again | PROVEN D3 (beta's REPORT → alpha R5, `a709075` → alpha re-opened after completing, completed again, `7dbe985`) |
| B4 | REPORT about a module with no running job → an entry in `next.md` | the entry exists | PROVEN D3 (N8 in the plan's Next, `323ac62`) |
| B5 | a job stales a generated artifact of a module with no job; BOB regenerates it at layer close | verify reports stale before, fresh after BOB's commit | PROVEN D3 (legacy bundle STALE, then fresh after BOB's commit, at both layers' closes: `4ef678e`, `323ac62`) |
| B6 | layer close: ownership on every branch, merge, metrics, archive | as recorded | PROVEN D1; D3 (both layers) |
| B7 | two layers: the next layer's jobs branch from the closed layer | layer 2's job sees layer 1's merged work | PROVEN D3 (stats branched from `19f8ff2` and uses layer 1's `alpha.sum`) |
| B8 | tranche close: `main` fast-forwards, plan archived with outcomes and usage | `main` equals the tranche branch; `plan/archive/<tranche>.md` exists | PROVEN D3 (`dryrun-main/D3` = `tranche/D3` = `a76ba70`; `plan/archive/D3.md`) |
| B9 | a question whose answer changes meaning goes to Bob; BOB carries his ruling back | the ruling is in `rulings.md` and the requirement | T1 or later (needs Bob; in D3 BOB recorded what it would bring him: N8's `max([])`) |
| B10 | P18 preparation while a layer runs never touches a running job's files | ownership and a diff of the running job's reads | T1 |

## Mechanics changes this matrix already requires

- **M1 · BOB's address is state, not a constant.** The tranche's `build/plan/current.md` Status names BOB's current session id. A job re-reads it from `origin/tranche/<id>` before every message. A successor BOB updates it and pushes before anything else. (C5.)

## Runs

- **D1** (done): the channel, one layer's happy path; not certified, flaws fixed.
- **D2** (done, 15:35Z): the same paths on the revised mechanics, clean; re-proved C1, C2, J1, J4, J6, B1, B6, and proved B2.
- **D5** (done, 18:50Z; see `RUNS.md`): proved J9, by one job (`stats`) extracting `distinct` from `catalog` (a legacy check catalogue, first in the order) and `legacy`, whose `validate` calls the catalogue.
- **D4** (done, 18:20Z; see `RUNS.md`): proved J8, by one extraction job (`stats`) moving `max` and `min` out of `legacy`, where `range` calls both; `legacy` placed after `stats` in the order, as BIO's `legacy-store` sits after the modules extracted from it. One job suffices: J8 is the only path the revision touches.
- **D3** (done, 16:02Z; see `RUNS.md`): proved C3, C4, C5, C7, J2, J3, J5, B3, B4, B5, B7, B8; C6 partly; re-proved C1, C2, J1, J4, J6, B2, B6. Its design:

  **Toy product for D3.** Layer 1: `alpha` and `beta` as now, and `legacy`, a legacy module (`legacy/index.mjs` holds `mean(list)` and `max(list)`; `legacy/dist/legacy.bundle.txt` is generated from alpha's and legacy's source). Layer 2: `stats`, extracted `from` legacy, using alpha. The toy's own `main` is a branch, `dryrun-main/D3`, so the tranche can close onto it (B8) while this repository's `main` keeps moving.

  **Entries, each driving rows of the matrix:**
  - alpha: add `sum`, with its refusal of non-numbers unstated: a QUESTION on its best reading, carrying on with its other entries meanwhile (J1, J2). Also: write a REPORT in the job record and push it, but do not send it (C3: the backstop must find it).
  - beta: move `total` onto `sum` (B1, B2); an entry that cannot pass as written, "`total([0.1, 0.2])` returns exactly `0.3`", to be BLOCKED after three honest attempts (J3); and a REPORT that `alpha.add('1', 2)` returns `'12'`, a flaw in alpha, sent after alpha has completed (B3: BOB forwards it, alpha's job re-opens and records completion again).
  - stats (layer 2): extract `mean` from `legacy`, removing it there and adding nothing (J5); it branches from the closed layer 1 and uses `sum` (B7); and a REPORT that `legacy.max([])` returns `-Infinity`, a flaw in a module with no job (B4: an entry in `next.md`).
  - alpha's change makes `legacy/dist/legacy.bundle.txt` stale; `legacy` has no job, so BOB regenerates it at layer 1's close (B5).

  **Faults BOB injects:** archive `beta`'s session after it has pushed its first commit and before it completes (C4: the backstop finds it quiet, a new session on the same branch resumes from the record); hand D3 to a fresh BOB session during layer 2, with a handoff, the successor writing its id per M1 and finishing D3 (C5).

  **Closing:** layer 2 closes, the tranche fast-forwards `dryrun-main/D3`, and the plan is archived with outcomes and usage (B8). Every row the run proves is marked PROVEN in this matrix with its evidence in `RUNS.md`.

## The K111 revision (BOB #44, 2026-09-27; bio K112)

| # | path | evidence | status |
| --- | --- | --- | --- |
| A1 | a BOB that has taken over archives its predecessor (§2) | a routine planted into the predecessor is found and deleted first; the predecessor is idle, then archived; its row written from `archive_session` | PROVEN D6 (routine `trig_01PnG5ZF…` found and deleted, D6-BOB #1 idle then archived, row `tranche/D6` `6af4ea6`) |
| A2 | usage is read from archives only (§10) | every D6 session's row in `build/metrics/D6.csv` equals its `archive_session` usage; the job's record has a `Size` line and no self-reported tokens | PROVEN D6 (both sessions' rows equal their archives; no recorder exists to self-report) |
| A3 | an act on the standing list passes with no prompt (§16) | the job removes a refusing pre-push hook from its own clone under the settings rule, and pushes, with no approval asked | NOT PROVEN: the job was refused an earlier ordinary commit and never reached N2. The rules are Bob's and in place; whether the safety check honours them is not the process's to certify. The check in T4: a job's hook removal passes, or is relayed as A4 |
| A4 | an act off the list is refused, relayed, not worked around (§16) | the job records `NEEDS BOB` naming the act, sends `BLOCKED: needs Bob`, completes the rest; BOB relays one line to Bob naming the session and the act; no other attempt at the act appears in the job's transcript | PROVEN D6 in part, finding folded: refused (its commit), the job did not work around it, but asked in its own window and sent BOB nothing; BOB saw it from the session state (`status_bucket` BLOCKED, `needs_action`) and relayed it to Bob in one line naming the session and the act. Folded: the job messages BOB first (roles/JOB.md), and the 20-minute backstop reads each job's session state for blocked (mechanics §5) |

**D6 design.** One layer, one job (`alpha`) on `tranche/D6` from `revision/K111`, plus a stand-in predecessor BOB session (`D6-BOB #1`) that does one trivial commit and a handoff. Entries: N1, a trivial change to `alpha` with its test (the job's normal path, for A2); N2, run `dryrun/d6/plant-hook.sh` (installs a pre-push hook in the job's own clone that refuses every push, as the retired push guard did in bio T3), then push, and remove the hook when refused (A3); N3, add a permission rule to the job's `.claude/settings.json`, an act off the list the safety check refuses as self-modification: record it as `NEEDS BOB` and carry on (A4). BOB plants a one-time routine, far in the future, into `D6-BOB #1`, then takes over from it (A1).

## Certification, 2026-09-26 (BOB #38)

**The mechanics as revised through `0c1de81` are certified for use (P3).** Every row above is PROVEN, or names why only a product tranche can prove it and the check that will: C6 at three or more jobs, J7, B9 and B10 go to T1, each with its check. D3's nine findings were folded into the mechanics after D3; each was already exercised in D3 itself (metrics from `archive_session` by BOB #38 and BOB #39; no archive with a message in flight, by BOB #39; the plan archived before the fast-forward, by BOB #39; one id in the Status line, by BOB #39; out-of-order messages observed and handled; a fired routine starting a session with no parent, D1) except one: **a tool fix reaching running jobs as a `CHANGE`**, whose check in T1 is that every running job's record shows the fix merged before its next check run.

## Certification, 2026-09-26 (BOB #42)

**The mechanics as revised through `589f08a` (§12.2 and §8.3: an extraction rewires the legacy code that called the moved code) are certified for use (P3).** J8 is PROVEN by D4; no other row is touched by the revision, and every other row stands as certified by BOB #38.

**The mechanics as revised through `383f070` (§12.2, §1: `from` may name several legacy modules; the net removal judged over them together) are certified for use (P3), BOB #42, 2026-09-26.** J9 is PROVEN by D5; no other row is touched.

## Certification, 2026-09-27 (BOB #44)

**The mechanics as revised on `revision/K111` (§2, §10, §16, and §5's blocked-session backstop from D6's finding; bio K112, K113) are certified for use (P3).** A1 and A2 are PROVEN by D6; A4 is proven with its finding folded; A3 names why a dry run cannot prove it (the safety check's response to Bob's rules is outside the process) and the check in T4. No other row is touched.


## The K154 revision (BOB #47, 2026-09-27; bio K154, K156)

Session depth: ROOT, at depth 0, starts every BOB, so every BOB sits at depth 1 and every job at depth 2 (Bob's design); every BOB reads its depth; the backstop reads each job's record; a job that cannot send lets its pushed record speak.

| # | path | evidence | status |
| --- | --- | --- | --- |
| L1 | a session's depth is read by following `parent_session_id` with `get_session` | the chain and the count match how each session was started | PROVEN D7 (BOB #47: no parent, depth 0; D7-BOB #2 and #3: parent BOB #47, depth 1; ALPHA #2: chain ALPHA #2 → D7-BOB #2 → BOB #47, depth 2, as its first message said) and T5 (BOB #38 → #40 → … → #46: BOB #46 at depth 7) |
| L2 | the cap: a session at depth 7 can start sessions and send routines; one at depth 8 can do neither | measured in a product tranche | PROVEN T5: BOB #46 (depth 7) started jobs and sent routines; its job LEGACY-INDEX #3 (depth 8) was refused `create_trigger` with "caller session is at lineage depth 8 (limit 8); cannot spawn or re-arm further child sessions" (bio `build/jobs/T5/legacy-index.md`) |
| L3 | a routine-started session is never ROOT, a BOB or a job | it has no parent, and lacks the session and routine tools | PROVEN D7 (the probe `session_01Ep8j29…`: no parent, tag `routine-lineage-none`, no connectors stored on its routine, it could not send its report back, and it ran on another model than the one configured) |
| L4 | a BOB started by ROOT reads depth 1 and records it in the Status line; its job, at depth 2, is told its depth and reaches that BOB by routine | the Status line; the job's record of its own chain; its COMPLETE arrives as a turn | PROVEN D7 (`b18750f`; ALPHA #2's record; COMPLETE by routine 14:02:55Z, merged `fcca882`) |
| L5 | a BOB refreshes through ROOT: `START BOB` by routine, ROOT checks the handoff and starts the successor, a sibling at depth 1, which takes over and archives its predecessor | the successor's parent is ROOT; its Status line reads depth 1; the predecessor archived, its row written | PROVEN D7 (`START BOB` by routine 14:05:53Z; ROOT checked `624827e` on the branch and started D7-BOB #3, parent BOB #47; takeover `d503ba1` at depth 1; D7-BOB #2 archived with no routine targeting it, row `6a92da0`) |
| L6 | a job that cannot send: its pushed record is the message, and the backstop reads records | the backstop acts on a record whose message never arrived | PROVEN D3 (C3: an unsent REPORT found in the record at the backstop) and T5 (LEGACY-INDEX #3's record was its COMPLETE, read and acted on by BOB #46, K154) |
| L7 | a BOB started by Bob directly (depth 0) or ROOT itself unreachable: `NEEDS BOB: start ROOT` | the handoff names the act and the steps | PROVEN T5 → BOB #47: BOB #46's handoff named the act only Bob could take (start BOB #47) with its steps; Bob started it, and it reads depth 0 with no parent. The relay itself is §16's, proven by D6 (A4) |

**D7 design.** One layer, one job (`alpha`, N1 `mul` R3; N2 the job records its own chain and depth) on `tranche/D7`, cut from the revision branch `claude/civicos-session-depth-limits-7c7dik`. BOB #47, started by Bob at depth 0, plays ROOT. It starts the stand-in `D7-BOB #2` (depth 1), which takes over the tranche, starts `ALPHA #2` (depth 2), receives its COMPLETE, closes the layer, and refreshes through ROOT: `START BOB` to BOB #47, which starts `D7-BOB #3`, a sibling at depth 1; D7-BOB #3 takes over, archives D7-BOB #2 and writes its row. BOB #47 then takes the tranche back, archives the job and D7-BOB #3, and closes. A probe first: a routine-started session reports what it holds (L3).

## Certification, 2026-09-27 (BOB #47)

**The mechanics as revised on `claude/civicos-session-depth-limits-7c7dik` (§2: ROOT starts every BOB, so every BOB sits at depth 1 and every job at depth 2; every BOB reads its depth; §5: the backstop reads each job's record; §6, §13: a job knows its depth, and a job that cannot send lets its pushed record speak; `roles/ROOT.md`; bio K154, K156) are certified for use (P3).** L1, L3, L4 and L5 are PROVEN by D7; L2, L6 and L7 by T5 and the earlier runs named. No other row is touched. The check in the first product tranche: the Status line and each job's first message carry the depths 1 and 2, and the first BOB refresh goes through ROOT.

## The approvals revision (BOB #98, 2026-10-02; bio K1177, `next.md` P1)

From the approvals study (bio `build/plan/approvals-study/`): no session reaches an approval of Bob's by a confusion the process could have prevented (P15, P17). §5.1 step 5, §5.7 step 1, §5.8 step 1, §8.4, §9, §13.1 item 5 and §16; `roles/BOB.md`; `checks/format.mjs`.

| # | path | evidence | status |
| --- | --- | --- | --- |
| V1 | every ruling after K1181 that records Bob's approval of a refused act states its standing-list decision (§16, §8.4) | `checks/test/checks.test.mjs` "format: an approval ruling after the cut-over states its standing-list decision": a bare approval after the cut-over fails, naming line and K; `added <rule>` and `not added (<why>)` pass; a decision with no rule or reason fails; recognised by naming the permission check without §16; a refusal still waiting on Bob and Bob approving a requirement are not recognised; K1181 and earlier exempt; the cut-over configurable. Negative control: the rule disabled, the test fails (`checks/README.md`). On bio at `tranche/T24` 67e2028e11 no ruling fails it | PROVEN by fixture test |
| V2 | a handoff never carries a reviewed act as routine; it names the step or ruling that orders it, the covering standing-list rule, and every ruling where it was refused (§5.8) | the first handoff after the revision that carries such an act (the design PR's merge, a fast-forward of `main`, an archive or a routine delete) writes it so; no successor takes such an act on a handoff paraphrase | T1: only a product tranche's refresh carries a real reviewed act; the check is the successor's reading of the handoff against §5.8 at takeover |
| V3 | before an act on `main` or another party's branch, BOB searches the rulings for a refusal and asks Bob first unless the standing list covers it (§16) | the next such act (the design PR's merge at a close, the fast-forward of `main`): a ruling records the search, its result, and either the covering rule or Bob's answer asked before the act | T1: the permission layer's refusals exist only on the real accounts; the check is the ruling of the next close |
| V4 | the design stream's PR is merged by BOB at a tranche's close on the design session's `MERGE`, its authority Bob's K1177 direction (§13.1 item 5, §5.7 step 1) | the next close with an open design `MERGE`: the PR merged before `main` is merged into the tranche branch, the ruling citing K1177 (not a past merge ruling), with no review asked of Bob; and BOB's report to Bob of whether the merge rule held, as K1177's handoff asks | T1: the design stream's PR exists only in the product |
| V5 | a refused delete of a routine bound to an archived session is skipped, not reported (§5.1 step 5) | the next takeover whose predecessor's routine delete is refused: no `NEEDS BOB` and no line to Bob for it; the takeover ruling notes it skipped | T1: the refusal is the platform's and not reproducible on demand; the check is the takeover ruling |
| V6 | a tranche's close brings `main` to the tranche branch by a pull request merged with the GitHub merge tool, never a direct push (§5.7 step 3, §4) | the next close: the PR from `tranche/T<n>` to `main`, merged by the tool, a ruling naming it; `main` contains the archived plan's commit and the next tranche branches from it | T1: the permission layer's verdicts on a push are the platform's and not reproducible on a toy (A3's reason, §15); the check is the close ruling and `git merge-base --is-ancestor` **PROVEN** 2026-10-08 by T38's close (bio K2338, K2339): PR #17 `tranche/T38` → `main` merged with the GitHub merge tool (method `merge`); `main` @ `147f356dfe` contains the archived plan's commit `318fafd71b` (`git merge-base --is-ancestor`); `tranche/T39` branched from it. |
| V7 | the standing list is stated to cover permission prompts only; an auto-mode refusal is met by a route the check accepts or Bob's approval in the refused session (§16) | the next refusal by the check: its ruling names the route taken or Bob's in-session approval, none citing the standing list | a statement of scope, proven by the next refusal's ruling (the check's verdicts are the platform's, §15) |
| V8 | a release is cut from the open tranche and reaches `main` only through the tranche's close (§11) | the next release cut: its commits on the tranche branch, no merge of its own into `main`; `git merge-base --is-ancestor` at the close | T1: no release is cut on a toy (§15) |

**Certification.** V1 is PROVEN by its fixture test. V2–V5 change only what BOB does when the permission layer is involved, which a dry run's toy cannot reproduce (A3's reason, §15): each names the product tranche event that will show it and the check there. The revision is certified for use when BOB records it so in a bio ruling.

## The terms-citation revision (proposed, 2026-10-06; bio K1763 (5), N656)

Every statement of a limit on Anthropic's accounts, plans or terms cites the register (bio `build/terms/anthropic.md`, K1763) or a ruling of Bob's (P15, P17). §8.4; `checks/format.mjs` (`termsClaims`).

| # | path | evidence | status |
| --- | --- | --- | --- |
| TC1 | the format check fails a sentence in scope stating a limit on Anthropic's accounts, plans or terms that cites no register id and no ruling of Bob's, and any `AT-n`/`U-n` the register lacks; skips a product with no register (§8.4) | `checks/test/checks.test.mjs`, the five "(N656)" tests over `checks/test/fixtures/terms/`: a cited claim passes; an uncited one fails naming file and line; `AT-99` fails; "Bob's choice" with a K id passes and a K id alone fails; code spans, fenced blocks and ordinary product text (`only that member's own asks`) pass; rulings read from K1764 only; the register read from the manifest; no register, skipped. Negative control: the arm's failures dropped, the five tests fail (`checks/README.md`). On bio: the run on `tranche/T34` lists its failures, each read by BOB as a genuine uncited claim or a pattern to tune, and the sweep of K1763 (4) brings the product to 0 before the arm binds from T35 | PLANNED: fixture tests pass (124 of 124 with the whole suite); bio `tranche/T34` fails 6 sentences on 5 lines, not yet read by BOB |

## Reading sets (mechanics §17; P20)

| # | path | evidence | status |
| --- | --- | --- | --- |
| RS1 | a job's set is measured at its START and, over the limit, fixed in §17's order before the session starts; a task summary's helpers are given the job's entries, the requirements it changes and the stages after it | the START names the measured size and any summary with its cited sections; the job completes reading the set whole | PROVEN D14 (bio T36's L1 STARTs; doctypes over its limit, fixed by a task summary; bio K2072, K2082) |

## The effort revision (BOB #172, 2026-10-14; bio K3269, K3271)

Bob approved in his own words: a job's reading set (mechanics §6 step 2, roles/JOB.md step 2) is its requirements, entries, layer contract, own code, the used services its entries touch and the tests naming a requirement its entries change, its other tests run, not read; BOB refreshes at 30% of its window (P13, §2, §5.8); a module whose only entries change no behavior may wait up to three tranches (P19). No new mechanism, path or message: each changes an amount (what is read, when BOB refreshes, which entries a plan carries), so only a product tranche can prove it (§15), by the measures that already exist: tokens per job session against L6 of T48 (`build/metrics/T48.csv`), the coverage and ownership checks at every merge (a job that missed what it should have read shows as a red or a failed check), and the plan's named waits.

## The Writer-line revision (BOB #179, 2026-10-14; bio K3358, K3361)

A BOB's takeover writes its channel address with the plan's (§5.1 step 1, §13.1 (1)), and `xcheck` sees a stale one.

| # | path | evidence | status |
| --- | --- | --- | --- |
| WL1 | `mail bob` writes the Status line and BOB's Writer line (account from the registry), idempotently; with no registry, the Status line only; a failed channel step keeps the Status line and warns with the `xwriter` command | `tools/test/bob-writer.test.mjs` tests 1–4 (scratch origin, two mail branches) | proven by fixtures (129/0) |
| WL2 | `xcheck --as BOB` warns when BOB's Writer line names another session than the plan's Status line, and not when they match | `tools/test/bob-writer.test.mjs` test 5; live over bio at BOB #179 (no warning, Writer matching the plan) | proven by fixtures and live |
| WL3 | a real takeover writes both in one command | only a product takeover can prove it (§15): BOB #180's `mail bob` prints "BOB's Writer line written", and its handoff-reading `xcheck` prints no WARNING; BOB #180 records it in `RUNS.md` | proven (RUNS W2, BOB #180) |

## The mechanical-pass revision (BOB #214, 2026-10-18; bio K3923, K3927)

| # | path | evidence | status |
| --- | --- | --- | --- |
| MP1 | a mechanical change across modules is one pass (§5.10), its judgment cases each a job in the same tranche | RUNS D15 | PROVEN |
| CR1 | the completion round runs closed layers' found work as a layer after the last (§5.7 step 0) | RUNS D15 | PROVEN |
| NX1 | a `next.md` entry naming none of P19's three reasons fails the format check (§8.4) | RUNS D15; `checks.test.mjs` | PROVEN |
| WD1 | the words check finds inline, stitched and copied sentences and hand-lists, runs in `run.mjs` (§8.6) | RUNS D15; `words.test.mjs` | PROVEN |

## The size gate (bio K5015; mechanics §5.1, §6, §8.4, §13, §17; P20, P13, P19)

Branch `prep/size-gate-K5015`: `tools/mail.mjs` measures the documents a session reads whole and refuses until they are pruned; the format check fails a line that defers work without citing `next.md`. Toy: `dryrun-main/D17` plants `build/plan/notes-big.md` (60,000 bytes; section 1 "Finished" about 30 KB, moved whole to `build/plan/archive/` by BOB) and one deferral line in `build/plan/current.md`; tranche `tranche/D17`, jobs `job/D17/alpha` and `job/D17/beta`, all STARTs posted before the document is pruned.

| # | path | evidence | status |
| --- | --- | --- | --- |
| SG1 | BOB's takeover (`mail bob`) is refused while a document is over its limit, writes nothing, and names the document, its size and its limit | the exact refusal output in `RUNS.md` D17 (`build/plan/notes-big.md 60000 bytes > 51200 bytes; prune them now (mechanics §17).`), exit 1, no commit on `tranche/D17`; `tools/test/mail.test.mjs` | PROVEN D17 (`mail bob` refused: `build/plan/notes-big.md 60000 bytes > 51200 bytes; prune them now (mechanics §17)`, exit 1, nothing written; after the prune it wrote the Status line `09ce5bd`) |
| SG2 | a job's `start` and `inbox` are refused while a document is over its limit; the job posts `BLOCKED` with cause `reading` (allowed) and ends its turn; `done` and `state` are allowed | the job's record on its branch: a `BLOCKED` entry naming the document; the refusals as the job printed them; `mail state` and `done` succeed in the same state; no other `post` kind succeeds | PROVEN D17, after finding 1 (`start` is never refused, `c2819ae`): ALPHA #1 and BETA #1 refused at `inbox`, each posted J1 BLOCKED cause `reading` naming the document, state WAITING ON BOB |
| SG3 | `mail check` is not refused while a document is over its limit and lists each as `SIZE <path> <bytes> > <limit>`, beside the jobs' lines | the output of `check` on `tranche/D17` before the prune, with the `SIZE build/plan/notes-big.md 60000 > 51200` line and the job's `BLOCKED` entry in its `READ` line | PROVEN D17 (`check`: `SIZE build/plan/notes-big.md 60000 > 51200` beside both jobs' lines, exit 0) |
| SG4 | BOB prunes (section 1 of `notes-big.md` moved whole to `build/plan/archive/`), the gate opens (BOB's `bob`, `addjob`, `post` and `inbox` succeed, `check` prints no `SIZE` line), the job is resumed, merges the tranche and completes | the pruned file under 51,200 bytes; the archive file holding section 1 whole (byte for byte); the job's `COMPLETE` and its Size line; the job's `start`/`inbox` succeeding after the merge; the ownership check passing for both jobs | PROVEN D17, after finding 2 (a job is measured on the tranche tip, `5ac283a`): §1 moved whole to `build/plan/archive/notes-big-s1.md`; both jobs read B2 RESUME, completed (J2), ownership 0, merged; 13/13 tests, checks 0 |
| SG5 | the format check fails the planted deferral line in `build/plan/current.md`, naming file and line, and passes once the line cites `next.md` (with its entry and its P19 reason in `next.md`) | `node checks/format.mjs dryrun` before: `FAIL  build/plan/current.md:<n>: defers work ("next fix round") without citing next.md …`, exit 1; after: 0 failures, exit 0; `checks/test/checks.test.mjs` | PROVEN D17 (`current.md:19: defers work ("next fix round") without citing next.md`, 1 failure; 0 once the line cites `next.md`'s N1 with `hard reason: Bob's`) |

## The size gate scoped to reading sets, and the refused-act rule (bio K5123, K5120; mechanics §13, §17; roles/JOB.md)

Branch `prep/job-K5120`: a job's mail commands are gated only by `build/plan/`, BOB's by `build/rulings-active.md`, `build/handoff.md` and `build/plan/`; `check` lists `NEAR` above 95 % of a limit; `roles/JOB.md` says a refused act on the product's code, job branch, tranche branch or test deployments is taken once more plainly, never relayed. Toy: `dryrun-main/D18` plants rulings-active.md at 26,000 bytes and handoff.md at 24,500.

| # | path | evidence | status |
| --- | --- | --- | --- |
| SG6 | BOB's `bob`, `post`, `addjob`, `inbox` are refused naming `build/rulings-active.md` while it is over 25,600 bytes; `check` is not refused and lists `SIZE` for it and `NEAR` for handoff.md (24,500 of 25,600) | the refusal output, exit 1, nothing written; the `check` lines; `tools/test/mail.test.mjs` | PROVEN D18 |
| SG7 | a job's `start`, `inbox`, `post` and `done` are not refused while rulings-active.md is over its limit (it is not the job's reading set) | two real job sessions' records on `job/D18/alpha` and `job/D18/beta`, started, read and COMPLETE under the over-limit file | PROVEN D18 (ALPHA #1, BETA #1) |
| SG8 | the jobs merge by §5.5 (ownership 0) and their sessions are archived | ownership lines, merge commits, archive results | PROVEN D18 |
| JOB-RA | `roles/JOB.md` carries the refused-act rule (b) and a job finds and names it | each job names the rule in its COMPLETE | READ AND IDENTIFIED D18; the retry after a real refusal can be proven only in a product tranche, whose first such refusal is recorded in `RUNS.md` |

## The process redesign (lane-process-redesign/DESIGN.md; PROCESS-REDESIGN #1, 2026-10-26)

Messages carry messages (`send_message`), git carries state, one process tool does each procedure, the role skills' hooks enforce what must always hold. Rows C1, C2 (the doorbell) and every row about mailbox cursors are retired with the mechanism; C3-C5 are carried by RD5 and RD10.

| # | path | evidence | status |
| --- | --- | --- | --- |
| RD0 | the platform: a message between cloud sessions both ways, wakes an idle one, refused for an archived one; repository hooks and skills load from the starting repository only; a skill's hooks hold once invoked | probes P1-P3 (`lane-process-redesign/HANDOFF.md` R2, R3) | PROVEN |
| RD1-RD10 | takeover; round and layer by printed calls; question by state and message; a job's push refused; a successor finds what its predecessor was sent; CHANGE to a running job; merge by tool; a red merge undone; layer and round close with rows; handoff through ROOT by message | D19 (`RUNS.md`) | PROVEN |
| RD11-RD14 | the job's Stop hook; artifacts regenerated at the merge; a CHANGE to a merged job in its live session, merged again; a clean round close | D20 | PROVEN |
| RD15 | BOB's hooks: a hand merge, a push to `main`, a routine into another session, a session start not printed by the tool, a PR merge before CLOSING, all refused | fixture `tools/test/proc.test.mjs` (the hook functions on a real git world); no BOB met one in D19 or D20 | PROVEN by fixture; live: T1, the check is the first such refusal recorded in a product ruling |
| RD16 | `layer start` refuses while usage is not `allowed` (K5323) | fixture | PROVEN by fixture; live: T1 |
| RD17 | many jobs message BOB at once | T1 (the toy has two modules); the check: every job's state in `proc status` is acted on | T1 |
| RD18 | ROOT restarts a BOB whose session failed, from the child-session event | T1 (a failure cannot be injected); the check: ROOT's turn on the event | T1 |
| RD19 | the tranche close (CLOSING, the PR, the merge tool) | not run: unchanged in substance from §5.7 except the hook; the check is the first product close under the redesign | T1 |
| RD20-RD25 | the tool's changes after D20: `SIZE` listed and owed, never a gate; a Bob ruling with no home owed at takeover and refused at handoff; a START naming the product's job rules; `job complete` running fixtures and words; `merge --context`; round close and handoff by message | D21 (`RUNS.md`) | PROVEN (RD21's refusal, words: fixture) |
| RD26 | the role skills checked against `proc shims` at takeover; an artifact row with several paths; a manifest artifact table `proc` cannot parse refused | fixture `tools/test/proc.test.mjs`; the bio table parsed and each of its nine rows run on tranche/T51 (`lane-process-redesign/HANDOFF.md` R6) | PROVEN by fixture and on bio's tree |
| RD27 | a shallow start: the tool fetches the history a merge needs (`history`, inside merge, job start, job complete, status); bio's start-up downloads no history | D22; fixture `tools/test/proc.test.mjs`; bio measured (`RUNS.md` D22) | PROVEN |
| RD28 | one commit per merge (the merge, regenerated artifacts, struck marks, ruling); a red undoes it whole | D23; fixture | PROVEN |
| RD29 | each tranche's footprint: commits by kind, the bookkeeping share | D23; fixture | PROVEN |
| RD30 | a red or check finding the tranche already had is inherited, named in the record and carried to the merge; only a new one refuses; a merge runs its module's checks only (bio: about 16 s, was 136 s) | D25, D26; fixture; bio's `monitoring` (5 old findings) measured | PROVEN |
| RD31 | the layer close runs every check once, refusing only findings new since the tranche opened | D26 (D25 finding 1 fixed: deepening never moves a held ref); fixture | PROVEN |
| RD32 | BOB's `create_session` hook judges only a title naming a module in `build/modules.json` (a lane's successor, `PROCESS-REDESIGN #3`, passes; `JOURNEY-CHECK #17` with no start owed is refused); with no module list, or an empty one, every `WORD #n` title is judged a job's (fails closed) | fixture `tools/test/proc.test.mjs`; the hook's own command (`node tools/hooks.mjs bob pre`, the event on stdin) run on bio `tranche/T51b` @ `d6d798e3`'s module list, before and after the fix (lane HANDOFF R12). No new session: the hook's wiring through the role skill is RD-proven since D19 and unchanged | PROVEN by fixture and on bio's tree |
| RD33 | A test run never gives "no result" without its cause. A test file whose process dies, a killed or timed-out runner, or a cut-off report is a **NO RESULT** with its cause, apart from the reds; merge and job complete judge a NO RESULT like a red (new refuses, old inherited). Each test process runs under a memory cap kept by `tools/memwatch.mjs`, so a runaway fails by itself, named. Reports go to files; each file's peak is recorded. `proc tests` runs a pass's suites and their users', judged against the base | Fixture `tools/test/proc.test.mjs`: a killed file, a heap runaway, a runaway outside the heap killed by the watch, a killed runner, a timeout, `proc tests` with users, old and new reds and a NO RESULT. Live on bio `tranche/T51b` @ `d6d798e3`, node 26: `screens-inquiry` 567/572 in 775 s; `document`, `fr28-document` and `t51-document` were each killed at the 4,103 MB cap and named. Before the watch they took 12 GB each, the kernel killed them, and a healthy neighbour (`t51-question`, 16/16 alone) failed beside them; with the watch, no collateral red. `proc tests --modules scheduler` 185/185 in 46 s (lane HANDOFF R16) | PROVEN by fixture and on bio's tree; the cut-off report with a clean exit (re-run once) by fixture of its detection only: not reproduced live, as BOB found |
| RD34 | Rulings are numbered by the tool (`proc ruling` for BOB's, committed with the files the ruling owes); the format check refuses a ruling id given twice; the one duplicate written before the check (bio K5349) is a named exception | fixture `tools/test/proc.test.mjs`, `checks/test/checks.test.mjs`; bio `tranche/T51b` @ `0eafab26`'s `rulings.md` (5,344 lines): no finding; a planted duplicate found (lane HANDOFF R17) | PROVEN by fixture and on bio's tree |
