# The gate installs dependencies only from a root package-lock.json; a product with per-member locks fails every pull request's artifacts in CI

**Report** · civicsmith/civicsmith:2026-10-30-bob-337-2.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/81
**Replied** · 2026-10-30, by the neoProcess lane

Fixed (issue 81): proc shims now writes the gate's install step from every package-lock.json the product holds, each installed in its own folder (npm ci --no-audit --no-fund), never one inside node_modules; for Civicsmith, its nine member locks. The neoProcess lane regenerates your shims on GitHub's runner, which merges gate.yml to your main. What your BOB does then: merge main into tranche (the shims check compares against it), update each open job pull request's branch so its gate runs again, and read the result: the artifacts' failure should be gone; any test still red with dependencies installed is a real red for its job.
