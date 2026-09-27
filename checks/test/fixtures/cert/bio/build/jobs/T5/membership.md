# T5 · membership — job record

Session: `session_01WvJLh3JQvPkdtZptfwXdqf` (MEMBERSHIP #2)

**Status** · COMPLETE, 2026-09-27. Job for module `membership`, tranche T5, branch `job/T5/membership`, from `tranche/T5` @ `e717124b06`. Entries: N73, N76 (R77, K127), N85, N64 (R75, R76), and every requirement marked *not yet met*.

## R77 final (REPORT 1)

- **N76 / R77** · `existenceAct(projectId, viewer)` is met as R77 states it, with no change to its code: C-70.1 (`check`, `translation` from `PROJECT_VISIBILITY_CHECKS`, the project's id and name, nothing else) when the viewer's sight is EXISTENCE; `null` at FULL, at NONE, and when no viewer is given; never throws. Its test, `R77 existenceAct …` in `bio-plane/test/m/membership/sight.test.mjs`, drives every sight arm (EXISTENCE for an outsider and for a member invited elsewhere; FULL for owner, invited, administrator, founder and the five machine classes; NONE for hidden, absent, a non-project bundle and a viewer naming nobody; no viewer), the setting's changes both ways, odd inputs, and byte-identity with what the acts answer. promotion may call `membershipOf(ctx).existenceAct(projectId, viewer)` now.

REPORT 1 sent to BOB at 05:49Z (R77 final, `job/T5/membership` @ `61be82b1ba`).

## Entries applied

- **N73** · R29 and R62 are built from `legacy-checks`' rows as the mint's other refusals are: `aiCredentialMint`'s local `refusal` helper with the literal codes `AI_CREDENTIAL_PRINCIPAL_NOT_THE_MINTER` (C-29.11) and `AI_CREDENTIAL_ORG_NOT_ADMIN` (C-29.12), inside `is-ai-credential-mint`, the region the rows name; `#ownRefusal` (which answered `check: "membership.R<n>"`) is removed, nothing else used it. The three DEC-49 regions the catalogue names in this file and the file lacked are marked, each refusal built from its C-96 row through `#custodialRefusal`: `adminResign > is-admin-resign-floor` (`RESIGN_AT_TWO`, C-96.10), `hostingAccessSet > is-hosting-access-holders` (`NO_HOLDERS`, C-96.11), `memberPairingSet > is-pairing-yours` (`PAIRING_NOT_YOURS`, C-96.12). Every other field of those answers is unchanged. `PROJECT_SEEN_NOT_A_PARTICIPANT` is minted only in `#existenceOnly`, reached by `existenceAct` (R77); promotion's copy goes with promotion's N73 share.
- **N76 / R77** · above (REPORT 1).
- **N85** (K124) · `memberPairings({ viewer, administer })` answers each caller only what R19 lets it see: every published pairing; an unpublished one only to its own member (R76's positional member of `viewer`) and to an administrator (the `administer` stamp, memberList's rule; the founder's viewer once claimed; a viewer naming an active administrator). Each row is `{handle, cover, published}`. With neither stamp it fails closed to the published pairings, which is what every caller received before. The op passes the query's `viewer` and `administer`, never the body's.
- **N64 (membership's share)** · R75 `rescueRefusal` and R76 `positionalMember` were already exported and used; now each has an interface test: R75 over every arm in order, compared byte for byte with `projectOwnerRescue`'s answer, a snapshot of every table before and after (writes nothing), and odd inputs (never throws); R76 over identity-before-viewer, the founder's two spellings, the five machine classes, every unadmitted form, and no write.
- **Requirements marked *not yet met*** · all verified met by MEMBERSHIP #1's work (T3) and tested at the interface: R10, R11, R18, R19, R29, R33 (REC-226), R35 and R40 (REC-224), R39, R42, R62, R63, R71 (membership's service; promotion calling it is K62, not mine). R77 met (above). Tests strengthened in this job: R29 and R62 now assert the catalogue's check and translation; R10, R11 and R19's refusals likewise; R63 is now read by an ordinary participant as well as the owner and an administrator, and refused to a non-participant. BOB may clear the marks in `build/requirements/membership.md` (it is not mine to edit).
- File header now cites R1–R77.

## Deferred

Nothing.

## Found in other modules (REPORT, in COMPLETE)

- **legacy-index** (N85's other half): the control plane stamps nothing on `op=memberpairings` today (`src/index.mjs`, no `viewer` or `administer` set for it). Until it stamps `viewer` (as for `PROJECT_ACTIONS`: the session's viewer, `class:<cls>` for a bearer) and `administer` (as for `memberlist`), every caller receives the published pairings alone: safe (fails closed, and the same as before this job), but a member does not see their own unpublished pairing and an administrator not the others.
- **Generated artifact made stale:** `bio-plane/dist/bio-plane.bundled.mjs` (`not_product`; BOB regenerates at the close): `src/membership/index.mjs` changed.
- **legacy-tests / old battery:** nothing new red. `aicredential` 96/1 → 97/0 (its N73 red is cleared).

## Tests and checks run

- `node --test bio-plane/test/m/membership/` — `tests 77, pass 77, fail 0` (73 at the start; new: R77, R19/N85, R75, R76).
- Layer tests: none named in `build/manifest.md`.
- Old battery, the suites touching what changed (against T4's close): `aicredential` 97/0, `airun-contextkind`, `d134-custodial-refusals`, `derivation-bounds`, `gate-reads`, `project-discoverable`, `project-join-request`, `machinefences-dec49`, `membership`, `members`, `d315-guard-witness` 25/0, `d278-codeless-refusals` 19/0, `d484-refusal-translation` 28/0, `adminvote` 87/0, `project-authority` 63/0, `projects` 115/0, `bootstrap` 18/0 all green; `meaning-bounds` 93/3 (N70), `project-sight` 223/1 (REPORT 6), `d470-catalog-census` 11/2 (N86), `affordances` 98/1 (REPORT 11), `d311-roster-affordances` 20/1 (N70, N45): each the same count as at T4's close, owed as there.
- Checks (civicos-process @ `7549c0b`):
  - `node checks/format.mjs .` — `format: 69 modules, 64 requirements files; 0 failures`
  - `node checks/architecture.mjs . membership` — `architecture: 11 product files, 26 relative imports (0 naming no tracked file, not judged); 0 failures`
  - `node checks/coverage.mjs . membership` — `coverage: 1 modules, 77 of 77 live requirement ids named by a test; 0 failures`
  - `node checks/ownership.mjs . membership tranche/T5` — `ownership: 9 files changed by membership between tranche/T5 and HEAD; legacy-store: 0 line(s) added, 0 removed; 0 failures`

Size: test runs 16, module lines 3431
