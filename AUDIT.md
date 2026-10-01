# Audit of the process documents (BOB #89 worker, 2026-10-01)

Line numbers are those of the documents at this commit (the history strip edited within lines, so they match the pre-strip text). D = PROCESS-DESIGN.md, M = PROCESS-MECHANICS.md, B = roles/BOB.md, J = roles/JOB.md, R = roles/ROOT.md. None of these is fixed here; the strip changed no meaning.

## (a) Stale text

1. **D:50–51 (P14)** says each session records its own TOKENS PROCESSED "before it ends" and that turns are collected; M:152 retired the self-reporting recorder (usage is read from the archive by BOB) and leaves `turns` empty. The principle still describes the retired mechanism.
2. **M:3** "the approved principles (`PROCESS-DESIGN.md`, P1–P16)"; principles run to P19. Same in `README.md` (outside the five).
3. **B:35** "record your metrics" at refresh; M:152 and B:41 say no session records its own usage, the successor writes `BOB-final`.
4. **B:28** `checks/run.mjs` described as "format, architecture and coverage"; it also runs channels when `build/channels.md` exists (M:138).
5. **M:162–168 §12 "Starting BIO on this process"** is a one-time transition plan (225 open rows, Batch30, "today's docs/architecture/"). Only §12.2 (legacy modules and extraction ownership) is a live rule, and §1, §6, §8.3 and J:7 all cite it as "§12.2".
6. **M:9 §1** says the canon "lives at `requirements/`… assembled from today's `docs/architecture/`"; the manifest says it is *listed* in `requirements/README.md` with files under `docs/architecture/` and `docs/development/`.
7. **M:13–22 §1 table** omits build-state files in use: `build/extraction/<module>.md` (P18 maps), `build/plan/starts-T<n>/`, `build/plan/draft-*.md`, `build/jobs/T<n>/<module>.bob.md` (named only in §13), `build/channels.md` and the mail branches (§13.1).
8. Outside the five: `CLAUDE.md` test command names `metrics/test/*.test.mjs` (no `metrics/` directory); product `build/manifest.md` lists a "metrics recorder" in the process repository; `README.md` omits `roles/ROOT.md`, `tools/`, `dryrun/`.

## (b) Contradictions

9. **M:140** "A new check is added only by BOB with Bob" vs **M:121** and **D:58 (P17)**: the process's tooling and checks are BOB's alone.
10. **M:15–17 §1 table**: `manifest.md`, `layers.md`, `modules.json` "BOB with Bob" vs P4/P17 (only layers and product-capability modules are Bob's; the rest, incl. helper/legacy modules, file ownership, order within a layer, is BOB's).
11. **D:44 (P12), M:66** "`main` does not change while a tranche runs" vs product practice (`build/manifest.md` "Parallel work"): `main` moves when the UX stream lands, and a tranche close merges `main` into the tranche branch. M:96 §5 Close (fast-forward only) does not provide for it.
12. **M:68 §4, M:81 §5, B:20** merge job branches only when every job of the layer is complete vs practice in force (TRANSITION §6): "Merge each job early when it completes".
13. **D:46 (P13)** "a session does one job, or one planning step, and ends" vs **M:42, M:46**: ROOT "lives long", BOB lives while its context is useful.
14. **B:37** "arm no timers" except the backstop vs **M:196 §13.1(3)** "A session may also look on its own `send_later` schedule".
15. **J:28–32 step 6** runs four checks incl. format vs **M:107 §6.6** "architecture, coverage and ownership".
16. **B:41** arms backstop and WATCH "if a layer runs" vs **M:44** unconditionally; **M:44** "A BOB at any other depth than 1 says so to Bob" is absent from B:41.

## (c) Duplicates (same rule, several wordings)

17. **Restart / backstop actions:** M:83, M:88–90, B:18 (each lists QUIET/UNCONFIRMED/RING handling in different words).
18. **Metrics row on archive:** M:81, M:44, M:152, B:20, B:41.
19. **Successor/ROOT handshake:** M:42, M:44, B:17 (misplaced inside "Run each layer"), B:40, R:5–6.
20. **Never idle / urgency / prepare next stages:** D:60 (P18), D:62 (P19), M:94, B:22, B:23.
21. **Acts only Bob can approve:** M:213–217, B:36, J:16.
22. **Legacy extraction ownership:** M:136 (§8.3), M:165 (§12.2), J:7, B:20.
23. **"Waiting" end-of-turn line:** M:101, J:23, B:38.
24. **Bob/BOB division:** D:58 (P17), M:28, M:116–127 (§7), B:7–11, and the product's CLAUDE.md.

## (d) History, provenance and measurement inside rules

25. Moved to `HISTORY.md` at this commit: both Status paragraphs; P17, P18, P19 attributions and Bob's quotes; M §2 (session names, depth K154 and the T5 measurement, ROOT/K167, routine-session D7, BOB #36 cost), §5 (Bob 2026-09-26, K128, D6, T6/D9, K167, D8, D9), §8 (K140, K954), §10 (recorder numbers), §12 (D4, D5, Batch30), §13 (K168, measurements), §13.1 (K954, K945, K473), §16 (T3, BOB #44); B (K128, two dates); R (K154). Remaining: `bio TRANSITION.md` is not cited any more; the `T0 for the transition` note in M:152 is kept as operative.

## (e) Rules only implied or scattered

26. **Opening a tranche:** M:79 (plan, tell Bob, meter), M:66 §4 (branch), M:92 (create WATCH "when it opens the tranche"), B:16 (order: tell Bob before creating the branch). The order and the WATCH are in no single list; nothing says a tranche may not open while a `CLOSING` plan exists except M:96.
27. **Starting a layer:** M:81, M:83, M:67, B:17; the practice's START body files (`build/plan/starts-T<n>/<m>.txt`, `--body-file`), arming the backstop at layer start, and merge order within a layer (TRANSITION §6 "rule 2") are stated nowhere in the mechanics.
28. **Closing a layer:** M:81 (regenerate, merge, archive), M:68, M:165 (read ADDED lines), M:204 §14 (regenerate before merging), B:20 (ownership check per job, which only B states); the practice's `not yet met: T<n>` mark-strike and `node checks/run.mjs` at close appear only in TRANSITION §6.
29. **Closing a tranche:** M:96 (two steps, meter, report), M:73 §4, M:92 (delete routines), D:62 (P19 report contents: elapsed time, work finished/left; M:96 lists a different set: fixed, deferred, cost), B:21; the manifest's "merge `main` first" step is absent.
30. **Takeover:** M:44, B:41, R:7 (WATCH death prompt), M:196 §13.1(3a) (read channel at takeover, absent from B:41), TRANSITION §6 (delete predecessor routines by id).
31. **Practice not in the mechanics:** accepted reds by name carried in STARTs; findings about a module whose job has not started go into its START (TRANSITION §6, "learned" 2); a job's "not yet met: T<n>" requirement markers; the UX stream's ownership rules live only in the product manifest and M §13.1(5).

## Verdict

Not a rewrite of the rules; the rules themselves are sound and mostly consistent. The documents *are* dirtied in structure: one stale principle (P14), five real contradictions (9–14), the lifecycle procedures (open, layer start/close, tranche close, takeover) scattered over three to five places each with differing wording, and a dead §12. Recommended: after the history strip, (1) amend P14 (Bob's, P16) and fix the stale counts; (2) resolve 9–16 by ruling; (3) restructure M §5 into one numbered procedure per lifecycle step, with BOB.md pointing to them instead of restating, and fold the practice in force (31) into it; (4) reduce §12 to the legacy-module rule. That is a targeted restructure of M §2/§5 and BOB.md, not a rewrite from scratch.
