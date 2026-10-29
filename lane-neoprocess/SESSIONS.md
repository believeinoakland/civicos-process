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

## 2. Context thresholds

A refresh is triggered by `get_session`'s `context_usage`, read by the session's own command, never by a timer: BOB at 40 % of its window (Bob, bio K3671 lineage; mechanics §2), a job or a lane at half (§6), ROOT at 55 % (§2). The successor continues from git (`PROTOCOL.md` §7a).

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
