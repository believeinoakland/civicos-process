# platform — requirements

**Status** · Written by the process's architecture session from REQUIREMENTS.md §2 (accepted by Bob, 30 Oct 2026) before the module's first START. Each R cites its REQUIREMENTS.md id; that document is the canon.

## Public

### Purpose

What the hosting platform (Claude Code cloud sessions, GitHub through the agent proxy, GitHub's runner) does and refuses, measured and dated; the acts the process may depend on; the credentials and grants a build needs.

### Provides

**constraints() → rows**
- **R1** Answers the one table of platform constraints: each row a measured fact with its date, how many times it was measured, its evidence and the workaround the process uses; the table is data in the module (`tools/platform.md` is its rendering). (PLT-1)
- **R2** Every row carries the date it was last confirmed; `constraints({ olderThan })` lists the rows not confirmed since, so a stale row is seen at each layer run: the layer close (`integration`, N2-28) calls it and prints the rows. (PLT-12)

**acts() → rows**
- **R3** Answers the acts the process depends on, each with its measured pass count and the role that takes it: `create_session` by a parent at depth 0 or 1, `send_message`, `get_session`, `list_events`, `send_later` to oneself, pull request creation, update, comment and merge by a printed call, `actions_run_trigger` of a workflow on `main`, a push to the session's own branch. (PLT-3)
- **R4** Refuses to list an act the auto-mode classifier decides case by case: `archive_session`, `update_trigger`, `delete_trigger`, `interrupt_session`, an edit of a settings file; its constraint row marks each as classifier-judged. (PLT-2)
- **R5** No row names a hook as the thing that enforces anything. (PLT-4)

**versionCheck(pin) → "PROCESS OK" | "PROCESS STALE <head>"**
- **R6** Compares the process checkout's head with the pinned commit and answers in one line; it is run once at a session's start and by no other command. (MNT-3; PLT-8)

**grantsCheck() → { ok, rows }**
- **R7** Proves the standing list present, the push to the role's branch, the GitHub API answering as the expected identity, and each service, address and variable the product's `build/grants.json` names; records the result with its time; `tranche open` reads it and refuses when it is missing, failed or older than a day. (PLT-10)

**dispatch(kind, args) → the workflow call**
- **R8** Prints the `actions_run_trigger` call for the runner workflows that take what a session cannot (repository setup, rename, transfer, a product's shims), each with the secret named by the owner of the target repository; the dispatch is a call the hook-free session makes by hand. (PLT-9)
- **R9** No function here, and none it serves, takes the process repository as a write target for a product role, the role read from the record when the caller names none; a product's route to the process (public read, a read grant, or reports carried by its owner) is a value this module reads (`processRoute`) and onboarding (`shims`, N2-43) records. (PLT-13, PLT-14)

**limits() → { backgroundMinutes, depth, deleteRoute }**
- **R10** Answers the platform's measured limits other modules design around: the in-session background limit (30 minutes), the session depth limit (8) with the depth the process allows (2), and the route a remote ref deletion takes as data, never as prose: `deleteRoute = { direct: 'refused', workflow: WORKFLOWS.prune, act: 'actions_run_trigger', ref: 'main' }`, with `WORKFLOWS.prune` naming the prune workflow (K6; record R3 reads it). (PLT-5, PLT-6, PLT-9)

## Private

### Uses

None.

### Invariants

- **R11** The module holds no credential value and prints none; a credential is named, never shown. (PLT-10; PERMISSIONS §10.4)
- **R12** Every platform behaviour another module relies on is a row of R1 or R3; a test enumerates the platform calls every module prints against the rows.

### Satisfies

- REQUIREMENTS.md §2 (PLT-1 to PLT-14).
