# N2 · measurements (SES-12; Bob, 30 Oct: "measure this tranche as we go through it")

Taken by the architecture session from git, GitHub and the sessions' records; never by a job. One block per layer, written at the layer's close; the baseline at the open.

## Baseline at the open (30 Oct 2026)

| measure | value | source |
| --- | --- | --- |
| process version pinned | the `main` commit `tranche` opens from (the plan's Status line) | git |
| commits on `main` on 30 Oct before the open | 154 (29 merged pull requests) | `git log origin/main --since 2026-10-30` |
| tool size | `tools/proc.mjs` 2,604 lines; `tools/lib.mjs` 463; `tools/hooks.mjs` 450; `checks/*.mjs` 2,686 | `wc -l` |
| suite | `node --test checks/test/*.test.mjs tools/test/*.test.mjs`: 255 `test(` calls | `grep -c` |
| old branches found at the open | 24 `tranche/D*`, 39 `job/D*/*`, 1 `fix/*`, none on `main`; the 24 kept as `carried/D*` and pruned by the new `prune.yml` | `git ls-remote` |
| the architecture session | neoProcess #20, depth 4, started 17:06Z | `get_session` |

## Per layer (written at each close)

| layer | opened | closed | jobs (sessions per job) | gate runs per merged job | restarts (process reasons) | commits: job code / records | tokens by role (cache read / write / output) | reading set per job at start (bytes) | overruns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
