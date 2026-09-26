# civicos-process

The development process for CivicOS: its principles, its mechanics, the role instructions, and the four checks. It is product-independent (principle P2). The product it builds is `believeinoakland/bio`, whose build state lives under `build/` in that repository.

Created by Bob on 2026-09-26.

| file | what |
| --- | --- |
| `PROCESS-DESIGN.md` | the principles, P1–P16, approved by Bob |
| `PROCESS-MECHANICS.md` | how the principles are carried out, approved by Bob |
| `roles/BOB.md`, `roles/JOB.md` | the standing instructions each role reads first (mechanics §2, §6) |
| `checks/` | the four checks (mechanics §8), with their tests; see `checks/README.md` |
| `metrics/record.mjs` | appends a session's tokens processed to the product's `build/metrics/T<n>.csv` (mechanics §10): `node metrics/record.mjs --product <root> --tranche <Tn> --role <BOB\|job> [--module <id>] [--test-runs <n>] [--module-lines <n>]`. Counts are summed from the session's transcript, one per model request; `turns` is the number of model requests. Transition sessions record under `T0`. |

The transition to this process is planned and logged in `docs/development/TRANSITION.md` on the branch `land/bob/process-design` of `believeinoakland/bio`.
