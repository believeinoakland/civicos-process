# Phase 2 design: a pull request per job, the gate in CI, an independent reviewer, the merge queue

**Status** · Design only (BOB #333, 2026-10-28 19:49Z: build nothing on the old `proc` until Bob answers the Rulebook's R1-R4). It is written to the Rulebook's Integration rules INT-1..INT-8 (https://claude.ai/artifact/J8E73nE7Y4qNczAVPTB5Sn) and Bob's answer 1 (bio K5791: "GitHub merge queue"). It holds for today's repository and for a clean one. Each claim names its evidence; what is unmeasured is called unknown.

## 1. What it replaces, and why (measured)

- Today BOB merges every job by hand, one at a time, on its own thread. That was the analysis's largest cause: COMPLETE to merged p50 36.5 min, max 139 min, against a run of 2.2 min.
- Phase 1 (a) put the merges in one background run, and D27 proved it (`dryrun/RUNS.md` D27). It is still serial and still started by BOB.
- The gate checks that a test **names** each requirement, never that the test can fail. bio's coverage check counts any `R<n>` anywhere in a test file (`checks/coverage.mjs:39`, `/\bR(\d+)\b/g` over the whole file). money's three empty tests R39-R41 therefore counted (bio `753f66fb9d`, `bio-plane/test/m/money/fiscal-year.test.mjs:97-100`, `owed("R39 …", () => {})`), and they are still on `tranche/T53` (the fix `4f72be1c76` is only on `job/T53/money`).
- One independent Opus reviewer found 19 defects in 20 merged T53 jobs (bio `build/plan/audit-T53-2026-10-28.md`).

## 2. The flow

1. **The job opens its pull request.** At `COMPLETE` the job pushes `job/T<n>/<m>` and opens a pull request into `tranche/T<n>`. The PR body is its completion report (`**Met**`, `**Evidence**`) and its title is `<m>: <entries>`. The job then marks the PR for the queue: `enable_pr_auto_merge` (merge method `MERGE`). On a branch that requires a merge queue, that adds the PR once its required checks pass (GitHub docs, "Merging a pull request with a merge queue": `gh pr merge` "adds it to the queue if required checks pass. Otherwise it enables auto-merge"). The job subscribes to its PR's activity, so a red check or a review gap wakes it (INT-6).
2. **CI runs the gate** on `pull_request` and on `merge_group` (docs: "The `merge_group` event is separate from the `pull_request` and `push` events", without it "status checks will not be triggered when you add a pull request to a merge queue"). One workflow, `gate.yml`, with these required checks (INT-3):
   - `ownership`: the PR's diff against its merge base, by `checks/ownership.mjs`. It includes the fill of a new module's own empty row (Phase 1 e's rule, `checks/lib.mjs` `rowFill`), so a new module's first PR carries its own row.
   - `tests`: the module's suite, then the suites of every module that uses it (`modules.json` `uses`, Phase 4). A red that the base also has is inherited and named, as today (mechanics §4, "Old debt never blocks new work").
   - `checks`: format, architecture, coverage, fixtures and words, scoped to the module. A finding the base already has is not the PR's.
   - `proof` (INT-2, §3 below): no empty test, and the sabotage run.
   - `artifacts`: while generated files are still committed (until Phase 3), regenerate and verify them, and fail when the committed copy is stale. After Phase 3 this check is `build` (the bundles build).
   - `review` (INT-4, §4 below).
3. **The merge queue** on `tranche/T<n>` merges each PR whose checks are green, with merge method **merge** (docs: "merge, rebase, or squash" are selectable; merge commits are kept, P12). Every PR is tested on the latest base plus the PRs ahead of it (docs: changes are "grouped into a `merge_group` with the latest version of the `base_branch`"). A failure removes the PR from the queue (docs: "if there are failed required status checks or conflicts with the base branch … the pull request will be removed from the queue"). The PR stays open, and its job is woken by the PR event (INT-6). No session merges (INT-5).
4. **Order.** The queue keeps arrival order. Module order (upstream first, K1965) holds because a layer's jobs never use one another's changes unless they `use` them. A user that needs its provider's change is red until that change is merged, so it goes back to the queue after the provider. **Unknown:** whether the queue's wait for a group delays a dependent PR enough to matter; measure in the dry run.
5. **Layer close (INT-7):** the layer is closed when every PR of the layer is merged (`list_pull_requests`, base `tranche/T<n>`, closed and merged). `proc status` reads that state from pull requests, not from job records (this replaces Phase 1 b's one-fetch check).
6. **The ruling line per merge goes away.** The record is the PR (its report, the checks, the review) and the merge commit. That ends the 4.7 MB `rulings.md` rewrite at every merge and the queue's collisions on it. This is an INT rule, and it removes mechanics §5.5's ruling step.

## 3. INT-2, a test that cannot fail is refused: two arms (measured on bio)

- **Static arm: no empty test.** A `test(`, `it(` or wrapper call whose body is empty (`() => {}`, `async () => {}`), or a `todo` whose title names a live id, does not count as naming that id. The coverage check counts an id only from a test that is not empty.
  - On bio's 2,965 test files under `bio-plane/test/m/` (21,284 titled tests), exactly the three money tests are empty, and there are no false positives. A naive "no assertion keyword" rule would flag 593 tests. At least 378 of those assert through helpers (`declaredOpHolds`, `bio-plane/test/declared-ops.mjs:34`; `refusedAt`/`accepted`, `ai-catalogue/schema.test.mjs:10-16`), so it is rejected.
- **Dynamic arm: the sabotage run.** Every source file of the module is replaced by stubs that throw on any use, and the module's tests are run again. A test that names an id and still passes cannot be proving that requirement of this module. It is listed as a review finding, not refused outright: a requirement about a static census may pass legitimately.
  - Measured on money at `tranche/T53` (`sabotage.mjs` in the lane's scratch, 53 exports stubbed): 150/150 pass normally in 9.6 s. Sabotaged, 141 ran and 2 passed, in 3.3 s. The 2 are "M-M1 R1 the 200 figures: each read exactly by calc-grammar's parser …" and "R29 the census finds no BAD_PERIOD answered by any money act". Neither calls money's code, and both are worth a reviewer's look.
  - The three empty tests are **not** caught by this arm: their file fails at load once money is stubbed (its line 9 calls a fixture at import). That is why both arms are needed.
- Cost per PR: one more run of the module's suite, with stubs, about a third of its normal time on money.

## 4. INT-4, an independent reviewer per PR

- **What it reads:** the module's requirements (both parts), the PR's diff, and the module's tests. It never reads the job's conversation. It reports **only** correctness gaps against the requirements, each with file:line and either a command and its output or a test it ran in its own copy. It reports nothing about style (the Rulebook's caution: "A reviewer that's asked to find problems will always find something").
- **Measured cost:** the audit took about 36,000 tokens per job and did 20 jobs in 28 minutes (the Rulebook, "Proof at the merge"; the audit file itself records neither figure: unknown from the file).
- **How it runs, two routes:**
  - **R-a (recommended): a reviewer session per PR,** `create_session` on `claude-opus-5-5`, started by BOB from a printed call when a PR's other checks are green. BOB only starts it; it merges nothing. The session reads, reviews, and posts one PR comment ending `<!-- civicos-review head=<sha> verdict=PASS|GAPS -->`.
    - The `review` check, a job of `gate.yml` rerun on `issue_comment`, passes only when the latest such comment names the PR's current head with `PASS`. In a `merge_group` run it checks each PR of the group, whose numbers are in the `gh-readonly-queue/…/pr-<n>-<sha>` branch name.
    - A push after the review makes the review stale, so the reviewer reviews again.
    - The job's hook refuses a job writing that marker, since every session posts as the same GitHub identity. A forged verdict is a role breach the hooks prevent; it is not cryptographically impossible.
  - **R-b: review inside CI** (the Claude Code GitHub Action). It needs a credential stored as a repository secret. Whether a plan credential may be used that way is a question for bio's terms register (`build/terms/anthropic.md`), not answered here, so R-b is not recommended until the register answers it.
- A gap is fixed by the job, or answered with evidence in the PR thread, before the review passes (INT-4).

## 5. What only Bob can set (each one act; steps to be written from GitHub's own page by `proc steps`, P20)

1. **A branch ruleset on the tranche branch:** "Require merge queue" (merge method merge), "Require status checks to pass" (the gate's checks), and a block on force pushes and deletions. **Unknown and decisive:** GitHub's merge-queue page says "A merge queue cannot be enabled with branch protection rules that use wildcard characters (`*`) in the branch name pattern". Whether that also binds a ruleset targeting `tranche/*` is not stated. Test it first on a throwaway branch with a `tranche/*`-style ruleset. If it binds, the ruleset names each tranche's branch exactly, and Bob's act is then once per tranche. The alternative is a fixed integration branch name; deciding between them is BOB's (P17).
2. **Repository settings:** under Settings, Actions, General, "Workflow permissions": read and write for `GITHUB_TOKEN` and "Allow GitHub Actions to create and approve pull requests" (docs, "Managing GitHub Actions settings for a repository"). Exact radio labels are to be read from the page when the steps are written.
3. Nothing else. Merge queues are available to public repositories owned by an organization (the analysis's source: the 2023-07-12 GitHub changelog). Standard runners are free for public repositories (docs, "About billing for GitHub Actions").

## 6. Targets and how each is measured (Phase 4 reports them per tranche)

| measure | today | target | measured how |
| --- | --- | --- | --- |
| COMPLETE (PR opened) to merged | p50 36.5 min, p90 58, max 139 | p50 ≤ 10, p90 ≤ 20 | PR `created_at` to `merged_at`, from the GitHub API |
| gate run | 2.2 min (max 5) | ≤ 1 min | the workflow's duration. Money's parts measured here: checks 6.3 s (format 0.2, architecture 0.1, coverage 0.1, fixtures 4.7, words 1.2), ownership 0.65 s, tests 10 s, sabotage 3.3 s, about 20 s before checkout and `npm ci`; artifacts about 50 s until Phase 3 removes them (the analysis) |
| BOB's end-of-turn check | 12.5 s median on bio (lane P1) | ≤ 3 s | the hook's own time; from PR state it needs no git fetch |

## 7. The dry run that certifies it (P3)

A toy tranche in this repository (`dryrun/`) is not enough: the queue and rulesets live on GitHub. The certification run uses a scratch **public** repository in the organization, or this repository with a ruleset on `tranche/D<n>` (one act of Bob's to create the ruleset). Two jobs plus one new module, as in D27. It proves:
- a PR per job;
- `gate.yml` green and red;
- a red PR leaving the queue and its job woken;
- the reviewer's GAPS then PASS;
- the queue merging with merge commits;
- the layer closing from PR state;
- the wildcard question above.

**Not designed here:** what the new repository (Rulebook R4) names its branches. This design takes the tranche branch's name as a parameter.
