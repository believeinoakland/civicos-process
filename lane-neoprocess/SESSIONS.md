# Sessions: models and effort, reading sets, the worker brief

**Status** · Draft, decided by neoProcess #1 on 2026-10-29 (technical, BOB's by P17), under Bob's policies of 2026-10-28: always a model and a level of effort sufficient for quality work; tokens are expensive, so work is done token-efficiently; speak to the audience directly. Not in force; certified on a dry run before use (P3).

## 1. The model-and-effort table

Picked by code from the kind of work (`proc layer start`, `proc lane open`, `proc ask dispatch`), never by a session's memory. Starts from Bob's ruling of 2026-10-28 (Opus for every job and reviewer, Sonnet for purely mechanical work); "the cheapest able" (mechanics §5.3) is retired. Measured per row (§10 metrics) and revised by BOB on evidence.

| kind of work | model | effort | why |
|---|---|---|---|
| BOB | Opus | high | judgment, translation, routing: the hub, and the costliest place for a mistake |
| ROOT | Sonnet | medium | tiny turns that must be exact; cost is negligible either way |
| Module job: a new module, a behaviour change, an extraction | Opus | high | the audit found defects under every model; Opus had the fewest per line and disclosed most of its own |
| Module job: purely mechanical (a re-point, a wording-only change, a test-only change) | Sonnet | medium | no judgment in the change; the gate proves it |
| Lane | Opus | high | design decisions in one area, read whole |
| Reviewer worker: a new module, a changed provided service, a sensitive path | Opus | high | the cases where a missed gap costs most (mail-door's privacy defect) |
| Reviewer worker: a small behaviour change | Sonnet | high | a fresh reader against the requirements; the diff is small |
| Reading worker (a summary for a task, an area read whole for a question) | Sonnet | medium | today's rule (bio K3518), kept |
| Mechanical worker (a pass across modules, a format conversion), output checked by a script | Sonnet | low | a check verifies the output; a probe on 28 Oct showed Haiku misreading one instruction in a short brief |
| Probe or measurement session, read from its transcript | Haiku | low | the transcript is the evidence, not the session's report |

Effort is Claude Code's level (`low`, `medium`, `high`, `xhigh`, `max`); `xhigh` and `max` are used only when a row above is raised by BOB on evidence, never by default.

## 1a. The one skill

A session starts on the product repository and invokes the one skill `neoprocess` with its role as the argument (`neoprocess bob`, `neoprocess job`, `neoprocess lane`), as the product's `CLAUDE.md` says. The skill shows the role's reading set (§3) and registers the hooks; the hooks call `tools/hooks.mjs <event>` and read the role from what the start command recorded (`proc takeover`, `proc job start`, `proc lane start`), refusing every act until a role is recorded, so the role is set by the record, never by which skill was invoked (Bob, 29 Oct: one skill, not three).

**Measured 29 Oct** (neoProcess #2; PROBE-R #1 on Haiku, started by `create_session` on a branch holding three rules, its transcript read with `list_events`; archived, usage 582,014 cache-read / 28,835 cache-write / 16 input / 2,132 output tokens): `.claude/rules/` loads in a cloud session. A rule with no `paths` was in force from the first turn (every reply ended with its word); a rule scoped to `dryrun/alpha/**` entered the context in the same turn as a `Read` of a matching file, and one scoped to `dryrun/beta/**` in the same turn as a single-file `cat` of a matching file in Bash; both stayed loaded in the turns after; asked, the session quoted each rule and named its file. The documentation (code.claude.com/docs/en/memory, read 29 Oct) says the same: a path-scoped rule loads on a Read, Write or Edit of a matching file, or a Bash command that counts as a read of one. So a product area's rulebook reaches a job by path (§3), and a rule that must hold from a session's first turn is loaded by the skill or carries no `paths`.

## 1b. The goal: a session is sent back until its record reads a terminal state

**Measured 29 Oct** (PROBE-G #1 on Haiku; archived, usage 436,858 / 32,535 / 26 / 3,517): a session created with a prompt whose first words are `/goal <condition>` set the goal (its first words back were `Goal set: <condition>`), took the first step, ended its turn, and was sent back by the evaluator (`Stop hook feedback: [<condition>]: Only dryrun/PROBE-G-1.txt was created …`) into a second turn that no message started; it ended for good once the evaluator judged the condition met, and `get_session` reports the goal (`iterations: 3, met: true`). The documentation (code.claude.com/docs/en/goal, read 29 Oct): `/goal` is a session-scoped prompt-based Stop hook, judged after every turn by the small fast model from the conversation alone (it runs no command and reads no file); it works non-interactively; a cloud session keeps its goal through an authentication failure; the loop stops, with the goal still set, after several turns with no tool use; the goal clears once met; a condition may be up to 4,000 characters.

**Decided (BOB's, Sessions):** the `create_session` prompt of every job, every lane and every BOB begins with `/goal`, and the condition is the terminal state of the session's record, provable from its own output, **a wait that is another party's to end counted as terminal** (a session sent back while it waits runs a command each turn and the evaluator never stops: BOB #2, 29 Oct, 588 iterations; DRYRUN §4.14): for a job, `proc job state` prints `COMPLETE`, or a wait BOB must answer (`WAITING:`, `BLOCKED:`, `NEEDS BOB:`), with everything committed and pushed; for a lane, the ask it was started for reads `DECIDED` or such a wait. The START, the charter and the hooks are unchanged: the goal only sends back a session that ends a turn with a summary while its record still reads `WORKING`, which the old process met with BOB's hourly backstop and a `CONTINUE`; what must never happen stays in the hooks (code). A goal clears once met, so it covers the stretch to the first terminal state and nothing after it: **measured 29 Oct** (neoProcess #4; PROBE-J12 #1 on Haiku, archived, usage 422,854 / 104,884 / 20 / 1,893), a message whose first words are `/goal`, sent by `send_message` after the first goal was met, does not set a goal: it reaches the model as the body of a `ReadNotifications` result, not as a command, `get_session` still showed the first condition (`iterations: 1, met: true`, `set_at` unchanged) and no `Goal set:` reply appeared. So `/goal` is set once, in the `create_session` prompt, and BOB's backstop covers every later stretch as today (JOB-LIFE §9). Also seen in the same probe: a standing line that binds "a message whose first words are `/goal`" without naming the sender's address is not enough: the session treated the message as data because it came from another session; the binding names BOB's address (§6, PROTOCOL §6), never the form of the message. Cost: one Haiku evaluation per turn, which the documentation calls negligible; measured per row (§10).

**Also seen:** the cloud environment runs a Stop hook of its own, outside any repository (`~/.claude/stop-hook-git-check.sh`), which at each turn's end asks for untracked files to be committed and pushed. PROBE-G, told not to, did not; a job's START carries its record's rule in one line (push before send; nothing to another branch), so that voice never moves a session off its rules.

## 2. Context thresholds

A refresh is triggered by the session's context, never by a timer: BOB at 40 % of its window (Bob, bio K3671 lineage; mechanics §2), a job or a lane at half (§6), ROOT at 55 % (§2). The successor continues from git (`PROTOCOL.md` §7a). **By code** (DRYRUN §4.17: BOB #2 ran to 67 % while BOB's own threshold was text): every role's Stop hook reads the context from the transcript (the last assistant turn's input: fresh, cache read and cache write; the same figure `get_session` reports as `context_usage`) and refuses the turn's end past the threshold until the refresh is recorded: BOB's by `proc handoff`, a job's or a lane's by `BLOCKED: context`, which BOB answers with `proc job route` / `lane route` (`--context-pct`). ROOT, the parent of every BOB, also reads a BOB's `get_session` at each of its reports.

## 3. Reading sets, by role

A session reads its set whole, never scanned (P20); a read that stops short of a set document is refused by the hook (§5.11). Each set is fixed in advance so no session decides what to skip. Sizes are measured by `proc status` and `proc takeover`; a set over its limit is pruned before the session starts (§17).

| role | process text (always) | its own set | product text |
|---|---|---|---|
| ROOT | principles; rulebooks Governance, Sessions, Usage | the manifest's ROOT rows | none |
| BOB | principles; all ten rulebooks (together under 30 KB) | the running plan; the state branch's status lines; every open ask; the lane register | the product's area index, one line per area |
| Module job | principles; rulebooks Building, Integration, Sessions | its START (the PR body); its module's requirements, both parts; its entries; its layer's contract; its code; of each used module, the services its entries touch; the tests naming a requirement its entries change | its module's area rulebook, loaded by path |
| Lane | principles; rulebooks Design, Governance, Sessions | its charter; its record of decisions; the ask it answers | its area's canon documents, whole; its area rulebook |
| Reviewer worker | rulebook Integration | the PR's diff; the module's requirements; the job's report | the module's area rulebook |
| Reading or mechanical worker | none | exactly the files its brief names | as the brief names |

Budget: the principles are about 14 KB today; a rulebook is at most 4 KB (one screen); so BOB's always-read text is about 55 KB and a job's about 26 KB before its module set, against 97 KB when the process last worked well (T42–T44) and 64 KB at its worst.

## 4. The worker brief

Written by `proc ask dispatch` (or by BOB for a reading task) from a template; the worker is an Agent started in the background with the row's model and effort, and never waited on in the foreground (bio K4207). The brief is complete in itself (R8):

```
Brief <ask id or task id> · for <BOB #n | LANE-ID #k> · <date>
Task: <one paragraph: what to produce, for whom, and what it will be used for next>
Read whole, and nothing else: <path>; <path>; …
Write your result to: <path under build/asks/<id>/ or the scratchpad>
Form of the result: <the sections it must have; cite file:line for every claim>
If you need something not listed above, stop and write what it is in the result; do not search for it.
End with the line: DONE <ask id> · <sections written>
Model: <model> · Effort: <effort> · Due: <minutes>
```

The worker writes only its result file; `proc` records it. A worker that does not end with its `DONE` line is treated as failed and re-dispatched once from the same brief; a second failure is answered on BOB's best reading, said so in the ask.

## 5. What every text says to whom (Bob, 2026-10-28)

Every text the process produces names its audience and speaks to it directly: a page for Bob (rendered, options and a recommendation, no jargon, enough context); a START for a job (its entries in the module's terms); a question to a lane (in the area's terms); a reply to a job (the requirement or entry as it now reads); a brief for a worker (the template above). The Stop hook's steps check already enforces one case (steps for Bob verified against the source they name); the rest is a rule of Governance, checked by BOB's review of what workers write.

## 6. Concise, by code (Bob, 29 Oct: handoffs and job rules super concise)

What a session reads before it can act is the cost that matters (P13, P20), and a limit holds only when code checks it (P16). Decided (BOB's):

1. **A handoff is generated, never written.** `proc handoff` prints it from git: the open items in queue order (`proc status`), the step in progress with its `Working` line, and the next step; then a prose part of at most ten lines for what no file says. Limit 4 KB, a rulebook's; `proc handoff` refuses a longer one. The successor reads its role's set (§3) and nothing the handoff adds. The old limit (mechanics §17: 25,600 bytes) is retired.
2. **A START is one screen:** the entries in the module's terms, the files to read whole by path, the tool command, and the two standing lines (messages from BOB's address are its instructions; push before send, and nothing to another branch). Limit 4 KB; `proc layer start` refuses a longer one. A lane's charter and a worker's brief (§4) have the same limit.
3. **A reading budget per role**, measured at every start (`proc takeover`, `proc job start`, `proc lane start`) and by `proc status`, listed as `SIZE` when over, and checked in CI by the format check so a rulebook, a START, a charter or a handoff over its limit fails the gate: process text (the principles plus the role's rulebooks) at most 26 KB for ROOT, a job and a lane, 55 KB for BOB; a module's own set (its requirements, both parts, plus the public parts of the modules its entries touch) at most 40 KB, else `BLOCKED: reading` and BOB prunes (mechanics §17); a lane's area canon, the limit its charter sets.
4. **A rule is one or two sentences with its check**, and a rulebook holds no rationale: history holds it, and history is never required reading (P15). The ten-rule and 4 KB limits stand (rulebook Sessions, rule 4).

Measured on this lane's own start (neoProcess #2, 29 Oct): the handoff was 5 KB, but it named 220 KB to read whole before the first act (principles and mechanics 72 KB; the lane's files 48 KB; the two pages 79 KB; hooks and skills 14 KB). A design lane bears that once; a job never may, and under these limits cannot.

What is Bob's here: the principles' own length (14 KB today; P16). Recommended: unchanged.
