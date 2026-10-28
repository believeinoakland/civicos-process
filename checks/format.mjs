// Check 4, format (PROCESS-MECHANICS §8.4; P4, P5, P15): the build state's files parse, every id they
// reference exists, and every module's `paths` and `tests` entry names a file or directory in the product tree.
// Also (§16, §9; P15, P17): every ruling numbered after APPROVALS_LAST_EXEMPT that records Bob's approval of a
// refused act states its standing-list decision.
// Also (N656, bio K1763; P15, P17; a proposed revision until certified, §15): where the product keeps a register of
// Anthropic's terms, every statement of a limit on Anthropic's accounts, plans or terms cites a register id or a ruling of Bob's.
// Also (P19, mechanics §8.4; bio K3923): every entry of `build/plan/next.md` names one of P19's hard reasons.
// Also (P19, mechanics §8.4; bio K5015): in `build/plan/current.md`, the running fix round's plan file(s) it names
// (`build/plan/fix-round-*.md` that exist, so not the archived ones) and `build/handoff.md`, a line that defers work
// ("next fix round", "next round", "a later round", "later tranche", "deferred to") fails unless it cites `next.md`:
// work that waits is an entry of `next.md` only, and plan text names dependencies, never "later".
// Also (P21; Bob, K5326): in each lane HANDOFF file (`build/plan/beta/*/HANDOFF.md`,
// `docs/development/investigation-design/HANDOFF.md`) every line that starts a dated report (`**P-<n>`, `**H<n>`, `**R<n>`,
// `**L<n>`, `**U<n>` or `**B<n>`) and holds a date of EVIDENCE_FROM or later has `Evidence:` within the entry (up to the
// next line that starts a report, or a heading). Earlier entries are exempt.
// Usage: node checks/format.mjs <product-root>
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { requirementIds, requirementFiles, report, trackedFiles } from './lib.mjs';

const SECTIONS = ['## Public', '### Purpose', '### Provides', '## Private', '### Uses', '### Invariants', '### Satisfies'];

// N440 (P3): an unresolved merge leaves conflict markers; a build-state file holding one is refused.
function conflictMarkers(root) {
  const files = ['build/modules.json', 'build/layers.md', 'build/plan/current.md', 'build/plan/next.md', 'build/rulings.md',
    ...requirementFiles(root).map((id) => `build/requirements/${id}.md`)];
  const out = [];
  for (const f of files) {
    if (!existsSync(join(root, f))) continue;
    readFileSync(join(root, f), 'utf8').split('\n').forEach((l, i) => {
      if (l.startsWith('<<<<<<< ') || l.replace(/\r$/, '') === '=======' || l.startsWith('>>>>>>> ')) out.push(`${f}:${i + 1}: merge-conflict marker`);
    });
  }
  return out;
}

// K1007 (P4, P15): an owned path names something that exists: a tracked file, a directory holding tracked files,
// or a file or directory present in the checkout (a `tests` directory a job has yet to fill counts if it exists).
function pathExists(root, tracked) {
  return (p) => {
    if (existsSync(join(root, p))) return true;
    const dir = p.endsWith('/') ? p : `${p}/`;
    return tracked.some((f) => f === p || f.startsWith(dir));
  };
}

// The approvals revision (bio K1177, `next.md` P1; P15, P17, mechanics §16): a ruling records Bob's approval of a refused act
// when it says `approved` and cites §16 or names the permission check (`permission`, `auto-mode` or `safety check`).
// It must state `standing list: added <rule>` (the settings.json rule in backticks) or `standing list: not added (<why>)`. The rulings up to and including
// K1181 predate the rule and are exempt.
export const APPROVALS_LAST_EXEMPT = 1181;
// Ruling ids given twice before this check existed, kept as written because later rulings cite them (bio K5349: the
// action-plans merge and T51b R1's close, 2026-10-27; lane HANDOFF R17).
export const RULING_DUPS_EXEMPT = ['K5349'];
const RULING = /^- K(\d+) · /;
const STANDING = /standing list: (?:added\s+`[^`]+`|not added\s*\(\s*[^\s)])/i;
export function isApprovalRuling(line) {
  return /\bapproved\b/i.test(line) && (/§16(?!\d)/.test(line) || /\b(?:permission|auto-mode|safety) check\b/i.test(line));
}
function approvalRulings(root, lastExempt) {
  const p = join(root, 'build/rulings.md');
  if (!existsSync(p)) return [];
  const out = [];
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(RULING);
    if (!m || Number(m[1]) <= lastExempt || !isApprovalRuling(line) || STANDING.test(line)) return;
    out.push(`build/rulings.md:${i + 1}: K${m[1]} records Bob's approval of a refused act but states no standing-list decision ("standing list: added \`<rule>\`" or "standing list: not added (<why>)", §16)`);
  });
  return out;
}

// N656 (bio K1763 (5), K1762 (2); P15, P17; a proposed revision until certified, §15): every statement of a limit on
// Anthropic's accounts, plans or terms cites the register (`AT-n`, `U-n`) or a ruling of Bob's (a K id with "Bob's").
// The register's path is read from `build/manifest.md` (a row naming Anthropic and a backticked `build/….md`), else
// `build/terms/anthropic.md`; a product with no register skips the arm. Scope: `build/requirements/*.md`, the plan's
// `current.md`, `next.md` and `draft-*.md`, `build/manifest.md`, rulings from TERMS_FIRST_RULING on, and
// `docs/architecture/*.md`. A sentence is read with its code spans removed; fenced code blocks are skipped.
export const TERMS_FIRST_RULING = 1764;

// P19, mechanics §8.4 (bio K3923): "An entry added to `next.md` while a tranche runs names one of P19's three reasons
// (Bob's pending decision, a deployment or measurement outside the tranche, something outside the product not yet
// existing); any other reason fails." Each entry line of `build/plan/next.md` (one line each) carries `hard reason: `
// and the text after it begins with one of NEXT_REASONS. No other plan file is judged.
export const NEXT_REASONS = /^(?:Bob's|a deployment|a measurement|outside the product)/i;
const ENTRY = /^- ((?:N|T\d+[a-z]?-)\d+|[A-Z]+-\d+) · /;
function nextReasons(root) {
  const p = join(root, 'build/plan/next.md');
  if (!existsSync(p)) return [];
  const out = [];
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(ENTRY);
    if (!m) return;
    const at = line.indexOf('hard reason: ');
    const reason = at < 0 ? null : line.slice(at + 'hard reason: '.length).replace(/^[*_\s]+/, '');
    if (reason !== null && NEXT_REASONS.test(reason)) return;
    out.push(`build/plan/next.md:${i + 1}: ${m[1]} names no P19 hard reason (Bob's, a deployment, a measurement, outside the product)${reason ? ` : "${reason.slice(0, 60)}"` : ''}`);
  });
  return out;
}
// P19, mechanics §8.4 (bio K5015): a line that defers work, outside `next.md`, cites `next.md`.
export const DEFERRAL = /\b(?:next fix round|next round|a later round|later tranche|deferred to)\b/i;
export function deferralFiles(root) {
  const files = ['build/plan/current.md', 'build/handoff.md'];
  const cur = join(root, 'build/plan/current.md');
  if (existsSync(cur)) {
    for (const m of readFileSync(cur, 'utf8').matchAll(/build\/plan\/(fix-round-[A-Za-z0-9._-]*?\.md)/g)) {
      const f = `build/plan/${m[1]}`;
      if (!files.includes(f) && existsSync(join(root, f))) files.push(f);
    }
  }
  return files.filter((f) => existsSync(join(root, f)));
}
function deferrals(root) {
  const out = [];
  for (const f of deferralFiles(root)) {
    readFileSync(join(root, f), 'utf8').split('\n').forEach((line, i) => {
      const m = line.match(DEFERRAL);
      if (m && !/next\.md/.test(line)) out.push(`${f}:${i + 1}: defers work ("${m[0]}") without citing next.md; work that waits is an entry of next.md only, with its P19 reason (P19)`);
    });
  }
  return out;
}
// A limit: a word or phrase that restricts; an Anthropic subject must also stand near it (statesLimit).
export const TERMS_LIMIT = new RegExp([
  String.raw`\b(?:may not|must not|cannot|can't|can ?not|forbids?|forbidden|forbidding|bars?|barred|not permitted|not allowed|prohibit(?:s|ed)?|member-only|no group-wide)\b`,
  // `never` of the product's own handling of a secret (never stored, shown, a binding) is not a limit on the terms.
  String.raw`\bnever\b(?!\s+(?:stored|shown|logged|echoed|exported|kept|written|a binding|into|fails?|as a password)\b)`,
  // `only` that opens a condition of the product's own (only by, through, with, when, where, until, from, if) is not.
  String.raw`\bonly\b(?!\s+(?:by|through|with|when|where|until|from|if)\b)`,
  String.raw`\bown\s+(?:[\w'’-]+\s+){0,2}only\b`,
].join('|'), 'i');
// An Anthropic subject. Free, Pro and Max count only as plan names: capitalised and beside another plan name,
// "plan", "subscription", "user" or "tier".
export const TERMS_SUBJECT = new RegExp([
  String.raw`\bsubscriptions?\b`, // The group's own API key is the product's credential (Bob's K1755; permitted, AT-9): how the product handles it is
  // product text. An "API-key path" is the product's route, not the terms'.
  String.raw`(?<!group(?:'s|’s) (?:Anthropic |one |own )?)\bAPI[- ]keys?\b(?![- ]path)`, String.raw`\bClaude(?:\.ai)? accounts?\b`,
  String.raw`\b(?:Consumer|Commercial) Terms\b`, String.raw`\bTeam plans?\b`, String.raw`\bEnterprise\b`,
  String.raw`\bsetup-token\b`, String.raw`\bOAuth\b(?!\s+(?:client|app)s?\b)`, String.raw`\bAnthropic(?:'s|’s)? (?:terms|plans?|accounts?|policies|policy|rules?)\b`,
  String.raw`\b(?:Free|Pro|Max)\b(?=\s*(?:,|/|\bor\b|\band\b|plans?\b|subscriptions?\b|users?\b|tiers?\b))`,
  String.raw`(?:,\s*|/|\bor |\band )(?:Free|Pro|Max)\b`,
].join('|'));
const TERMS_ID = /\b(?:AT|U)-\d+\b/g;
// A sentence states a limit when a limit word and a subject stand within TERMS_NEAR characters of each other: a long
// sentence about the product's own behaviour that only mentions an account in passing is not a claim about the terms.
export const TERMS_NEAR = 40;
const all = (re, s) => [...s.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`))];
// Returns the limit word's index, or -1.
export function statesLimit(s) {
  const subjects = all(TERMS_SUBJECT, s);
  if (!subjects.length) return -1;
  const hit = all(TERMS_LIMIT, s).find((l) => subjects.some((m) => {
    const gap = l.index < m.index ? m.index - (l.index + l[0].length) : l.index - (m.index + m[0].length);
    return gap <= TERMS_NEAR;
  }));
  return hit ? hit.index : -1;
}

export function registerPath(root) {
  const manifest = join(root, 'build/manifest.md');
  if (existsSync(manifest)) {
    for (const line of readFileSync(manifest, 'utf8').split('\n')) {
      if (!/Anthropic/.test(line)) continue;
      const m = line.match(/`(build\/[^`\s]+\.md)`/);
      if (m) return m[1];
    }
  }
  return 'build/terms/anthropic.md';
}

// The ids a register defines: an `AT-n` or `U-n` that opens a heading or is written in bold.
export function registerIds(text) {
  const ids = new Set();
  for (const line of text.split('\n')) {
    const h = line.match(/^#+\s+((?:AT|U)-\d+)\b/);
    if (h) ids.add(h[1]);
    for (const m of line.matchAll(/\*\*((?:AT|U)-\d+)\b/g)) ids.add(m[1]);
  }
  return ids;
}

function termsScope(root, register) {
  const files = ['build/manifest.md', 'build/plan/current.md', 'build/plan/next.md'];
  const md = (dir, keep = () => true) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && keep(e.name)).map((e) => `${dir}/${e.name}`).sort() : []);
  files.push(...md('build/requirements'), ...md('build/plan', (n) => n.startsWith('draft-')), ...md('docs/architecture'));
  return files.filter((f) => f !== register && existsSync(join(root, f)));
}

// A line's sentences: split after . ! ? or ; before a new clause, and at the ` · ` field separator.
function sentences(line) {
  return line.split(/(?<=[.!?;][*"”)]*)\s+(?=[A-Z*"“(\[`_])|\s+·\s+/).filter((s) => s.trim());
}

export function termsClaims(root) {
  const register = registerPath(root);
  if (!existsSync(join(root, register))) return { failures: [], skipped: true };
  const ids = registerIds(readFileSync(join(root, register), 'utf8'));
  const failures = [];
  const files = [...termsScope(root, register), ...(existsSync(join(root, 'build/rulings.md')) && register !== 'build/rulings.md' ? ['build/rulings.md'] : [])];
  let lines = 0;
  for (const f of files) {
    let fence = false;
    readFileSync(join(root, f), 'utf8').split('\n').forEach((raw, i) => {
      if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; return; }
      if (fence) return;
      if (f === 'build/manifest.md' && raw.includes(`\`${register}\``)) return; // the row that names the register describes it
      if (f === 'build/rulings.md') { const k = raw.match(RULING); if (!k || Number(k[1]) < TERMS_FIRST_RULING) return; }
      lines++;
      const line = raw.replace(/`[^`]*`/g, ' ');
      for (const s of sentences(line)) {
        const named = s.match(TERMS_ID) || [];
        const unknown = named.filter((id) => !ids.has(id));
        const at = statesLimit(s);
        const from = s.length <= 120 || at < 60 ? 0 : Math.min(at - 60, s.length - 120);
        const excerpt = `${from ? '…' : ''}${s.slice(from).replace(/\s+/g, ' ').trim().replace(/^[-*#>\s|]+/, '').slice(0, 120)}`;
        if (unknown.length) { failures.push(`${f}:${i + 1}: uncited limit on Anthropic's terms ("${excerpt}"): ${[...new Set(unknown)].join(', ')} not in ${register}`); continue; }
        if (at < 0) continue;
        if (named.length) continue;
        if (/\bK\d+\b/.test(s) && /\bBob(?:'s|’s)?\b/.test(s)) continue;
        failures.push(`${f}:${i + 1}: uncited limit on Anthropic's terms ("${excerpt}")`);
      }
    });
  }
  return { failures, skipped: false, register, lines };
}

// Each ruling id once (P15: a ruling is cited by its id). `proc ruling` and `proc merge` number from the file as it
// stands; an id written by hand could repeat one (lane R17), and this finds it.
function rulingIds(root, exempt = RULING_DUPS_EXEMPT) {
  let text; try { text = readFileSync(join(root, 'build/rulings.md'), 'utf8'); } catch { return []; }
  const first = new Map(), failures = [];
  text.split('\n').forEach((l, i) => {
    const k = l.match(RULING)?.[1]; if (!k) return;
    if (first.has(k) && !exempt.includes(`K${k}`)) failures.push(`build/rulings.md:${i + 1}: K${k} given twice (first at line ${first.get(k)}); number rulings by \`proc ruling\``);
    if (!first.has(k)) first.set(k, i + 1);
  });
  return failures;
}

// P21: a lane's dated report carries its evidence.
export const EVIDENCE_FROM = '2026-10-28';
const REPORT_START = /^\*\*(?:P-|H|R|L|U|B)\d+/;
export function handoffFiles(root) {
  const dir = join(root, 'build/plan/beta');
  const lanes = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `build/plan/beta/${e.name}/HANDOFF.md`).sort() : [];
  return [...lanes, 'docs/development/investigation-design/HANDOFF.md'].filter((f) => existsSync(join(root, f)));
}
function laneEvidence(root, from = EVIDENCE_FROM) {
  const out = [];
  for (const f of handoffFiles(root)) {
    const lines = readFileSync(join(root, f), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!REPORT_START.test(line) || !(line.match(/\b\d{4}-\d{2}-\d{2}\b/g) || []).some((d) => d >= from)) return;
      let end = i + 1;
      while (end < lines.length && !REPORT_START.test(lines[end]) && !/^#/.test(lines[end])) end++;
      if (!lines.slice(i, end).some((l) => l.includes('Evidence:'))) out.push(`${f}:${i + 1}: the report "${line.slice(0, 40)}" dated ${from} or later has no "Evidence:" in its entry (a command run with its result, a file:line, or a test run with its totals; P21)`);
    });
  }
  return out;
}

// N656 (K1763) is opt-in until certified by its dry run (P3; dryrun/CERTIFICATION.md TC1): CIVICOS_TERMS_CHECK=1.
export function checkFormat(root, { approvalsLastExempt = APPROVALS_LAST_EXEMPT, terms: withTerms = process.env.CIVICOS_TERMS_CHECK === '1' } = {}) {
  const terms = withTerms ? termsClaims(root) : { failures: [], skipped: true };
  const failures = [...conflictMarkers(root), ...rulingIds(root), ...approvalRulings(root, approvalsLastExempt), ...nextReasons(root), ...deferrals(root), ...laneEvidence(root), ...terms.failures];
  let tracked = [];
  try { tracked = trackedFiles(root); } catch { /* not a git repository: the checkout alone is read */ }
  const exists = pathExists(root, tracked);
  let state;
  try { state = JSON.parse(readFileSync(join(root, 'build/modules.json'), 'utf8')); }
  catch (e) { return { failures: [...failures, `build/modules.json: does not parse (${e.message})`], summary: 'stopped' }; }
  const mods = Array.isArray(state.modules) ? state.modules : [];
  if (!mods.length) failures.push('build/modules.json: no modules');
  const seen = new Map();
  const claimed = new Map();
  let lastLayer = 0;
  mods.forEach((m, i) => {
    const at = `build/modules.json: ${m && m.id ? m.id : `module ${i}`}`;
    if (!m || typeof m.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(m.id)) { failures.push(`${at}: id missing or invalid`); return; }
    if (seen.has(m.id)) failures.push(`${at}: id given twice`);
    if (!Number.isInteger(m.layer) || m.layer < 1) failures.push(`${at}: layer is not a positive integer`);
    else if (m.layer < lastLayer) failures.push(`${at}: layer ${m.layer} after layer ${lastLayer}; a layer's modules are adjacent and in order (P4)`);
    else lastLayer = m.layer;
    for (const k of ['paths', 'tests', 'uses']) if (!Array.isArray(m[k])) failures.push(`${at}: ${k} is not a list`);
    for (const p of [...(m.paths || []), ...(m.tests || [])]) {
      if (claimed.has(p) && claimed.get(p) !== m.id) failures.push(`${at}: path ${p} is also claimed by ${claimed.get(p)}`);
      claimed.set(p, m.id);
    }
    for (const k of ['paths', 'tests']) for (const p of Array.isArray(m[k]) ? m[k] : []) {
      if (!exists(p)) failures.push(`${at}: ${k} entry ${p} names no file or directory in the product`);
    }
    for (const u of m.uses || []) {
      if (u === '*earlier') { if (!m.legacy) failures.push(`${at}: only a legacy module may use "*earlier"`); continue; }
      if (!seen.has(u)) failures.push(`${at}: uses ${u}, which is ${mods.some((x) => x.id === u) ? 'not earlier in the order' : 'no module'}`);
    }
    for (const f of [].concat(m.from ?? [])) if (!mods.some((x) => x.id === f && x.legacy)) failures.push(`${at}: from ${f}, which is no legacy module`);
    seen.set(m.id, m);
  });
  for (const p of state.not_product || []) if (claimed.has(p)) failures.push(`build/modules.json: ${p} is both not_product and owned by ${claimed.get(p)}`);

  // layers.md: each layer row lists exactly that layer's modules, in order.
  const layersPath = join(root, 'build/layers.md');
  if (existsSync(layersPath)) {
    const rows = readFileSync(layersPath, 'utf8').split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l));
    const layers = new Set(mods.map((m) => m.layer));
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map((c) => c.trim());
      const n = Number(cells[0]);
      if (!layers.has(n)) continue; // a table of another kind (the legacy modules' line counts has no layer number first)
      const listed = cells[cells.length - 1].split(',').map((s) => s.trim()).filter(Boolean);
      const actual = mods.filter((m) => m.layer === n).map((m) => m.id);
      if (listed.join(',') !== actual.join(',')) failures.push(`build/layers.md: layer ${n} lists ${listed.join(', ')}, but modules.json has ${actual.join(', ')}`);
      layers.delete(n);
    }
    for (const n of layers) failures.push(`build/layers.md: layer ${n} has no row`);
  } else failures.push('build/layers.md: missing');

  // Requirements files: one per module, the sections of mechanics §3, each id once.
  let reqFiles = 0;
  for (const id of requirementFiles(root)) {
    reqFiles++;
    const at = `build/requirements/${id}.md`;
    if (!seen.has(id)) failures.push(`${at}: names no module of build/modules.json`);
    const text = readFileSync(join(root, at), 'utf8');
    let from = 0;
    for (const s of SECTIONS) {
      const i = text.split('\n').findIndex((l, k) => k >= from && l.trim() === s);
      if (i < 0) failures.push(`${at}: section "${s}" missing or out of order`); else from = i + 1;
    }
    const { all } = requirementIds(text);
    const dup = all.filter((r, i) => all.indexOf(r) !== i);
    if (dup.length) failures.push(`${at}: ids given twice: ${[...new Set(dup)].join(' ')}`);
  }

  // The plan: an entry id once per module. An entry shared by two modules (a provided service and its
  // user) is listed under each; a module heading is a line that is only a bold module id, or several.
  for (const plan of ['build/plan/current.md', 'build/plan/next.md']) {
    if (!existsSync(join(root, plan))) continue;
    let under = '';
    const keys = [];
    for (const line of readFileSync(join(root, plan), 'utf8').split('\n')) {
      if (/^\*\*[a-z][a-z0-9-]*\*\*(,\s*\*\*[a-z][a-z0-9-]*\*\*)*(\s*\(.*\))?\s*$/.test(line) || /^#/.test(line)) { under = line; continue; }
      const m = line.match(/^- ((?:N|T\d+[a-z]?-)\d+|[A-Z]+-\d+) · /);
      if (m) keys.push(`${m[1]}\u0000${under}`);
    }
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i).map((k) => k.split('\u0000')[0]);
    if (dup.length) failures.push(`${plan}: entry ids given twice under one module: ${[...new Set(dup)].join(' ')}`);
  }
  return { failures, summary: `${mods.length} modules, ${reqFiles} requirements files${terms.skipped ? '' : `, terms register ${terms.register}`}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failures, summary } = checkFormat(process.argv[2] || '.');
  process.exitCode = report('format', failures, summary);
}
