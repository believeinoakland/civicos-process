# What a product supplies to neoProcess

**Status** · Draft, neoProcess #1, 2026-10-29. The checklist a second project fills in; everything else comes from the process repository (P2). The dry run's toy product (`dryrun/`) is the first "second project": it fills this list with the smallest possible product, and certifying the process on it is also the proof that the process is product-independent.

| the product supplies | where | written by | notes |
|---|---|---|---|
| `CLAUDE.md`, under thirty lines | repository root | `proc shims`, from this list | attach the process repository; invoke your role's skill; the standing safety rules |
| The role skills (`civicos-<role>/SKILL.md`) that load the role's rulebooks and register its hooks | `.claude/skills/` | `proc shims` | never by hand; a check fails when they differ |
| The canon index: mission, requirements, designs, by file | `requirements/README.md` | Bob with BOB | every module requirement cites the canon by section (P5) |
| The manifest: where the canon, the build state, each layer's tests, the generated artifacts, the object storage for captures and the ROOT session live | `build/manifest.md` | BOB with Bob | |
| The layers, in order, each with its contract | `build/layers.md` | BOB with Bob | |
| The modules in total order: id, layer, paths, tests, uses | `build/modules.json` | BOB with Bob (P4) | |
| Each module's requirements, public and private parts | `build/requirements/<module>.md` | BOB (with Bob where meaning changes, P5) | small enough to read whole (P6) |
| The product areas: each with the canon it owns, its modules, its rulebook | `build/areas.md` | BOB with Bob | every module in exactly one area |
| One rulebook per product area, loaded by the paths of its modules | `.claude/rules/<area>.md` with `paths:` | BOB; Bob for policy | at most ten rules, one screen |
| The lane register: id, area, charter, canon, status, live session | `build/lanes.md` | BOB (`proc lane …`) | the lanes the product's capabilities need, opened as the project goes |
| Each lane's decisions | `build/lanes/<id>/decisions.md` | the lane | durable; cited as `L-<ID>-<n>` |
| The product's own procedures: release, deploy, walks, a design channel | `build/situations/*.md` | BOB with Bob | named in the manifest; read whole when the situation arises |
| The plans: the running round, the next, the archive | `build/plan/` | BOB, by `proc` | the Status, Jobs and Owed lines live on the state branch instead |
| The metrics | `build/metrics/T<n>.csv` | BOB, by `proc … archived` | one commit per layer close |
| The gate workflow | `.github/workflows/gate.yml` | `proc shims` | runs the process repository's checks on every PR and in the merge queue |
| The rulesets: a merge queue and the required checks on the fixed branch `tranche`; one rule on `main` | repository settings | **Bob, once** (an act only he can take, walked through) | the one setup step that is his; fixed branch names because a queue cannot target a wildcard pattern (JOB-LIFE §1) |
| Object storage for captures, with a 30-day expiry | the product's platform (bio: R2) | BOB | screenshots never enter git (`PROTOCOL.md` §7d) |
| A register of Anthropic's terms, where the product uses the API | `build/terms/anthropic.md` | BOB with Bob | optional; the format check cites it (§8.4) |

What a product never supplies: a principle, a process rulebook, a tool, a hook, a check, or a copy of any process text (`proc shims` writes the few files that must sit in the product repository, and a check fails when they drift).
