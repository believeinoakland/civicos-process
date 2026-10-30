# record — requirements

**Status** · Written by the process's architecture session from REQUIREMENTS.md §3 (accepted by Bob, 30 Oct 2026) before the module's first START. Each R cites its REQUIREMENTS.md id.

## Public

### Purpose

The git record every role reads and writes: the durable tranche branch, the transient orphan state branch per epoch, one writer per file, and `status`, which reads the whole state a role needs in one command.

### Provides

**repo(root) → R**
- **R1** Opens a product checkout and answers its git plumbing (read a file at a ref, list, fetch, push, heads), its relative paths and its remote name; every other module reaches git only through it. (REC-1)

**stateRead(R, path, epoch) / stateList / stateWrite(R, files, message) → commit**
- **R2** Reads and writes the epoch's orphan state branch by plumbing, with no checkout and no second worktree; a write is one commit of the files given, pushed, and retried once with a fetch and a merge on a lost race, never a force. (REC-1, REC-2)

**epochOpen(R) / epochClose(R)**
- **R3** Opens the next epoch's state branch empty and logs its label on the tranche; closes it only when no ask is open, and deletes it by the route `platform` names (the prune workflow where the proxy refuses). (REC-1)

**commitPush(R, branch, files, message) → commit** · **unpushed(R) → list**
- **R4** Commits the files named on the branch named and pushes; refuses a push to any branch but the role's own as the role record names it. (REC-2)

**paths() → { durable, transient }**
- **R5** Answers the two path tables as data; no path is in both, and a test proves it. (REC-1)

**status(role) → the state**
- **R6** Reads from git everything the role needs in one call, with sizes: the plan's Status line, every job's and lane's line, open asks, owed acts, undelivered messages, the pin, a stop or resume, the role's reading set; a fresh session of any role starts from it alone. (REC-3, REC-7)
- **R7** Prints the context share of the session from `get_session` output given to it and the word REFRESH past the role's threshold; it reads no platform status as a work state. (SES-3; PLT-11)

**recordAct(R, act, result)**
- **R8** Writes a remote act as done only from the call's result passed in, never from the request; there is no function that records a request. (REC-5)

**addr(R, who) → session id**
- **R9** Reads a party's address from `main` of the process repository or from the product's tranche at the moment of use, never from a side branch or a message. (REC-6)

**stop(R, why, choices) / resume(R, version)**
- **R10** Writes `STOPPED <why> · <version>` with each unmerged job's choice (complete-allowed or abandoned), and `RESUMED <version>`, in the plan's Status line; every role's `status` shows them. (PLN-5; REC-7)

**metricsRow(R, row)**
- **R11** Appends one row keyed by session id to the tranche's metrics file; a session that cannot be read is named unmeasured, never estimated. (SES-10)

## Private

### Uses

- `platform`: `acts`, `limits` (which routes a push or a delete may take; the depth and background limits `status` reports against).

### Invariants

- **R12** Record writes never touch a module's paths or tests, and the gate's trigger paths exclude every record path, so a record write never costs a job a gate run. (REC-4)
- **R13** A session's reads are a matter of record: `status` prints the reading set with sizes; the report names what was read; the transcript is the evidence. (REC-8)

### Satisfies

- REQUIREMENTS.md §3 (REC-1 to REC-8).
