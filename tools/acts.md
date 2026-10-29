# The act table (PERMISSIONS §2.1)

Every act the process takes, per role: the route the tool uses, the relation it needs, and what was measured. `neo refused --act <id>` marks a refusal predicted when its act is a row here; a product session takes no act this table has not seen pass. Measured: a date with the session, or `N1` (the dry run proves it, row X1), or `—` (not yet).

| act | role | route | relation it needs | measured |
| --- | --- | --- | --- | --- |
| `git push(own branch)` | job, lane, BOB | `neo` commands and the session's own `git push` | its own branch only (`job/<m>`; `tranche`); the hooks refuse any other | N1 |
| `git push(state branch)` | every role | `neo …` by plumbing (`stateWrite`), never by hand | the one state branch of the epoch | N1 |
| `git push(delete state branch)` | BOB | `neo epoch close` tries it, then prints the prune workflow's dispatch | the proxy refuses every ref delete (measured 29 Oct #5 on the toy: `unexpected disconnect`, the branch kept); the product's `prune.yml` deletes it (REP 4) | 2026-10-29 #5 (refused; the workflow is row X3) |
| `git push(delete job branch)` | BOB | `neo merged` tries it, then prints the prune workflow's dispatch | refused by the proxy (BOB #1's R-BOB-1-2, 29 Oct); a merged branch left behind is built over by the next opening commit; `tranche` itself is never deleted | 2026-10-29 #5 (refused; the workflow is row X3) |
| `actions_run_trigger(prune.yml)` | BOB | the dispatch `neo merged` or `neo epoch close` printed | the workflow on `main`; the GitHub app's scope | 2026-10-29 #5 (the toy: `job/probe` at the tranche tip deleted by run 40827749216 in 11 s, dispatched through the proxy, 204) |
| `git merge --ff-only / checkout -B` (a stale local branch) | every role | the tool and the session | none; `git reset --hard` was refused by the classifier on 29 Oct (#4) and is never used | 2026-10-29 #4 |
| `create_session(job)` | BOB | the call `neo layer start` or `neo job route` printed, unchanged | BOB is the parent | N1 |
| `create_session(lane)` | BOB | the call `neo lane open`, `lane route` or `ask ask` printed | BOB is the parent | N1 |
| `create_session(BOB)` | ROOT | `START BOB #<n>` from the handoff | ROOT is the parent | N1 |
| `create_session(probe)` | a lane | by hand, Haiku | the lane is the parent | 2026-10-29 #4 (PROBE-J12 #1) |
| `send_message(BOB)` | job, lane | the address `neo addr --bob` prints, with the record pushed | none measured | 2026-10-29 #2 (PROBE-R) |
| `send_message(job or lane)` | BOB | the call `neo` printed | none measured | 2026-10-29 #2 |
| `send_later(own backstop)` | BOB | `send_later` to itself | its own session | 2026-10-29 #4 |
| `archive_session(child)` | BOB (jobs, lanes), ROOT (BOBs), a lane (probes) | `neo job retire`, `layer close`, `lane archived`, `bob archived` | the archived session is one the caller created, or a child of its predecessor: a parent or sibling was refused by the classifier ("Interfere With Workloads") on 29 Oct (#3, #4) even with an allow rule in settings, yet BOB #2 archived STATS #1, created by BOB #1, with no refusal (29 Oct, the dry run; X2) | 2026-10-29 #4 (child passed, parent refused); BOB #2 (a predecessor's child passed, STATS #1, idle); #6 (a predecessor's child refused, BOB #2, while its goal sent it back: archive and `interrupt_session` both "Interfere With Workloads", 14:23Z): so a successor of the lane archives only the BOBs it started, and its predecessor's are Bob's |
| `create_pull_request(draft job PR)` | BOB | the call `neo layer start` or `job reopen` printed | the GitHub app's scope on the product repository; the head one commit past the base (GitHub refuses an empty PR: measured 29 Oct #5 by BOB #1, R-BOB-1-1, fixed by the opening commit) | N1 |
| `add_issue_comment(own PR report)` | job | the call `neo job complete` printed | its own PR, while the comment is owed | N1 |
| `update_pull_request(own PR ready)` | job, BOB | the call `neo job complete` or `neo merged` printed | its own PR, while the act is owed | N1 |
| `pull_request_review_write(COMMENT)` | BOB | the call `neo review result` printed | a COMMENT review only: REQUEST_CHANGES and APPROVE are refused on one's own pull request, and every session is Bob's one user (BOB #1's R-BOB-1-3, 29 Oct) | 2026-10-29 #5 (refused as REQUEST_CHANGES; COMMENT is N1) |
| `update_pull_request_branch(job PR behind tranche)` | BOB | `neo merge` | none measured; GitHub merges the tranche into the job's branch | — (N1) |
| `merge_pull_request(job PR)` | BOB | the call `neo merge` printed (the gate green on the tip, the tip holding the tranche) | the hook allows it while the job's Merge line reads `merging` | — (N1) |
| `git push(tranche, direct)` | BOB, lane | `commitPush` | no required check and no pull-request rule on `tranche`: either refuses every direct push, the branch's creation included (measured 29 Oct #5 on the toy: "Required status check gate is expected") | 2026-10-29 #5 |
| `merge_pull_request(close PR to main)` | BOB | the GitHub merge tool, once the plan reads CLOSING | the hook allows it then only; the `main` ruleset (a pull request required, zero approvals) lets Bob's token merge it | 2026-10-29 #5 (the seed's PR believeinoakland/neoprocess-dryrun#1, merged through the proxy) |
| `create_repository(organization)` | — | none: an act of Bob's | refused by scope on 29 Oct (#4: 404 on the organization endpoint) | 2026-10-29 #4 |
| `write(.claude/settings.json)` | the seed | `neo shims` from `permissions.json` | K1702: a session's edit of the settings file was refused | — (X4) |
| `Agent(background worker)` | BOB, a lane | `neo ask dispatch`, `review decide` | `run_in_background: true` (the hook refuses the foreground) | 2026-10-29 #2 |
| `TaskStop(worker)` | BOB | by hand, to re-dispatch from the brief | its own worker | — (X2 injects it) |
