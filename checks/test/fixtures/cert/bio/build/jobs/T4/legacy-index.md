# legacy-index — T4 job record

**Job** · LEGACY-INDEX #1, session `session_01WqPRmYSbsF2qV78iQdWxhc`, branch `job/T4/legacy-index` (from `tranche/T4` @ `147e626`). Entries: N43, and N12, N19, N21 where their modules have landed (`build/plan/current.md`, Layer 11; text in `build/plan/next.md`). A legacy module: no requirements file, no `tests` path; its contract is the entries and the modules it serves (here `membership` R10, R11, R19 and `pdf-reader` R26).

## Status

COMPLETE (2026-09-27). Waiting on nothing; available for a `CHANGE` until BOB archives this session.

## Entries applied

- **N43** · `index.mjs` routes membership's five ops (N18). OPS rows: `adminresign`, `hostingaccessset`, `memberpairingset` (mutating; classes admin/member/probe, `machineClasses` admin/probe, REC-159's shape) and `hostingaccess`, `memberpairings` (reads; admin/member/probe, as `memberlist`). The three acts are a new array `ROSTER_SELF_ACTIONS`: spread into both `SESSION_OPS` sets (an enrolled administrator's session is a `member` kind, D-136), `NEEDS` null for each (no working capability; the roster decides), and the server's `by` stamped in a statement of its own after `projectrequests`' (the pinned `by` expression is untouched). Not added to `GOVERNANCE_ACTIONS` (its operator fence's C-32.17 sentence names the §4.7 votes and would be false here) nor `CUSTODIAL_ACTIONS` (its `by` condition is pinned by the old battery). A bearer stamps `class:<cls>` and the store refuses it by the roster (`NOT_AN_ADMIN`, `PAIRING_NOT_YOURS`); no new refusal code was minted (a fence code would need a catalogue row in `legacy-checks`).
- **N12** · The JSONC reader comes into the product as `bio-plane/scripts/jsonc.mjs` (the old `tools/jsonc.mjs`, unchanged below a provenance note); `deploy.mjs` and `resolve-version.mjs` import it. `scripts/op-claims.mjs` is removed, and with it `scripts/op-claims-ledger.mjs`, which imports it and serves the same ledger (only `test/op-claims.test.mjs` read it). Two stale comments corrected (`derive-bindings.mjs`, `coverage.mjs`'s "HOW CHECKED" list).
- **N19** · The built work `land/worker/D-627` @ `056d3092` (`index.mjs`, 14 lines), kept whole because it meets pdf-reader R26: `TIER3_REASONS` = `no_text_layer`, `image_content_unread`; `needsTier3` and `tier3Pages` route both; `needsTier2` counts both `image_content_*` markers as scan markers (tier 2 reads no image; neither marker is an undecoded character). `image_content_undetermined` is not routed to OCR. `mergeTier3Text`'s condition-1 comment now names both markers.

## Deferred

- **N21** · Its module has not landed. "The instance's active profiles" is the instance setting `instance-setup` R13–R14 records (`JURISDICTION_PROFILES` at first boot, `profilesSet`), not yet met (N10), and `next.md` places N21 with `extraction` (T5-2). Until then `docprofile`'s no-view fallback (K39) stands and `index.mjs` passes no `ctx.view`.

## Readings taken (BOB's to confirm; built as stated)

- Who reads `hostingaccess` and `memberpairings`: membership R11 and R19 set no reader rule, so the class ACL is `memberlist`'s (admin, member, probe; every signed-in session). If the hosting-access record should be administrators' only, that is a membership requirement (a `viewer`/`by` on the read), and I would stamp it.
- The operator's `admin` bearer reaches the three acts and is refused by the roster (its `by` is `class:admin`, on no roster), as `memberadd`'s bearer route names nobody (REC-156). `hostingaccessset` is therefore not the root of trust's act; membership R11 says "recorded by an administrator".

## Found in other modules (REPORT)

1. **legacy-tests (old battery), made red by N12's removal**, each failing at import (`ERR_MODULE_NOT_FOUND` for `scripts/op-claims.mjs`): `op-claims.test.mjs` (base: 34 pass, 2 fail), `hygiene.test.mjs` (base: 1305 pass, 6 fail; it imports `corpus`, `sweep`), `walkfigure.test.mjs` (base 32/0), `rung-ladder.test.mjs` (base 48/0; it imports `readDispatch`, `routeOf`, `PLANE`, the dispatch reader, not the ledger), and the controls `op-claims.control.mjs`, `walkfloor.control.mjs`, `rung-ladder.control.mjs`. They retire or re-anchor (T4-5's kind of work).
2. **affordances** (`bio-plane/src/affordances.mjs`, `NON_ACTS`): the totality guard (`affordances.test.mjs`, "every op in NEEDS is a published act or a named NON_ACT") now fails naming `adminresign`, `hostingaccessset`, `memberpairingset`: 98 pass, 1 fail (base 99/0). Each needs a NON_ACTS row, reason as for `memberadd`: the subject is a member or the roster, never a bundle.
3. **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` and its `.bundle.json` (inputs: the plane's source); BOB regenerates at the layer close.
4. **membership**, nothing wrong: its relays read `by` from the query after the body, so the stamp holds. `setpassword`'s ledger entry (N68) went with the ledger.

## Tests and checks

No `tests` path (legacy). Measured on this branch, against a worktree of `origin/tranche/T4` for comparison:
- **N43, through the whole plane in Miniflare** (a scratch driver, not committed: no path of mine holds tests): 14 pass, 0 fail — each of the five ops reaches the store; a member's session naming another `by` is stamped as itself; the three bearer classes (MEMBER_TOKEN `CLASS_FORBIDDEN`; admin and probe refused by the roster, `by` = `class:<cls>`); hosting access recorded by ruth's session and read back; pairings published by the member and by an administrator, refused for another's; resignation refused at two administrators, carried at three. The same driver over the base source: every arm fails (`unknown op`).
- **N19, the three predicates evaluated from the source:** `image_content_unread` routes (pages [1, 3] with a `no_text_layer` page), `image_content_undetermined` alone does not, `encrypted` still wins, tier 2 is not asked for image markers alone and is for a mix with `no_tounicode`.
- Old battery, mine | base: `capability` 63/0 | same; `adminvote` 87/0; `members` 96/0; `d270-refusal-truth` 36/0; `affordances` 98/1 | 99/0 (REPORT 2); `rec155-session-routes` 9/5 | 9/5 (fixture documents; not this); `deploybindings` 41/0; `resolveversion` 11/0; `tier3-layer-parts` 49/0; `tier-pagewise` 127/0; `tier2-wire` 46/0; `d606-perpage-ocr` 28/0; `pdf-worker-binding` 12/0; `cpdf18-pdf-images` 22/7 | 22/7; `reading-wire` 45/10 | 45/10; `ocr-member-e2e` 25/21 | 25/21; the four suites of REPORT 1 fail at import.
- Modules that use the service: `membership`'s own tests (`bio-plane/test/m/membership/*.test.mjs`, 8 files): all pass.
- No layer tests (manifest).
- `node checks/format.mjs`: 69 modules, 64 requirements files; 0 failures.
- `node checks/architecture.mjs … legacy-index`: 29 product files, 50 relative imports (0 naming no tracked file); 0 failures (the `scripts/` imports of `tools/` are gone).
- `node checks/coverage.mjs … legacy-index`: 0 of 0 live requirement ids; 0 failures.
- `node checks/ownership.mjs … legacy-index tranche/T4`: 9 files changed by legacy-index; 0 failures.

Size: test runs 31, module lines 11,256 (`index.mjs`) + 42 (`scripts/jsonc.mjs`)
