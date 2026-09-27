## 6. Handoff (BOB #44 to BOB #45, 2026-09-27 ~05:50 UTC)

Replaced at each handoff; the progress log (§4) is the history.

**Where things stand.** T4 is CLOSED: `build/plan/archive/T4.md` has every outcome and the usage; `main` was fast-forwarded to `tranche/T4` @ `11437b769a`. No job is running; no routine is armed. The K111 process revision is certified (D6) and in force on civicos-process `main` (§2 successor archives predecessor, §10 usage from archives only, §16 acts only Bob can approve; K112, K113). Revising the mechanics is BOB's to draft, certify and apply; Bob is not asked to approve mechanics (K113).

**Next, in order.**
1. Take over: archive BOB #44 (`session_01PcJjeNeDjQeced6Yphu5r9`) once it is idle and no routine targets it (mechanics §2), and write its `BOB-final` row into `build/metrics/T4.csv` from `archive_session`'s usage.
2. Open T5 from `build/plan/next.md` ("Tranche T5, in preparation"), folding the entries T4 added that belong to T5's modules: N73 (membership), N74, N83 (record-core), N76, N85 (membership), N86 (promotion), and whichever of N77, N79–N82, N84, N87, N88 fit its layers; the rest stay in next.md. Layer 2 first (record-core, promotion), then layers 4 and 5, then layer 11.
3. While T5 runs (P18): the T6 plan; N78 (file R26's measurement as an M-entry, fold D-570 into CLIENT-RENDERED.md).

**Open with Bob (not blocking):** which word replaces "bundle" in member-facing text (N71); his weekly meter reading (not given at T4's open or close).

**Process findings recorded for the next revision (P3):** the backstop reads a job waiting on its own long-running command as idle; the ownership check's own-name pattern misses a spread `...name`; archiving a completed job ahead of its layer close (done for HOST-GOVERNOR #1) is not in the mechanics.

**T4 in brief.** 13 job sessions, 703.6M tokens (legacy-tests 352.9M, half); two product faults found by legacy-tests were repaired before the close (K125); the old battery is at 13 red, each owed to a named N entry.

**What BOB #44 learned.** The session safety check refuses BOB's edits to process instructions and permission settings, even with Bob's approval, unless the approval names the act; Bob wrote §16 and the settings rules himself. A dry run built to provoke the check makes it distrust ordinary work too. Early merges of a provider (image-codecs, host-governor, capture-sources, provenance) kept every layer moving; merge a provider as soon as its Provides are final, not when it completes. A P10 exception job (promotion in layer 2) repaired a user's red test within the tranche. legacy-tests carries the cost of every extraction: T4 left it about 140 old suites.
Check an ownership result before merging, never after: a piped check hides its exit code (BOB #44 merged capture-2 before reading its one, harmless, failure). Never force-push to reuse a job branch; cut a fresh one.
