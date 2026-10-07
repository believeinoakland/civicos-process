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
