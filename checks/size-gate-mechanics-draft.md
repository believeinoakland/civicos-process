# Draft: mechanics text for the size gate (bio K5015)

For Bob's approval before it binds (K1258). `PROCESS-MECHANICS.md` is not edited. Each item gives the section, whether the text is new or changed, and the principle it serves.

**The gate in one paragraph.** `tools/mail.mjs` measures the documents a session reads whole before it acts, and refuses until they are pruned. Limits: `build/rulings-active.md` 80 lines and 25,600 bytes; `build/handoff.md` 25,600 bytes; every text file (.md, .txt, .tsv, .csv, .json, .html) under `build/plan/` outside `archive/` 51,200 bytes. Images and other binaries are never measured. A document may be exempted only by a line `<path> · <reason>` in `build/plan/size-exempt.txt`. There is no bypass.

## 5.1 Take over (P20, P13)

New step 0, before step 1:

> 0. `mail bob` measures the documents you must read whole (§17) and refuses, naming each document, its size and its limit, until they are pruned. If it refuses, prune them now (§17), then take over. `done`, `state`, `addr` and `ring-text` are never refused.

Step 2 gains: "`mail check` also lists each document over its limit as `SIZE <path> <bytes> > <limit>`."

## 5.4 Watch a layer (P20, P13)

Added to the `mail check` list of what BOB acts on:

> - **`SIZE <path> …`** (a document over its limit): prune it now (§17). A job that posted `BLOCKED` with cause `reading` is waiting on exactly this.

## 6 The module job (P20, P13)

Step 1 gains, after "The job's first act is `mail start`":

> `mail start` is never refused. If `post` or `inbox` refuses because a document is over its limit, the job does not prune it: it sets its state, posts `BLOCKED` with cause `reading` (naming the documents), and ends its turn. `BLOCKED`, `done` and `state` are never refused. BOB prunes the documents, then resumes the job (§5.4).

## 8.4 Format (P19)

Added after the sentence on `next.md` entries:

> A line that defers work fails, naming its file and line, unless it cites `next.md`: in `build/plan/current.md`, in the running fix round's plan file that `current.md` names, and in `build/handoff.md`, the words "next fix round", "next round", "a later round", "later tranche" and "deferred to". Work that waits is an entry of `next.md` only, with its P19 reason; plan text names dependencies, never "later".

## 13 The tool (P20, P13)

In "The tool", after the command list:

> Before any command except `start`, `done`, `state`, `addr`, `ring-text`, `xdone` and a job's `post --kind BLOCKED`, the tool measures the reading set's documents (§17) and refuses, exiting non-zero and writing nothing, naming each document over its limit. A job is told "BOB prunes them; post BLOCKED with cause reading"; BOB is told "prune them now (mechanics §17)". `check` is not refused: it lists each such document as a `SIZE` line.

## 17 Reading sets (P20, P13)

"Limits" replaces its first sentence:

> **Limits.** The limits of the documents every session reads whole are fixed here and enforced by `tools/mail.mjs` (§13) at every command: `build/rulings-active.md` at most 80 lines and 25,600 bytes; `build/handoff.md` at most 25,600 bytes; every text file under `build/plan/` outside `build/plan/archive/` at most 51,200 bytes. A fix round's plan is one file, moved whole to `build/plan/archive/` when the round ends. The session that makes a document grow past its limit prunes it in the same act: removing history and what is stated elsewhere, keeping every binding word, or moving finished material whole to the archive. BOB sets the limit of any other kind of set as a ruling and measures it (a job's at its `START`, §5.3).

First line of "When a set is over its limit": "BOB fixes it before the session starts, in this order" is unchanged; the gate is the backstop that stops a session that starts anyway.
