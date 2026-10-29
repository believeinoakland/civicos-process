# neoProcess (repository `civicos-process`, to be renamed `neoProcess`)

A development process for any software product: its principles, its rulebooks, its design, its tool, its hooks and its checks. It is product-independent (P2): a product supplies what `PRODUCT-SUPPLIES.md` lists and nothing else. In force from 2026-10-29, certified on the dry run N1 (`dryrun/N1/CERTIFICATION.md`). Created by Bob on 2026-09-26; redesigned by the lane neoProcess, 28–29 Oct 2026 (`lane-neoprocess/`).

| file | what |
| --- | --- |
| `PROCESS-DESIGN.md` | the principles, P1–P20, approved by Bob |
| `rulebooks/*.md` | the ten area rulebooks, at most ten rules each, one screen, each naming its principle and what enforces it |
| `PROTOCOL.md` | how jobs and lanes reach each other through BOB; the state branch; refresh and account move |
| `JOB-LIFE.md` | a job's life as a pull request: the gate, review by judgment, the tool's merge, rounds and the tranche's close |
| `SESSIONS.md` | models and effort, the goal, reading sets and their budgets, the worker brief, ROOT's turn |
| `DESIGN-STAGE.md` | how a lane's decision becomes a canon section, a rule or a requirement |
| `PERMISSIONS.md` | how a refused act is predicted, routed and counted; Bob's standing approval; `permissions.json` and `tools/acts.md` |
| `GRANTS.md` | every grant the work needs, gathered at one sitting before it starts and held to its end (`proc grants check`) |
| `PRODUCT-SUPPLIES.md`, `SETUP-STEPS.md` | what a product supplies; Bob's one setup act per repository |
| `PROCESS-MECHANICS.md` | the index: which text governs what, and what none of them says |
| `tools/proc.mjs`, `tools/hooks.mjs`, `tools/lib.mjs` | the tool (one command per step), the hooks (what must never happen, in code), their shared functions; `tools/mail.mjs` the cross-account channel |
| `checks/` | the checks the gate runs (`checks/README.md`) |
| `.claude/skills/neoprocess/` | the one skill, invoked with the role as its argument |
| `dryrun/` | the toy product; `dryrun/N1/` the certification of this process |
| `lane-neoprocess/` | the lane's working files: the page for Bob (https://claude.ai/artifact/9XUojdyekJgrsMaxrEtdCR), the companion (https://claude.ai/artifact/ELZt9Q2V5xQccoeyXUSMZD), the dry run's record, the commit point's plan, the handoff |
| `HISTORY.md` | revision history and provenance, not read in normal work |
