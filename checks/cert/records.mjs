// Grammar validators for the build state's records (dryrun/cert/SUITE.md §0, §4 item 2; PROCESS-MECHANICS §2, §6,
// §10, §13, §16): a job record, the plan's Status line, a message's first line, a handoff, and the metrics CSV.
// Each validator returns { errors: [...], ...parsed }; an empty `errors` is a pass. `strict` requires what the revised
// design adds for gap X3 (a message id, version and reply-to); the current corpus is judged non-strict.
// Usage: node checks/cert/records.mjs [--strict] <file> ...            (the kind is read from the path)
//        node checks/cert/records.mjs [--strict] --message '<first line>' ...
//        node checks/cert/records.mjs [--strict] --kind record|plan|handoff|csv|messages <file> ...
import { readFileSync } from 'node:fs';
import { report } from '../lib.mjs';

// A cloud session id (the address of §13; `get_session`'s `id`).
export const SESSION_ID = /\bsession_[0-9A-Za-z]{20,}\b/g;
const SESSION_ONE = /^session_[0-9A-Za-z]{20,}$/;
const idsIn = (text) => [...new Set(text.match(SESSION_ID) || [])];

// The message kinds (§13; §2 for ROOT). START is BOB's first message to a job (§6.1 names it only "BOB's first
// message"; SUITE C1 and every T6 start used `START`). STARTED is ROOT's answer (roles/ROOT.md).
export const JOB_KINDS = ['QUESTION', 'REPORT', 'COMPLETE', 'BLOCKED'];
export const BOB_KINDS = ['ANSWER', 'CHANGE', 'START', 'START BOB'];
export const ROOT_KINDS = ['STARTED'];
export const KINDS = [...JOB_KINDS, ...BOB_KINDS, ...ROOT_KINDS];

// Fields the revised design adds (gap X3): `id=<message id>`, `v=<version>`, `re=<id>[@<v>]`.
const FIELD = /^(id|v|re)=(\S+)$/;
const FIELD_VALUE = { id: /^[A-Za-z0-9][\w.:#-]*$/, v: /^\d+$/, re: /^[A-Za-z0-9][\w.:#-]*?(@\d+)?$/ };

function fieldsOf(tokens, errors, where) {
  const f = {};
  for (const t of tokens) {
    const m = t.match(FIELD);
    if (!m) { errors.push(`${where}: "${t}" is neither a kind nor an id=/v=/re= field`); continue; }
    if (m[1] in f) errors.push(`${where}: ${m[1]}= given twice`);
    else if (!FIELD_VALUE[m[1]].test(m[2])) errors.push(`${where}: ${m[1]}=${m[2]} is malformed`);
    f[m[1]] = m[2];
  }
  return f;
}

function strictFields(f, kinds, errors, where) {
  if (!f.id) errors.push(`${where}: no id= (strict: every message carries its id, X3)`);
  if (!f.v) errors.push(`${where}: no v= (strict: every message carries its version, X3)`);
  if (kinds.includes('ANSWER') && !f.re) errors.push(`${where}: an ANSWER has no re= (strict: it names the question and version it answers, X3, F5)`);
}

// Senders: `BOB #<n>`, a session name `<LANE> #<k>` (`D7-BOB #2`), `ROOT` or `ROOT #<k>`, or a job's module id
// (roles/JOB.md: `From <module> (T<n>)`).
const SENDER = /^(?:BOB #\d+|ROOT(?: #\d+)?|[A-Z][A-Z0-9-]* #\d+|[a-z][a-z0-9-]*)$/;
const TRANCHE = /^[TD]\d+$/;
const FIRST = /^From (.+?)(?: \(([^)]*)\))?: (.*)$/;

// A message's first line (§13): `From <sender> (<T>): <KIND>`, kinds joined by ` + ` when one message carries
// two (`ANSWER + CHANGE`, as BOB #45–#48 sent), `BLOCKED: needs Bob` (§16), then optional id=/v=/re= fields.
// ROOT's `From ROOT: STARTED BOB #<n> <session id>` (roles/ROOT.md) names no tranche and carries the successor:
// accepted non-strict for ROOT only.
export function parseMessageLine(line, { strict = false } = {}) {
  const errors = [];
  const where = `"${line.length > 80 ? line.slice(0, 77) + '...' : line}"`;
  const m = line.match(FIRST);
  if (!m) return { errors: [`${where}: not "From <sender> (<T>): <KIND>"`] };
  const [, sender, tranche, rest] = m;
  if (!SENDER.test(sender)) errors.push(`${where}: sender "${sender}" is not BOB #<n>, a session name, ROOT or a module id`);
  const isRoot = /^ROOT/.test(sender);
  if (tranche === undefined) { if (!isRoot || strict) errors.push(`${where}: no (<tranche>)`); }
  else if (!TRANCHE.test(tranche)) errors.push(`${where}: tranche "${tranche}" is not T<n> or D<n>`);
  let text = rest.trim();
  const kinds = [];
  let needsBob = false, named = null;
  for (;;) {
    const k = [...KINDS].sort((a, b) => b.length - a.length).find((x) => text === x || text.startsWith(x + ' ') || text.startsWith(x + ':'));
    if (!k) break;
    kinds.push(k);
    text = text.slice(k.length);
    if (k === 'BLOCKED' && /^: needs Bob\b/.test(text)) { needsBob = true; text = text.slice(': needs Bob'.length); }
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
  const fields = fieldsOf(text ? text.split(/\s+/) : [], errors, where);
  if (strict) strictFields(fields, kinds, errors, where);
  return { errors, sender, tranche: tranche ?? null, kinds, kind: kinds.join(' + '), needsBob, named, ...fields };
}

export const validateMessage = (text, opts) => parseMessageLine(text.split('\n')[0], opts);

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

const STATES = ['STARTED', 'WORKING', 'WAITING', 'BLOCKED', 'COMPLETE'];
const SIZE_LINE = /^Size\b/;
const SIZE = /^Size: test runs (\d+), module lines (\d+)$/;
// A record's message entries: a `## ` heading, or a list item `- **…`, that opens with a kind or `Q<n>`.
const ENTRY = /^(?:##\s+|-\s+\*\*)(QUESTION|REPORT|ANSWER|CHANGE|COMPLETE|BLOCKED|START|Q\d+)\b(.*)$/;

// A job record `build/jobs/<T>/<module>.md` (§6.7, §10, §13, §16). Grammar:
// - a line `**Status** · <STATE> …`, STATE one of STATES;
// - its header (the lines before the first `## `, where the Status and Session lines stand) names the job's own
//   session id (the first one named) and `depth <d>` (§6.1, K154);
// - COMPLETE ⇒ its last `Size…` line is exactly `Size: test runs <n>, module lines <n>` (§10);
// - every `NEEDS BOB:` line is `NEEDS BOB: <act>, <why>` (§16);
// - message entries (see ENTRY) carry well-formed id=/v=/re= fields when they carry any; strict: every entry
//   carries id= and v=, and an ANSWER re= (X3).
export function parseRecord(text, { strict = false } = {}) {
  const errors = [];
  const lines = text.split('\n');
  // The Status is a line `**Status** · <STATE> …`, or (four T4 records) a `## Status` section whose first paragraph
  // opens with the state, bold or not: the same field, a grammar choice.
  let statusLine = lines.find((l) => /^\*\*Status\*\*\s*·/.test(l));
  const sec = lines.findIndex((l) => /^## Status\s*$/.test(l));
  if (!statusLine && sec >= 0) statusLine = lines.slice(sec + 1).find((l) => l.trim() !== '');
  let state = null;
  if (!statusLine) errors.push('no "**Status** · <STATE>" line');
  else {
    state = (statusLine.replace(/^\*\*Status\*\*\s*·\s*/, '').replace(/^\*\*/, '').match(/^[A-Z]+/) || [null])[0];
    if (!STATES.includes(state)) errors.push(`Status state "${state ?? statusLine.slice(0, 40)}" is not one of ${STATES.join(', ')}`);
  }
  const headEnd = lines.findIndex((l) => l.startsWith('## '));
  const header = lines.slice(0, headEnd < 0 ? lines.length : headEnd).join('\n');
  const ids = idsIn(header);
  const sessionId = ids[0] || null;
  if (!sessionId) errors.push('the Status/Session header names no session id');
  const d = header.match(/\bdepth (\d+)\b/);
  const depth = d ? Number(d[1]) : null;
  if (depth === null) errors.push('the Status/Session header names no depth');
  const sizes = lines.filter((l) => SIZE_LINE.test(l));
  const last = sizes.at(-1);
  const sm = last && last.trim().match(SIZE);
  const size = sm ? { testRuns: Number(sm[1]), moduleLines: Number(sm[2]) } : null;
  if (state === 'COMPLETE') {
    if (!last) errors.push('COMPLETE with no "Size: test runs <n>, module lines <n>" line');
    else if (!sm) errors.push(`last Size line is not "Size: test runs <n>, module lines <n>": "${last.slice(0, 90)}"`);
  }
  const needs = needsBobLines(text);
  for (const nb of needs) if (!nb.ok) errors.push(`line ${nb.n}: not "NEEDS BOB: <act>, <why>": "${nb.line.slice(0, 90)}"`);
  const messages = [];
  lines.forEach((l, i) => {
    const m = l.match(ENTRY);
    if (!m) return;
    const kinds = /^Q\d+$/.test(m[1]) ? (/\bANSWER\b/.test(m[2]) ? ['ANSWER'] : ['QUESTION']) : [m[1], ...[...m[2].matchAll(/\+\s*(ANSWER|CHANGE)\b/g)].map((x) => x[1])];
    const where = `line ${i + 1}`;
    const errs = [];
    const f = fieldsOf(m[2].match(/\b(?:id|v|re)=[^\s*`,;)]+/g) || [], errs, where);
    if (strict) strictFields(f, kinds, errs, where);
    errors.push(...errs);
    messages.push({ n: i + 1, kinds, q: /^Q\d+$/.test(m[1]) ? m[1] : null, line: l.trim(), ...f });
  });
  return { errors, state, sessionId, ids, depth, size, needsBob: needs, open: needs.filter((x) => x.ok), messages };
}
export const validateRecord = parseRecord;

// The plan's Status line (§2, §13): exactly one session id, BOB's, written `BOB #<n> · <session id> · depth <d>`.
export function parsePlanStatus(text) {
  const errors = [];
  const line = text.split('\n').find((l) => /^\*\*Status\*\*\s*·/.test(l));
  if (!line) return { errors: ['no "**Status** · …" line'], ids: [] };
  const ids = idsIn(line);
  if (ids.length !== 1) errors.push(`Status names ${ids.length} session ids (${ids.join(', ') || 'none'}); BOB's address is exactly one (§13)`);
  const m = line.match(/BOB #(\d+) · `?(session_[0-9A-Za-z]{20,})`? · depth (\d+)/);
  if (!m) errors.push('Status has no "BOB #<n> · <session id> · depth <d>" (§2)');
  const state = (line.replace(/^\*\*Status\*\*\s*·\s*/, '').match(/^[A-Z]+/) || [null])[0];
  const jobs = text.split('\n').find((l) => /^\*\*Jobs\*\*/.test(l)) || null;
  return { errors, ids, state, bob: m ? { n: Number(m[1]), id: m[2], depth: Number(m[3]) } : null, depth: m ? Number(m[3]) : null, jobs };
}
export const validatePlanStatus = parsePlanStatus;

// A BOB's handoff (§2): its own line `BOB #<n> · <session id> · depth <d>`; when it asks Bob for a new ROOT, a line
// `NEEDS BOB: start ROOT` followed by the prompt to paste (a fenced block or a quote) and plain numbered steps, and
// nothing after them (the handoff "ends" with it, SUITE A9, A11). Other NEEDS BOB lines follow §16.
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
    else if (requireStartRoot) errors.push('no "NEEDS BOB: start ROOT" line (ROOT unreachable or this BOB not at depth 1)');
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
    const rec = parsed.find((p) => p.sessionId === r.session);
    if (!rec) continue;
    const row = `${r.session} (${r.module}) test_runs ${r.test_runs || '""'}, module_lines ${r.module_lines || '""'}`;
    if (!rec.size) errors.push(`${row}: its record ${rec.path} has no readable Size line`);
    else if (String(rec.size.testRuns) !== r.test_runs || String(rec.size.moduleLines) !== r.module_lines) errors.push(`${row}: its record ${rec.path} says test runs ${rec.size.testRuns}, module lines ${rec.size.moduleLines}`);
  }
  return { errors };
}

// Every line of a file of message first lines (one per line) that is a message (starts "From ").
export function parseMessages(text, opts) {
  const errors = [], messages = [];
  text.split('\n').forEach((l, i) => {
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
