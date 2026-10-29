# Certification of neoProcess (P3): the dry run N1

One row per path PROTOCOL §10, JOB-LIFE §13 and DESIGN-STAGE §5 name. A row is PROVEN by what git and GitHub show (an ask file's stages, a PR's comments and checks, a state-branch line, a metrics row), never by a session's report (P20). PLANNED names the entry or act that drives it. The process is certified only when every row reads PROVEN, or names the reason it can only be proven in a product run and the check that will prove it there.

## The protocol (PROTOCOL §10)

| # | path | driven by | evidence | status |
| --- | --- | --- | --- | --- |
| P1 | a job's QUESTION answered by BOB alone | alpha N6 | the ask: Route `answered by BOB`, Replied, CLOSED | PLANNED |
| P2 | a job's QUESTION asked of a lane, decided, folded into a requirement, replied as a CHANGE the job merges | alpha N1 → ARITH | the ask's four stages; `requirements/arithmetic.md` §3 and alpha R8 in one commit with the close; the job's merge of `tranche` | PLANNED |
| P3 | a lane's QUESTION to another lane through BOB | stats N12 → STATS → ARITH | STATS's ask with its own `QUESTION #n` From line; ARITH's decision; STATS's decision | PLANNED |
| P4 | an ask that needs Bob, held NEEDS BOB, closed citing his decision | stats N11 | the ask: Route `needs Bob`, Status NEEDS BOB, Decided `Bob`, Replied | PLANNED |
| P5 | a successor BOB continuing an ASKED ask from its file | BOB handover with an ask ASKED | the ask's Asked line by BOB #1, Replied by BOB #2 | PLANNED |
| P6 | a job's send_message to a lane refused by its hook | alpha N7 | the refusal text in alpha's report; no message in the lane's transcript | PLANNED |
| P7 | a lane re-chartered by `neo lane charter` | BOB's act | the charter file and the `re-chartered` decision line | PLANNED |
| P8 | two requests in one BOB turn, both found by `neo status`, handled in order | alpha N5 | one BOB turn's events; both asks' From lines; the order of their Route lines | PLANNED |
| P9 | a worker's result recorded by the wake its completion sends, BOB's turn ended meanwhile | any dispatch | BOB's transcript: turn end, completion wake, `neo ask …` with the result | PLANNED |
| P10 | a worker killed mid-task, seen by the failure notice, re-dispatched from the same brief (`neo ask dispatch --again`) | BOB's act | the ask's Working line with its `replaced · <first line>` under it; one brief file | PLANNED |
| P11 | a Working line past its due listed LATE and re-dispatched | BOB's act (`--due 1`) | `neo status` listing LATE; the re-dispatch | PLANNED |
| P12 | a duplicate `neo ask decided` refused | BOB's act | the refusal; the ask unchanged | PLANNED |
| P13 | a lane refreshed mid-ask, its successor finishing the ask from git | BOB's act (`lane route --context-pct 60`) | the lane's Status line with the new session; the decision by it | PLANNED |
| P14 | BOB refreshed with a Working line out, its successor re-dispatching it | BOB handover | the takeover's acts; the second dispatch | PLANNED |
| P15 | a move to a second account with an ask open, closed on the new account | only between Bob's two accounts | — | provable only with Bob's two accounts (PROTOCOL §15) |
| P16 | a request whose message arrives before its record (RESEND, not acted on) | alpha N5 (`QUESTION #2`) | BOB's one-line RESEND; no ask for it | PLANNED |
| P17 | a job's send_message refused by its hook while its record is unpushed | alpha N4 | the refusal text in alpha's report | PLANNED |
| P18 | a message numbered the same as one already recorded, refused by `neo ask open` | alpha N5 (`QUESTION #1` again) | the refusal; one ask A<n> for the number | PLANNED |
| P19 | a dormant lane started by `neo ask ask` from the register, the ask answered by the new session | stats N12 (STATS dormant) | STATS's Status line DORMANT then LIVE; the create_session printed by `ask ask` | PLANNED |
| P20 | an epoch closed (state branch gone) and the next opened, every durable file on `tranche` | the close | `git ls-remote` without `state/E1`; `build/epochs.md`; the asks' text copied where cited | PLANNED |

## The job's life (JOB-LIFE §13)

| # | path | driven by | evidence | status |
| --- | --- | --- | --- | --- |
| J1 | a job started from a draft PR whose body is its START | every job | the PR body; the job's first commit after it | PLANNED |
| J2 | the `**Met**` strike riding the job's own commit; ownership accepts it | alpha N1 (R8, R9), stats N10 (R10, R11) | the commit `<m> N1: met …` in the PR; the gate green on it | PLANNED |
| J3 | the gate red on a branch and green after the fix | alpha N3 | the PR's check runs: one failure, then success | PLANNED |
| J4 | a review decided "no review" with its reason | BOB on alpha or beta | the job's Review line `no review · …` | PLANNED |
| J5 | a review decided "review" whose worker reports a gap, fixed and approved | stats N10 (and alpha, 29 Oct: an R9 gap) | the PR's comment reviews `CHANGES REQUESTED by the review` then `APPROVED by the review`; the Review line `gaps: n` then `approved`; the CHANGE; the second completion | PLANNED |
| J6 | a merge by the tool's printed call, its `pull_request.closed` event waking BOB and recorded | every merge | the job's Merge line `merging` then `merged`; the event | PLANNED |
| J7 | a CHANGE after the merge re-opening the job on a fresh branch and PR | alpha N1's answer, timed after its merge | two PRs for alpha; the REOPENED line; the second merge | PLANNED |
| J8 | a branch behind `tranche` updated by `update_pull_request_branch` at `neo merge`, the gate run again on the updated tip (the merged result), and the merge made only from that run's head (BLD 5 forbids the test that would have made this run red, BOB #1's A3; a red here is J3's path) | beta's PR, behind after alpha merges | the Merge line `updating` then `merging <updated tip>`; the check runs on the two tips; the merge commit | PLANNED |
| J9 | a job retired early by `neo job retire` and one at the layer's close | alpha early, beta at the close | the plan's owed lines; two metrics rows | PLANNED |
| J10 | a tranche closed by the one PR to `main` | the close | the PR `N1: close`, merged by BOB; `tranche` gone | PLANNED |
| J11 | a job that ends a turn with its record WORKING sent back by its goal without a message from BOB | beta N9 | beta's transcript: the Stop hook's refusals, then the goal's send-back | PLANNED |
| J12 | whether a message whose first words are `/goal` sets the goal again after a wait | PROBE-J12 #1, 29 Oct | `get_session`: the first condition unchanged (`iterations: 1, met: true`); the message read as data by `ReadNotifications`; no `Goal set:` reply | MEASURED before the run: it does not (SESSIONS §1b); no dry-run row |
| J13 | the tool's merge (JOB-LIFE §6, §12): the gate on every pull request to `tranche`, a green current tip merged by the printed call, the hook refusing any other merge | every merge | the check runs on the PRs; the merge commits; one refused hand merge | PLANNED |

## The Design stage (DESIGN-STAGE §5)

| # | path | driven by | evidence | status |
| --- | --- | --- | --- | --- |
| D1 | a lane decision that changes a canon section, written by the lane, cited by a requirement | ARITH on alpha N1 | `requirements/arithmetic.md` §3 by the lane; alpha R8 citing it | PLANNED |
| D2 | a lane decision that changes a rule: BOB rewrites the rulebook; before-and-after rendered where the rule is Bob's | ARITH's rule for empty lists | `.claude/rules/arithmetic.md` rule 2 rewritten by BOB; the decision line | PLANNED |
| D3 | a decision that changes a requirement's meaning, held NEEDS BOB, folded after his decision, an entry sent to each user module | stats N11 | the ask; stats R1 as Bob decided; the CHANGE to stats (and to legacy's census if any) | PLANNED |
| D4 | a decision line cited from a rulebook with the ask file gone | after the epoch closes | the rulebook's `L-ARITH-<n>`; no `asks/` anywhere | PLANNED |

## Permissions (PERMISSIONS.md §4)

| # | path | driven by | evidence | status |
| --- | --- | --- | --- | --- |
| X1 | every row of the act table (`tools/acts.md`) tried in its role and relation, passing | the whole run | the table's measured column, each row naming its event | PLANNED |
| X2 | a classifier refusal recorded by `neo refused`, listed by `neo status`, routed to the party whose relation passes | BOB archives a session it did not create (induced) | the state-branch line; the metrics row; the archive by the parent | PLANNED |
| X3 | a `state/*` or merged `job/*` branch deleted by the product's prune workflow, dispatched as `neo` prints it (the proxy refuses every ref delete: measured 29 Oct #5, R-BOB-1-2) | `neo merged`, `neo epoch close` | the workflow run; `git ls-remote` without the branch | PLANNED |
| X4 | the toy's `.claude/settings.json` written by `neo shims` at seeding | the seed | the commit, or the classifier's refusal and Bob's commit | PLANNED |
| X5 | a standing-list rule honoured where a permission prompt would otherwise stop a session | a job's act the list names | the act taken with no prompt | PLANNED |
| X6 | `autoMode.allow` in the product's settings honoured by a cloud session in Auto | a job's routine act in Auto | the act taken with no classifier block | PLANNED |
| X7 | the hook's `allow` clears a prompt in a cloud session (Accept edits) | a job's `neo` command | the command run with no prompt and no allow rule for it | PLANNED |
| X8 | server-managed rules from the admin console reach a product's sessions | Bob's act, if he takes it | the toy's session with the repository file removed still approved | PLANNED, Bob's act |

