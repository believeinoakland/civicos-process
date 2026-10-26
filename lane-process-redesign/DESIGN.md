# The process redesign: design

**Status** · Draft, PROCESS-REDESIGN #1, 2026-10-26. Not in use: it reaches use only once certified by a dry run (P3) and merged by BOB at a tranche boundary, or sooner on Bob's ruling (K5334). Its sources are Bob's direction (R1: Claude Code's best practices and the practice before the decline, not today's process), the principles P1-P20, the Claude Code documentation read live on 2026-10-26, the probes P1-P3 (R2, R3) and the measured history (`evidence-pre-decline-practice.md`).

## 1. What failed, and what worked

**Worked (T42-T44, T48; Oct 10-14):** a tranche of 13-80 entries, fixed when it opened, closed to `main` in 3-9 hours; one job session per module per tranche, kept open until its layer closed, so a CHANGE reached the same session; about two messages each way per module; BOB's always-read set 97 KB; five small checks and a 32 KB mail tool.

**Failed (Oct 18-26), each measured:**
1. **Open scope.** T51 became "until released, deployed and walked, every defect fixed" (K3815): 8.6 days open, 1,385 job sessions, fix rounds re-planned inside one 190-230 KB plan.
2. **One session per change.** Archive at merge (K4219) made every later CHANGE a new session: 6.96 sessions and 9.4 COMPLETEs per module (1.00 and 1.2-1.8 before).
3. **Rules in prose that must always hold.** The always-read file grew 16.7 KB to 63.8 KB, was cut to 25 KB (K5012), and each new rule then pushed out an old one; BOBs re-learned by mistakes (K5322).
4. **Hand-carried protocol.** Two commands where one was meant (COMPLETE, then `done`), a cursor check that turned the slip into a ring and a turn (K5171, K5320; "cursor" in 3, 34, 60 rulings on Oct 24-26); doorbells set minutes late or rung into archived sessions (K3686, K5321).
5. **Gates that fail everyone.** A 214-byte overrun of one file stopped every job (K5123).

**Claude Code's practice** (code.claude.com, read 2026-10-26): the always-read file is short ("Would removing this cause Claude to make mistakes? If not, cut it"; under 200 lines); situational procedures are skills, loaded when used; "use hooks for actions that must happen every time with zero exceptions"; steps a script can do are code; bulk reading goes to subagents; each piece of work carries a check it runs; a fresh session with a clear brief beats a long corrected one; sessions pass findings by message.

**The platform, measured (R2, R3):** `send_message` carries a message between cloud sessions both ways, wakes an idle session within seconds and refuses an archived one at once; repository hooks and skills load only from the repository a session starts on; a skill's frontmatter hooks hold for the rest of the session once it is invoked.

## 2. The shape

The roles stay (Bob, ROOT, BOB, module jobs; P4-P9, P17), the principles stay, and the working shape of Oct 10-14 comes back. What changes is how the steps are carried: by the platform's messages, by one process tool that does each procedure whole, and by hooks.

**2.1 Work in fixed rounds (P10, P19).** A tranche runs as one or more **rounds**. A round's scope is fixed when it opens: its entries, grouped by module and layer. Work found while it runs goes to the running job of its module (the same session), else to the START of a job not yet started, else to the **next round of the same tranche**, which opens the moment this one ends. So nothing found waits for another tranche (P10, P19), and no plan is re-planned while it runs. Each round's plan is its own file, archived whole when the round ends. A walk's findings are a round's entries, never edits to a running one.

**2.2 One session per module per round, kept until its layer closes (P8, P10, P13).** As P10 says and as Oct 10-14 ran: a job's session stays active after its merge until its layer closes, and a CHANGE reaches that same session by message. The tool's `job route` starts a fresh session instead only when the session is archived or failed, or its context is past half its window (mechanics §6), and the fresh one continues from the job's record. K4219's archive at merge, which P10 does not allow, is retired (a BOB ruling, so BOB's to replace, P17).

**2.3 Messages carry messages; git carries state (P9, P13, P15).** BOB and a job talk by `send_message`, which is delivered or refused at once. Git keeps only what a successor or a merge must read: each job's record holds one Status line (session, depth, state) and, at the end, its completion report; a question that waits is also its state (`WAITING: <the question in one line>`), so a successor BOB sees it. No mailbox entries, no cursors, no doorbells, no `RING` or `READ` bookkeeping. A message refused because its target is archived is re-sent to the address the tool reads from git at that moment.

**2.4 One process tool, one command per procedure (P16; Bob, K5326).** `tools/proc.mjs` replaces the hand-carried steps. Each command checks the state it needs, does the whole procedure, commits and pushes, and refuses (exit 1, naming what is missing) when a step cannot be done; it never leaves a step half done. Where the procedure needs a platform act a script cannot take (start a session, send a message, archive), it prints the exact call, and a hook checks the call against it.
- BOB: `takeover`, `round open`, `layer start` (job branches, START bodies, the `create_session` specs), `job route` (message the live session or start a fresh one), `merge` (premerge's checks, the merge, push and verify, the marks struck, the ruling line, the metrics row), `layer close`, `round close`, `tranche close` (each gate in order), `handoff`, `status`.
- Job: `start`, `state`, `complete` (runs the module's tests and the checks, writes the completion report with the Size line, commits and pushes, then prints the message to send; refuses while anything is red or unpushed).
- Any: `addr` (the live session of a role, read from git at that moment).
The checks (§8) and the cross-account channel (§13.1) stay as they are; the channel already has no doorbell.

**2.5 Hooks for what must always hold (Bob, K5326).** Each role's skill registers the role's hooks from its frontmatter (R3), so no settings file changes. The hooks are small and run `tools/hooks.mjs <role> <event>`:
- **Job, Stop:** refuse to end a turn with unpushed or uncommitted work, or with the state `WORKING` (end on a named wait or `COMPLETE`).
- **Job, PreToolUse:** refuse a force push, a push to any branch but the job's own, `create_session`, `create_trigger`, `fire_trigger`.
- **BOB, PreToolUse:** refuse a force push, a direct push to `main`, a hand merge of a job branch (`proc merge` does it), a `create_session` whose title, branch or prompt is not one `layer start` or `job route` printed, any `create_trigger` but its own backstop, and a PR merge to `main` unless `tranche close` has reached its merge step.
- **BOB, Stop:** refuse to end a turn while `proc status` shows a step half done or work unpushed.
If the process repository is not attached, every hook refuses with that reason: they fail closed.

**2.6 The always-read file is an index (Bob, K5323; P15, P20).** Each role reads one short file: its skill, under 150 lines, naming for each situation the one file to read whole when it arises (`situations/<name>.md`, each under 300 lines). Process rules live in the mechanics, the situations or the code; Bob's product rulings move to subject files under bio `build/rulings-product/`, each read whole by the work that touches its subject; `build/rulings.md` stays the full log, searched by tool, never read whole. `rulings-active.md` holds only standing judgments that no code enforces, and the takeover check fails when a recent ruling of Bob's is in none of these homes (today's `bob-rulings-check`, moved into the tool).

**2.7 BOB's context stays small (P13, P20).** BOB waits on messages, not on timers: one backstop, an hourly `send_later` into its own session, only to catch a job that died silently (the platform also reports a child session's failed turn to its parent). Bulk reading goes to workers (sonnet at medium) that return what the task needs. BOB refreshes past 40 % of its window (Bob, K3671, K5167), through ROOT as now.

**2.8 Job count by usage (Bob, K5323).** No cap on concurrent jobs; `layer start` reads `rate_limit_info` (`get_session`, passed in) and starts no new job while its status is not `allowed`, telling BOB to report it to Bob.

## 3. Where the files live (P2)

- This repository: the principles, the mechanics (revised), `tools/proc.mjs`, `tools/hooks.mjs`, the checks, `roles/<role>.md` (each role's index, the text its skill shows), `situations/*.md`, and the dry run.
- The product repository (bio): its `CLAUDE.md` (under 30 lines: attach the process repository, then invoke your role's skill) and one small skill per role, `.claude/skills/civicos-<role>/SKILL.md`, whose frontmatter carries the hooks and whose body loads the process repository's `roles/<role>.md` at invocation. These files are written by `proc shims <product>` from this repository, and a check fails when they differ, so they never drift.

## 4. What reaches Bob

No principle needs to change to carry this design: rounds are mechanics within P10 (nothing found waits for another tranche), the session kept to its layer's close is P10's own text, and §13's premise is mechanics. Bob's own rulings it touches: K3815 (T51's scope) stands, carried as rounds; K5323 (no cap but usage) is carried in code. The report (charter step 6) puts them with options and a recommendation. Settings files are untouched, so Bob has no act to take for the hooks. Claude Code's *projects* (a coordinating conversation that starts threads) fit the roles closely but load no repository hooks or skills and are a beta on Bob's own account: offered to him as an option, not recommended now.

## 5. Certification (P3, mechanics §15)

A dry run in `dryrun/`, two jobs in one layer plus a second round, run by real sessions started on the lane's branch: takeover; open a round; start a layer; a QUESTION and its ANSWER by message; a CHANGE to a running job; COMPLETE by `proc complete`; merge by `proc merge`; a second round's entry routed to the same live session; a message to an archived session refused and re-sent; a job that tries to stop while working, and to force-push, refused by its hooks; BOB's handoff. Each path and its evidence is a row in `dryrun/CERTIFICATION.md`; the run is recorded in `dryrun/RUNS.md`.
