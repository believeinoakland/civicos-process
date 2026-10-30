# neoProcess lane: handoff

**From** · neoProcess #16 (`session_01RAN5emLPV3t3uAq6znKJ2N`), the lane's address, 30 Oct. Before it #15 `session_012hdw2TtwUWftsP6A4fnU4L`, #14 `session_012hdw2SRrXZibnQhZJimtZw`. Branch `claude/modest-brahmagupta-vvaann` of `neobobkrause/neoprocess`. Its work reaches `main` by its own pull requests; the branch continues from `main`.

**Moved to Bob's second Claude account** (Bob, 30 Oct, 11:xxZ, his words: *"the secondary Claude account is connected to the civicsmith github account - which is now a neoprocess collaborator. So now the second account can be used for both civicsmith and neoprocess development. So I need this Claude account to stand down its neoprocess development here."*). #15 stood down on the first account; #16 is started by Bob there from START-16. Its GitHub identity, measured by #16: `civicsmith` (`GET /user`), a collaborator (push, triage; admin impossible on a personal account's repository, so Bob: "Leave it as is", 30 Oct); every lane act passes (acts.md). Civicsmith's sessions are on that account too.

**Standing** · Bob, 29 Oct: keep working until there is no way to; nothing stops for him; a detail is never his (DES 1); plain words; PERMISSIONS §6 is his approval of all development and testing acts; every grant gathered before the work at one sitting (PERMISSIONS §10); one set of development tokens per owner account, a token short of a permission replaced, never worked around (PERMISSIONS §9); **no API key, ever** (§9.3); the network level stays Full (§8.8); the process names no product. Commit messages in plain words (the classifier reads them). The lane starts its successor by `proc process handoff`; Bob only when the chain breaks, from the START file.

## Read whole at start

What the start prints; `PERMISSIONS.md` §9–§10, `GRANTS.md`, `SETUP-STEPS.md`, `tools/acts.md`; then only what the step in hand changes, whole: a tool section (`tools/proc.mjs` has a usage header; `grep -n '^export' ` lists its functions), its test, a design file.

## Where it stands (30 Oct; suite 281 green)

- Certified: DRYRUN §6-16 (§15-16 NOT YET on the product).
- **Issues are the channel** (Bob, 30 Oct, "Go with A"; GOV 5): `proc process status` lists them; acknowledge each NEW one (`proc issue ack`), close it naming the fix on `main` (`proc issue close`); the lane's Stop hook refuses a turn's end with one unacknowledged or no backstop due (`send_later`, the message `proc process status` prints).
- **Plain words** (issue 61): every turn's last message of BOB, ROOT, a lane, this lane and onboarding passes the plain-words check and the fresh reader (the skill `neoprocess-reader`, invoked after the start); a turn refused four times in a row ends.
- **Test sessions**: headless `claude -p` in the scratchpad (acts.md; DRYRUN §8).
- **Attach no second repository** (PERMISSIONS §10.7); #13 had two (issue 63). Shims are regenerated on the runner.
- The sitting page (version 18) is on the first account, unreadable from the second (PERMISSIONS §10.6).

## What remains, in order

1. **Done 30 Oct**: issues 84 (`proc job takein`, JOB-LIFE §1a) and 86 (`proc merge` over BOB's records, `gateNeutral`, JOB-LIFE §6), each on `main` with its reply. A running product session keeps its old process clone: a fix reaches it only through a session started after.
2. **Civicsmith**: BOB #338 (since 11:25Z) recorded both replies seen (§13 PROVEN live). PR 55 merged 12:18Z on a green gate (§14 PROVEN live); BOB #339 from 12:31Z has both fixes. Still to read: a job taking in its old branch (§15); a merge over BOB's records (§16).
3. **Issue 61 stays open** (DRYRUN §9): the evidence check is live; more wording no longer moves it (`judge3.sh`). Bob told 30 Oct.
4. The dry-run repositories' move to `neobobkrause` (Bob's hand act, the page's step 8), then `repo-shims.yml` for each. **The release-signing decision** (the page's foot): his.

## Acts only Bob can take

Done 29-30 Oct: every grant of the sitting; `civicsmith` a collaborator here. Still his: item 4.
