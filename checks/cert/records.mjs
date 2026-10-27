// Grammar validators for the build state's records (dryrun/cert/SUITE.md §0, §4 item 2; PROCESS-MECHANICS §2, §6,
// §10, §13, §16): a job record, the plan's Status line, a message's first line, a handoff, and the metrics CSV.
// Each validator returns { errors: [...], ...parsed }; an empty `errors` is a pass. `strict` requires the grammar of the
// K164 mechanics exactly (envelopes with ids, handled marks, Size lines naming their session); the pre-K164 corpus is
// judged non-strict.
// Usage: node checks/cert/records.mjs [--strict] <file> ...            (the kind is read from the path)
//        node checks/cert/records.mjs [--strict] --message '<first line>' ...
//        node checks/cert/records.mjs [--strict] --kind record|plan|handoff|csv|messages <file> ...
import { readFileSync } from 'node:fs';
import { report } from '../lib.mjs';

// A cloud session id (the address of §13; `get_session`'s `id`).
export const SESSION_ID = /\bsession_[0-9A-Za-z]{20,}\b/g;
const SESSION_ONE = /^session_[0-9A-Za-z]{20,}$/;
const idsIn = (text) => [...new Set(text.match(SESSION_ID) || [])];

// The message kinds (§13, *K164*), by direction. Each direction has its own id: `J<n>` from a job, `B<n>` from BOB to
// a job, `#<n>` (the BOB concerned) between a BOB and ROOT. STARTED is ROOT's retired notice (F4): accepted non-strict.
export const JOB_KINDS = ['QUESTION', 'REPORT', 'COMPLETE', 'BLOCKED'];
export const BOB_JOB_KINDS = ['START', 'ANSWER', 'CHANGE', 'RESUME'];
export const BOB_ROOT_KINDS = ['START BOB', 'WATCH'];
export const ROOT_KINDS = ['REFUSED', 'WAKE'];
export const BOB_KINDS = [...BOB_JOB_KINDS, ...BOB_ROOT_KINDS];
export const KINDS = [...JOB_KINDS, ...BOB_KINDS, ...ROOT_KINDS, 'STARTED'];
export const BLOCKED_CAUSES = ['tests', 'needs Bob', 'context'];
const ID = /^(?:J\d+|B\d+|#\d+)$/;

// Senders: `BOB #<n>`, a session name `<LANE> #<k>` (`D7-BOB #2`), `ROOT` or `ROOT #<k>`, or (non-strict) a job's
// module id, as roles/JOB.md had it before K164.
const SENDER = /^(?:BOB #\d+|ROOT(?: #\d+)?|[A-Z][A-Z0-9-]* #\d+|[a-z][a-z0-9-]*)$/;
const TRANCHE = /^[TD]\d+[a-z]?$/;   // T51b: a tranche's suffixed successor (bio K5336)
const FIRST = /^From (.+?)(?: \(([^)]*)\))?(?: to ([a-z][a-z0-9-]*))?: (.*)$/;

// A message's first line, its envelope (§13, *K164*):
//   From <sender> (<T>)[ to <module>]: <KIND> <id>[ re <id>][ replaces <id>]      BLOCKED adds `: <cause>`
// Non-strict (the pre-K164 corpus): kinds joined by ` + `, `BLOCKED: needs Bob`, no id, ROOT with no tranche and
// `STARTED BOB #<n> <session id>`. Strict: exactly the grammar above, the KIND allowed for its direction, the id of
// that direction; `to <module>` exactly on BOB's messages to a job; `re J<n>` exactly on an ANSWER; `replaces J<m>`
// only on a QUESTION, m below its id; a BLOCKED cause one of BLOCKED_CAUSES.
export function parseMessageLine(line, { strict = false } = {}) {
  const errors = [];
  const where = `"${line.length > 80 ? line.slice(0, 77) + '...' : line}"`;
  const m = line.match(FIRST);
  if (!m) return { errors: [`${where}: not "From <sender> (<T>): <KIND>"`] };
  const [, sender, tranche, to, rest] = m;
  if (!SENDER.test(sender)) errors.push(`${where}: sender "${sender}" is not BOB #<n>, a session name, ROOT or a module id`);
  const isRoot = /^ROOT/.test(sender), isBob = /^(?:[A-Z][A-Z0-9]*-)?BOB #\d+$/.test(sender), isJob = !isRoot && !isBob;
  if (strict && /^[a-z]/.test(sender)) errors.push(`${where}: sender "${sender}" is a module id, not the session's name (strict)`);
  if (tranche === undefined) { if (!isRoot || strict) errors.push(`${where}: no (<tranche>)`); }
  else if (!TRANCHE.test(tranche)) errors.push(`${where}: tranche "${tranche}" is not T<n> or D<n>`);
  let text = rest.trim();
  const kinds = [];
  let needsBob = false, named = null, cause = null;
  for (;;) {
    const k = [...KINDS].sort((a, b) => b.length - a.length).find((x) => text === x || text.startsWith(x + ' ') || text.startsWith(x + ':'));
    if (!k) break;
    kinds.push(k);
    text = text.slice(k.length);
    if (k === 'STARTED' && isRoot) {
      const s = text.match(/^ (BOB #\d+) (session_[0-9A-Za-z]{20,})/);
      if (s) { named = { name: s[1], id: s[2] }; text = text.slice(s[0].length); }
      else errors.push(`${where}: STARTED names no "BOB #<n> <session id>"`);
    }
    text = text.trim();
    if (!text.startsWith('+ ')) break;
    text = text.slice(2).trim();
  }
  if (!kinds.length) { errors.push(`${where}: kind "${rest.split(' ')[0]}" is not one of ${KINDS.join(', ')}`); return { errors, sender, tranche }; }
  const c = text.match(/^(.*?):\s*(.+)$/);
  if (c) { text = c[1].trim(); cause = c[2].trim(); if (/^needs Bob\b/.test(cause)) needsBob = true; }
  const f = {};
  const toks = text ? text.split(/\s+/) : [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === 're' || t === 'replaces') {
      const v = toks[++i];
      if (!v || !ID.test(v)) errors.push(`${where}: "${t}" names no id`);
      else if (f[t]) errors.push(`${where}: "${t}" given twice`);
      else f[t] = v;
    } else if (ID.test(t) && !f.id && !f.re && !f.replaces) f.id = t;
    else errors.push(`${where}: "${t}" is neither an id (J<n>, B<n>, #<n>) nor re/replaces <id>`);
  }
  const kind = kinds.join(' + ');
  if (strict) {
    const err = (e) => errors.push(`${where}: ${e} (strict, §13)`);
    if (kinds.length > 1) err('one KIND per message');
    const allowed = isRoot ? ROOT_KINDS : isBob ? BOB_KINDS : JOB_KINDS;
    if (!allowed.includes(kinds[0])) err(`${kinds[0]} is not a KIND ${isRoot ? 'ROOT' : isBob ? 'BOB' : 'a job'} sends`);
    const toJob = isBob && BOB_JOB_KINDS.includes(kinds[0]);
    const want = isJob ? /^J\d+$/ : toJob ? /^B\d+$/ : /^#\d+$/;
    if (!f.id) err('no id');
    else if (!want.test(f.id)) err(`id ${f.id} is not ${isJob ? 'J<n>' : toJob ? 'B<n>' : '#<n>'}`);
    if (toJob && !to) err(`BOB's ${kinds[0]} names no "to <module>"`);
    if (!toJob && to) err('only BOB\'s messages to a job carry "to <module>"');
    if (kinds[0] === 'ANSWER' && !/^J\d+$/.test(f.re || '')) err('an ANSWER names no "re J<n>", the question version it answers');
    if (kinds[0] !== 'ANSWER' && f.re) err('only an ANSWER carries "re"');
    if (f.replaces && (kinds[0] !== 'QUESTION' || !/^J\d+$/.test(f.replaces) || Number(f.replaces.slice(1)) >= Number((f.id || 'J0').slice(1)))) err(`"replaces ${f.replaces}" is not a QUESTION's earlier J<m>`);
    if (kinds[0] === 'BLOCKED' ? !BLOCKED_CAUSES.includes(cause) : cause !== null) err(kinds[0] === 'BLOCKED' ? `BLOCKED's cause is not one of ${BLOCKED_CAUSES.join(', ')}` : 'only BLOCKED carries ": <cause>"');
  }
  return { errors, sender, tranche: tranche ?? null, to: to ?? null, kinds, kind, needsBob, cause, named, ...f };
}

export const validateMessage = (text, opts) => parseMessageLine(text.split('\n')[0], opts);

// BOB's backstop, a one-time routine into its own session (§5, *K164*): first line `BACKSTOP (<T>, layer <k>)`.
export const BACKSTOP = /^BACKSTOP \([TD]\d+, layer \d+\)$/;
export function parseBackstopLine(line) {
  return { errors: BACKSTOP.test(line) ? [] : [`"${line.slice(0, 80)}": not "BACKSTOP (<T>, layer <k>)" (§5)`] };
}

// `NEEDS BOB: <the one act>, <why>` (§16). A line saying there is none ("no `NEEDS BOB`") has no colon and is not one.
const NEEDS = /NEEDS BOB:\s*(.*)$/;
export function needsBobLines(text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    const m = line.match(NEEDS);
    if (!m) return;
    const g = m[1].replace(/[`*]+$/g, '').match(/^(.+?),\s+(.+)$/);
    out.push({ n: i + 1, line: line.trim(), act: g ? g[1].trim() : m[1].trim(), why: g ? g[2].trim() : null, ok: !!g });
  });
  return out;
}

const STATES = ['STARTED', 'WORKING', 'RUNNING', 'WAITING', 'NEEDS BOB', 'BLOCKED', 'COMPLETE'];
const SIZE_LINE = /^Size\b/;
const SIZE = /^Size(?: \((session_[0-9A-Za-z]{20,})\))?: test runs (\d+), module lines (\d+)$/;
// The revised Status line (§6.1, *K164*).
const STATUS_K164 = /^\*\*Status\*\* · (session_[0-9A-Za-z]{20,}) · depth (\d+) · (WORKING|RUNNING until (\S+) \((.+)\)|WAITING ON BOB \((J\d+)\)|NEEDS BOB|COMPLETE) · sent J(\d+) · handled B(\d+)$/;
// A record's message entries: a heading `## <envelope>` (*K164*, §13); before K164, a `## ` heading or a list item
// `- **…` that opens with a kind or `Q<n>`.
const ENVELOPE = /^##\s+(From .*)$/;
const ENTRY = /^(?:##\s+|-\s+\*\*)(QUESTION|REPORT|ANSWER|CHANGE|COMPLETE|BLOCKED|START|Q\d+)\b(.*)$/;

// A job record `build/jobs/<T>/<module>.md` (§6, §10, §13, §16). Grammar:
// - a Status line: *K164* `**Status** · <session id> · depth <d> · <state> · sent J<n> · handled B<n>`; before it,
//   `**Status** · <STATE> …` or a `## Status` section, the header (lines before the first `## `) naming the session
//   id (the first one named) and `depth <d>`;
// - COMPLETE ⇒ a Size line `Size (<session id>): test runs <n>, module lines <n>` (before K164, `Size: …` as the last);
// - every `NEEDS BOB:` line is `NEEDS BOB: <act>, <why>` (§16);
// - message entries: headings `## <envelope>`, each envelope well formed.
// Strict (the K164 record): the K164 Status line; every entry a job's envelope heading, ids J1, J2, … in order and
// `sent` the last; a `WAITING ON BOB (J<n>)` names an entry; one Size line per session, each naming it, and on
// COMPLETE one naming the Status's session; no pre-K164 entries.
export function parseRecord(text, { strict = false } = {}) {
  const errors = [];
  const lines = text.split('\n');
  let statusLine = lines.find((l) => /^\*\*Status\*\*\s*·/.test(l));
  const k164 = statusLine && statusLine.trim().match(STATUS_K164);
  const sec = lines.findIndex((l) => /^## Status\s*$/.test(l));
  if (!statusLine && sec >= 0) statusLine = lines.slice(sec + 1).find((l) => l.trim() !== '');
  let state = null, marks = null;
  if (k164) {
    state = k164[3].startsWith('RUNNING') ? 'RUNNING' : k164[3].startsWith('WAITING') ? 'WAITING' : k164[3];
    marks = { sent: Number(k164[7]), handled: Number(k164[8]), waitingOn: k164[6] ?? null, runningUntil: k164[4] ?? null };
  } else if (!statusLine) errors.push('no "**Status** · <STATE>" line');
  else {
    const t = statusLine.replace(/^\*\*Status\*\*\s*·\s*/, '').replace(/^\*\*/, '');
    state = (t.match(/^NEEDS BOB|^[A-Z]+/) || [null])[0];
    if (!STATES.includes(state)) errors.push(`Status state "${state ?? statusLine.slice(0, 40)}" is not one of ${STATES.join(', ')}`);
    if (strict) errors.push('the Status line is not "**Status** · <session id> · depth <d> · <state> · sent J<n> · handled B<n>" (strict, §6.1)');
  }
  const headEnd = lines.findIndex((l) => l.startsWith('## '));
  const header = lines.slice(0, headEnd < 0 ? lines.length : headEnd).join('\n');
  const ids = idsIn(header);
  const sessionId = k164 ? k164[1] : ids[0] || null;
  if (!sessionId) errors.push('the Status/Session header names no session id');
  const d = k164 ? [null, k164[2]] : header.match(/\bdepth (\d+)\b/);
  const depth = d ? Number(d[1]) : null;
  if (depth === null) errors.push('the Status/Session header names no depth');
  const sizeLines = lines.filter((l) => SIZE_LINE.test(l));
  const parsedSizes = sizeLines.map((l) => ({ line: l, m: l.trim().match(SIZE) }));
  const sizes = parsedSizes.filter((x) => x.m).map((x) => ({ session: x.m[1] ?? null, testRuns: Number(x.m[2]), moduleLines: Number(x.m[3]) }));
  const own = sizes.find((x) => x.session && x.session === sessionId);
  const last = parsedSizes.at(-1);
  const size = own ? { testRuns: own.testRuns, moduleLines: own.moduleLines } : last?.m && !last.m[1] ? { testRuns: Number(last.m[2]), moduleLines: Number(last.m[3]) } : null;
  if (strict) {
    for (const x of parsedSizes) if (!x.m || !x.m[1]) errors.push(`Size line is not "Size (<session id>): test runs <n>, module lines <n>": "${x.line.slice(0, 90)}" (strict, §10)`);
    const seen = new Set();
    for (const x of sizes) if (x.session) { if (seen.has(x.session)) errors.push(`two Size lines for ${x.session} (strict: one per session, §10)`); seen.add(x.session); }
    if (state === 'COMPLETE' && !own) errors.push(`COMPLETE with no Size line naming its session ${sessionId} (strict, §10)`);
  } else if (state === 'COMPLETE') {
    if (!last) errors.push('COMPLETE with no "Size: test runs <n>, module lines <n>" line');
    else if (!size) errors.push(`last Size line is not "Size: test runs <n>, module lines <n>": "${last.line.slice(0, 90)}"`);
  }
  const needs = needsBobLines(text);
  for (const nb of needs) if (!nb.ok) errors.push(`line ${nb.n}: not "NEEDS BOB: <act>, <why>": "${nb.line.slice(0, 90)}"`);
  const messages = [];
  lines.forEach((l, i) => {
    const where = `line ${i + 1}`;
    const env = l.match(ENVELOPE);
    if (env) {
      const p = parseMessageLine(env[1], { strict });
      errors.push(...p.errors.map((e) => `${where}: ${e}`));
      if (strict && p.kinds && !JOB_KINDS.includes(p.kinds[0])) errors.push(`${where}: a record's entries are its job's own messages (strict, §13)`);
      messages.push({ n: i + 1, line: l.trim(), envelope: true, ...p });
      return;
    }
    const m = l.match(ENTRY);
    if (!m) return;
    if (strict) errors.push(`${where}: a message entry that is not a "## <envelope>" heading (strict, §13): "${l.slice(0, 60)}"`);
    const kinds = /^Q\d+$/.test(m[1]) ? (/\bANSWER\b/.test(m[2]) ? ['ANSWER'] : ['QUESTION']) : [m[1], ...[...m[2].matchAll(/\+\s*(ANSWER|CHANGE)\b/g)].map((x) => x[1])];
    messages.push({ n: i + 1, kinds, q: /^Q\d+$/.test(m[1]) ? m[1] : null, line: l.trim() });
  });
  if (strict && k164) {
    const env = messages.filter((x) => x.envelope && x.id);
    env.forEach((x, k) => { if (x.id !== `J${k + 1}`) errors.push(`line ${x.n}: entry ${x.id} out of order, J${k + 1} expected (strict, §13)`); });
    if (marks.sent !== env.length) errors.push(`Status "sent J${marks.sent}", but the record's last entry is J${env.length} (strict, §13)`);
    if (marks.waitingOn && !env.some((x) => x.id === marks.waitingOn)) errors.push(`Status waits on ${marks.waitingOn}, which no entry is (strict, §6.1)`);
  }
  return { errors, state, sessionId, ids, depth, size, sizes, marks, needsBob: needs, open: needs.filter((x) => x.ok), messages };
}
export const validateRecord = parseRecord;

// The plan's Status line (§2, §13): exactly one session id, BOB's, written `BOB #<n> · <session id> · depth <d>`.
// Its `Jobs` line (*K164*, §13): per job `<MODULE> #k \`<session id>\` · handled J<n> · sent B<n>`, entries separated
// by `;`; strict: every session id the line names carries both marks.
const JOB_MARKS = /([A-Z][A-Z0-9-]* #\d+) `?(session_[0-9A-Za-z]{20,})`? · handled J(\d+) · sent B(\d+)/g;
export function parsePlanStatus(text, { strict = false } = {}) {
  const errors = [];
  const line = text.split('\n').find((l) => /^\*\*Status\*\*\s*·/.test(l));
  if (!line) return { errors: ['no "**Status** · …" line'], ids: [] };
  const ids = idsIn(line);
  if (ids.length !== 1) errors.push(`Status names ${ids.length} session ids (${ids.join(', ') || 'none'}); BOB's address is exactly one (§13)`);
  const m = line.match(/BOB #(\d+) · `?(session_[0-9A-Za-z]{20,})`? · depth (\d+)/);
  if (!m) errors.push('Status has no "BOB #<n> · <session id> · depth <d>" (§2)');
  const state = (line.replace(/^\*\*Status\*\*\s*·\s*/, '').match(/^[A-Z]+/) || [null])[0];
  const jobs = text.split('\n').find((l) => /^\*\*Jobs\*\*/.test(l)) || null;
  const marks = jobs ? [...jobs.matchAll(JOB_MARKS)].map((x) => ({ name: x[1], session: x[2], handled: Number(x[3]), sent: Number(x[4]) })) : [];
  if (strict && jobs) for (const id of idsIn(jobs)) if (!marks.some((x) => x.session === id)) errors.push(`Jobs line: ${id} has no "<MODULE> #k \`<session id>\` · handled J<n> · sent B<n>" (strict, §13)`);
  return { errors, ids, marks, state, bob: m ? { n: Number(m[1]), id: m[2], depth: Number(m[3]) } : null, depth: m ? Number(m[3]) : null, jobs };
}
export const validatePlanStatus = parsePlanStatus;

// A BOB's handoff (§2): its own line `BOB #<n> · <session id> · depth <d>`; when it asks Bob for a new ROOT, a line
// `NEEDS BOB: start ROOT` followed by the prompt to paste (a fenced block or a quote) and plain numbered steps, and
// nothing after them (the handoff "ends" with it, SUITE A11; A9: only when ROOT is unreachable, since a BOB at any
// depth has its successor started by ROOT, §2). Other NEEDS BOB lines follow §16.
export function parseHandoff(text, { requireStartRoot = false } = {}) {
  const errors = [];
  const self = text.match(/BOB #(\d+) · `?(session_[0-9A-Za-z]{20,})`? · depth (\d+)/);
  if (!self) errors.push('no "BOB #<n> · <session id> · depth <d>" line (§2: the handoff carries the BOB\'s depth)');
  const lines = text.split('\n');
  const at = lines.findIndex((l) => /^(?:\*\*)?NEEDS BOB: start ROOT\b/.test(l.trim()));
  const loose = needsBobLines(text).filter((x) => !/NEEDS BOB: start ROOT\b/.test(x.line));
  for (const nb of loose) if (!nb.ok) errors.push(`line ${nb.n}: not "NEEDS BOB: <act>, <why>": "${nb.line.slice(0, 90)}"`);
  if (at < 0) {
    if (lines.some((l) => /NEEDS BOB: start ROOT/.test(l))) errors.push('"NEEDS BOB: start ROOT" is not at the start of its line');
    else if (requireStartRoot) errors.push('no "NEEDS BOB: start ROOT" line (ROOT unreachable)');
  } else {
    const tail = lines.slice(at + 1);
    if (!tail.some((l) => /^(```|>)/.test(l.trim()) || /^".{20,}"$/.test(l.trim()))) errors.push('"NEEDS BOB: start ROOT" is not followed by the prompt to paste (a fenced block or a quote)');
    if (!tail.some((l) => /^\d+\.\s/.test(l.trim()))) errors.push('"NEEDS BOB: start ROOT" is not followed by numbered steps');
    if (tail.some((l) => /^#{1,6} /.test(l))) errors.push('the handoff does not end with "NEEDS BOB: start ROOT", its prompt and steps');
  }
  return { errors, self: self ? { n: Number(self[1]), id: self[2], depth: Number(self[3]) } : null, startRoot: at >= 0 };
}
export const validateHandoff = parseHandoff;

// `build/metrics/<T>.csv` (§10): the header below; one row per session, keyed by its cloud session id; role `job`
// or `BOB-final`; the four usage counts non-negative integers; `turns` empty (the archive does not report it);
// `test_runs` and `module_lines` integers on a job row (copied from its Size line), empty on a BOB-final row.
export const CSV_HEADER = 'session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines';
const USAGE = ['cache_read', 'cache_write', 'input', 'output'];
export function parseCsv(text) {
  const errors = [];
  const lines = text.split('\n').filter((l, i, a) => l !== '' || i < a.length - 1);
  if (lines[0] !== CSV_HEADER) errors.push(`header is not "${CSV_HEADER}"`);
  const cols = CSV_HEADER.split(',');
  const rows = [];
  const seen = new Map();
  lines.slice(1).forEach((l, i) => {
    const n = i + 2;
    const v = l.split(',');
    if (v.length !== cols.length) { errors.push(`row ${n}: ${v.length} fields, not ${cols.length}`); return; }
    const r = Object.fromEntries(cols.map((c, k) => [c, v[k]]));
    rows.push(r);
    if (!SESSION_ONE.test(r.session)) errors.push(`row ${n}: session "${r.session}" is not a cloud session id`);
    if (seen.has(r.session)) errors.push(`row ${n}: session ${r.session} has a row already (row ${seen.get(r.session)})`);
    seen.set(r.session, n);
    if (!['job', 'BOB-final'].includes(r.role)) errors.push(`row ${n}: role "${r.role}" is not job or BOB-final`);
    if (r.role === 'job' && !/^[a-z][a-z0-9-]*$/.test(r.module)) errors.push(`row ${n}: a job row names no module`);
    if (r.role === 'BOB-final' && r.module) errors.push(`row ${n}: a BOB-final row names a module`);
    for (const c of USAGE) if (!/^\d+$/.test(r[c])) errors.push(`row ${n}: ${c} "${r[c]}" is not a count`);
    if (r.turns !== '') errors.push(`row ${n}: turns "${r.turns}" is not empty (the archive does not report it)`);
    for (const c of ['test_runs', 'module_lines']) {
      if (r.role === 'job' && !/^\d+$/.test(r[c])) errors.push(`row ${n}: ${c} "${r[c]}" is not a count (copied from the record's Size line)`);
      if (r.role === 'BOB-final' && r[c] !== '') errors.push(`row ${n}: ${c} on a BOB-final row`);
    }
  });
  return { errors, rows };
}
export const validateCsv = parseCsv;

// The metrics row of a job and its record agree (§10: BOB copies the record's Size line into the row; SUITE G4).
// `records` maps a record's path to its text; a row is matched to the record of its module in which it is the
// record's own (first named) session id. Returns errors for a row whose record's Size is unreadable or differs.
export function crossCheckSize(csvText, records) {
  const errors = [];
  const parsed = Object.entries(records).map(([path, text]) => ({ path, ...parseRecord(text) }));
  for (const r of parseCsv(csvText).rows) {
    if (r.role !== 'job') continue;
    // A Size line naming the row's session (*K164*: one per session), else the record's own when it is that session's.
    const named = parsed.map((p) => ({ p, z: p.sizes.find((z) => z.session === r.session) })).find((x) => x.z);
    const rec = named?.p ?? parsed.find((p) => p.sessionId === r.session);
    if (!rec) continue;
    const size = named ? named.z : rec.size;
    const row = `${r.session} (${r.module}) test_runs ${r.test_runs || '""'}, module_lines ${r.module_lines || '""'}`;
    if (!size) errors.push(`${row}: its record ${rec.path} has no readable Size line`);
    else if (String(size.testRuns) !== r.test_runs || String(size.moduleLines) !== r.module_lines) errors.push(`${row}: its record ${rec.path} says test runs ${size.testRuns}, module lines ${size.moduleLines}`);
  }
  return { errors };
}

// Every line of a file of message first lines (one per line) that is a message (starts "From ").
export function parseMessages(text, opts) {
  const errors = [], messages = [];
  text.split('\n').forEach((l, i) => {
    if (opts?.strict && /^BACKSTOP\b/.test(l)) { errors.push(...parseBackstopLine(l).errors.map((e) => `line ${i + 1}: ${e}`)); return; }
    if (!l.startsWith('From ')) return;
    const m = parseMessageLine(l, opts);
    messages.push(m);
    errors.push(...m.errors.map((e) => `line ${i + 1}: ${e}`));
  });
  return { errors, messages };
}

// The kind of a build-state file, from its path.
export function kindOf(path) {
  if (/\.csv$/.test(path)) return 'csv';
  if (/build\/jobs\/[A-Z]+\d+\/[^/]+\.md$/.test(path)) return 'record';
  if (/build\/plan\/(current|archive\/[A-Z]+\d+)\.md$/.test(path)) return 'plan';
  if (/(handoff|TRANSITION)[^/]*\.md$|\/handoff\//i.test(path)) return 'handoff';
  if (/messages[^/]*\.txt$/.test(path)) return 'messages';
  return null;
}

const VALIDATORS = { record: parseRecord, plan: parsePlanStatus, handoff: parseHandoff, csv: parseCsv, messages: parseMessages };
export function validateFile(path, text, { kind = kindOf(path), strict = false, requireStartRoot = false } = {}) {
  if (!VALIDATORS[kind]) return { errors: [`${path}: no validator for this path (name --kind)`] };
  return VALIDATORS[kind](text, { strict, requireStartRoot });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const requireStartRoot = args.includes('--require-start-root');
  const ki = args.indexOf('--kind');
  const kind = ki >= 0 ? args[ki + 1] : undefined;
  const msg = args.includes('--message');
  const rest = args.filter((a, i) => !a.startsWith('--') && !(ki >= 0 && i === ki + 1));
  if (!rest.length) { console.error('usage: node checks/cert/records.mjs [--strict] [--kind record|plan|handoff|csv|messages] <file> ... | --message "<first line>" ...'); process.exit(2); }
  const failures = [];
  for (const r of rest) {
    const res = msg ? parseMessageLine(r, { strict }) : validateFile(r, readFileSync(r, 'utf8'), { kind, strict, requireStartRoot });
    failures.push(...res.errors.map((e) => (msg ? e : `${r}: ${e}`)));
  }
  process.exitCode = report('records', failures, `${rest.length} ${msg ? 'message line' : 'file'}${rest.length === 1 ? '' : 's'} read${strict ? ' (strict)' : ''}`);
}
