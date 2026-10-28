# The delegation protocol: how jobs and lanes reach each other through BOB

**Status** · Draft, decided by neoProcess #1 on 2026-10-28 (a technical matter, BOB's by P17). Not in force; certified on a dry run before use (P3). Reported to Bob in plain words on the neoProcess page (§2).

## The requirements it meets (Bob, 2026-10-28)

- R1 · The session architecture is ROOT → BOB → jobs and lanes. A job changes one module's code and runs its tests; a lane has one area of focus and responsibility, unique to it.
- R2 · Other sessions delegate tasks in a lane's area to that lane through BOB, and the lane responds with design decisions through BOB.
- R3 · BOB is not a forwarder: it translates what a job or lane needs into a question the lane can answer, and translates the lane's answer into terms the requester can understand and use.
- R4 · A requester need not know whether BOB will answer itself or a lane will. Lanes are abstracted from each other, and from jobs, through BOB.
- R5 · Which lanes a project has is the project's own; BOB defines a lane, on its own recommendation or Bob's, without Bob's approval; Bob may later suggest a change to a lane's responsibilities.
- R6 · BOB carries a central workload, so the protocol minimizes BOB blocking behind work being done. Requests to BOB are queued; BOB consumes the queue; handling a request never blocks.
- R7 · The same holds for a lane: it does not block behind a request. BOB and lanes handle a request statelessly: receive it, decide what is to be done, and, where the work is involved or needs a response from another entity (the repository, the web, another session), spawn a worker to do it.
- R8 · A worker's brief is rich enough that the worker knows what is to be done and how to communicate its result back.
- R9 · The protocol is fault tolerant: no party hangs, and no work is lost. Timeouts of an hour or less may be needed as handles for the worst case; they are never the default means of getting a response.
- R10 · Session refreshes are supported explicitly: any party (BOB, a lane, a job) can be replaced by a successor session, and nothing in flight is lost.
- R11 · Moving from one account to another is supported explicitly: the whole set of sessions can continue on another account, and nothing in flight is lost.

And the canon it stands on: a flaw in another module goes through BOB (P9); what BOB resolves itself and what goes to Bob (mechanics §7); messages carry the words and git carries the state (§13); a decision is recorded once, in its home (P15); every claim names its evidence (P20); what must hold every time is code (P16; Bob, K5326).

## 1. One address

A job or a lane sends every request to BOB's address (`proc addr --bob`), never to a lane or another job. **Code:** the job's and the lane's PreToolUse hook refuses a `send_message` to any session but the one that address names (R1, R4; P16). A request whose target is refused as archived is resent to the address read again (§13).

## 2. What a request carries

A request is the first words of a message, `QUESTION` or `REPORT` as today (§13), from a job or a lane, in the requester's own terms: a job writes against its module's requirements and entries, a lane against its area's canon. It carries what the requester needs, its best reading if it has one, and its evidence (P20). Before sending, the requester records the wait in its own record (`WAITING: <one line>`), so a successor BOB sees it without the message (§6, §13). The requester carries on against its best reading unless the answer decides what it builds next.

## 3. The ask record

Every request BOB does not answer in the same turn becomes an **ask**: one file, `build/asks/A<n>.md`, written only by `proc ask …`, holding in order:

1. `**From** · <JOB or LANE #k> · <session> · <date>` and the request verbatim;
2. `**Route** · <answered by BOB | asked of <lane> | needs Bob>` with BOB's one-line reason;
3. `**Asked** · <lane> · <date>` and the question as BOB put it, in the lane's terms;
4. `**Decided** · <lane> · <date>` and the lane's answer verbatim (§5);
5. `**Replied** · <date>` and the reply as BOB put it, in the requester's terms, naming the requirement, entry, design section or rule it changed;
6. `**Status** · RECEIVED | ASKED | DECIDED | NEEDS BOB | CLOSED`.

The ask is the state. BOB's context holds nothing a successor needs: `proc status` lists every open ask with its stage, and a successor BOB continues each from its file (§5.1, §5.8). An ask that changes a requirement, a design or a rule is closed in the same commit as that change (P15; §9: a ruling never holds owed work alone).

## 4. How BOB routes

On each request BOB decides, in this order, and writes the `Route` line:

1. **Answer itself** when the request is BOB's by mechanics §7: wording of a requirement without a change of meaning, routing a flaw to its module, sequencing, ownership, tooling, tests, branches, or any detail of P17. Most requests end here; the requester is told the answer, not that BOB made it.
2. **Ask a lane** when the request needs a design decision inside a lane's area (the area's canon, its construct designs, its rules). The lane is found from the project's lane register (§7). A request that spans two areas becomes two asks, one per lane, and BOB composes the reply.
3. **Bring to Bob** when the request is Bob's by P17 (a change to what a requirement means, doctrine, high-level architecture, UX, policy), whether or not a lane was asked first: a lane's decision may itself name what is Bob's. BOB puts it to Bob with an explanation, options and a recommendation; the ask reads `NEEDS BOB` meanwhile.

The requester never learns which route was taken unless the answer needs it (a decision of Bob's is cited as his).

## 5. Translation, both ways

**To the lane.** BOB writes the question in the lane's terms: the area's canon section or rule at issue, the behaviour the requester needs stated as a requirement on the area (never the requester's code or branch), the options BOB sees, and what the lane's answer must settle. It carries the requester's evidence only as far as the lane needs it. A lane reads its own area whole (P20) and nothing of the requester's module.

**From the lane.** A lane answers `DECISION`: the decision in one or two sentences, its rationale, its evidence, what it changes (a canon design section, a rule of its area's rulebook, a requirement's meaning) and whether any of it is Bob's. A lane's own need for another area is a `QUESTION` to BOB, like a job's (R4).

**To the requester.** BOB folds the decision into its home first (the canon design, the rulebook, the requirement: with Bob where its meaning changes, P5), commits that with the ask's close, and only then replies: `ANSWER` for a question, or `CHANGE` where the fold changed a file the requester reads (the requester then merges the tranche branch, §4). The reply is in the requester's terms: the requirement or entry as it now reads, not the lane's words.

## 6. Nothing blocks: the queue, the turn, the worker (R6, R7, R8)

**The queue is git; a message is the wake.** The platform delivers a `send_message` to a session between its turns and holds it while a turn runs (measured, lane PROCESS-REDESIGN R2, R3), so BOB's inbox is already a queue. But a message can be lost with the session it was sent to, so the queue of record is in git: every requester's `WAITING:` line in its own record, and every open ask with its stage. `proc status` is the queue as BOB reads it, in this order: a job that cannot proceed (`ANSWER`, `UNBLOCK`, `MERGE`), then asks by stage (`DECIDED` before `ASKED` before `RECEIVED`), oldest first. Whatever wakes BOB, it consumes from `proc status`, not from the message alone, so a lost message costs at most one wake.

**A turn is one step and ends.** BOB's handling of a request is: record it (`proc ask open`), decide its route (`proc ask route`), dispatch the work, end the turn. The dispatch is never waited on in the turn:
- reading or drafting that is more than a few lines (reading an area whole to write the question in the lane's terms, composing a reply from a decision) goes to a **worker**, an Agent started in the background (the canon's rule already: never waited on in the foreground, P13; bio K4207);
- a `proc` command that runs long (`merge`, `tests`, `layer close`) runs as a background task, as today (§5.10);
- a question to a lane, an answer to a job, a page for Bob, is one `send_message` and the turn ends.
The same holds for a lane: it records the ask, spawns a worker for the reading, and ends its turn; its decision is the worker's result, reviewed and sent.

**A worker's brief is complete in itself** (R8): the ask id; the files to read whole, by path, and nothing else (P20, §17); the task in one paragraph; the file to write its result to (`build/asks/A<n>/<stage>.md`); and the line it ends with. The worker never writes the build state (only `proc` does): it writes its result file and finishes, and the platform's completion notice wakes the session that started it. That session then records the result with one `proc ask` command, which reads the result file, and continues. A worker that needs more than it was given stops and says so in its result; it never searches for it (P20).

**Every stage is in git before the next message is sent.** The ask file carries a `**Working** · <worker or session> · <stage> · since <time> · due <time>` line while a dispatch is out, written by the command that dispatched it and cleared by the one that records the result. So a successor BOB (or a successor lane session) sees from `proc status` exactly what is out, and re-dispatches from the same brief.

## 7. Fault tolerance (R9)

- **Nothing is lost:** the request, each stage's text and every worker's brief are in git before the message or dispatch that depends on them; a worker's inputs are files in git, so re-running the same brief gives the same result. Every `proc ask` command is idempotent: a result recorded twice, or a stage recorded out of order, is refused with its reason and changes nothing.
- **Nobody hangs:** no turn waits on another party. A session ends its turn with its state in git and is woken by the platform: a message (R6), a worker's completion notice, a background command's completion, or a child session's failure event (§2).
- **A dead worker is seen, not waited for:** the Agent tool reports a failed worker to the session that started it; a worker session that fails is reported to its parent. Either wakes the session, which re-dispatches from the brief or, on a second failure, answers on its best reading and says so in the ask.
- **A lost wake is caught by the backstop, never by waiting:** BOB's one hourly `send_later` (§5.4) reads `proc status`; a `Working` line past its `due` is listed `LATE` for re-dispatch or a best-reading answer. The due is the worst-case handle (R9): an hour for a worker, a day for a lane's decision; passing it never fails the ask and never counts as an answer.
- **A replaced party loses nothing:** a message refused as `session_inactive` is resent to the address read again (§13); a lane session archived, failed or past half its window is replaced by `proc lane route`, as a job's is (§5.4), and continues from the ask files; a successor BOB finds every open ask at takeover.
- **An answer that arrives late is still applied:** after the requesting job completed it re-opens the job as a CHANGE (P10); after its layer closed it is an entry in the completion round (P10, P19).

## 7a. Refresh and account move (R10, R11)

**A refresh is the normal case, not an exception.** Because every stage is in git and no turn waits (§6, §7), replacing any session is the same act for every role: the outgoing session ends its turn with nothing half done (its Stop hook refuses otherwise), the successor is started by the party that starts that role (ROOT for BOB; BOB for a job or a lane, by `proc job route` / `proc lane route`), and the successor's first command (`proc takeover`, `proc job start`, `proc lane start`) reads its state from git: its record, every open ask it owns, every `Working` line out under its name. A `Working` line held by a replaced session is re-dispatched by the successor from the same brief (§6); a worker inside the old session is lost with it, and loses nothing, because its inputs and brief are files. The address of the new session is written to git by that first command (the plan's Status line, the Jobs line, the lane register), and every other party reads addresses from git before sending (§1), so a message refused as `session_inactive` is resent to the right place at once (§13). The threshold that triggers a refresh is a rule of the Sessions area (BOB at 40 % of its window; a job or lane at half), measured from `get_session`, never from a timer.

**An account move is a refresh of everyone at once.** Sessions on two accounts cannot message each other (§13.1), so the move is: BOB records `MOVING` in the plan's Status line with the target account and pushes; every party that is replaced is replaced on the new account, BOB first (by a ROOT on that account, which Bob starts: the one act only he can take, §2), then each lane and job by the new BOB from their records; the old sessions are archived once their successors' addresses are in git, and their usage rows written (§10). The ask files, the job records and the lane register carry across unchanged, because they are in git, not in any account. Anything in flight on the old account (a worker, a message not yet consumed) is covered by §6 and §7: the successor re-dispatches from the brief, and consumes the queue from `proc status`, not from messages. The condition that starts a move is a rule of the Usage area (the weekly limit near, `rate_limit_info` not `allowed`, or Bob's word; `situations/account-move.md` today); the move itself never waits on a timer.

## 8. Lanes in the record

A project's lanes are its own (R5). `build/lanes.md` in the product's build state has one row per lane: `id`, `area` (the product or process area it is responsible for, unique), `charter` (the file), `canon` (the documents it owns), its live session (`LANE-ID #k`, from `proc lane open` / `proc lane route`), and its status. BOB opens, re-charters or closes a lane with `proc lane open|charter|close`, each writing a ruling line (§9); Bob's suggestion to change a lane's responsibilities is applied by `proc lane charter`. The lane's start skill loads Design, Governance and Sessions, and its own area's rulebook (neoProcess §5).

## 9. Tool and hooks

`proc ask open` (records a request verbatim, from the message BOB received), `proc ask route --answer|--lane <id>|--bob --reason <…>`, `proc ask dispatch --stage <question|reply> --brief-file <f> --due <minutes>` (writes the brief and the `Working` line, prints the Agent call), `proc ask ask --question-file <f>` (records the question, prints the `send_message` to the lane), `proc ask decided --answer-file <f>`, `proc ask close --reply-file <f> --files <changed…>` (refuses unless the files the reply names are in the same commit, or the route is `needs Bob` with Bob's decision cited; prints the `send_message` to the requester). Each refuses a stage already passed (§7). `proc status` lists open asks (`RECEIVED`, `ASKED`, `DECIDED`, `NEEDS BOB`, `WORKING`, `LATE`) in queue order (§6). BOB's Stop hook refuses the end of a turn while an ask reads `RECEIVED` or `DECIDED` with nothing dispatched (an act owed, §5.11), and lets it end while a `Working` line is out. The job's and the lane's PreToolUse hook refuses a `send_message` to any address but BOB's (§1), and every role's refuses a worker waited on in the foreground (bio K4207).

## 10. What the dry run proves (P3, §15)

A job's QUESTION answered by BOB alone; a job's QUESTION asked of a lane, decided, folded into a requirement and replied as a CHANGE the job merges; a lane's QUESTION to another lane through BOB; an ask that needs Bob, held `NEEDS BOB` and closed citing his decision; a successor BOB continuing an `ASKED` ask from its file; a job's `send_message` to a lane refused by its hook; a lane re-chartered by `proc lane charter`; two requests arriving during one BOB turn, both found by `proc status` and handled in order; a worker's result recorded by the wake its completion sends, with BOB's turn ended meanwhile; a worker killed mid-task, seen by the failure notice and re-dispatched from the same brief with the same result; a `Working` line past its due listed `LATE` by the backstop and re-dispatched; a duplicate `proc ask decided` refused; a lane refreshed mid-ask, its successor finishing the ask from git; BOB refreshed with a `Working` line out, its successor re-dispatching it; a move of BOB, a lane and a job to a second account with an ask open, closed on the new account (provable only between Bob's two real accounts, so recorded as §15 allows). Each is a row of `dryrun/CERTIFICATION.md` when this reaches certification.
