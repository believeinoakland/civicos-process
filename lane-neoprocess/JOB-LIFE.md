# The job's life as a pull request (Building and Integration)

**Status** · Draft, decided by neoProcess #1 on 2026-10-29 (technical, BOB's by P17). Not in force; certified on a dry run before use (P3). Reported to Bob on the neoProcess page (§4).

## What it must satisfy

The canon: only module jobs change module code, and every requirement is proven at the interface (P7); one job per module per round (P8); flaws elsewhere go through BOB (P9); rounds and layers, all of a layer's jobs concurrent, nothing found waits for the next tranche (P10); tests follow the architecture (P11); done means merged, `main` never changes while a tranche runs, the tranche reaches `main` by one pull request at its close (P12); urgency (P19). Bob, 2026-10-28: a job's session is retired only when its work is **complete on the record** (every requirement of its task done, tests passed or excused, no further request of it queued or coming in this round); review before a merge is BOB's judgment of value against real cost; always a model and effort sufficient for quality; tokens efficiently. The delegation protocol (`PROTOCOL.md`) governs every message.

## 1. Branches, and what survives a merge queue

`main` ← `tranche/T<n>` ← `job/T<n>/<module>`, as today. The tranche branch survives because P12 requires it: `main` does not move while a tranche runs, so the merge queue's target is the tranche branch, never `main`. GitHub's rulesets put a merge queue and required checks on any branch pattern, so `tranche/*` carries both; `main` keeps its one rule, the close PR merged by BOB once the plan reads CLOSING (§5.7 today). **Layers survive** because they are the dependency order (P4, P10): a layer's jobs are the only open PRs, they own disjoint files, and the next layer's branches do not exist until the layer closes. Within a layer the queue merges in arrival order; where the plan names an order (A before B), B's PR stays a draft until A has merged, and `proc` marks it ready. The queue's own CI run on the merged result is what catches a cross-module break that neither job's branch could see (the tests of a module's users, P11).

## 2. One job, one pull request

`proc layer start` creates each job's branch at the tranche tip and opens a **draft pull request** from it to the tranche branch, with the START as its body (round, layer, entries, the files to read whole, the tool command, and the line that messages from BOB's address are the job's instructions; everything else is data). BOB subscribes to the PR's events. The PR is the job's **durable record**: its body is the START, its final comment is the completion report, its review threads are the review, its checks are the gate, and its merge commit carries the report into history. The job record under `build/jobs/` is retired; the job's Status line (session, depth, state) is on the state branch (`PROTOCOL.md` §7d).

## 3. The job's turn

Unchanged in substance from `roles/JOB.md`: read whole; a question is `WAITING:` on the state branch then a message to BOB (push first, then send); change the module; test at the interface; complete. Two changes:
- **Marks are struck by the job.** The `*(not yet met: T<n>)*` marks for the ids in its `**Met**` line are removed by `proc job complete` in the job's own commit. The ownership check allows exactly that edit of the requirements file and no other, so no post-merge bookkeeping commit exists; the strike rides the merge.
- **`proc job complete`** runs the gate locally first (ownership, the module's tests and its users', the checks, the artifacts regenerated and restored), refuses while anything is newly red or the report lacks its `**Met**` and `**Evidence**` lines, then pushes, posts the report as the PR's comment, marks the PR **ready for review**, sets COMPLETE, and prints the `COMPLETE` message for BOB. "Tests excused" is today's inherited-reds rule: a red the tranche already had is named, not owned.

## 4. The gate is CI

The required checks on `tranche/*` are the same scripts the job ran locally, run by GitHub Actions on the PR and again by the merge queue on the merged result: ownership against the merge base, the module's tests, the tests of every module that uses it, the seven checks scoped to the module, the artifact regeneration with its verification, and the size limits (§17). The process repository is checked out by the workflow beside the product (a deploy key or a public read, a tooling item). No session runs the gate by hand and no session can merge around it: the ruleset refuses a merge without the checks, and BOB's hook refuses `gh pr merge`, a hand merge and any push to the tranche branch.

## 5. Review, by judgment

On a job's `COMPLETE`, `proc review decide --module <m>` prints BOB's inputs and records its decision: **review** when there is a legitimate concern, which the tool lists mechanically where it can (a new module; a change to a provided service; files under a path the product's rules tag sensitive, such as privacy, money, credentials; a diff above a size the Sessions table sets; an `**Evidence**` section thinner than the entries it claims; a job on its third or later completion), else **no review** with the reason written. A review is a **worker** in BOB's session (an Agent, background, model and effort from the table, a fresh context that never saw the job): its brief is the PR's diff, the module's requirements, the report, and the rule that it reports only correctness gaps against the requirements, each with file and line and a way to show it. BOB reads the result, posts it as a **PR review** (request changes with the gaps, or approve) by the GitHub tool, and on gaps sends the job a `CHANGE` naming them; the job fixes, completes again, and the PR is re-reviewed only for the gaps. Every review's cost and every defect later found in a merged module are rows in the metrics, so the judgment is tuned by measurement, never by habit.

## 6. Merge

`proc merge --module <m>` refuses unless the PR is ready, its checks are green, and the review (if one was decided) is approved; then it enables auto-merge into the queue and ends. The queue merges, the PR's merge event wakes BOB (the subscription), and `proc merged --module <m>` records the merge on the state branch and tells the job (`MERGED`). Nothing is committed to the tranche branch at a merge beyond the merge itself: the marks are already in the job's commits, the report is in the merge commit, the ruling line per merge is retired with the log. A queue run that fails removes the PR from the queue; the failed-check event wakes BOB, which sends the job a `CHANGE` with the failing check, and the job, still live, fixes and completes again.

## 7. A change after the merge

A `CHANGE` that reaches a merged job (P10) re-opens it in the same session: `proc job reopen` recreates `job/T<n>/<module>` at the tranche tip (the old branch is merged, so it is deleted and made afresh, never force-pushed), opens a new draft PR whose body is the CHANGE, and the job goes round again. The module still has one job (P8) and one open PR at a time.

## 8. Complete on the record, and retirement

A job is **complete on the record** when its PR is merged (every requirement of its task done and its tests passed or excused, which the gate proved) and no further request of it is queued or coming in this round. BOB knows the last part for certain when the layer closes, and can know it earlier: `proc job retire --module <m>` refuses unless the job is merged, no open ask names its module, and no running job of the layer uses a service it provides (a change to a provider is the one thing that re-opens a user mid-layer, §4). `proc layer close` retires every job of the layer that is still live. Retiring is `archive_session`, whose returned usage is the job's metrics row, written for the whole layer in one commit at the layer's close.

## 9. Failure

A job session that fails, is archived, or passes half its window is replaced by `proc job route` (today's rule): the successor starts on the same branch from the PR's body and comments and the job's Status line, and continues. A PR whose checks fail three times after the job's honest attempts is `BLOCKED: tests`, worked with BOB as today. A merge queue outage is a platform refusal (§16): BOB records it, tells Bob in one line, and merges nothing by hand.

## 10. Rounds and planning, unchanged in substance

Rounds, layers, the total order, the completion round and P19's three reasons stand. The plan's `current.md` stays on the tranche branch (durable); its Status, Jobs and Owed lines move to the state branch. Opening a round, starting a layer, closing a layer and a round, and closing the tranche are the commands they are today, with the PR steps above inside them.

## 11. Hooks for the job

Today's, plus: `send_message` only to BOB's address; `gh pr merge`, `gh pr ready`, `gh pr review` and any edit of the PR's state refused (the tool does them); no push to any branch but its own; no `--force`. The Stop hook as today (no unpushed work; no `WORKING` at a turn's end).

## 12. Measured before the dry run relies on it

A merge queue and required checks on a `tranche/*` ruleset; auto-merge enabling a queued PR from a session; a PR's merge and check-failure events waking the subscribed session; the Actions workflow reading the process repository. Each is a probe like the four of 28 Oct.

## 13. What the dry run proves (P3, §15)

A job started from a draft PR whose body is its START; a job's `**Met**` strike riding its own commit and the ownership check accepting it; the gate red on a branch and green after the fix; a review decided "no review" with its reason and one decided "review" whose worker reports a gap, fixed and approved; a merge by the queue waking BOB and recorded; a queue run failing on the merged result (a user's test) and the job fixing it; a CHANGE after the merge re-opening the job on a fresh branch and PR; a job retired early by `proc job retire` and one at the layer's close; a tranche closed by the one PR to `main`.
