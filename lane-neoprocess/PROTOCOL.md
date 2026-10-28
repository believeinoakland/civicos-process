# The delegation protocol: how jobs and lanes reach each other through BOB

**Status** · Draft, decided by neoProcess #1 on 2026-10-28 (a technical matter, BOB's by P17). Not in force; certified on a dry run before use (P3). Reported to Bob in plain words on the neoProcess page (§2).

## The requirements it meets (Bob, 2026-10-28)

- R1 · The session architecture is ROOT → BOB → jobs and lanes. A job changes one module's code and runs its tests; a lane has one area of focus and responsibility, unique to it.
- R2 · Other sessions delegate tasks in a lane's area to that lane through BOB, and the lane responds with design decisions through BOB.
- R3 · BOB is not a forwarder: it translates what a job or lane needs into a question the lane can answer, and translates the lane's answer into terms the requester can understand and use.
- R4 · A requester need not know whether BOB will answer itself or a lane will. Lanes are abstracted from each other, and from jobs, through BOB.
- R5 · Which lanes a project has is the project's own; BOB defines a lane, on its own recommendation or Bob's, without Bob's approval; Bob may later suggest a change to a lane's responsibilities.

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

## 6. Timing and failure

- A lane answers in its own session's turn; an ask open for more than a day is listed by `proc status` as `SLOW` for BOB to route again or answer on its best reading, saying so in the ask.
- A lane session that is archived, failed or past half its window is replaced by `proc lane route`, as a job's is (§5.4); the ask in git is what the successor continues from.
- An answer that arrives after the requesting job completed re-opens the job as a CHANGE (P10); after its layer closed, it is an entry in the completion round (P10, P19).

## 7. Lanes in the record

A project's lanes are its own (R5). `build/lanes.md` in the product's build state has one row per lane: `id`, `area` (the product or process area it is responsible for, unique), `charter` (the file), `canon` (the documents it owns), its live session (`LANE-ID #k`, from `proc lane open` / `proc lane route`), and its status. BOB opens, re-charters or closes a lane with `proc lane open|charter|close`, each writing a ruling line (§9); Bob's suggestion to change a lane's responsibilities is applied by `proc lane charter`. The lane's start skill loads Design, Governance and Sessions, and its own area's rulebook (neoProcess §5).

## 8. Tool and hooks

`proc ask open` (records a request verbatim, from the message BOB received), `proc ask route --answer|--lane <id>|--bob --reason <…>`, `proc ask ask --question-file <f>` (writes the question, prints the `send_message` to the lane), `proc ask decided --answer-file <f>`, `proc ask close --reply-file <f> --files <changed…>` (refuses unless the files the reply names are in the same commit, or the route is `needs Bob` with Bob's decision cited; prints the `send_message` to the requester). `proc status` lists open asks (`RECEIVED`, `ASKED`, `DECIDED`, `NEEDS BOB`, `SLOW`). BOB's Stop hook refuses the end of a turn while an ask reads `RECEIVED` or `DECIDED` (an act owed, §5.11). The job's and the lane's PreToolUse hook refuses a `send_message` to any address but BOB's (§1).

## 9. What the dry run proves (P3, §15)

A job's QUESTION answered by BOB alone; a job's QUESTION asked of a lane, decided, folded into a requirement and replied as a CHANGE the job merges; a lane's QUESTION to another lane through BOB; an ask that needs Bob, held `NEEDS BOB` and closed citing his decision; a successor BOB continuing an `ASKED` ask from its file; a job's `send_message` to a lane refused by its hook; a lane re-chartered by `proc lane charter`. Each is a row of `dryrun/CERTIFICATION.md` when this reaches certification.
