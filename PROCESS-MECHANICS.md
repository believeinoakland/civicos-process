# The process mechanics

**Status** · APPROVED by Bob 2026-09-25 (second draft, written by BOB #36). This document describes HOW the approved principles (`PROCESS-DESIGN.md`, P1–P16) are carried out. Each mechanism cites the principle it serves (P16). Where it and the principles disagree, the principles win. Its home is this repository, beside the principles (P2), since 2026-09-26. The product repository it is applied to is `believeinoakland/bio`.

## 1. Where things live (P2, P5)

**The process repository** holds the principles, these mechanics, the role instructions (§2), and the four checks (§8). It is product-independent.

**The product's requirements canon** lives at `requirements/` in the product repository: the mission, the product requirements, and the construct designs. It is the one place every module's requirements cite, by section. For BIO, it is assembled from today's `docs/architecture/`.

**The build state** is `build/` in the product repository. Only process roles write there, and a module job writes only its own job record.

| path | holds | written by |
| --- | --- | --- |
| `build/manifest.md` | where the requirements canon, the build state, and each layer's tests live | BOB with Bob |
| `build/layers.md` | the layers, in order, each with its contract | BOB with Bob |
| `build/modules.json` | the modules in their **total order**; per module: `id`, `layer`, `paths` (the files it owns), `tests`, `uses` (earlier module ids) | BOB with Bob |
| `build/requirements/<module>.md` | the module's requirements, public and private parts (§3) | BOB (§7 says when with Bob) |
| `build/plan/current.md`, `next.md`, `archive/T<n>.md` | the running tranche's plan, the next one, and the finished ones | BOB |
| `build/jobs/T<n>/<module>.md` | one record per module job | the job |
| `build/rulings.md` | every ruling, one line each (§9) | BOB |
| `build/metrics/T<n>.csv` | tokens processed per session (§10) | each session, at its end |

A file is owned by exactly one module; `paths` never overlap.

## 2. Roles and sessions (P4, P5, P9, P13)

- **Bob** decides the high level only (P17): policy and doctrine, requirements and changes to what they mean, the architecture's layers and product modules, and UX. He does not edit files or enter commands. Which work goes into a tranche, and when a tranche opens, is BOB's (P17).
- **BOB** works with Bob on the architecture and the requirements. It opens and closes tranches and layers, spawns module jobs, routes flaws, improvements and changes, and resolves conflicts, ambiguities and other complications **itself wherever it reasonably can** (§7).
- **A module job** changes one module, the only role that changes product code (P7).

**Session depth stays minimal.** Bob starts BOB. BOB spawns the module jobs. Module jobs spawn no sessions. BOB's successor is created as a fresh top-level session by a routine, never as BOB's child.

**BOB's lifetime.** BOB keeps working while its context is useful. It refreshes when its context passes about **2–3 times its working set**, the requirements and state it actually needs. The reason is cost: every turn re-reads the whole context, so a large, stale context costs more per turn than a fresh session pays to re-read its working set (measured in BOB #36, 2026-09-25). The threshold is confirmed or corrected by the metrics (§10). A refreshing BOB writes a lean handoff into the build state first.

## 3. Requirements format (P5, P6, P7, P15)

Each `build/requirements/<module>.md` has a **public** part and a **private** part.

**Public**, which is all a user of the module reads:
1. **Purpose.** One or two sentences.
2. **Provides.** Each service: its interface (name, inputs, outputs, errors) and its behaviour, each statement with a permanent requirement id (`R1`, `R2`, …; a retired id is marked retired, never reused).

**Private**, read only by the module's own job:
3. **Uses.** Each service used, named `<module>.<service>`, from earlier modules only.
4. **Invariants.** Each with its own `R` id.
5. **Satisfies.** The canon sections it serves.
6. **Suggestions.** Implementation notes, which bind nothing.

A job for a module being written, or gaining capabilities, reads the **Purpose** of every earlier module and the **Provides** of those it will use. A job changing an existing module reads the **public** part of each module it uses.

## 4. Branches (P10, P12)

- Opening a tranche creates `tranche/T<n>` from `main`. **`main` does not change while a tranche runs.**
- When a layer starts, each of its jobs branches from the tranche branch: `job/T<n>/<module>`.
- When every job of the layer is complete, BOB merges their branches into the tranche branch. The modules own disjoint files, so these merges do not conflict.
- The next layer's jobs branch from the updated tranche branch.
- When the last layer completes, the tranche branch is merged to `main` as a fast-forward.

A failed tranche is abandoned without touching `main`.

## 5. The tranche cycle (P10, P14)

**Open (BOB).** BOB sets `next.md` as tranche `T<n>`: entries grouped by module, modules by layer, and tells Bob in one line that it has opened and what it covers. BOB asks Bob for his weekly meter reading, the one measure only he can take (P14); the tranche does not wait for it. `next.md` becomes `current.md`, and a new `next.md` is created.

**Each layer.** BOB spawns, **concurrently**, one job for each module of the layer that has entries. Every job stays active until every job of the layer has recorded completion. A change one job communicates to another, through BOB, **re-opens** that other job even if it had completed: it processes the change and records completion again. When all are complete, BOB merges their branches (§4), archives the jobs' sessions, and starts the next layer.

**Close (BOB).** The tranche branch merges to `main`. `current.md` moves to `archive/T<n>.md`, with each entry's outcome and the tranche's measured usage. BOB asks Bob for his weekly meter reading again, and reports the tranche to him in plain words: what was fixed, what was deferred and why, and what it cost.

## 6. The module job (P6, P7, P8, P11)

1. **Start** on `job/T<n>/<module>`.
2. **Read in full**, never scanned: its own requirements (both parts); the public part of each module it uses (§3); its layer's contract; its code and tests; its entries.
3. **Ambiguity.** Ask BOB, and continue against the clarified text.
4. **Change the module** to apply every entry. Deal with every flaw or improvement found in the module in the job whenever possible. Defer one to `next.md` through BOB only when it must.
5. **Test.** Every requirement id is named by at least one test, and the coverage check passes. Run the module's tests, then its layer's tests. If it changed a provided service, BOB first updates the requirements (§7), and the job also runs the tests of the modules that use it.
6. **Check:** architecture, coverage and ownership (§8).
7. **Record completion** in `build/jobs/T<n>/<module>.md`: the entries applied; anything deferred, and why; what it reported about other modules; the tests run; its token counts. Tell BOB. **Stay active** until BOB closes the layer, processing any change BOB forwards and recording completion again.

**When tests will not pass** after three honest attempts, the job keeps its session and works the problem with BOB. BOB can clarify a requirement, route a cause found in another module, or re-scope the entry. Only if the two cannot resolve it is that entry deferred, and the job completes the rest.

A job writes only its module's `paths` and `tests`, plus its own job record.

## 7. What BOB resolves, and what goes to Bob (P4, P5, P9)

**BOB resolves itself**, recording a ruling where it decides anything:
- conflicts between jobs;
- routing flaws and improvements (forward to a running job of that module, or add to `next.md`);
- ambiguities it can settle by clarifying the **wording** of a requirement without changing its meaning;
- sequencing within the process's rules;
- every lower-level technical or detailed decision (P17): dependency (`uses`) edges, order within a layer, which module owns a file, helper and legacy modules, the process's tooling and checks, tests, branches and CI.

**BOB brings to Bob** only:
- a change to what a requirement **means**, including a change to a provided service;
- the architecture at its high level (adding, removing or reordering layers, or adding or removing a module that carries product capability);
- doctrine and priority;
- anything the principles reserve to him.

Each question comes with a recommendation. When Bob rules a service change, BOB updates the provider's requirements and adds an entry for every module that uses it, in this tranche if that module's layer has not yet completed, otherwise in `next.md`.

## 8. The four checks (P4, P7, P16)

Small tools in the process repository, and the only process tooling:
1. **Architecture:** every product file is in exactly one module's `paths`, and every import is to the module itself or to a module earlier in the order that is declared in `uses`.
2. **Coverage:** every live requirement id is named by at least one of the module's tests.
3. **Ownership:** a job's diff touches only its module's `paths` and `tests` and its job record.
4. **Format:** the build state's files parse, and every id they reference exists.

A new check is added only by BOB with Bob, and cites the principle it serves.

## 9. Rulings (P15)

One line per ruling in `build/rulings.md`:

`K<n> · <date> · <module or layer> · <the ruling> · <why>`

A ruling that changes requirements is folded into them in the same act. A ruling is changed only by a new line that names its evidence and the one it replaces.

## 10. Metrics (P14)

At its end, every session appends one row to `build/metrics/T<n>.csv`:

`session · role · module · cache-read · cache-write · input · output tokens · turns · test runs · module lines`

Bob's weekly meter is noted at each tranche's open and close. **No bounds yet.** After a few tranches, BOB reports the model: tokens per job against module size, entries and test runs; tokens against the movement of the weekly meter; and BOB's own cost against its context size, which tests §2's refresh threshold. Bob then sets bounds.

## 11. Release (P11)

A release runs the full regression, then follows the distribution process (a separate document). A full regression also runs whenever Bob asks.

## 12. Starting BIO on this process

1. **Canon and build state.** BOB, with Bob, assembles `requirements/` from the design corpus, then drafts `manifest.md`, `layers.md`, `modules.json` and the target modules' requirements.
2. **The monoliths.** `store.mjs`, `index.mjs` and `app.html` are each registered as a temporary **legacy module**. An entry to extract a target module from a legacy module is applied by that target module's job, which is the one exception to ownership: it may remove the moved code from the legacy file. Extraction runs bottom-up, a layer at a time. A legacy module is retired when it is empty.
3. **Tests.** Each extracted module's job writes its requirement-named tests at its interface. Source-anchored tests are retired with the legacy code they anchor on.
4. **The old plan.** BOB rewrites each of the 225 open rows that affects the product as an entry against a target module, and drops the rest.
5. **Batch30 is NOT landed** (Bob, 2026-09-25: no tokens for it). It stays reachable in `snapshot/pre-refactor-2026-09-25`, with all the old process's unmerged work. **Its value is judged by the requirements, not in advance:** a target module's extraction job reads the legacy and snapshot code for its module, keeps what meets its requirements, and discards the rest. The old process's own tooling is not carried forward.
