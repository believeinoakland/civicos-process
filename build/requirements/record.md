# record — requirements

**Status** · Written by the process's architecture session from REQUIREMENTS.md §3 (accepted by Bob, 30 Oct 2026) before the module's first START. Each R cites its REQUIREMENTS.md id.

## Public

### Purpose

The git record every role reads and writes: the durable tranche branch, the transient orphan state branch per epoch, one writer per file, and `status`, which reads the whole state a role needs in one command.

### Provides

**repo(root) → R**
- **R1** Opens a product checkout and answers its git plumbing (read a file at a ref, list, fetch, push, heads), its relative paths and its remote name; every other module reaches git only through it *(not yet met: N2 — the checks (`architecture`, N2-12) and the legacy files reach git through it as their jobs rewire them; record's own `tools/mail.mjs` in this job)*. (REC-1)

**stateRead(R, path, epoch) / stateList / stateWrite(R, files, message) → commit**
- **R2** Reads and writes the epoch's orphan state branch by plumbing, with no checkout and no second worktree; a write is one commit of the files given, pushed; on a lost race it is re-applied on the tip the other writer left (a bounded number of times, then refused), never a force and never a loss of the other writer's files. (REC-1, REC-2)

**epochOpen(R) / epochClose(R)**
- **R3** Opens the next epoch's state branch empty and logs its label on the tranche; closes it only when no ask is open, and deletes it by the route `platform` names (the prune workflow where the proxy refuses). (REC-1)

**commitPush(R, branch, files, message) → commit** · **unpushed(R) → list**
- **R4** Commits the files named on the branch named, refusing when the checkout is not that branch, and pushes; refuses a push to any branch but the role's own as the role record names it; with no role record yet (the architecture session's bootstrap: `epoch open` and `tranche open` run before `takeover` records a role) only `tranche` may be pushed, and a record naming no known role, or a job without its module, is refused. (REC-2; K11)

**paths() → { durable, transient }**
- **R5** Answers the two path tables as data; no path is in both, and a test proves it. (REC-1)

**status(role) → the state**
- **R6** Reads from git everything the role needs in one call, with sizes: the plan's Status line, every job's and lane's line, open asks, owed acts, undelivered messages, the pin, a stop or resume, the role's reading set (a job's from its START; another role's as its caller gives it, since the roles' sets are defined above this layer, SESSIONS §3, and `proc status` passes them); a fresh session of any role starts from it alone. (REC-3, REC-7; K12)
- **R7** Prints the context share of the session from `get_session` output given to it and the word REFRESH past the role's threshold; it reads no platform status as a work state. (SES-3; PLT-11)

**recordAct(R, act, result)**
- **R8** Writes a remote act as done only from the call's result passed in, never from the request: the fields a result must carry to prove the act ran come from `platform.acts()`'s row for that act, never from the caller; there is no function that records a request. (REC-5; K12)

**addr(R, who) → session id**
- **R9** Reads a party's address at the moment of use from the record alone: the process's parties from `main` of the process repository (never the product's own `main`), the product's parties from its tranche or its epoch's state branch; never from a side branch, a mail branch or a message. (REC-6; the state branch is the product's transient record, REC-1)

**stop(R, why, choices) / resume(R, version)**
- **R10** Writes `STOPPED <why> · <version>` with each unmerged job's choice (complete-allowed or abandoned), and `RESUMED <version>`, in the plan's Status line; every role's `status` shows them. (PLN-5; REC-7)

**metricsRow(R, row)**
- **R11** Appends one row keyed by session id to the tranche's metrics file; a session that cannot be read is named unmeasured, never estimated. (SES-10)

## Private

### Uses

- `platform`: `acts`, `limits` (which routes a push or a delete may take; the depth and background limits `status` reports against).

### Invariants

- **R12** Record writes never touch a module's paths or tests: a test proves `paths()` disjoint from every module's paths and tests in `build/modules.json`; the gate's trigger paths exclude every record path (`gate`, N2-23, reads `paths()`), so a record write never costs a job a gate run. (REC-4)
- **R13** A session's reads are a matter of record: `status` prints the reading set with sizes; the report names what was read; the transcript is the evidence. (REC-8)

### Satisfies

- REQUIREMENTS.md §3 (REC-1 to REC-8).
