# host-governor — T4 job record

**Job** · HOST-GOVERNOR #1, session `session_01Dx2ApePwLa24DTQGcHYdpj`, branch `job/T4/host-governor` (from `tranche/T4`). Entries: T4-1, N25, R3, R12 (`build/plan/current.md`, Layer 3). Map: `build/extraction/host-governor.md`. Rulings read: K47, K61, K63, K66, K69, K71, K72, K93.

## Status

COMPLETE (2026-09-27), again after BOB's ANSWER to Q1: `tranche/T4` @ `97bc628` merged (K122: R9 now reads as built); R9's test gained the standing-cool-off case; tests and checks re-run below.

## Question to BOB (sent 2026-09-27)

**Q1 · R9 against R21.** R9 says a refusal "sets the cool-off to end at now + max(min(cap, base × 2^(n−1)), retry_after_ms)". R21 says "no outcome … shortens a cool-off". They disagree when a later refusal computes a shorter window than one already standing (a 429 with `Retry-After: 3600` then, within that hour, a 403 whose escalation is 60 s: R9's words set the cool-off to 60 s from now, which shortens it). Today's code sets it unconditionally (R9's words). **My reading, built:** R21 governs; the cool-off ends at the later of the standing one and R9's figure, and the answer's `cooloff_until`/`cooloff_ms` report the cool-off in force. Only the wording of R9 would change ("extends the cool-off to end no earlier than …"). I carry on on this reading.

## Entries applied

- **T4-1** · The module is `bio-plane/src/host-governor/` (`index.mjs`, `schema.mjs`; 360 lines). It exports `governorOf(ctx, {env, now, random, record})` (K61; one `HostGovernor` per Durable Object storage, R20), whose methods are `governorAdmit`, `governorReport`, `governorConfig`, `governorState`, `governorHolding`, `isHeld` and `migrate`; `GOVERNOR` (the chosen constants); `appetiteOf` (R3 and R12's one rule); `badAppetite` (R12's one refusal, `check: "host-governor.R12"`, since no catalogue row exists); `retryAfterMs` (the one `Retry-After` parser, for `capture`'s subresource fetch too); `governorRoutes` (the Durable Object's four routes, spread into the legacy store's op map); `governorOverStub` (K72 (2)'s Worker adapter); `governedFetch`; `governorOp`; `HOST_GOVERNOR_SCHEMA`. The clock and the jitter are injected (the Suggestion). `migrate` runs the DDL and declares `host_governor` to record-core exempt from purge, once (R24).
- **K72 (3)** · The DDL left `schema.mjs`, which interpolates `${HOST_GOVERNOR_SCHEMA}` where it stood (the last table, as `RECORD_SCHEMA` is interpolated); the legacy store also runs `governorOf(this.ctx, {env}).migrate()` beside membership's, which passes the binding (map §4.2).
- **Rewired in `legacy-store`:** the four public `governor*` methods delegate (the object's RPC callers, `monitor-cadence`, and `#checkGroupDomain` keep working, K63); the routes spread `governorRoutes`; `#conditionsGovernorHolding` reads `governorHolding({now})` and `#captureRequestHostHeld` reads `isHeld` (R14; both methods stay for `queue` and `capture-requests`). `Store.GOVERNOR` and `#governorRow` are gone.
- **N25** · `index.mjs`'s `governedFetch(env, stub, target, purpose, delegated)` is now a three-line wrapper: the agent it composes (`userAgent`, which stays for `capture`) is passed in, the governor is `governorOverStub(stub)`. Its three callers (archive lookup, acquire, monitor) are unchanged. The two op handlers are one call to `governorOp`, the control plane keeping `storeSilent` and `json`. **The OPS rows, `SESSION_OPS` entries and `NEEDS.governorconfig` stay in `index.mjs`** (K93 (3): op declarations stay with the control plane, handlers move; this supersedes map §1's "OPS rows move"), so `adminvote.control.mjs`'s pinned row is untouched.
- **R3** · A binding that is absent, empty, non-numeric, zero, negative or infinite falls back to 12; so does a stored appetite that is not positive (a row written before R12 held).
- **R12** · `governorConfig` refuses such a value `BAD_APPETITE` and writes nothing; the op refuses with the same object (R19: one refusal).

## Flaws fixed in the module (beyond the entries)

- R21: a later, shorter refusal shortened a standing cool-off (Q1; answered by K122, R9 reworded).
- R10: an ignored status created a row for a host never seen; it now changes nothing.
- R5: a clock that stepped back refilled negatively; the elapsed time is floored at 0.
- R16: `Retry-After` of a negative number gave a negative wait, and an unreadable one gave 0; now never below 0, and `null` when unreadable.
- `governedFetch` sends no `user-agent` header when the caller supplies none (R16: it composes none).

## Deferred

Nothing.

## Found in other modules (REPORT)

1. **legacy-tests (T4-5), source-anchored reds this extraction makes, each green on `tranche/T4` before it, each reading moved text:** the schema-order rule in `observation-log` (A2), `publishedcase`, `mint-ledger` (S1), `bias`, `capturerequests`, `capture-text-index` (A1) (each 1 fail: the literal `CREATE TABLE IF NOT EXISTS host_governor` is no longer in `schema.mjs`; `aicredential`'s one red is on the base too and is not this); `plane-envelope` (2: D-240 (e)'s residual census, and HELD OPEN (iii), which reads `governedFetch`'s "ungoverned is better than unfetched" in `index.mjs`, now in the module); `derivation-bounds` (2: M0-63's admitted member `#conditionsGovernorHolding` no longer holds a row source, and the census floor fell by that one). `hygiene` stays green (1311/0). Not touched by me (P7).
2. **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` (and its `.bundle.json`), whose inputs are the plane's source; BOB regenerates it at the layer close (mechanics §14).
3. **For `capture` (building against these Provides):** use `governedFetch(target, {userAgent, fetch, governor})` with `governorOverStub(stub)` from the Worker, `retryAfterMs` for the subresource `fetchOne`'s parse, and `isHeld` (in the object) in place of the `governorstate` read; `archiveSelect`'s 24/min `governorconfig` POST still works unchanged.
4. **legacy-store / legacy-index architecture** (not mine, unchanged by this job): 5 failures on the base and on this branch alike (`store.mjs` imports `affordances.mjs` and `queuestate.mjs`, later modules; three `scripts/` import `tools/`).

## Tests and checks

- `node --test bio-plane/test/m/host-governor/*.test.mjs`: tests 28, pass 28, fail 0 (`governor.test.mjs` R1–R17, R20–R25 over node:sqlite with record-core's real instance; `ops.test.mjs` R18, R19 at the handler and through the whole plane in Miniflare, by every class and every kind of session).
- Old battery through the plane, on this branch: `governor` 37/0, `queue-conditions` 51/0, `group-identity` 43/0, `monitor-cadence` 0 fail, `gate-reads` 115/0, `empty-body` 10/0, `acquire` 95/0, `archive-monitoring` 22/0, `hygiene` 1311/0, `d125-findingmute` 42/0, `provenance-marker` 113/0, `versions` 78/0, `scheduler` 51/0; the reds are listed above. No layer tests (manifest).
- `node checks/format.mjs`: 69 modules, 64 requirements files; 0 failures.
- `node checks/architecture.mjs … host-governor`: 5 product files, 8 relative imports; 0 failures.
- `node checks/coverage.mjs … host-governor`: 25 of 25 live requirement ids named by a test; 0 failures.
- `node checks/ownership.mjs … host-governor tranche/T4`: 9 files changed; legacy-store 13 lines added, 163 removed; legacy-index 6 added, 82 removed; 0 failures. Every added legacy line is a delegation, an import from `./host-governor/`, or a call to it.

Size: test runs 43, module lines 360
