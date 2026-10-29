# Bob's setup act (done 29 Oct 2026; read back from GitHub's API by #5)

**What exists.** `believeinoakland/neoprocess-dryrun`, public, owned by Bob's personal account (GitHub's API: owner type `User`; so no merge queue, which GitHub offers only on a repository owned by an organization, and no bypass actors). Two rulesets, both Active: `tranche` (target `tranche`: restrict deletions, block force pushes, and the required check `gate`, which must go, below) and `main` (target `main`: restrict deletions, block force pushes, a pull request required with zero approvals). `civicos-process` is public (its visibility read 29 Oct). **Allow auto-merge** is off and stays off: the process does not use it (JOB-LIFE §12). The Claude GitHub app reaches the toy (this session attached it).

**The one edit left (Bob).** Open github.com/believeinoakland/neoprocess-dryrun/settings/rules, click **tranche**, untick **Require status checks to pass**, and save; nothing else. Why: a required check refuses every direct push to the branch, its creation included (measured 29 Oct, #5: `Required status check "gate" is expected`), and BOB and the lanes push `tranche` for what is no job's; the gate is enforced by `neo merge` instead (JOB-LIFE §6).

**For the next product repository** (`civicsmith`), the same, from the screens Bob saw on 29 Oct (<<org>> means believeinoakland, <<repo>> the repository's name):

1. At the top right of any page click the plus icon, then **New repository**; set **Owner** to <<org>>, type <<repo>>, choose **Public**, click **Create repository**.
2. On the repository's page click **Settings** (under the "…" menu next to the tabs if hidden), then on the left **Rulesets**, **Rulesets** again, **New ruleset**, **New branch ruleset**.
3. Type `tranche` as the name; change **Enforcement status** from Disabled to **Active**; under "Target branches" click **Add target**, choose **Include by pattern**, type `tranche`. Under "Rules" leave the defaults (**Restrict deletions**, **Block force pushes**) and tick nothing else; click **Create**.
4. A second ruleset the same way, named `main`, Active, target `main` by pattern; under "Rules" tick **Require a pull request before merging** (zero approvals); click **Create**.
5. At github.com/apps/claude/installations/select_target, pick <<org>> and give the Claude app access to <<repo>>.

A session can do none of it: repository settings writes are refused by the proxy (measured 29 Oct, #5: `Repository settings writes are not permitted through this proxy`, HTTP 403 on a PATCH of the repository), and creating a repository was refused on 29 Oct (#4). A session can read all of it back (`gh api repos/<org>/<repo>/rulesets`), which is how BOB verifies the act.

Documentation used (fetched 2026-10-29): docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/{creating-rulesets-for-a-repository,available-rules-for-rulesets,about-rulesets}; …/configuring-pull-request-merges/managing-a-merge-queue; …/managing-protected-branches/about-protected-branches; docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request.
