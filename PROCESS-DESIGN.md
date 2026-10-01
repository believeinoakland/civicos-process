# The process principles

**Status** · APPROVED by Bob 2026-09-25, as written by BOB #36 from his direction in BOB's session that day. AMENDED and APPROVED the same day: P10 carries Bob's rule that a layer's jobs run concurrently, and P12 the tranche branch. AMENDED by Bob 2026-09-26: P17, the working relationship, which governs every other principle's "with Bob"; and P18, the pipeline. AMENDED by Bob 2026-10-01: P19, a plan is written from the work that remains (proposed by BOB #85). These principles REPLACE the current process wholly; nothing in the old process survives unless it is derived from them. Their home is this repository, `believeinoakland/civicos-process` (P2), since 2026-09-26; until then they sat on the branch `land/bob/process-design` of `believeinoakland/bio`. The restore point before the replacement is the branch `snapshot/pre-refactor-2026-09-25` (5b9c2643): its tree is `main` @ 95fe7bc7, and its parents are every branch tip of that moment, all kept reachable. Tags could not be pushed from the cloud (HTTP 403).

**P1 · Purpose.** The process exists to put correct, working product behaviour that meets every defined requirement onto `main`. Nothing else is output. A rule, a record or a test has value only as far as it serves that.

**P2 · The process and the product are separate.** Each has its own correctness. The process is defined in its own repository. It keeps the product's **build state** in one subtree of the product repository, and only the process writes there. The build state holds the architecture (layers, modules, their order and dependencies), each module's requirements, the plans, and the record of jobs.

**P3 · The process is correct before it is used.** A meaningful flaw in the process stops all product work until the process is fixed and **certified**: the fix is checked against these principles, then proven on a small dry-run tranche. The process is never patched in reaction while it runs.

**P4 · The architecture is owned by BOB, with Bob.** BOB, working with Bob, defines the layers and the modules. Only BOB, with Bob, adds, removes or reorders the layers and the modules that carry product capability; the rest of the architecture is BOB's (P17). The modules are arranged in one **total order**. Each module belongs to exactly one layer. A layer's modules are adjacent in the order, and every lower layer's modules come before every higher layer's. A module may use the services of modules earlier in the order, and never of a module later in it. That is acyclic by construction. The declared use is checked against the actual imports, and a violation fails the build.

**P5 · Requirements are owned by BOB, with Bob.** BOB, working with Bob, writes each module's requirements:
- the services the module **provides**: each interface and its behaviour;
- the services it **uses**, named by module;
- the invariants it keeps;
- the product requirements and design sections it satisfies, cited by section.

Requirements may suggest an implementation but never require one. The module is free to choose and change its implementation. Because requirements are read whole, never scanned, they are concise and unambiguous. Only BOB, with Bob, changes a module's requirements. BOB communicates a change to a requirement, or to the interface of a provided service, to every module that uses that service.

**P6 · A module fits in one reading.** A module is sized so that one session can read, in full, its code, its requirements, and the requirements of the services it uses.

**P7 · Only module jobs change module code, and every requirement is proven met.** Every change to a module meets all of that module's requirements as they stand at that moment. **Every requirement is tested, and the tests confirm the module is fully compliant with it.** No requirement goes untested, and no test merely samples one. The tests check behaviour at the module's interface, never its source text. When a module, or a user of a module, finds an ambiguity in the definition of a service, BOB updates the requirements to remove it and to state the service as it now is. The module's tests then confirm compliance with the clarified text.

**P8 · The unit of work is the module job.** A module has at most one job at a time. A job applies every plan entry for its module. Flaws and improvements are both reasons to change a module. When the job finds either in its own module (a requirement not met, an inefficiency, a gap or error in its tests, a better way to meet a requirement, or anything else), **it deals with it in the job whenever possible**. It adds an entry to the next tranche only when it must.

**P9 · A flaw or improvement in another module goes through BOB.** A job that believes it has found a flaw in another module, or an improvement to it, reports it to BOB, described in terms of that module's requirements or its efficiency. BOB confirms it, then:
- if that module's job is running, BOB forwards it to that job, which deals with it in the job whenever possible and adds an entry to the next tranche only when it must, depending on its complexity and how far the job has gone;
- if no job is running for that module, BOB adds an entry to the next tranche.

A flaw in the requirements themselves goes to BOB and Bob.

**P10 · Builds happen in tranches, one layer at a time.**
- A tranche's plan is fixed when the tranche starts. An entry that arises during a tranche goes to the **next** plan.
- The tranche runs one layer at a time, lowest first. **All the module jobs of a layer run concurrently.**
- All the jobs of the current layer stay active until every one of them has recorded that it is complete.
- If a job communicates a change to another job of the same layer, through BOB (P5), that other job processes the change and signals completion again, even if it had already said it was complete.
- Only when every job of the layer is complete are those jobs archived and the jobs of the next higher layer started, concurrently.
- The one exception to freezing is a change to a provided service. BOB carries it to the modules that use the service, and those are in the same or a later layer, so their jobs in this tranche pick it up.
- When every layer is complete, the tranche's plan is archived and the next plan becomes current.

**P11 · Tests follow the architecture.** Each module has its own tests, and each layer may have layer tests. A job runs its module's tests and its layer's tests. When it changes what its module provides, it also runs the tests of every module that uses the change. **Because every job in a layer may run that layer's tests, testing lives in module tests wherever possible, and the effort needed to run layer tests is kept as small as possible.** The full regression runs only at release, or when Bob asks.

**P12 · Done means merged.** A tranche works on its own branch off `main`, and `main` does not change while a tranche runs. A job is done when its tests pass and its work is merged into the tranche's branch. A tranche is done when every job is merged and the tranche's branch is merged to `main`.

**P13 · Sessions are short and single-purpose.** A session does one job, or one planning step, and ends. State lives in the build state, never in a long-running context. A session's cost grows with its context size multiplied by its number of turns: re-reading its own context is most of what it spends. A long-lived session woken again and again is the most expensive thing the process can run.

**P14 · Usage is measured first, then bounded.**
- **The authoritative measure** is Bob's plan meter: the share of the weekly limit used, as Bob reads it.
- **The process measures TOKENS PROCESSED per session** (cache reads plus cache writes plus input plus output), tagged by tranche and job, and recorded by each session before it ends. It never uses dollar estimates, which understate and are unreliable across container restarts.
- **The first tranches COLLECT METRICS; they are not bounded by them.** Token counts per job are recorded alongside job size (the module's lines, its entries, its test runs, its session turns) and against the movement of Bob's weekly meter, to build an empirical model of what a job costs.
- **Real budget bounds are set only once that model exists**, and Bob approves them. Until then Bob sees each tranche's measured usage when it ends.

**P15 · A ruling is made once, and recorded unambiguously yet concisely.** A decision is recorded once, in its home document, stated unambiguously and as concisely as possible, so that every later session that reads it spends as little context as possible. It is not reopened without new evidence named in writing.

**P16 · Rules derive from principles.** Every process rule names the principle it serves. A rule is never added in reaction to an incident unless it can be derived from a principle. These principles change only with Bob's approval.

**P17 · Bob decides the high level; BOB decides the rest.** (Bob, 2026-09-26: this working relationship is remembered and followed at all times, in all situations.) Bob decides only high-level questions of **policy and doctrine, requirements, architecture and UX**. Every lower-level technical or detailed decision is BOB's, made without asking him: dependency edges, order within a layer, file ownership, helper and legacy modules, tooling, tests, branches, CI, the wording of a requirement, and every other matter of implementation or process detail. BOB decides it, records it once (P15), and reports it to Bob in plain words as done. A "with Bob" in any other principle or rule means only what is high-level by this principle. **Bob does not edit files and does not enter commands.** BOB does the work. When an act only Bob can take is needed (an action on his own account), BOB names that one act and walks him through it in plain steps. When BOB is unsure whether a question is Bob's, it decides by this principle and says which way it read it.

**P18 · The process is a pipeline.** (Bob, 2026-09-26.) While a tranche runs, BOB prepares the stages after it, so the next tranche can open the moment this one closes and no stage waits on work that could have been done earlier: the next tranche's plan; the requirements of the modules the next tranches will build, drafted, reviewed and brought to Bob where they are his (P17); the map of what each coming extraction moves out of a legacy module; and anything else a later stage will need. Preparation never changes `main` while a tranche runs, never changes a module a running job owns, and never changes requirements a running job is reading; it is written on the tranche branch, and changes the running tranche only through P9 and P10.

**P19 · Urgency.** (APPROVED by Bob 2026-09-30: "Yes, urgency! Add it, and live it."; his words: "development productivity is one of the highest priorities"; "don't stop", "pipeline", "go, go, go!"; "The layer level waits are proper. Complete code coverage is proper. All the safeguards in the process are proper.") BOB never decides, silently or otherwise, that the work may take longer than it must. Every tranche carries every entry that can safely be done in it; an entry is deferred only for a named hard reason (the order, P4; a module's size before its split, P6; a dependency not yet built; one job per module, P8; a question that is Bob's, P17; a deployment or measurement), never for the tranche's size or a job's smallness. **A plan is written from the work that remains, not from the work that is queued** (APPROVED by Bob 2026-10-01): it carries every entry that can safely be done in the tranche, and names the hard reason for each one it leaves out. The aim of every tranche is that the next one is needed only for work with a hard reason. The next tranche is prepared while this one runs and opens the moment it closes (P18); BOB never idles while work remains. Each tranche's report to Bob states its elapsed time, the work it finished (legacy lines removed, entries applied) and the work left. Speed comes from full scope and no idle time, never from weakening a safeguard: the layer order, complete test coverage and the checks stand.
