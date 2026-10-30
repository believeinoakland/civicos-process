# neoProcess lane: handoff

**From** · neoProcess #17 (`session_01RAN5ejekyLkeVyhZwxrg7C`), the lane's address, 30 Oct. Before it #16 `session_01RAN5emLPV3t3uAq6znKJ2N`, #15 `session_012hdw2TtwUWftsP6A4fnU4L`. Branch `claude/modest-brahmagupta-vvaann` of `neobobkrause/neoprocess`. Its work reaches `main` by its own pull requests; the branch continues from `main`.

**Moved to Bob's second Claude account** (Bob, 30 Oct: *"the second account can be used for both civicsmith and neoprocess development"*). Its GitHub identity, measured by #16: `civicsmith` (`GET /user`), a collaborator (push, triage; admin impossible on a personal account's repository, so Bob: "Leave it as is", 30 Oct); every lane act passes (acts.md). Civicsmith's sessions are on that account too.

**Standing** · Bob, 29 Oct: keep working until there is no way to; nothing stops for him; a detail is never his (DES 1); plain words; PERMISSIONS §6 is his approval of all development and testing acts; every grant gathered before the work at one sitting (PERMISSIONS §10); one set of development tokens per owner account, a token short of a permission replaced, never worked around (PERMISSIONS §9); **no API key, ever** (§9.3); the network level stays Full (§8.8); the process names no product. Commit messages in plain words (the classifier reads them). The lane starts its successor by `proc process handoff`; Bob only when the chain breaks, from the START file.

## Read whole at start

What the start prints; `PERMISSIONS.md` §9–§10, `GRANTS.md`, `SETUP-STEPS.md`, `tools/acts.md`; then only what the step in hand changes, whole: a tool section (`tools/proc.mjs` has a usage header; `grep -n '^export' ` lists its functions), its test, a design file.

## Where it stands (30 Oct, 14:0xZ)

- Certified: DRYRUN §6-20 (§15-20 NOT YET wholly on the product); suite 283.
- **Issues are the channel** (Bob, 30 Oct, "Go with A"; GOV 5): `proc process status` lists them; acknowledge each NEW one (`proc issue ack`), close it naming the fix on `main` (`proc issue close`); the lane's Stop hook refuses a turn's end with one unacknowledged or no backstop due (`send_later`, the message `proc process status` prints).
- **Plain words** (issue 61): every turn's last message of BOB, ROOT, a lane, this lane and onboarding passes the plain-words check, the fresh reader and the evidence check; a turn refused four times in a row ends.
- **Test sessions**: headless `claude -p` in the scratchpad (acts.md; DRYRUN §8).
- **Attach no second repository** (PERMISSIONS §10.7). Shims are regenerated on the runner (`repo-shims.yml`), now onto the product's running `tranche` too.
- **Scheduled tasks** (#17): never delete one whose run matters (deleting deletes the sessions it started); switch it off (`update_trigger enabled false`). A predecessor's backstop is deleted by its successor at its start (#17 deleted #16's).

## What remains, in order

1. **Issue 96 (Bob's act pending)**: done: threshold 40 %; the hook passes the lane's one-shot task (successor's starter, or a probe) and one `fire_trigger` within 30 minutes. Measured (DRYRUN §19): a task made by a session's tool starts a session with no lineage but no repository, no connector, Sonnet, and no `create_session`; so neither successor nor starter. Asked of Bob (13:44Z, steps verified): make once on claude.ai/code/routines the task "neoProcess lane successor" (repository neobobkrause/neoprocess, environment BIO, Opus 5.5, GitHub connector, API trigger, the prompt: check out the lane's branch, follow the newest START file's fenced block). When it exists (`list_triggers`): make `proc process handoff` print `fire_trigger` of it (found by name) instead of `create_session`, the hook pass it; measure its first session's depth, checkout and settings; then close 96. Until then the handoff is the old `create_session` (depth +1; #17 is depth 1 of 8). The `starterPrompt`/`probeChild` code is unused by the handoff: remove it when the route lands.
2. **Issue 98** (Civicsmith's layer 5 stopped on it): the shims' start line fast-forwards an existing clean copy; role starts refuse a copy they cannot bring to main; shims written to `tranche` too (4473097). NOT YET: a new Civicsmith job reports its copy at c1ab817 or later (BOB #340 told, 14:0xZ). Then close 98. If the copy is not on `main` or is changed, the line names it on stderr and the old copy's start does not refuse: read what the job reports.
3. **Issue 95**: closed (e18b275). The `--unmeasured` route unproven on the product (QUERY-LANGUAGE #1 was archived by ROOT).
Done 30 Oct: issues 84, 86, 88, 90, 92, 93, 95.
4. **Civicsmith**: BOB #340 (session_01RAN5ekHqfZFXcxU3eB9Ecf) since about 13:5xZ. Still to read: a job taking in its old branch (§15); a merge over BOB's records (§16).
5. **Issue 61 stays open** (DRYRUN §9): the evidence check is live (`judge3.sh`).
6. The dry-run repositories' move to `neobobkrause` (Bob's hand act, the page's step 8), then `repo-shims.yml` for each. **The release-signing decision** (the page's foot): his.

## Acts only Bob can take

Done 29-30 Oct: every grant of the sitting; `civicsmith` a collaborator here. Still his: item 1's task on claude.ai; item 6.
