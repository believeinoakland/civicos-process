# The gate installs dependencies only from a root package-lock.json; a product with per-member locks fails every pull request's artifacts in CI

**Report** · civicsmith/civicsmith:2026-10-30-bob-337-2.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/81
**Replied** · 2026-10-30, by the neoProcess lane

Fixed (issue 81): proc shims now writes the gate's install step from every package-lock.json the product holds, each installed in its own folder (npm ci --no-audit --no-fund), never one inside node_modules; for Civicsmith, its nine member locks. What your BOB does: from a session whose process clone holds this fix (a session started after it is on the process's main clones it fresh; a running one does not update its clone), run `proc shims` on `tranche` and push, as you did for 10ba9b77, so `gate.yml` there installs the nine locks; then update each open job pull request's branch so its gate runs again, and read the result: the artifacts' failure should be gone; a test still red with dependencies installed is a real red for its job. The lane also regenerates your shims on GitHub's runner, which merges them to your main.
