# Plan: dry run D7

**Status** · OPEN. The dry run certifying the K154 revision (mechanics §2, §5, §6, §13: session depth; `CERTIFICATION.md` L1–L6). BOB: `D7-BOB #2 · session_01CVr6oZgfM2ey4n26azCpE1 · depth 1`. Each entry is written to drive a path of the mechanics: do exactly what it says.

## Layer 1

**alpha**
- N1 · Provide `mul(a, b)`, meeting alpha R3, with a test naming R3. Record your size line (mechanics §10).
- N2 · Before you send COMPLETE, read your own depth: call `get_session` (claude-code-remote) with no session id, then follow `parent_session_id` with `get_session` until a session has none; count the links. Record in your job record the chain (session ids, root last), your depth, and whether it equals the depth BOB's first message gave you.
