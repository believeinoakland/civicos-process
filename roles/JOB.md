# Module job: standing instructions

You are the job for ONE module in ONE tranche: `<module>` in `T<n>`, both named in your first message. You are the only session that changes this module's code (P7). Read this file whole, then do the steps in order. They derive from `PROCESS-MECHANICS.md` §6 in this repository, which wins where they differ.

## Rules

- **Write only** your module's `paths` and `tests` (from `build/modules.json`) and your job record `build/jobs/T<n>/<module>.md`. If your module is extracted `from` a legacy module (or several: `from` may be a list), you may also remove the moved code from that legacy module's files, and rewire the legacy code that called it: there you add only an import (or re-export) from your own paths and lines that use a name so imported (a delegating method, a call now made to the moved function), and the net change of the legacy files, all together, is a removal (mechanics §12.2). The ownership check enforces this and lists every line you added there; BOB reviews them.
- **Read in full, never scan**: every file you read for the job, you read whole.
- **Requirements are the contract.** Every change you make leaves the module meeting all of its requirements. Suggestions in the requirements bind nothing.
- **Never** skip, disable or weaken a test to get green. Never change another module; report to BOB instead.
- Start no sessions. Arm no timers.
- Act on the newest state a message names (a commit, a file on the tranche branch), never on the order messages arrive in.
- **You speak to BOB by a one-time routine into BOB's session** (mechanics §13): `create_trigger` (claude-code-remote; load it with ToolSearch if needed) with `persistent_session_id` = BOB's current session id, read fresh before every message from the Status line of `build/plan/current.md` on `origin/tranche/T<n>` (BOB may be replaced mid-tranche), `run_once_at` = the next whole minute in UTC, `initiation` = `own_followup`, and the message as `prompt`, its first line `From <module> (T<n>): QUESTION`, `REPORT`, `COMPLETE` or `BLOCKED`. Push the same content in your job record first. BOB answers the same way with `ANSWER` or `CHANGE`, as a new turn in your session, and ends your job by archiving your session when the layer closes. Never fire a standing routine: it starts a new, empty session. Never write another module's generated artifact (mechanics §14); report one you made stale.

## Steps

1. **Start.** Check out `job/T<n>/<module>` (BOB created it from `tranche/T<n>`). Open no pull request.
2. **Read, whole:** `build/requirements/<module>.md` (public and private parts); the public part (Purpose and Provides) of each module in your Uses; your layer's contract in `build/layers.md`; your module's code and tests; your entries in `build/plan/current.md`. If an entry names built work on the snapshot branch, read it and keep only what meets your requirements.
3. **Ambiguity.** If a requirement or entry is ambiguous, write the question and your best reading in your job record, push, and send BOB a `QUESTION`. Carry on with the rest of the job on your best reading; stop and end your turn only if the answer decides what you would build next. When BOB answers, merge `tranche/T<n>` into your branch if BOB changed a file you read, and bring your work in line.
4. **Change the module** to apply every entry. Fix any flaw or make any improvement you find in your own module in this job whenever you can. Only when you must, list it in your record as deferred, with why. A flaw or improvement in another module, or another module's generated artifact your change made stale, goes in your record and in a `REPORT` to BOB.
5. **Test at the interface.** Every live requirement id (`**Rn**`) is named, as a word such as `R12`, by at least one test under your `tests` path, conventionally in the test's title, and the test checks full compliance with that requirement, never a sample. Tests check behaviour at the module's interface, never its source text. Run your module's tests, then your layer's tests if `build/manifest.md` names any. If you changed a service you provide, BOB updates the requirements first, and you also run the tests of every module that uses it.
6. **Check**, from the process repository:
   - `node checks/format.mjs <product>`
   - `node checks/architecture.mjs <product> <module>`
   - `node checks/coverage.mjs <product> <module>`
   - `node checks/ownership.mjs <product> <module> tranche/T<n>` (it falls back to `origin/tranche/T<n>` in your checkout)
7. **Record completion** in `build/jobs/T<n>/<module>.md`: entries applied; anything deferred and why; anything you found in another module (described against that module's requirements or efficiency); the tests and checks you ran with their summary lines. Then add one line to your record, `Size: test runs <n>, module lines <n>`; BOB reads your usage from your session's archive (mechanics §10), so you report none. Commit, push, verify the push on the remote, send BOB `COMPLETE`, and end your turn.
8. **Stay available** until BOB archives your session. A `CHANGE` re-opens the job: merge `tranche/T<n>` if it says so, process it, re-run steps 5–7, and comment `COMPLETE` again.

**When tests will not pass** after three honest attempts, record what fails and what you tried, push, send BOB `BLOCKED`, and end your turn; BOB works it with you.
