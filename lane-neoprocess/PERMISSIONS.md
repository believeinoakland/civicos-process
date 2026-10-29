# Permissions: how neoProcess handles a refused act

**Status** · Draft, neoProcess #4, 2026-10-29, on Bob's direction of the same day: "the neoProcess also needs to robustly handle permissions, something the current process continually struggles with." Not in force; certified on the dry run before use (P3). What is Bob's here is named in §6.

## 1. What refuses an act, measured

Four different things refuse a session's act, and they behave differently. Each was met on 29 Oct (neoProcess #3 and #4), with the evidence named:

| what refuses | how it decides | cleared by | measured |
| --- | --- | --- | --- |
| **The process's own hooks** (`tools/neo-hooks.mjs`) | the rule it names, in code; the refusal names the route that does the act | taking that route | the fixture tests (`tools/test/neo-hooks.test.mjs`) |
| **The auto-mode safety classifier** | a judgment of the command's text or the tool call, by category (`Irreversible Local Destruction`, `Interfere With Workloads`, …); it reads the act, not the state | nothing in a settings file: `.claude/settings.json` here already allows `archive_session`, and the classifier still refused #4's archive of #3 ("Interfere With Workloads"); Bob can allow the act in the refused session | #4: `git reset --hard origin/<branch>` refused on a clean checkout, while `git merge --ff-only origin/<branch>`, the same result, passed; #4's `archive_session` of its own child (PROBE-J12 #1) passed and of its parent (#3) was refused; #3's archives of #2 and of itself were refused |
| **The platform's scope** | what the account's GitHub app, the git proxy and the session's repository list allow; an error, not a prompt | Bob, in a settings page (the app's repositories, the environment's hosts) | #4: `create_repository` in the organization answered 404; REP 2: the git proxy refuses hand deletes and tags |
| **The environment's own Stop hook** (`~/.claude/stop-hook-git-check.sh`) | a turn may not end with uncommitted or untracked files | committing, or holding until the hook gives up | PROBE-G, PROBE-J12: a session told not to commit held, at the cost of a loop |

The old process's struggle (mechanics §16; situations/refused.md; K1702, K4696, K5120, K5293) is that every refusal is met **during** a step, by the session that cannot clear it, and is then relayed to Bob one at a time: the standing list grew by incident, a settings rule never cleared the classifier, and an approval typed in one session never reached the next.

## 2. The design: no product session meets an unpredicted refusal

Derived from P3 (correct before used), P16 (what must hold every time is code) and P17 (the act only Bob can take is named and walked through):

1. **An act table, proven on the dry run.** `tools/acts.md` lists every act the process takes, per role: the tool or command, the route the tool uses, the relation it needs (its own branch; a session it created; a pull request `neo` printed), and the result measured on the toy. The dry run tries every row in its role (certification rows X1–X5). A product session takes no act the table has not seen pass. An act that is refused in a product run and is not in the table is a process flaw: it stops the work until the table and the route are fixed (P3), never a workaround.
2. **Routes the checks accept by construction.** The tool never uses a destructive verb where a constructive one gives the same result: `merge --ff-only` or `checkout -B` for a stale branch, never `reset --hard`; no force, no rewrite; the one remote delete (a closed epoch's state branch, PROTOCOL §7d) is in the table as a row the proxy must be seen to allow, else the branch is left for Bob's prune workflow (REP 4) and the design says so.
3. **Routed by relation.** The classifier lets a session act on what it created and refuses what it did not: a session archives only its own children, so ROOT archives every BOB, BOB archives every job and lane, and a successor of any role is started by that role's parent, never by its predecessor (R10; PROTOCOL §7a). The neoProcess lane itself, whose sessions start each other, is the counter-example: #2 and #3 can be archived only by Bob.
4. **One standing list, applied by the tool.** The acts Bob allows without asking are one file in the process repository (`permissions.json`, Bob's policy), from which `neo shims` writes each product's `.claude/settings.json`; the gate fails on drift. It covers the permission prompt only; it never clears the classifier (§1), and it never holds an act that loosens a standing safety rule (REP 2). Whether a session may write that file at seeding is itself a table row (X4; K1702 says a session's edit of settings was refused): if refused, Bob commits it once and the tool only checks drift.
5. **A refusal is a recorded, routed, counted event.** A refused session runs `neo refused --act "<the one act>" --kind <hook|classifier|scope|platform> --reason "<the refusal's words>"`: one line on the state branch, listed by `neo status` as `REFUSED <role> <act>`. BOB routes it from the table: to the party whose relation passes (the parent archives), to the route the tool offers, or, when only Bob can clear it, `NEEDS BOB` with one line naming the session and the act. Every refusal is a metrics row (kind, role, act), so a tranche's report states how many refusals it met and how many the table had not predicted; the number to reach is zero unpredicted.
6. **A self-check at every start.** `neo takeover`, `job start` and `lane start` dry-fire the role's reaching acts (`git push --dry-run` to its own branch; a fetch of the branches it reads; the state branch written), so a scope or proxy problem shows in the first turn, before any work depends on it.

## 3. What the hooks already do

The process's hooks are the first line: they refuse, with the route named, everything that must never happen (REP 2, 3, 5; SES 1, 6, 8; INT 3, 9; a job's acts on its PR), so a session rarely reaches the classifier with an act it should not take. What then reaches the classifier is, by construction, an act the table says passes, or an unpredicted refusal (§2.1).

## 4. What the dry run proves (certification rows X1–X5)

X1, every row of the act table tried in its role and relation on the toy, passing; X2, an induced classifier refusal (BOB archives a session it did not create) recorded by `neo refused`, listed by `neo status`, routed to the parent and cleared there; X3, the state-branch delete through the git proxy, allowed or refused and the design settled by what is seen; X4, the toy's `.claude/settings.json` written by `neo shims` at seeding, or refused and committed by Bob; X5, a standing-list rule honoured where a permission prompt would otherwise stop a session.

## 5. Rules, as they will read

Rulebook REP 9 and 10 and GOV 9 are rewritten at the commit point from §2 (BOB's, the mechanism); the one-sentence forms: *A refused act is recorded by `neo refused` and routed from the act table, never worked around; an unpredicted refusal in a product run stops the work until the table and the route are fixed (P3, P16, P17).* *The standing list is one file in the process repository, Bob's; the tool writes each product's settings from it and fails on drift (P16, P17).* *A session archives only sessions it created; a role's successor is started by the role's parent (P13; PROTOCOL §7a).*

## 6. Bob's standing approval (29 Oct 2026, his words, on record)

> "The neoProcess will be involved initially in development. Development product will be controlled using git. So nothing can be lost, and data used during development is throwaway. The only secrets are those stored in environment variables or other password managers away from CC. So releases, test IDs, and all other elements that would be more closely guarded in a customer's workflow are all 100% just for testing. So there needs to be an understanding about all of this up front. I need to be able to go on record as approving CC to do whatever it needs to do related to development, testing, and walker deployments without my having to provide any further approvals. I know that there's a way of giving this ongoing approval and for that approval to be properly partitioned and managed so that subsequent sessions and lanes can do what they need without asking for more permissions."

This is the ruling the standing list derives from (P17: policy; GOV 8: his words govern, BOB's details marked). BOB's details (P17):

- **What the approval clears, and how it is carried.** The platform (its documentation, read 29 Oct) sets a cloud session's permission mode at its creation, by the surface that starts it; a settings file cannot raise it, and a child session is never more permissive than its parent (`create_session`). So the approval is carried in two places the process controls, not in a mode: (1) **the standing list**, `permissions.json` in the process repository, from which `neo shims` writes each product's `.claude/settings.json` `permissions.allow` rules (every act of the act table that a permission prompt would otherwise stop: the tool's commands, the tests, pushes to the session's own branches, the session tools, the pull-request tools), so every session on the product, now and later, holds the same approval without asking; (2) **the act table and its routes** (§2.1–§2.3), so that what the process asks of a session is an act the checks accept.
- **What it does not clear, measured.** The auto-mode safety classifier judges each act by category and is not read from a settings file: the allow rule for `archive_session` in this repository's settings did not stop the classifier refusing #4's archive of its parent. The process therefore does not rely on approval for those acts: it removes them (no hard reset, no force, no rewrite) or routes them to the party whose relation the classifier accepts (a parent archives). A refusal that still occurs is an unpredicted one (§2.5), a process flaw to fix in the table, never a question to Bob.
- **The partition.** The list is one file, Bob's, in the process repository; a product repository holds only the copy the tool writes and the gate checks for drift; nothing in it loosens a standing safety rule (REP 2), and nothing in it touches a secret, which stays in environment variables and password managers away from the sessions, as Bob says.

## 7. What is Bob's (P17)

The standing approval of §6 and the list it yields (`permissions.json`): Bob has given it, on record; any later narrowing or widening is his. Everything else above is mechanism, BOB's, decided here and reported as done.
