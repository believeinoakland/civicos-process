Accounting for rulebooks/repository.md (REP), neoProcess #3, 2026-10-29. Paths: P = PROCESS-DESIGN.md, M = PROCESS-MECHANICS.md, PR = lane-neoprocess/PROTOCOL.md, JL = lane-neoprocess/JOB-LIFE.md, PS = lane-neoprocess/PRODUCT-SUPPLIES.md, RA = bio build/rulings-active.md.
P12 | P:44 | P12 · kept as rule 1 (main never moves; branches)
P10 | P:33-40 | P10 · kept as rule 1 (layer/job branches); rounds and layers themselves are INT/BUILDING, folded
P16 | P:56 | P16 · kept as rules 2, 3, 9 (hooks and code enforce)
P17 | P:58 | P17 · kept as rules 4, 9, 10 (settings and Bob's setup act are Bob's; the rest BOB's)
P13 | P:46 | P13 · kept as rules 5, 6, 8
P15 | P:54 | P15 · kept as rule 5 (state branch not a record)
P7 | P:23 | P7 · kept as rules 3, 7 (job writes own branch; no job commits artifacts)
M§1 | M:5-32 | folded (build-state layout is SES/INT/BUILDING's; `build/` written by process roles only is rule 3 via the hooks); mail branches row kept in rule 3
M§1 | M:7 | superseded by PS:7-8, 21 (`proc shims` writes CLAUDE.md, the one `neoprocess` skill and `gate.yml`; the `civicos-*` skills are retired) · kept as rules 9, 10
M§4 | M:76 | P12 · kept as rule 1; the numbered `tranche/T<n>` is superseded by JL:11 (fixed `tranche`)
M§4 | M:77 | superseded by JL:11, 15 (`job/<module>`, created with the draft PR)
M§4 | M:78-84 | superseded by JL:11, 33 (the merge queue merges jobs; `proc merge` no longer merges; CHANGE after merge is `proc job reopen`, JL:37); close by one PR is folded (already in INT rule 9)
M§4 | M:85 | folded (a failed tranche abandoned without touching `main`: already rule 1)
M§4 | M:87 | folded (old debt: already in INT rule 6)
M§4 | M:89 | P13 · kept as rule 8
M§5.7 | M:131-133 | folded (tranche close by one PR: already in INT rule 9; `main` never pushed: rule 1)
M§5.11 | M:159-169 | kept as rules 2, 3, 9; job and BOB hook lists are the CODE column; PreToolUse read-whole and background-command hooks folded (already in SES rules 3, 6); the BOB Stop hook, marker and steps check are SES's; "three Stop refusals running" is a hook detail, left in code
M§5.11 | M:168 | folded (steps check: already SES rule 9)
M§13 | M:248-256 | folded (messages: SES rule 8)
M§13.1 | M:262-267 | P2, P13 · kept as rule 3 (a mail branch is written only by its owner, never merged into main); the channel itself is the cross-account area's, not set out here
M§8.5 | M:210 | coded (the channels check guards mail-branch history) · named in rule 3
M§14 | M:272 | superseded in part by JL:25 (gate regenerates for its run; `proc layer close` commits once; no artifact in a job) · kept as rule 7; "a merge whose only conflict is in listed artifacts takes the tranche's copy" retired (a job never commits one, JL:25)
M§16 | M:281-283 | P17 · kept as rule 9 (standing list is Bob's, from settings; never loosens a safety rule)
M§16 | M:285-287 | P17 · kept as rule 10 (NEEDS BOB, no workaround); the pre-act search of `rulings.md` before an act on main/another party's branch is a BOB habit with no check, left in BOB.md (unresolved, see last line)
M§16 | M:285 | folded (relay to Bob in one line: SES/communication rules)
PR§7d | PR:116-128 | kept as rules 5, 6; state branch orphan, never referenced from durable files, deleted at `proc epoch close`
PR§7d | PR:126 | Bob, 29 Oct · kept as rule 6 (screenshots never in git; R2 with 30-day expiry); the capture-branch fallback for a product without object storage (PR:126) is not in the rule: folded to the product's own situation, see Unresolved
PR§7d | PR:128 | folded (one writer per file, lost push retried with fetch and merge: `proc` detail, PR:107)
PR§7b | PR:107 | coded (`proc` retries a lost push with fetch and merge, never a force) · folded into rule 2
PR§7a | PR:132-134 | folded (refresh and account move: SES and USAGE areas)
JL§1 | JL:11 | kept as rule 1 (fixed `tranche`, `job/<module>`; wildcard names cannot be queued)
JL§2 | JL:15 | folded (job as a draft PR, state on the state branch: INT/BUILDING)
JL§4 | JL:25 | kept as rules 3, 7, 10 (required checks and queue are INT rule 3; the ruleset and the deploy key are Bob's one act, rule 10; BOB's hook refuses `gh pr merge` and pushes to `tranche`, rule 3)
JL§6 | JL:33 | folded (merge by queue: INT rule 5)
JL§11 | JL:53 | kept as rules 2, 3 (job hook: own branch only, no force)
JL§12 | JL:57-64 | folded (measurements; Allow auto-merge is a setting, named in rule 10)
PS | PS:21-23 | kept as rule 10 (gate workflow by `proc shims`; ruleset, auto-merge, deploy key Bob's once); object storage kept as rule 6
PS | PS:22 | Bob's one setup act · kept as rule 10
K1177 | K1177 | CLAUDE.md standing direction: development PRs merged by sessions without Bob's review · folded (RA:17, INT/merge area)
K1261 | K1261 | kept as rule 2 (force-push and history-rewrite denials stand; the list never loosens a safety rule) and rule 9 (standing list)
K2254 | K2254 | kept as rule 2 (fast-forward only, never a force-push or rewrite of main)
K1091 | K1091 | folded (edits to `.claude/settings.json` are Bob's own: RA:17, rule 9)
K1702 | RA:17 | kept as rule 9 (edits to the settings file refused even with Bob's approval; Bob writes them)
K1433 | K1433, K1436 | coded (the git proxy refuses tag pushes, HTTP 403, not retried) · kept as rule 2
K1709 | K1709, RA:21 | folded (tags refused; branch `study/constructs` never deleted) · kept as rules 2, 4 (`study/*` protected)
K4385 | K4385 | superseded by `proc` creating the branches (`mail jobbranch` was the fix for a hand-written forced push; JL:11, 15 replace it) · kept as rule 2 (no force path)
K5300 | K5300 | kept as rule 4 (no session can delete a branch; the workflow does, with its protected set); Bob chose "A"
K5308 | K5308 | set aside: automatic pruning on every push to `main` was asked of Bob, not recorded as approved; rule 4 names the workflow, not its trigger (Unresolved)
K5326 | K5326, RA:11 | kept as rules 9, 10 (what must always happen is code; hooks)
K5346 | RA:19 | folded (every repository act is BOB's, never asked of Bob; Bob's one act is the release): rule 10 names only the setup act, which JL/PS make his
K5120 | RA:20 | folded (RA:20: still Bob's are `main` outside the close PR, force-push, rewriting history, the restore point, secrets) · kept as rule 2
K4696 | RA:8 | kept as rule 10 (a refused act is never worked around, split, rephrased or retried)
K5339 | RA:18 | folded (the close runs no whole suite: INT rule 9)
K1977 | RA:25 | retired (an operational lesson, a retry with `-c http.version=HTTP/1.1`; `proc` retries a lost push, PR:107)
K4207 | RA:26 | folded (background long commands: SES rule 6)
Unresolved: (1) Who deletes `tranche` and `job/<module>` after their merge (JL:11 says they are deleted): no session may delete a ref (K5300), so it needs GitHub's "delete branch on merge" setting (Bob's setup act) or the prune workflow; rule 1 therefore does not say who, and PRODUCT-SUPPLIES:22 does not list the setting. (2) K5308's automatic pruning is not recorded as approved; rule 4 does not state a trigger. (3) The capture-branch fallback for a product with no object storage (PR:126) is left out; whether it is a rule or a product situation is undecided. (4) The pre-act search of `rulings.md` before an act on `main` or another party's branch (M:287) has no check; not carried as a rule. (5) Rule 6 is TEXT only: no check names a capture in git (a size limit exists, JL:25, but is not tied to captures). (6) Whether the cross-account mail channel (M§13.1) belongs to this area or its own; only its branch-write rule is carried (rule 3).
