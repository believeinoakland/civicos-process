# Bob's one setup act, step by step (verified against GitHub's documentation, 2026-10-29)

Do these on github.com, signed in as yourself. <<org>> means the organization believeinoakland; <<tranche>> means tranche; <<main>> means main; <<gate>> means gate; <<repo>> means neoprocess-dryrun; <<key name>> means NEOPROCESS_DEPLOY_KEY.

1. At the top right of any page, click the plus icon, then click **New repository**.
2. In the **Owner** box pick <<org>>, type <<repo>> as the name, choose Public (GitHub offers a merge queue only on a public repository owned by an organization, or on Enterprise Cloud), and click **Create repository**.
3. On the new repository's main page click **Settings**. If you cannot see it, open the "…" menu next to the tabs and click it there.
4. On the left click **General**. Near the bottom, under "Pull Requests", tick **Allow auto-merge**.
5. On the left, under "Code, planning, and automation", click **Rulesets**, then click **Rulesets** again, then click **New ruleset**, then click **New branch ruleset**.
6. Under "Ruleset name" type <<tranche>>. Click **Disabled** and choose **Active**.
7. In the "Target branches" section click **Add a target**, choose to include by name, and type <<tranche>>.
8. In the "Branch protections" section tick **Require merge queue** (the page names it so for branch protection; the ruleset screen may word it slightly differently) and tick **Require status checks to pass before merging**; in "Additional settings" type <<gate>> as the status check and click the plus to add it. Then save the ruleset.
9. Make a second ruleset the same way (step 5), named <<main>>, **Active**, targeting <<main>>. In "Branch protections" tick **Require a pull request before merging**, then save.
10. Open the page github.com/believeinoakland/neoProcess, click **Settings**, and in the sidebar click **Deploy Keys**, then click **Add deploy key**.
11. In the "Title" field type <<repo>>, and in the "Key" field paste the public key BOB gave you. Leave **Allow write access** unticked, then click **Add key**.
12. Go back to the neoprocess-dryrun repository, click **Settings**, then in the "Security" section click **Secrets and variables**, then click **Actions**.
13. Click the **Secrets** tab, then click **New repository secret**.
14. In the **Name** field type <<key name>>, in the **Secret** field paste the private key BOB gave you, and click **Add secret**.

Documentation used (all fetched 2026-10-29):
- docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys
- docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets (redirect of the using-secrets-in-github-actions page)
