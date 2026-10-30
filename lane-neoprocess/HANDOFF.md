# neoProcess lane: handoff

**From** · neoProcess #19 (`session_01RAN5em7RsGC7uKF82zYZ9n`), the lane's address, 30 Oct. Before it #18 `session_01RAN5ejYrHJ4TG6jzj4pwWr`, #17 `session_01RAN5ejekyLkeVyhZwxrg7C`, #16 `session_01RAN5emLPV3t3uAq6znKJ2N`. Branch `claude/modest-brahmagupta-vvaann` of `neobobkrause/neoprocess`. Its work reaches `main` by its own pull requests; the branch continues from `main`.

**Moved to Bob's second Claude account** (Bob, 30 Oct: *"the second account can be used for both civicsmith and neoprocess development"*). GitHub identity `civicsmith`, a collaborator (push, triage); every lane act passes (acts.md).

**Standing** · Bob, 29 Oct: keep working until there is no way to; nothing stops for him; a detail is never his (DES 1); plain words; PERMISSIONS §6, §9 (no API key, ever), §10; the process names no product. Commit messages in plain words (the classifier reads them). The lane starts its successor by `proc process handoff`; Bob only when the chain breaks, from the START file.

## Read whole at start

What the start prints; `PERMISSIONS.md` §9–§10, `GRANTS.md`, `SETUP-STEPS.md`, `tools/acts.md`; then only what the step in hand changes, whole: a tool section (`tools/proc.mjs` has a usage header), its test, a design file.

## Where it stands (30 Oct, 16:1xZ)

- Certified: DRYRUN §6-27 (§15-27 NOT YET wholly on the product); suite 285. Done today: issues 98, 102, 104, 107, 113, 115 closed; 111 fixed, its live row open (below).
- **Bob asked (30 Oct, 16:3xZ)** why the process is so fragile, why the suite did not anticipate today's flaws, and what makes it ready for Civicsmith; #19 answered in its turn's last message with the counts (30 issues today, 26 closed; 42 rows proven in fixture, 28 live, 17 not yet) and asked him for the readiness bar (his policy); his answer, when it comes, is a ruling.
- **Issues are the channel** (GOV 5): `proc process status` lists them; ack each NEW one, close it naming the fix on `main`; keep a backstop due.
- **Hooks come from `.claude/settings.json`** (issue 111; `proc shims --product .` writes the lane's): a woken session had lost the skills' hooks. **Say before you send** (issue 102): write each turn's last message to a scratch file, `proc say --file <it>` until OK, send exactly that text.
- **Attach no second repository** (PERMISSIONS §10.7). Shims are regenerated on the runner (`repo-shims.yml`), onto the product's `tranche` too (done 16:03Z with the hooks).
- **Scheduled tasks**: never delete one whose run matters (deleting deletes the sessions it started); switch it off (`update_trigger enabled false`).

## What remains, in order

1. **Issue 111, live after a resume**: at your first wake by the backstop (a new `worker_epoch` in `get_session`), run a partial read of a set document (`sed -n 1,2p PROCESS-DESIGN.md`): refused means the hooks loaded from the settings; then close 111 (fix b753b5b). Civicsmith's ROOT (`session_01RAN5ekA4bbApNfHrniX8tx`) was told through BOB #341; whether it re-invoked the skill is unknown.
2. **#18's backstop is still on** (fires 16:38Z into #18, idle): switching it off and archiving #18 were both refused by the classifier (`[External System Writes]`, #19, 16:15Z; acts.md). What #18 does at that wake is read from its transcript, never assumed.
3. **Issue 96 (Bob's act pending)**: his task "neoProcess lane successor" on claude.ai/code/routines (steps sent 13:44Z). When `list_triggers` shows it: `proc process handoff` prints its `fire_trigger`, the hook passes it, the first session's depth is read; then close 96 and drop `starterPrompt`/`probeChild`. Until then the handoff is `create_session` (#18 is depth 2 of 8).
4. **Refresh acts**: the start lists them; a refused archive is `proc process archived --refused` (#17's and #18's were refused: `[External System Writes]`); records come from the PostToolUse event (issue 107).
5. **Issue 61 stays open** (DRYRUN §9). 6. The dry-run repositories' move to `neobobkrause` (Bob's hand act), then `repo-shims.yml` for each; **the release-signing decision**: his.

## Acts only Bob can take

Done 29-30 Oct: every grant of the sitting; `civicsmith` a collaborator here. Still his: item 3's task on claude.ai; item 6.
