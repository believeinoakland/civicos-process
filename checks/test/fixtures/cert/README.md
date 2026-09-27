# Certification fixtures (SUITE.md §4, bio K164)

Copied verbatim unless said otherwise; read by `checks/test/cert.test.mjs`.

| path | source |
| --- | --- |
| `bio/build/jobs/T4`, `T5`, `T6` | bio `origin/tranche/T6` @ `bfaf7e6287` (T6 closed after layer 2, K165) |
| `bio/build/metrics/T4–T6.csv` | the same commit |
| `bio/build/plan/archive/T4–T6.md` | the same commit |
| `bio/build/plan/current.md` | bio `039eb27c33` (T6's plan as BOB #48 opened it) |
| `bio/handoff/BOB-44…47.md` | §6 of bio `docs/development/TRANSITION.md` at each handoff commit (`ee457c5432`, `5dfd4134a8`, `0c6c206966`, `04279c652f`) |
| `dry/D1…D7/build` | civicos-process `origin/tranche/D<n>`: each run's own jobs, metrics and plan |
| `dry/main/build` | civicos-process `dryrun/build` on this branch (D3's plan, D6's metrics as later completed) |
| `messages-T5-T6-D7.txt` | the first line of every trigger `list_triggers(include_completed)` returned on 2026-09-27 ~15:39 UTC (105: T5 from 08:02, D7, T6), newest first |
| `t6/snap-1.json` | real `get_session` (6 sessions) and `list_triggers` output read then, trimmed to the fields `assert.mjs` reads, each prompt cut to its first line |
| `t6/run.json` | the run manifest for T6 as it ran (layer 1's jobs) |
| `k140/` | the K140 case (see its README) |

`EXPECTED-FAILURES.txt` is the corpus report: every error the validators give on the real records (non-strict).
The corpus test fails if a record starts or stops failing; change this file only with the reason in the commit.
