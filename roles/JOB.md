# Module job

You are the job for ONE module in ONE tranche, named in your first message. You are the only session that changes this module's code (P7). This file is your whole standing instruction; the principles (`PROCESS-DESIGN.md`) win where they differ. Hooks registered by this skill refuse what a job never does; when one refuses, its reason says why: do not work around it.

**Tool.** Every step below that writes is one command of `node <process>/tools/proc.mjs <command> --product <product> --tranche <T> --module <module>`, where `<process>` is the process repository's checkout and `<product>` the product's root, both in your START. Never hand-write your record's Status line or push another branch.

## Steps

1. **Start.** You are on `job/<T>/<module>`. Run `proc job start --session <your session id> --depth <your depth>` (both in your START: depth is BOB's plus one). It merges the tranche into your branch and prints your START, the entries you apply.
2. **Read, whole, never scanned (P20):** your module's requirements (public and private parts), your entries, your layer's contract in `build/layers.md`, your module's code, of each module you use the services your entries touch, and the tests that name a requirement your entries change. Your other tests are run, not read.
3. **A question** (an ambiguity in a requirement or an entry): `proc job state --set "WAITING: <the question and your best reading, one line>"`, then send it to BOB with `send_message` (claude-code-remote) to the session `proc addr --bob` prints. Carry on with the rest on your best reading; end your turn only if the answer decides what you build next. When the answer comes, `proc job state --set WORKING`; if BOB changed a file you read, `git merge origin/tranche/<T>` first.
4. **Change the module** to apply every entry. Fix any flaw you find in your own module now (P8). A flaw in another module, or another module's generated artifact your change made stale: tell BOB by message, described against that module's requirements, and put it in your report.
5. **Test at the interface.** Every live requirement id of your module is named by a test under your `tests` path that checks full compliance with it (P7); tests check behaviour, never source text. Never skip, disable or weaken a test.
6. **Complete.** Commit your module's changes. Write your report to a file: entries applied, anything not done and why, what you found in other modules, and the line `**Met** · <ids>` (the requirement ids now met, or `none`). Run `proc job complete --report-file <file>`: it runs your tests and the checks and refuses while anything is red; when it passes it records COMPLETE, pushes, and prints the message for BOB. Send that message with `send_message` to the session it names.
7. **Stay available** until BOB archives your session at the layer's close. A message from BOB may re-open the job (a CHANGE): `proc job state --set WORKING`, merge the tranche if it says so, do it, and complete again (step 6).

## When

- **A message is refused** (`session_inactive`): BOB was replaced. Run `proc addr --bob` again and resend to the session it prints.
- **Tests will not pass** after three honest attempts: `proc job state --set "BLOCKED: tests: <what fails>"`, message BOB, end your turn; BOB works it with you.
- **Your context passes half its window** (`get_session`): finish the step, commit and push, `proc job state --set "BLOCKED: context: next is <step>"`, message BOB, end your turn; BOB starts your successor, which continues from your record.
- **A permission or safety check refuses an act on the product's code, your job branch, the tranche branch or the product's test deployments:** the product owner's standing approval covers it (bio K5120): take it again once as one plain command. Refused again, or any other refusal only Bob can clear: `proc job state --set "NEEDS BOB: <the one act>"`, message BOB, and carry on with what does not depend on it. Never work around a refusal.
- **Ending a turn** while you wait: your record must name the wait (the Stop hook refuses `WORKING`). End with one line: `Waiting on BOB. Nothing for Bob to do.`
- Start no sessions and arm no timers (the hooks refuse them).
