# Accounting · rulebook BLD (neoProcess #3, 2026-10-29)
Lines cite files: D = PROCESS-DESIGN.md, M = PROCESS-MECHANICS.md, J = lane-neoprocess/JOB-LIFE.md, S = SESSIONS.md, P = PROTOCOL.md, A = bio build/rulings-active.md, R = bio build/rulings.md.
K3271 | R:3272, A:35 | P20, P6 · kept as rule 1 (the job's reading set; M:175 and S:50 give the same list)
K3588 | R:3587, A:13 | P20 · kept as rule 1 (no scans, Bob's)
K3678 | R:3677, M:291 | P20, P13 · kept as rule 1 (`BLOCKED: reading`; the stop is CODE by the hook, M:164)
M §6 step 1 | M:175 | P20 · kept as rule 1
M §17 reading limits | M:291-293, S:84 | P6, P20 · kept as rule 1 (size check) and left to Sessions rule 4 for the budgets
M §6 step 2 | M:176 | P9 · kept as rule 2
P §2 | P:30 | P9, P20 · kept as rule 2 (WAITING recorded, pushed, then sent; best reading)
P §1 | P:26 | P13, P16 · folded (already in Sessions rule 8: messages go only to BOB's address); rule 2 names the job's use of it
M §13 kinds | M:254 | P9 · kept as rule 2 (`QUESTION`, `REPORT`)
D P9 | D:27-31 | P9 · kept as rule 2 (a flaw in another module goes through BOB)
D P8 / M §6 step 3 | D:25, M:177 | P8 · kept as rule 3 (rule 3 states only the job's part; routing is BOB's, Governance)
M §6 ownership paragraph | M:183 | P7 · kept as rule 4
M §8.3 ownership | M:207 | P7 · coded (the ownership check) under rule 4
J §3 marks struck by the job | J:20 | P7 · kept as rule 4 (lane files win over M:70, M:122, which strike the marks at merge)
M §14 generated artifacts | M:272, J:25 | P7, P12 · kept as rule 4 (the gate regenerates and restores; the job never commits one; J §4 wins over M:272)
D P7, M §6 step 4 | D:23, M:178 | P7 · kept as rule 5 (every id named by a test at the interface; coverage check M:206)
K4990 | R:4985 | P7, P11 · kept as rule 5 (no hand-built answer of another module)
K4993 | R:4988 | P7, P11 · kept as rule 5 (the fixtures check, M:212)
K4995 | R:4990 | P4, P7 · folded (already in M §8.7: the user publishes a contract fixture, the provider's tests run it; the fixtures check holds it)
K3268, K3366 | R:3269, R:3366 | P7 · kept as rule 5 (tests never hand-list another module's content or copy its words; the words check M:211)
J §3 cannot-fail check | J:21, rulebook Integration rule 2 | P7 · kept as rule 5 as planned CODE; not built yet
D P11, M §6 step 4 | D:42, M:178 | P11 · kept as rule 6
M §4 old debt | M:87 | P7, P19 · kept as rule 7
J §3 inherited reds | J:21 | P7 · kept as rule 7
M §6 step 5 | M:179 | P20, P7 · kept as rule 8 (`**Met**`, `**Evidence**`; refusals are CODE)
M §6 "when tests will not pass" | M:181 | P8, P19 · kept as rule 9 (TEXT: nothing records the three attempts)
M §6 context half | M:181 | P13 · folded (already in Sessions rule 5)
M §6 job stays available, M §5.11 job Stop | M:179, M:163 | P13, P10 · kept as rule 10
J §7 change after the merge | J:37 | P10 · kept as rule 10 (`proc job reopen`)
J §9 failure | J:45 | P8, P13 · folded (the replacement is Sessions and Governance's `proc job route`)
J §3 `proc job complete` posts report as PR comment, marks PR ready | J:21 | P12 · folded (already in Integration rules 1 and 3; the gate is theirs)
M §5.11 job PreToolUse (no force push, no session or routine creation) | M:162 | P13 · folded (Sessions rule 1 and 8 cover who starts sessions and where messages go)
M §10 size line `Size (<session>): ...` | M:228 | P14 · folded (the metrics row is read from the archive, Sessions rule 10)
M §3 requirements format | M:56-72 | P5 · set aside (BOB's area; a job does not write requirements)
M §12.2 extraction exception | M:242 | P7 · set aside (legacy modules belong to the architecture area)
M §7 what BOB resolves | M:185-200 | P17 · set aside (Governance)
K4297 | R:4294 | P7, P8, P11, P17 · set aside (BOB, not a job, fixes a stale test; it is not the job's turn; it fits Governance or Integration)
K506 | R:509 | P13 · set aside (a quiet job is BOB's watch, Sessions)
K874 | R:876 | P18 · set aside (a START asks an explicit test for ids other tests name; it is the START's content, Sessions rule 4)
K1185 | R:1187 | P10 · set aside (an architecture change carried to a running layer; Integration or Governance)
K624 | R:627 | P4 · set aside (splitting a module is architecture)
K3259 | R:3260 | P15 · set aside (a wording fix without code is BOB's edit, never a job; Governance)
Unresolved: K4297's rule (BOB fixes a test-only stale test itself, no job) fits Building or Governance; I left it out because it is BOB's act. Rules 3 and 9 are TEXT and no code is named for them. The full-log greps (inherited red, K-numbers of rulings that set a rule) returned mostly merge records, so I read only rulings that set a rule.
