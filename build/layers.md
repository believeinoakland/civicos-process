# Layers of the process, as a product under itself

Accepted architecture: REQUIREMENTS.md §1 (Bob, 30 Oct 2026). Each layer's contract is one line; its modules are adjacent in `build/modules.json`.

| layer | contract | modules |
| --- | --- | --- |
| 1 | What the hosting platform does and refuses, measured and dated, and the acts the process may depend on (PLT-1 to PLT-14); the git record every role reads and writes, one writer per file, durable on the tranche and transient on the state branch (REC-1 to REC-8). Nothing above this layer calls the platform or git except through these two. | platform, record |
| 2 | The module order and the checks on code (ARC-1 to ARC-5); requirement files, ids, marks, and the line between a test and a measurement (REQ-1 to REQ-6). | architecture, requirements |
| 3 | Tranches, rounds, layers, entries, stop and resume, partial layers (PLN-1 to PLN-8); a job as a pull request (JOB-1 to JOB-10); the CI gate on a module's own suite (GAT-1 to GAT-8); review, merge, layer close, tranche close, release (INT-1 to INT-6). | planning, jobs, gate, integration |
| 4 | Roles, who starts whom, refresh by handoff, reading sets and budgets, models, usage, the process's own overhead (SES-1 to SES-13); messages between sessions and to Bob, nothing holding a turn, no judge (MSG-1 to MSG-7). | sessions, messages |
| 5 | Flaw reports and replies, the pinned version and its pickup at a stop, incremental proof and the certification mark, the process built under itself (MNT-1 to MNT-10); what a product receives and onboarding (SHM-1 to SHM-5). proc-legacy is today's tool, extracted from by every job above and retired when empty. | maintenance, shims, proc-legacy |
