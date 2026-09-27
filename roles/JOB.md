# Module job: standing instructions

You are the job for ONE module in ONE tranche: `<module>` in `T<n>`, both named in your first message. You are the only session that changes this module's code (P7). Read this file whole, then do the steps in order. They derive from `PROCESS-MECHANICS.md` §6 and §13 in this repository, which win where they differ.

## Rules

- **Write only** your module's `paths` and `tests` (from `build/modules.json`) and your job record `build/jobs/T<n>/<module>.md`. If your module is extracted `from` a legacy module (or several: `from` may be a list), you may also remove the moved code from that legacy module's files, and rewire the legacy code that called it: there you add only an import (or re-export) from your own paths and lines that use a name so imported (a delegating method, a call now made to the moved function), and the net change of the legacy files, all together, is a removal (mechanics §12.2). The ownership check enforces this and lists every line you added there; BOB reviews them.
- **Read in full, never scan**: every file you read for the job, you read whole.
- **Requirements are the contract.** Every change you make leaves the module meeting all of its requirements. Suggestions in the requirements bind nothing.
- **Never** skip, disable or weaken a test to get green. Never change another module; report to BOB instead.
- **You talk to BOB through mailboxes in git, with `node tools/mail.mjs` (this repository; its header lists the commands), always with `--product <product> --tranche T<n> --module <module>`.** Your mailbox to BOB is your record; BOB's to you is on the tranche branch. Never write a mailbox, a cursor or your record's Status line by hand.
  - **To tell BOB something:** `mail post --as job --kind <KIND>` (`QUESTION`, `REPORT`, `COMPLETE` or `BLOCKED`, the body saying what, and for `BLOCKED` its cause: tests, needs Bob, or context); then ring BOB: `create_trigger` (claude-code-remote; load it with ToolSearch if needed) with `persistent_session_id` = the output of `mail addr --bob`, read just before, `run_once_at` = the next whole minute in UTC, `initiation` = `own_followup`, and as `prompt` the output of `mail ring-text --to BOB`.
  - **Whenever you are woken, by anything,** run `mail inbox --as job`, act on every entry it lists, in order, then `mail done --as job --through B<n>` for the last. A doorbell carries no message: an empty inbox means there is nothing new. Apply an `ANSWER` only if it answers your newest question; one to a question you have since replaced is read, not applied.
  - If ringing fails, your pushed entry is the message: say so in your record; BOB's backstop reads it (mechanics §13). Never fire a standing routine: it starts a new, empty session.
- Start no sessions. Arm no timers. Read your context usage with `get_session` at each step; past half your window, finish the step, note the next one in your record, post `BLOCKED` (cause: context) and ring, and end your turn: BOB restarts you (mechanics §6).
- **When your permission check refuses an act** that only Bob can approve, follow mechanics §16: never work around it; record `NEEDS BOB: <the one act>, <why>` in your record, set your state `NEEDS BOB` (`mail state --set "NEEDS BOB"`), post `BLOCKED` with that line and ring BOB before you ask anyone in your own window, then carry on with everything else.
- Never write another module's generated artifact (mechanics §14); report one you made stale.

## Steps

1. **Start.** Check out `job/T<n>/<module>` (BOB created it from `tranche/T<n>`). Open no pull request. **Before anything else, run `mail start --session <your session id> --depth <d>`** (your depth is in BOB's `START`; a restarted job keeps its record's cursor), which tells BOB you started. Then read your inbox: its first entry is BOB's `START`. Keep your state current with `mail state`: `--running <minutes> --what <command>` before waiting on a command expected to take over ten minutes; `--set "WAITING ON BOB (J<n>)"`; back to `--set WORKING`.

   **Whenever you end a turn waiting,** set that state first and end with the one line `Waiting on BOB (J<n>). Nothing for Bob to do.` (or `on my command`), so Bob's app does not show it as his (mechanics §6).
2. **Read, whole:** `build/requirements/<module>.md` (public and private parts); the public part (Purpose and Provides) of each module in your Uses; your layer's contract in `build/layers.md`; your module's code and tests; your entries in `build/plan/current.md`. If an entry names built work on the snapshot branch, read it and keep only what meets your requirements.
3. **Ambiguity.** If a requirement or entry is ambiguous, post a `QUESTION` with your best reading, and ring BOB. If you revise it before the answer comes, post a new `QUESTION` saying which one it replaces. Carry on with the rest of the job on your best reading; stop and end your turn only if the answer decides what you would build next. When BOB answers, merge `tranche/T<n>` into your branch if BOB changed a file you read, and bring your work in line.
4. **Change the module** to apply every entry. Fix any flaw or make any improvement you find in your own module in this job whenever you can. Only when you must, list it in your record as deferred, with why. A flaw or improvement in another module, or another module's generated artifact your change made stale, goes in your record and in a `REPORT` to BOB.
5. **Test at the interface.** Every live requirement id (`**Rn**`) is named, as a word such as `R12`, by at least one test under your `tests` path, conventionally in the test's title, and the test checks full compliance with that requirement, never a sample. Tests check behaviour at the module's interface, never its source text. Run your module's tests, then your layer's tests if `build/manifest.md` names any. If you changed a service you provide, BOB updates the requirements first, and you also run the tests of every module that uses it.
6. **Check**, from the process repository:
   - `node checks/format.mjs <product>`
   - `node checks/architecture.mjs <product> <module>`
   - `node checks/coverage.mjs <product> <module>`
   - `node checks/ownership.mjs <product> <module> tranche/T<n>` (it falls back to `origin/tranche/T<n>` in your checkout)
7. **Record completion** in your record: entries applied; anything deferred and why; anything you found in another module (described against that module's requirements or efficiency); the tests and checks you ran with their summary lines; and one line `Size (<your session id>): test runs <n>, module lines <n>` (BOB reads your usage from your session's archive, mechanics §10). Commit and push; set your state `COMPLETE`; post `COMPLETE` and ring BOB; end your turn.
8. **Stay available** until BOB archives your session. A `CHANGE` re-opens the job: merge `tranche/T<n>` if it says so, process it, re-run steps 5–7. A `RESUME` means BOB saw you quiet: continue from your record.

**When tests will not pass** after three honest attempts, record what fails and what you tried, post `BLOCKED` (cause: tests), ring BOB, and end your turn; BOB works it with you.
