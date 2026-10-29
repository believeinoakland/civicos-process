# Bob's one setup act, step by step (verified against GitHub's documentation, 2026-10-29; steps 10–14 on a deploy key and a secret dropped by #4: the process repository goes public instead, BOB's decision)

Do these on github.com, signed in as yourself. <<org>> means the organization believeinoakland; <<tranche>> means tranche; <<main>> means main; <<gate>> means gate; <<repo>> means neoprocess-dryrun.

1. At the top right of any page, click the plus icon, then click **New repository**.
2. In the **Owner** box pick <<org>>, type <<repo>> as the name, choose Public (GitHub offers a merge queue only on a public repository owned by an organization, or on Enterprise Cloud), and click **Create repository**.
3. On the new repository's main page click **Settings**. If you cannot see it, open the "…" menu next to the tabs and click it there.
4. On the left click **General**. Near the bottom, under "Pull Requests", tick **Allow auto-merge**.
5. On the left, under "Code, planning, and automation", click **Rulesets**, then click **Rulesets** again, then click **New ruleset**, then click **New branch ruleset**.
6. Under "Ruleset name" type <<tranche>>. Click **Disabled** and choose **Active**.
7. In the "Target branches" section click **Add a target**, choose to include by name, and type <<tranche>>.
8. In the "Branch protections" section tick **Require merge queue** (the page names it so for branch protection; the ruleset screen may word it slightly differently) and tick **Require status checks to pass before merging**; in "Additional settings" type <<gate>> as the status check and click the plus to add it. Then save the ruleset.
9. Make a second ruleset the same way (step 5), named <<main>>, **Active**, targeting <<main>>. In "Branch protections" tick **Require a pull request before merging**, then save.
10. Open the page github.com/believeinoakland/civicos-process (this process repository, under its present name) and click **Settings**. In the "Danger Zone" section, to the right of "Change repository visibility", click **Change visibility**, select Public, click to confirm that you are changing the visibility of the correct repository, click **I have read and understand these effects**, then click **Make this repository public**. (BOB's decision, 29 Oct: the toy's gate reads the process repository with no key or secret; nothing in it is confidential.)

Documentation used (all fetched 2026-10-29):
- docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
