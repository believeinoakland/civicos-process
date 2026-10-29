Accounting for rulebooks/release.md (neoProcess #3, 2026-10-29). Lines: PROCESS-MECHANICS.md (M), rulings-active.md (A), PROCESS-DESIGN.md (D), JOB-LIFE.md (J), integration.md (I), bio build/rulings.md (K).
P12 | D:44 | P12 · kept as rule 1 and rule 2
P11 | D:42 | P11 · kept as rule 4 (the full regression only at a release or when Bob asks) and rule 3
P19 | D:62 | P19 · kept as rule 5 (reasons to hold work) and rule 10 (the report names each deferral)
P14 | D:48-52 | P14 · kept as rule 2 (usage in the archived plan) and rule 10 (cost)
P7 | D:23 | P7 · kept as rule 7 (a red is fixed or named; M:87 inherited reds)
P20 | D:64 | P20 · kept as rule 8 (the report cites its evidence)
P17 | D:58 | P17 · kept as rule 9
P16 | D:56 | P16 · every rule names its principle or Bob's ruling
§5.7 | M:128-136 | P12 · kept as rules 1, 2, 10 (steps 1-3 are rules 1-2; step 5 is rule 10); step 4 (delete the backstop) and step 6 (open the next tranche) folded (already in M:128-136; the backstop is BOB's own mechanic, the next opening in rule 10)
§5.7 step 3 hook | M:134, M:167 | P12 · coded (BOB's PreToolUse hook: a PR merge only once the plan reads CLOSING, no push to main), rule 1
§11 | M:236-238 | P11, P12 · kept as rule 6 (cut from the open tranche, reaches main only by the close) and rule 4 (full regression at a release)
§5 (rest) | M:91-127, M:138-170 | superseded by lane files: merge, layer close and refresh are INT and SES territory (I:5-8, sessions.md:5), not release
§14 | M:270-272 | folded (already in INT rule 3 and 7: the gate and layer close regenerate and verify artifacts; a release cut's own regeneration is the product's procedure, K3217)
§5.2 | M:101-107 | folded (opening the next tranche is not the release area; named in rule 10 only)
§16 | M:279-287 | folded (a refused act is never worked around: cited in rule 9; the standing list is Bob's)
J §1 | J:11 | P12 · folded (I rule 9 and rule 1 of this book: the close is the one PR, `main` merged in first; the fixed `tranche` branch name is the mechanism)
J §10 | J:49 | folded (closing the tranche is the command it is today)
I rule 9 | I:9 | P11, P12 · folded (already in I rule 9: the close PR; this book repeats the close in rule 1 and the full regression in rule 4, so I rule 9 may drop its last sentence)
I rule 1 | I:1 | P12 · folded (done means merged is in I)
A §1 line 6 | A:6 | P19 · kept as rule 5 (K1876, K1741 as the hard-reason test)
A §2 line 18 | A:18 | P11 · kept as rule 3 (Bob, K5339), replaces K2704
A §2 line 19 | A:19 | P17 · kept as rule 9 (Bob, K5346)
A §2 line 20 | A:20 | P17 · kept as rule 9 (K5120; deploys to the development instances)
A §2 line 21 | A:21 | P17 · kept as rule 9 (K5293, K1709 tag refusal) and rule 6 (K3217: the signed cut is merged into the open tranche at once)
A §1 line 10 | A:10 | folded (the out-of-layer fix round in a release, K3528, belongs to planning, not this book)
K19 | K:23 | P11 · kept as rule 4
K2273 | K:2275 | P12 · kept as rule 6 (Bob approved: a release is cut from the open tranche and reaches main only through the close; changes 1 and 2 of it are rule 1 and the §16 sentence)
K3217 | K:3218 | P12 · kept as rules 6 and 8 (merge an earlier unmerged cut at once; the report kept in build/plan)
K2910 | K:2911 | P20 · kept as rule 8 (rollback targets recorded before the cut)
K2911 | K:2912 | folded (a release's changes to product files are committed on its cut: in rule 6)
K3044 | K:3046 | P7 · kept as rule 7 (reds accepted by name) and rule 8 (the report's contents)
K1876 | K:1878 | P19 · kept as rule 5
K1741 | K:1743 | P19 · folded (in rule 5 and D:62)
K5339 | K:5332 | P11 · kept as rule 3
K2704 | K:2705 | superseded by K5339 (every module's tests at a close, retired)
K5293 | K:5288 | P17 · kept as rule 9
K5346 | K:5339 | P17 · kept as rule 9 (the later of the two; see Unresolved)
K5120 | K:5115 | P17 · kept as rule 9
K4841 | K:4836 | P17 · kept as rule 9 (the biosmoke deployments)
K3556 | K:3555 | folded (nothing a biosmoke instance holds is secret: inside K4841)
K1709 | K:1711 | P15 · kept as rule 9 (a tag push refused, never retried; the restore branch `study/constructs` is the product's, not a release rule) and as evidence for rule 8
K1433 | K:1435 | folded (tag refusal, in rule 9)
K1705 | K:1707 | coded in the product (the distribution procedure `plan/draft-T33-release.md` is the product's, not read: not in my brief); rule 8 draws only on its account check
K1716, K1717 | K:1718-1719 | superseded by K4841 and K5293 (per-deploy approval retired)
K3542, K4163 | K:3541, K:4160 | superseded by K5293 (the per-release approval in the refused session)
K5336 | K:5329 | retired (a one-off: T51 closed without a deployment; its general form is P19's reason, rule 5)
K5345 | K:5338 | retired (a one-off defect and Bob's one act; the hook's reach over process-repository PRs is not a release rule)
K5137 | K:5132 | folded (merges of development PRs: A:20)
Unresolved: (1) K5293 ("You do not need my approval for a release") and K5346 ("the only step ... you need my opinion for is a github release approval") differ; A:19 and A:21 keep both. Rule 9 follows the later, K5346, as the one kept act, and names it only as "approving the GitHub release"; what that act is on GitHub (the signing run's environment approval, K3044) is the product's distribution procedure, which I was not given. (2) Rule 8 lists the release report's contents from K3217, K2910 and K3044; the full list lives in the product's distribution document, not read here, so BOB should check rule 8 against it. (3) The brief asks for a rule on deployment; the product's own deployment steps (order, accounts) are in that same document, so rule 9 holds only the approval side.
