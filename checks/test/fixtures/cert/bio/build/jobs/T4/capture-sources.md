# T4 · capture-sources — job record

**Session** CAPTURE-SOURCES #1, `session_013dcTX498bqp3qZbH6dTpQN`, on `job/T4/capture-sources` (cut from `tranche/T4`, merged to `0446ab092b`). Process: civicos-process `roles/JOB.md`.

**Contract** `build/requirements/capture-sources.md` (R1–R54); files `bio-plane/src/render.mjs`, `browserrender.mjs`, `cdx.mjs`, `drive.mjs`; tests `bio-plane/test/m/capture-sources/`. Entries (`build/plan/current.md`, Layer 3): **T4-3** — requirement-named tests for every live id; R36 (the CDX `urlkey`, K48); R54 (the render locale from the profiles, K48); R26 (D-570's quiet-window class, K48). R37 (Memento) stays unscheduled (K48). No extraction: the module owns its four files (map §1).

## Questions to BOB

### Q1 · 2026-09-27 · R54: which key of the combined view names the locale (my reading, on which I carry on)

R54 says the render locale is "the one the instance's active jurisdiction profiles name (`view`, `jurisdictions.combine`'s view)". No profile section names a locale today, and `jurisdictions.validate` refuses an unknown section (`UNKNOWN_SECTION`, its R11), so any key I read is one `jurisdictions` does not yet define (the map §3 says the key is `jurisdictions`' to state).

**My reading:** `renderLocaleFor(view)` reads `view.locale`, shaped as `jurisdictions` shapes a one-value fact (R7's `practice.minutes_due_days`: `{value, basis}`, with `profile` beside it in a view, R13/R15): it answers `view.locale.value` when that is a well-formed BCP 47 language tag (`^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$`), and `RENDER_DEFAULTS.locale` for anything else (no view, no section, a withheld conflict, a malformed tag). It never throws. So the function is correct from the day `jurisdictions` adds the section, and answers the fallback until then. The section itself (`locale: {value, basis}` in the profile, one value per key under R15) is `jurisdictions`' to add; I report it rather than write it.

**ANSWER** (BOB, 02:20Z): the reading stands, now R54's text on `tranche/T4` @ `a813d62` (K119); the profile key is N77, next tranche. Merged; nothing to change.

**CHANGE** (BOB, 02:29Z): host-governor merged early (`tranche/T4` @ `337804c`). Already in my branch (merge `2e85ba46f2`). This module makes no fetch and does not touch the governor (R47), so nothing uses its exports here.

## Completion · 2026-09-27

### Entries applied (T4-3)

- **Requirement-named tests for every live id**, at the interface, in `bio-plane/test/m/capture-sources/`: `render.test.mjs` (R1–R18, R47–R50, R54), `browserrender.test.mjs` (R19–R26, against a plain-Node fake of the binding's two endpoints and CDP, with injected clocks; `Runtime.evaluate`'s expression is run against a fake `document`, so the doctype rule is the driver's own), `cdx.test.mjs` (R27–R37, R52), `drive.test.mjs` (R38–R46, R51, R53). **R37** (Memento) is not yet met and unscheduled (K48): it is named by a `test.todo`, not by a test of today's state, which would pin the gap.
- **R36** · `selectCapture`'s `chosen` keeps the CDX `urlkey` (`null` when the row has none), and `archiveHop`'s evidence names it (`CDX urlkey …`, or "the CDX record carried no urlkey").
- **R54** · `renderLocaleFor(view)`, as K119 words it (Q1). Every render still asks `en-US` until `jurisdictions` adds the key (N77) and `capture` passes the view (its R41).
- **R26** · D-570's quiet window, **on**, with **N = 4 s, measured** (below). After the load event, while at least one request is open and every open request is older than N, 500 ms of that quiet ends the wait as `quiet_excluding_long_lived`. With nothing open, R23's networkidle still ends it. An asked `until: "load"` is not overridden. The answer's `wait.long_lived` is `{older_than_s, count, urls}` (the requests open and older than N when the wait ended, whichever rule ended it). `renderBlock` classes the word `settled` (R3), records `completeness: "settled_with_open_requests"` (R14) and `render.wait.long_lived`, and states "settled; <count> long-lived request(s) still open were not waited for", which `completenessReading` also answers (R4). Grade and method are untouched (R50).

### R26's measurement (D-570: "extend M-151")

M-151's instrument, run by this job 2026-09-27 02:15–02:47Z. Headless Chromium `Chrome/141.0.7390.37` over CDP (`puppeteer-core@23`), through the egress proxy with its CA pinned by SPKI, a fresh incognito context per run, 1280×800, 60 s of observation after `Page.navigate`, every request's start and end recorded. 8 runs each of `oaklandca.opengov.com/transparency`, `oaklandca.opengov.com/`, `data.oaklandca.gov/` and `oakland.legistar.com/Calendar.aspx` (server-rendered control).
- Requests that ended, client-rendered sources: n = 1,597; median 301 ms, p99 1,148 ms, **max 1,968 ms**.
- Requests that never ended in 60 s: only on opengov, **4 per run in 16 of 16 runs**. They are a LaunchDarkly event stream plus two twitter and one facebook widget frames, each starting 2.0 s or more after navigation. The social frames may be held open by this egress path rather than by the site.
- **Rule** (M-151's): twice the tail, rounded up to the whole second: 2 × 1,968 ms → **N = 4 s**.
- **Replay of the driver's wait over the 32 recorded runs** (15 s wait):
  - Without the rule, opengov ends on the timeout in 16 of 16 runs.
  - With N = 4 s, opengov settles in 16 of 16 runs, at 8.4–10.0 s, naming 4 requests each.
  - data.oaklandca.gov and legistar end on networkidle in 16 of 16 runs either way, at the same instants.
- Not measured: Cloudflare's browser and network, other sources, a slow day.
- **Where the measurement lives:** the whole statement is in `browserrender.mjs`'s comment at `LONG_LIVED_AFTER_MS`, since only my paths are mine to write. The harness sha256 is `118fad49…`, the rows `f727eab5…`, the analysis `60f366cd…`. **REPORT:** filing it as an M-entry (M-151's sibling) and folding D-570 into `CLIENT-RENDERED.md` (the ruling's home) is for BOB; I can hand over the harness and rows whole.
- **Negative control** (the ruling's): with the age exclusion dropped (`isLongLived` → `false`), exactly R26 fails, the stream fixture ending `timeout` (7 pass / 1 fail). The restore was verified by `cmp`, after which 8/8 passed.

### Own flaws fixed in this job

- **R5–R7** · `Number()` read a blank string, `null` or `true` as 0 or 1, so a blank `RENDER_DAILY_ALLOWANCE_MS` meant "no renders", and a `null` asked timeout reserved 0 ms. Now only a number, or a non-blank numeric string, counts.
- **R12** · an unparseable `navigated_to` lost the page host instead of falling back to `pageUrl`.
- **R18** · the service renderer rejected when the service's `fetch` threw. It now answers `{ok: false, error}` (the Suggestion).
- **R25** · a session the binding handed out after the open bound expired was never closed. It is now closed on arrival.
- **R39** · `HTTPS://docs.google.com/...` (an https URL) read as not Drive.
- **R42** · `driveHop` threw on a detection without `signals`.
- Efficiency: `renderBlock` looked up each request's digest by `indexOf`, which is quadratic. It now uses a map.

### Deferred

- **R37** (Memento), unscheduled (K48).

### Found in other modules (REPORT)

- **legacy-tests** · `test/nc-d490.mjs`'s `nobodies` arm anchors on `if (sawNetwork) await collectBodies(conn, sessionId, [...requests.values()], { now });`. That text was already absent at `0446ab092b`, before this job; the line reads `{ now, until: overall }` since CONDUCT #22. The arm cannot arm. None of this job's edits touched an `nc-d490` or `nc-d64` anchor (each still matches exactly once).
- **jurisdictions** · the `locale` key R54 reads (N77, already entered by BOB).
- No generated artifact is staled: the plane bundle is `not_product` and regenerated at the close, and none of the three workers imports these files.

### Tests and checks run

- Module: `node --test bio-plane/test/m/capture-sources/` → **tests 54, pass 53, fail 0, todo 1** (R37).
- Old-battery suites that import these files, on the final code (their users' side; the layer has no layer tests):
  - `browser-render` 48 pass, 0 fail
  - `rendered-capture` 103 pass, 0 fail
  - `d522-unattended-render` 20 pass, 0 fail
  - `monitor-rendered` 28 pass, 0 fail
  - earlier in the job: `cdx` 37/0, `drive` 160/0, `drive-convert` 43/0, `d525-driveshells` 42/0, `d524-archive-baseline` 19/0
- Checks (civicos-process `7549c0b6`):
  - format: 69 modules, 64 requirements files; 0 failures
  - architecture: 8 product files, 11 relative imports; 0 failures
  - coverage: 54 of 54 live requirement ids named by a test; 0 failures
  - ownership: 2 files changed by capture-sources between tranche/T4 and HEAD; 0 failures

Size: test runs 24, module lines 1799
