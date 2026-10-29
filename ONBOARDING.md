# Onboarding: a project brought under neoProcess, new or existing

**Status** · BOB's mechanism (P17) for Bob's requirement of 29 Oct 2026, in his words: *"neoProcess must include an on-boarding or initialization capability that either takes an existing project that wasn't being developed using neoProcess and converts it to use neoProcess, or enables me or somebody like me to start a new development project with neoProcess involved as soon as a vision, audiences, and initial set of requirements for the project can be discussed."* The process names no project (GRANTS); everything below works from the project's own files. To be certified on a dry run that onboards a throwaway project each way before a real project relies on it (P3; GOV 5).

## 1. Who does it

An **onboarding session**: the person who owns the project (Bob, or someone like him; called *the owner* here) starts one Claude Code cloud session on the process repository, in Auto, with the project's repository attached (a new project: an empty repository, made beforehand by the process's repo-setup workflow, which `proc repo setup` dispatches from a session on the process repository, or by the owner by hand, SETUP-STEPS; a session with two repositories reads neither's settings, PERMISSIONS §10.7), and invokes `neoprocess onboard`. Its start, `proc onboard start --product <dir> --session <id>`, records the role; the role pushes only the project's `onboard` branch, opens and merges the one seed pull request to the project's `main`, and starts no session. It talks with the owner only about what is the owner's (P17: vision, audiences, requirements, the high-level architecture, UX, and the grants only the owner can give); every other matter it decides and reports.

## 2. The steps, both paths (`proc init` writes, `proc init --check` reports)

| # | step | new project | existing project | whose |
| --- | --- | --- | --- | --- |
| 1 | **Intake** | the owner and the session talk through the vision, the audiences and the first requirements; the session writes them as the canon index, `requirements/README.md`, each section the owner's words or approved by him | the session surveys the repository (`build/onboarding/survey.md`, written by `proc init`: its directories, languages, package manifests, tests, workflows, its old `CLAUDE.md` kept); helpers read the code and docs in full (P20) and draft the canon index from what the project already does; the owner corrects it | the owner's (P17) |
| 2 | **Seed** | `proc init --mode new`: the build state's skeleton (manifest, layers, modules, areas, lanes, rulings, plan, grant list) and `proc shims` (CLAUDE.md, the skill, the settings with the standing list, the gate and prune workflows) | `proc init --mode convert`: the same, never overwriting a file the project has (its old `CLAUDE.md` moved into `build/onboarding/`), and a first `build/modules.json` with one **legacy module** per code directory (held whole, extracted later, PRODUCT-SUPPLIES) | BOB's |
| 3 | **Grants** | the project's grant list (`build/GRANTS.md`, `build/grants.json`) from what the requirements will deploy and exercise; the one sitting (PERMISSIONS §10) | the same, read from the project's deploy and test code by helpers (its workflows, configs, the variables it reads) | the list BOB's; the sitting the owner's |
| 4 | **Repository** | `proc repo setup`: the two rulesets, made by the workflow it dispatches (or by the owner by hand, SETUP-STEPS) and read back | the same on the existing repository | the tool's, or the owner's once |
| 5 | **Architecture** | layers and modules from the requirements (P4), in total order | the legacy modules ordered, and the first extractions planned from the survey (what each coming extraction moves) | the owner's for capability-carrying layers and modules; the rest BOB's (P4, P17) |
| 6 | **Requirements** | each module's, citing the canon (P5) | each extracted module's; a legacy module has none until extracted | BOB's, with the owner where meaning changes |
| 7 | **First tranche** | its plan in `build/plan/next.md` | the same | BOB's |
| 8 | **Handover** | the seed pull request merged to `main`; `proc grants check` green; the owner starts the project's ROOT (SESSIONS §1a), which starts BOB, which opens the first tranche | the same | the owner's one act |

`proc init --check` lists each step DONE or OPEN with what is missing and whose it is, so a later session, or the owner, sees where onboarding stands from git alone (P13).

## 3. What makes a step done (the check)

1 the canon index has no `<!-- onboarding: ... -->` marker left · 2 every seed file present and `proc shims --check` reports no drift · 3 `build/grants.json` exists and `proc grants check` passed in the last day · 4 the rulesets read back · 5 `build/modules.json` names at least one module and `build/layers.md` lists every module · 6 every non-legacy module has `build/requirements/<id>.md` · 7 `build/plan/next.md` holds an entry · 8 the project's `main` holds the seed and an epoch is open (the first BOB's first act, once the owner has started ROOT). Step 4 reads CHECK: its proof is `proc repo setup`'s read-back, not a file.
