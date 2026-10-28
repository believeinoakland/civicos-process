// The process tool (lane-process-redesign/DESIGN.md §2.4; Bob, K5326: "Step that must aways happen belong in code,
// not instructions!"). One command per procedure. Each checks the state it needs, does the whole procedure, commits and
// pushes, and refuses (exit 1, naming what is missing) when it cannot; it never leaves a step half done. A platform act
// a script cannot take (start a session, send a message, archive a session) is printed as the exact call, recorded as
// owed in the plan's Owed line, and cleared by the command that records its result; a hook checks the call (hooks.mjs).
//
// State in git (DESIGN §2.3), product-relative:
//   build/plan/current.md      **Status** · <STATE> · <BOB name> · <session> · depth <d>     (the BOB to message)
//                              **Round** · R<k> · layer <L> <OPEN|CLOSED>, …
//                              **Jobs** · <module>: <NAME #k> <session>; …                   (each job's live session)
//                              **Owed** · <act>; <act>                                       (platform acts printed, not yet done)
//   build/jobs/<T>/<module>.md **Status** · <session> · depth <d> · <STATE>                 (the job's record)
//                              STATE: WORKING · WAITING: <question> · BLOCKED: <cause> · NEEDS BOB: <act> · COMPLETE
//   build/plan/starts-<T>/<module>.txt   the START text, the job's first message
//   build/rulings.md           - K<n> · <date> · <module> · <ruling> · <why>
//   build/metrics/<T>.csv      one row per archived session
// The working context of a role, for the hooks, is `.git/civicos-role.json` (never committed): written by `takeover`
// (BOB) and `job start` (job).
//
// Usage: node tools/proc.mjs <command> --product <dir> --tranche <T> [options]
//   BOB   takeover --name "BOB #n" --session <id> --depth <d>   status [--gate]   round open --round R<k> --plan <file>
//         layer start --layer <L> [--usage <status>] [--modules <m1,m2> (only these, in a started layer)]   job started --module <m> --name "<M> #k" --session <id>
//         job messaged --module <m>   job route --module <m> [--context-pct <n>] [--session-status <s>]   merge --module <m> [--with <m2>[,<m3>]] [--context <pct>]
//         layer close --layer <L>   job archived --module <m> --usage <json>   bob cleared --name --session (--reply|--unanswered)   bob archived --name --session --usage   round close   handoff
//   job   job start --module <m> --session <id> --depth <d>   job state --module <m> --set <STATE>
//         job complete --module <m> [--with <m2>] --report-file <f>   (the report needs a `**Evidence**` section, P20)
//   any   addr (--bob | --module <m>)   shims --out <dir> --process <path>   history --ref <ref> (before a merge made by hand)   sizes (every document over its limit; a lane runs it before each commit)   footprint [--base <ref>]
//         tests --modules <m1,m2> [--users] [--base <ref>] [--heap-mb <n>] [--cap-mb <n>] [--timeout-min <n>] (a pass's test run; lane R14)
//         ruling --line-file <f> [--files <p1,p2>] (BOB's own ruling, numbered by the tool; lane R17)
//         steps --file <steps.md> --source <p1,p2,…> [--product <dir>] (P20: a step for Bob is sent only as this printed it; needs no --tranche)
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, openSync, closeSync } from 'node:fs';
import { totalmem, availableParallelism } from 'node:os';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeLines } from './mail.mjs';
import { artifactRows, isGenerated } from '../checks/lib.mjs';

const PROCESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PLAN = 'build/plan/current.md';
export const recordPath = (T, m) => `build/jobs/${T}/${m}.md`;
export const startPath = (T, m) => `build/plan/starts-${T}/${m}.txt`;
export const JOBRULES = 'build/situations/job.md';   // the product's standing rules for every job, named in each START
export const jobBranch = (T, m) => `job/${T}/${m}`;
export const trancheBranch = (T) => `tranche/${T}`;
const SESSION = /^session_[0-9A-Za-z]+$/;
const today = () => new Date().toISOString().slice(0, 10);
class Refused extends Error {}
const refuse = (msg) => { throw new Refused(msg); };

// ---- git and files ----

export function repo(product) {
  const dir = resolve(product || '.');
  const root = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const g = (args, quiet = true) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', quiet ? 'ignore' : 'inherit'], maxBuffer: 64 << 20 }).trim();
  const rel = (p) => relative(root, join(dir, p)) || '.';
  const read = (p) => { const f = join(dir, p); return existsSync(f) ? readFileSync(f, 'utf8') : null; };
  const write = (p, text) => { const f = join(dir, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };
  const remote = (branch, p) => { try { return g(['show', `origin/${branch}:${rel(p)}`]); } catch { return null; } };
  const fetch = (...branches) => { for (const b of branches) { try { g(['fetch', '-q', 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`]); } catch { /* absent */ } } };
  const branch = () => g(['rev-parse', '--abbrev-ref', 'HEAD']);
  return { dir, root, g, rel, read, write, remote, fetch, branch };
}
// A cloud session starts on a shallow clone (its last 50 commits); older history stays on the remote and is fetched
// only when a step needs it: where two lines of work split (bio's full-history download at session start is retired,
// lane HANDOFF R8). Deepens the clone until `a` and `b` have a merge base, then returns it (null: no common history).
export function history(R, a, b) {
  const base = () => { try { return R.g(['merge-base', a, b]); } catch { return null; } };
  const named = [a, b].filter((x) => x.startsWith('origin/'));
  const refs = named.map((x) => `+refs/heads/${x.slice(7)}:refs/remotes/${x}`);
  // Deepening adds history; it never moves a ref the session already holds (D25: it had moved a pinned origin/main).
  const held = Object.fromEntries(named.map((x) => { try { return [x, R.g(['rev-parse', '--verify', '-q', `refs/remotes/${x}`])]; } catch { return [x, null]; } }));
  const keep = () => { for (const [x, sha] of Object.entries(held)) if (sha) R.g(['update-ref', `refs/remotes/${x}`, sha]); };
  for (let depth = 200; ; depth *= 5) {
    const found = base();
    if (found || R.g(['rev-parse', '--is-shallow-repository']) !== 'true') return found;
    if (depth > 125000) R.g(['fetch', '-q', '--unshallow', 'origin', ...refs]);
    else R.g(['fetch', '-q', `--deepen=${depth}`, 'origin', ...refs]);
    keep();
  }
}
function on(R, want) { const b = R.branch(); if (b !== want) refuse(`check out ${want} first (on ${b})`); }
// Commit the named files and push; a push that loses a race merges the remote once (never a rebase, never a force).
function commitPush(R, branch, paths, message) {
  // A path already removed (staged with `git rm`, or gone from the working tree but tracked) is staged as a deletion.
  const gone = (p) => { if (existsSync(join(R.root, R.rel(p)))) return false; try { R.g(['cat-file', '-e', `HEAD:${R.rel(p)}`]); return true; } catch { return false; } };
  const del = paths.filter(gone), keep = paths.filter((p) => !del.includes(p));
  if (del.length) R.g(['rm', '-q', '--cached', '--ignore-unmatch', '--', ...del.map(R.rel)]);
  R.g(['add', '--', ...keep.map(R.rel)]);
  try { R.g(['diff', '--cached', '--quiet']); } catch { R.g(['commit', '-q', '-m', message]); }
  try { R.g(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`]); }
  catch { R.g(['pull', '-q', '--no-rebase', '--no-edit', 'origin', branch]); R.g(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`]); }
  return R.g(['rev-parse', '--short', 'HEAD']);
}
// Unpushed or uncommitted work in this checkout: the reason a turn may not end (hooks.mjs).
export function unpushed(R) {
  const out = [];
  if (R.g(['status', '--porcelain', '--untracked-files=no'])) out.push('uncommitted changes');
  const b = R.branch();
  try { const n = Number(R.g(['rev-list', '--count', `origin/${b}..HEAD`])); if (n) out.push(`${n} commit(s) on ${b} not pushed`); } catch { out.push(`${b} has never been pushed`); }
  return out;
}
export function modules(R) {
  const all = JSON.parse(R.read('build/modules.json') || '[]');
  return Array.isArray(all) ? all : all.modules;
}
function roleFile(R) { return join(R.root, '.git', 'civicos-role.json'); }
export function readRole(root) { const f = join(root, '.git', 'civicos-role.json'); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; }

// ---- the plan ----

const STATUS = /^\*\*Status\*\* · ([A-Z]+) · (\S+(?: \S+)? #\d+) · (session_[0-9A-Za-z]+) · depth (\d+)$/m;
export function parsePlan(text) {
  const t = text || '';
  const s = t.match(STATUS);
  const line = (k) => t.match(new RegExp(`^\\*\\*${k}\\*\\* · (.*)$`, 'm'))?.[1] ?? '';
  const jobs = [...line('Jobs').matchAll(/([a-z][a-z0-9-]*): ([A-Z][A-Z0-9-]* #\d+) (session_[0-9A-Za-z]+)/g)].map((x) => ({ module: x[1], name: x[2], session: x[3] }));
  const owed = line('Owed').split('; ').map((x) => x.trim()).filter((x) => x && x !== 'none');
  const r = line('Round').match(/^R(\d+)(.*)$/);
  const layers = r ? [...r[2].matchAll(/layer (\d+) (OPEN|CLOSED)/g)].map((x) => ({ layer: Number(x[1]), state: x[2] })) : [];
  return { state: s?.[1] ?? null, bob: s ? { name: s[2], session: s[3], depth: Number(s[4]) } : null, round: r ? Number(r[1]) : 0, layers, jobs, owed };
}
function setLine(text, key, value, after = '**Status**') {
  const re = new RegExp(`^\\*\\*${key}\\*\\* · .*$`, 'm'), line = `**${key}** · ${value}`;
  if (re.test(text)) return text.replace(re, line);
  const i = text.indexOf(after);
  if (i < 0) return text.replace(/^(# .*\n)/, `$1\n${line}\n`);
  const end = text.indexOf('\n', i);
  return `${text.slice(0, end + 1)}${line}\n${text.slice(end + 1)}`;
}
// The repository's GitHub URL, for create_session's source_url (a proxied remote names owner/repo at its end).
export function sourceUrl(R) { const u = R.g(['remote', 'get-url', 'origin']); const m = u.match(/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/); return m ? `https://github.com/${m[1]}/${m[2]}` : u; }
const fmtJobs = (jobs) => jobs.map((j) => `${j.module}: ${j.name} ${j.session}`).join('; ') || 'none';
const fmtRound = (n, layers) => `R${n}${layers.map((l) => ` · layer ${l.layer} ${l.state}`).join('')}`;
function planEdit(R, T, edit, message) {
  on(R, trancheBranch(T));
  const text = R.read(PLAN) ?? refuse(`no ${PLAN}`);
  const p = parsePlan(text);
  const next = edit(text, p);
  R.write(PLAN, next);
  return commitPush(R, trancheBranch(T), [PLAN], message);
}
const addOwed = (text, p, acts) => setLine(text, 'Owed', [...new Set([...p.owed, ...acts])].join('; ') || 'none');
const clearOwed = (text, p, act) => setLine(text, 'Owed', p.owed.filter((x) => x !== act).join('; ') || 'none');

// ---- the job record ----

const RSTATUS = /^\*\*Status\*\* · (session_[0-9A-Za-z]+) · depth (\d+) · (.+)$/m;
export function parseRecord(text) { const m = (text || '').match(RSTATUS); return m ? { session: m[1], depth: Number(m[2]), state: m[3] } : null; }
export const STATES = /^(WORKING|COMPLETE|WAITING: .+|BLOCKED: (tests|context|reading|needs Bob)\b.*|NEEDS BOB: .+)$/;

// ---- commands: any role ----

export function addr(o) {
  const R = repo(o.product); R.fetch(trancheBranch(o.tranche));
  const p = parsePlan(R.remote(trancheBranch(o.tranche), PLAN) ?? R.read(PLAN));
  if (o.bob) return p.bob?.session ?? refuse('no BOB in the plan\'s Status line');
  return p.jobs.find((j) => j.module === o.module)?.session ?? refuse(`no session for ${o.module} in the plan's Jobs line`);
}

// ---- commands: BOB ----

// The tranche's footprint in the repository (P14; lane HANDOFF R9): its commits since `--base` (default origin/main),
// each non-merge commit by what it changed: product code or tests, job records only, other build state only, docs.
// Reported at the tranche's close, so bookkeeping that grows back is seen within one tranche.
export function footprint(o) {
  const R = repo(o.product), ref = o.base || 'origin/main';
  if (ref.startsWith('origin/')) R.fetch(ref.slice(7));
  const base = history(R, ref, 'HEAD') ?? refuse(`${ref} shares no history with HEAD`);
  const pre = R.rel('.') === '.' ? '' : `${R.rel('.')}/`;
  const kinds = { product: 0, 'job records': 0, 'other build state': 0, docs: 0 };
  let merges = 0;
  for (const block of R.g(['log', '--format=@@%P', '--name-only', `${base}..HEAD`]).split('@@').slice(1)) {
    const [parents, ...files] = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (parents.split(' ').length > 1) { merges++; continue; }
    const rel = files.map((f) => (f.startsWith(pre) ? f.slice(pre.length) : `../${f}`));
    if (!rel.length) continue;
    const k = rel.every((f) => f.startsWith('build/jobs/')) ? 'job records' : rel.every((f) => f.startsWith('build/')) ? 'other build state'
      : rel.every((f) => f.startsWith('build/') || f.startsWith('docs/')) ? 'docs' : 'product';
    kinds[k]++;
  }
  const commits = Object.values(kinds).reduce((a, b) => a + b, 0);
  return { base, commits, merges, kinds, bookkeeping: commits ? `${Math.round((100 * (commits - kinds.product)) / commits)} %` : '0 %' };
}
// Before a merge BOB makes itself (the tranche's close merges `main` into it, §5.7): the history that merge needs.
export function historyCmd(o) {
  const R = repo(o.product); const ref = o.ref || refuse('--ref <ref>, e.g. origin/main');
  if (ref.startsWith('origin/')) R.fetch(ref.slice(7));
  const base = history(R, ref, 'HEAD') ?? refuse(`${ref} shares no history with HEAD`);
  return { ref, base, shallow: R.g(['rev-parse', '--is-shallow-repository']) === 'true' };
}

// §5.1 whole: the Status line, the role file, and everything a successor must act on, from git alone.
export function takeover(o) {
  if (!/^BOB #\d+$/.test(o.name || '') || !SESSION.test(o.session || '')) refuse('--name "BOB #<n>" --session <id> --depth <d>');
  const R = repo(o.product), T = o.tranche;
  const before = parsePlan(R.read(PLAN));
  const commit = planEdit(R, T, (text, p) => setLine(text, 'Status', `${p.state || 'OPEN'} · ${o.name} · ${o.session} · depth ${Number(o.depth)}`, '# '), `plan ${T}: ${o.name} ${o.session} takes over`);
  writeFileSync(roleFile(R), JSON.stringify({ role: 'bob', product: R.rel('.'), tranche: T, session: o.session }));
  const acts = [];
  if (Number(o.depth) !== 1) acts.push(`tell Bob: BOB at depth ${o.depth}, not 1 (P13)`);
  if (before.bob && before.bob.session !== o.session) acts.push(`send_message to ${before.bob.name} ${before.bob.session}: "TAKEN OVER by <your name>: delete every routine into your own session, then reply ROUTINES DELETED"; wait for its reply (situations/takeover.md)`, `once it replies: proc bob cleared --name "${before.bob.name}" --session ${before.bob.session} --reply "<its reply>" (none after 20 minutes and one more message: --unanswered "<why>")`, `archive ${before.bob.name} ${before.bob.session} once idle, then: proc bob archived --name "${before.bob.name}" --session ${before.bob.session} --usage '<archive_session usage json>'`);
  acts.push('arm the backstop: send_later into your own session, 60 minutes (DESIGN §2.7)');
  // A product inside this repository (the dry run) reaches the process by its project dir; any other at PROCESS.
  const via = R.root === PROCESS ? '${CLAUDE_PROJECT_DIR:-.}' : PROCESS;
  for (const [k, v] of Object.entries(shims({ process: via }))) {
    const f = join(R.root, '.claude/skills', k, 'SKILL.md');
    if (!existsSync(f) || readFileSync(f, 'utf8') !== v) acts.push(`the role skill .claude/skills/${k}/SKILL.md ${existsSync(f) ? 'differs from' : 'is missing; write it with'} \`proc shims --out <repo>/.claude/skills --process '${via}'\`: rewrite it so, commit and push (DESIGN §3)`);
  }
  const st = status(o);
  for (const s of st.size.filter((x) => x.startsWith('SIZE '))) acts.push(`prune ${s.split(' ')[1]} under its limit (mechanics §17): ${s}`);
  for (const u of unplacedBobRulings(R)) acts.push(`give Bob's ruling a home (rulings-active.md, build/rulings-product/, build/situations/, or bob-rulings-placed.txt): ${u}`);
  return { commit, previous: before.bob, owed: before.owed, jobs: st.jobs, size: st.size, acts };
}
// Every job's state, read from git; quiet jobs; owed acts; documents over or near their limits (mechanics §17: listed for
// BOB to prune, never a gate on anyone, bio K5123). `gate` adds the reasons this BOB may not end a turn.
export function status(o) {
  const R = repo(o.product), T = o.tranche, now = o.now ?? Date.now();
  R.fetch(trancheBranch(T));
  const p = parsePlan(R.read(PLAN));
  const jobs = p.jobs.map((j) => {
    const jb = jobBranch(T, j.module);
    R.fetch(jb);
    const rec = parseRecord(R.remote(jb, recordPath(T, j.module)));
    let pushed = NaN; try { pushed = Number(R.g(['log', '-1', '--format=%ct', `origin/${jb}`])) * 1000; } catch { /* none */ }
    let merged = false; try { history(R, `origin/${jb}`, 'HEAD'); R.g(['merge-base', '--is-ancestor', `origin/${jb}`, 'HEAD']); merged = true; } catch { /* not merged */ }
    const state = rec?.state ?? 'NOT STARTED';
    const quiet = state === 'WORKING' && now - pushed > 60 * 60e3;
    const needs = [];
    if (!rec) needs.push('UNCONFIRMED');
    if (state === 'COMPLETE' && !merged) needs.push('MERGE');
    if (/^WAITING: /.test(state)) needs.push('ANSWER');
    if (/^(BLOCKED|NEEDS BOB)/.test(state)) needs.push(/^NEEDS BOB/.test(state) ? 'RELAY TO BOB' : 'UNBLOCK');
    if (quiet) needs.push('QUIET: read its session (get_session)');
    return { ...j, state, merged, needs };
  });
  const gate = [...p.owed.map((x) => `owed: ${x}`), ...unpushed(R)];
  return { state: p.state, round: p.round, layers: p.layers, jobs, owed: p.owed, size: sizeLines(R.dir), gate };
}
// Every ruling of the last `days` that records Bob's own words has a home a session reads (bio K5311, K5323): it is cited
// in rulings-active.md, a product rulings file, a product situation, or build/plan/bob-rulings-placed.txt (`K<n> · where`,
// for a home elsewhere: requirements, mechanics, CLAUDE.md, or done). Returns each unplaced line. (bio's
// build/plan/bob-rulings-check.mjs, moved into the tool: DESIGN §2.6.)
export function unplacedBobRulings(R, days = 3, now = Date.now()) {
  const since = new Date(now - days * 86400e3).toISOString().slice(0, 10);
  const dir = (d) => { try { return readdirSync(join(R.dir, d)).filter((f) => f.endsWith('.md')).map((f) => `${d}/${f}`); } catch { return []; } };
  const homes = ['build/rulings-active.md', ...dir('build/rulings-product'), ...dir('build/situations')].map((f) => R.read(f) || '').join('\n');
  const cited = new Set(homes.match(/K\d+/g));
  for (const l of (R.read('build/plan/bob-rulings-placed.txt') || '').split('\n')) if (/^K\d+/.test(l)) cited.add(l.match(/^K\d+/)[0]);
  const out = [];
  for (const line of (R.read('build/rulings.md') || '').split('\n')) {
    const m = line.match(/^- (K\d+) · (\d{4}-\d{2}-\d{2}) · (.*)$/);
    if (!m || m[2] < since || cited.has(m[1])) continue;
    if (/^Bob[: ]|Bob's words|, Bob's \(|\(Bob's\)| Bob's direction|^Bob's/.test(m[3].split(' · ')[0])) out.push(`${m[1]} ${m[2]} · ${m[3].slice(0, 140)}`);
  }
  return out;
}
// A round's plan is fixed when it opens (DESIGN §2.1): the file is copied whole into current.md's body.
export function roundOpen(o) {
  const R = repo(o.product), T = o.tranche, n = Number(String(o.round || '').replace(/^R/, ''));
  if (!n) refuse('--round R<k>');
  const body = readFileSync(o.plan, 'utf8');
  const layers = [...new Set([...body.matchAll(/^## Layer (\d+)/gm)].map((x) => Number(x[1])))].map((layer) => ({ layer, state: 'OPEN' }));
  if (!layers.length) refuse(`${o.plan}: no "## Layer <n>" heading`);
  return planEdit(R, T, (text, p) => {
    if (p.round && p.layers.some((l) => l.state === 'OPEN')) refuse(`round R${p.round} is still open: close it first`);
    const head = text.split(/\n## /)[0].trimEnd();
    return `${setLine(head, 'Round', fmtRound(n, layers))}\n\n${body.trim()}\n`;
  }, `plan ${T}: round R${n} opens`);
}
// The entries of one module in one layer of the running round's plan.
export function entriesOf(planText, layer, m) {
  const sec = planText.split(/^## /m).find((s) => s.startsWith(`Layer ${layer}`)) || '';
  const block = sec.split(/^\*\*/m).find((b) => b.startsWith(`${m}**`));
  return block ? block.slice(m.length + 2).trim() : '';
}
// §5.3: job branches at the tranche's tip, the START texts, and the create_session calls owed (printed, hook-checked).
export function layerStart(o) {
  const R = repo(o.product), T = o.tranche, L = Number(o.layer);
  // A weekly warning (allowed_warning) is no stop (bio K5722, Bob: "GO!"); only a status that refuses use stops new jobs.
  if (o.usage && !['allowed', 'allowed_warning'].includes(o.usage)) refuse(`usage status is "${o.usage}": no new job starts; tell Bob (K5323)`);
  on(R, trancheBranch(T));
  const text = R.read(PLAN), p = parsePlan(text);
  if (!p.layers.find((l) => l.layer === L && l.state === 'OPEN')) refuse(`layer ${L} is not open in round R${p.round}`);
  // --modules starts only the named modules of an open layer: a module given entries after its layer started (P10:
  // nothing found waits), without sending every other job its START again (BOB #327).
  const only = String(o.modules || '').split(',').filter(Boolean);
  const mods = modules(R).filter((m) => m.layer === L && entriesOf(text, L, m.id) && (!only.length || only.includes(m.id)));
  for (const id of only) if (!mods.some((m) => m.id === id)) refuse(`${id}: no entries in layer ${L} of round R${p.round}`);
  if (!mods.length) refuse(`layer ${L} of round R${p.round} has no entries`);
  const specs = [], paths = [];
  for (const m of mods) {
    const live = p.jobs.find((j) => j.module === m.id);
    const cmd = `node ${o.process || PROCESS}/tools/proc.mjs <command> --product ${R.rel('.')} --tranche ${T} --module ${m.id}`;
    const body = `Round R${p.round}, layer ${L}, module ${m.id}, tranche ${T}. Your depth: ${p.bob.depth + 1}. BOB: ${p.bob.name} (${p.bob.session}).\nThe process tool: \`${cmd}\`. Start with \`<command>\` = \`job start --session <your session id> --depth ${p.bob.depth + 1}\`.\n${R.read(JOBRULES) !== null ? `Before changing code, read \`${JOBRULES}\` whole: the product's standing rules for every job.\n` : ''}\nEntries:\n${entriesOf(text, L, m.id)}\n`;
    R.write(startPath(T, m.id), body); paths.push(startPath(T, m.id));
    if (live) specs.push({ module: m.id, action: 'message', session: live.session, message: body });
    else specs.push({ module: m.id, action: 'create_session', source_url: sourceUrl(R), title: `${m.id.toUpperCase()} #${nextK(R, T, m.id)}`, source_revision: jobBranch(T, m.id), prompt: jobPrompt(m.id, T, { product: R.rel('.') }) });
  }
  R.write(PLAN, addOwed(text, p, specs.map((s) => `${s.action === 'message' ? 'message' : 'start'} ${s.module}`)));
  paths.push(PLAN);
  const commit = commitPush(R, trancheBranch(T), paths, `plan ${T}: round R${p.round} layer ${L} starts (${mods.map((m) => m.id).join(', ')})`);
  // The tranche tip now carries the STARTs; each new job branch is moved to it, so the job reads its START locally.
  for (const m of mods) pushJobBranch(R, T, m.id);
  return { commit, specs };
}
export const jobPrompt = (m, T, o) => `You are ${m.toUpperCase()}, the module job for \`${m}\` in tranche ${T}${o.product && o.product !== '.' ? ` (product root \`${o.product}\`)` : ''}. If /home/user/civicos-process does not exist, attach believeinoakland/civicos-process (add_repo) and clone it there. Then invoke the skill civicos-job and follow it; your START is printed by its first command.`;
function nextK(R, T, m) {
  const names = parsePlan(R.read(PLAN)).jobs.filter((j) => j.module === m).map((j) => Number(j.name.split('#')[1]));
  // The record's count lives on the job branch until a merge brings it to the tranche, and an archived job has left the Jobs line.
  R.fetch(jobBranch(T, m));
  const prior = [R.read(recordPath(T, m)), R.remote(jobBranch(T, m), recordPath(T, m))].map((t) => Number((t || '').match(/^\*\*Sessions\*\* · (\d+)/m)?.[1] || 0));
  return Math.max(0, ...prior, ...names) + 1;
}
function pushJobBranch(R, T, m) {
  const jb = jobBranch(T, m), tip = R.g(['rev-parse', 'HEAD']);
  R.fetch(jb);
  let head = null; try { head = R.g(['rev-parse', `origin/${jb}`]); } catch { /* new */ }
  if (head) { try { history(R, `origin/${jb}`, tip); R.g(['merge-base', '--is-ancestor', head, tip]); } catch { return; } }   // holds its own work: the job merges the tranche itself
  R.g(['push', '-q', 'origin', `${tip}:refs/heads/${jb}`]);
}
// A session was created for a job: its address, and the owed start cleared.
export function jobStarted(o) {
  if (!/^[A-Z][A-Z0-9-]* #\d+$/.test(o.name || '') || !SESSION.test(o.session || '')) refuse('--module <m> --name "<M> #k" --session <id>');
  const R = repo(o.product);
  return planEdit(R, o.tranche, (text, p) => {
    const jobs = [...p.jobs.filter((j) => j.module !== o.module), { module: o.module, name: o.name, session: o.session }];
    return clearOwed(setLine(text, 'Jobs', fmtJobs(jobs)), p, `start ${o.module}`);
  }, `plan ${o.tranche}: ${o.name} ${o.session} for ${o.module}`);
}
// A message owed by layer start was sent (send_message answered "delivered").
export function jobMessaged(o) {
  const R = repo(o.product);
  return planEdit(R, o.tranche, (text, p) => clearOwed(text, p, `message ${o.module}`), `plan ${o.tranche}: START sent to ${o.module}'s live session`);
}
// Where a message for a job goes (DESIGN §2.2): its live session, or a fresh one that continues from its record.
export function jobRoute(o) {
  const R = repo(o.product), p = parsePlan(R.read(PLAN));
  const j = p.jobs.find((x) => x.module === o.module);
  const dead = !j || /ARCHIVED|FAILED|INACTIVE/i.test(o.sessionStatus || '') || Number(o.contextPct) > 50;
  if (!dead) return { action: 'message', session: j.session };
  return { action: 'create_session', source_url: sourceUrl(R), title: `${o.module.toUpperCase()} #${nextK(R, o.tranche, o.module)}`, source_revision: jobBranch(o.tranche, o.module), prompt: jobPrompt(o.module, o.tranche, { product: R.rel('.') }), archive: j?.session ?? null };
}
// §5.5 whole: the gates, the merge, the tests, the checks, the marks struck, the ruling line; pushed and verified.
// `--with <m2>[,<m3>]` merges several COMPLETE jobs as one merge commit (bio BOB #328, RD37): for jobs whose changes
// are each red without the other (a new fleet member and the test that lists the fleet), so no tree between them is
// ever committed. Each is gated as if merged alone (its record, its ownership, its own inherited reds and checks).
export function merge(o) {
  const R = repo(o.product), T = o.tranche, ms = [o.module, ...String(o.with || '').split(',').filter(Boolean)];
  if (!o.module) refuse('--module <m>');
  if (new Set(ms).size !== ms.length) refuse(`--with names ${o.module} or a module twice`);
  const jbs = ms.map((m) => jobBranch(T, m));
  on(R, trancheBranch(T));
  if (unpushed(R).length) refuse(`the tranche checkout has ${unpushed(R).join(', ')}`);
  R.fetch(trancheBranch(T), ...jbs);
  try { R.g(['merge', '-q', '--ff-only', `origin/${trancheBranch(T)}`]); } catch { refuse(`${trancheBranch(T)} has diverged from origin`); }
  const jobs = ms.map((m, i) => {
    const jb = jbs[i], recText = R.remote(jb, recordPath(T, m)), rec = parseRecord(recText);
    if (rec?.state !== 'COMPLETE') refuse(`${m}: its record reads ${rec ? rec.state : 'no Status line'}, not COMPLETE`);
    const met = (recText.match(/^\*\*Met\*\* · (.*)$/m)?.[1] || '').split(/,\s*/).filter((x) => /^R\d+$/.test(x));
    const base = history(R, 'HEAD', `origin/${jb}`) ?? refuse(`${m}: ${jb} shares no history with ${trancheBranch(T)}`);
    const own = run('node', [join(PROCESS, 'checks/ownership.mjs'), R.dir, m, base, `origin/${jb}`]);
    if (own.status !== 0) refuse(`${m}: ownership: ${lastLine(own)}`);
    return { m, jb, met, own, inherited: JSON.parse(recText.match(/^Inherited reds: (\[.*\])$/m)?.[1] || '[]'), before: moduleChecks(R, m) };
  });
  const pre = R.g(['rev-parse', 'HEAD']);
  // One commit per merge (lane HANDOFF R9: keep the repository a ledger): the merge, its regenerated artifacts, the
  // struck marks and the ruling line are made in the working tree and committed together once everything is green.
  // The checkout had no uncommitted tracked change when the merge began (refused above), so restoring every tracked
  // file to `pre` undoes exactly the merge and what regenerating wrote.
  const undo = () => { spawnSync('git', ['-C', R.root, 'merge', '--abort']); R.g(['reset', '-q', '--hard', pre]); };
  const mg = spawnSync('git', ['-C', R.root, 'merge', '-q', '--no-ff', '--no-commit', ...jbs.map((jb) => `origin/${jb}`)], { encoding: 'utf8' });
  if (mg.status !== 0) {
    // A conflict only in generated artifacts takes the tranche's copy; regenerating below makes it current (§14).
    // A joint merge is git's octopus, which stops at any conflict: each job merges the tranche first.
    const gen = artifacts(R).flatMap((a) => a.paths), un = rawGit(R.dir, ['diff', '--name-only', '--diff-filter=U', '--relative']).split('\n').filter(Boolean);
    if (ms.length > 1 || !un.length || !un.every((f) => isGenerated(gen, f))) { undo(); refuse(`${ms.join(', ')}: merge conflict${un.length ? ` in ${un.join(', ')}` : ''}${ms.length > 1 ? ' (a joint merge takes no conflict: each job merges the tranche first)' : ''}; aborted, nothing changed`); }
    R.g(['checkout', '-q', '--ours', '--', ...un.map(R.rel)]); R.g(['add', '--', ...un.map(R.rel)]);
  }
  // A merged change can make another module's generated artifact stale (D19 finding 1): every artifact the manifest
  // lists is regenerated and verified at each merge, in the manifest's order, and committed with it (mechanics §14).
  const art = regenerate(R, `after merging ${ms.join(', ')}`, false);
  for (const j of jobs) {
    j.tests = runTests(R, j.m);
    j.newReds = reds(j.tests).filter((n) => !j.inherited.includes(n)).map(why(j.tests));
    j.newFindings = fresh(moduleChecks(R, j.m).fails, j.before.fails);
  }
  if (art.stale.length || jobs.some((j) => j.newReds.length || j.newFindings.length)) {
    undo();
    refuse(`${ms.join(', ')}: after the merge, ${art.stale.length ? `artifacts stale after regenerating: ${art.stale.join(', ')}; ` : ''}${jobs.map((j) => `${ms.length > 1 ? `${j.m} ` : ''}tests ${j.tests.pass}/${j.tests.tests}${j.newReds.length ? ` (new reds: ${j.newReds.join('; ')})` : ''}${j.newFindings.length ? `; new check findings: ${j.newFindings.join('; ')}` : ''}`).join('; ')}; the merge was undone`);
  }
  const reqPaths = [];
  for (const j of jobs) {
    const reqPath = `build/requirements/${j.m}.md`, req = R.read(reqPath);
    if (req && j.met.length) R.write(reqPath, req.split('\n').map((l) => (j.met.some((id) => l.includes(`**${id}**`)) ? l.replace(` *(not yet met: ${T})*`, '') : l)).join('\n'));
    if (req !== null) reqPaths.push(reqPath);
  }
  const what = jobs.map((j) => `${j.m} (${j.jb}): COMPLETE; ownership ${lastLine(j.own).replace(/^ownership: /, '')}; tests ${j.tests.pass}/${j.tests.tests}${reds(j.tests).length ? ` (inherited reds ${reds(j.tests).length})` : ''}; checks: no new finding (${j.before.fails.size} before); struck ${j.met.join(', ') || 'none'}`).join('; and ');
  const k = ruling(R, ms.join(', '), `Merged ${ms.length > 1 ? 'jointly ' : ''}${what}${o.context !== undefined ? `; BOB's context ${o.context} %` : ''}`, '§5.5; P7, P12');
  R.g(['add', '--', ...[...reqPaths, 'build/rulings.md'].filter((p) => R.read(p) !== null).map(R.rel)]);
  R.g(['commit', '-q', '--no-edit', '-m', `${k}: merged ${ms.join(', ')} (${jbs.join(', ')})${art.changed.length ? `; artifacts regenerated: ${art.changed.join(', ')}` : ''}`]);
  const commit = commitPush(R, trancheBranch(T), ['build/rulings.md'], `${k}: merged ${ms.join(', ')}`);
  R.fetch(trancheBranch(T));
  if (R.g(['rev-parse', 'HEAD']) !== R.g(['rev-parse', `origin/${trancheBranch(T)}`])) refuse('pushed, but origin does not show the merge: read it by hand');
  const one = jobs[0];
  return ms.length > 1
    ? { commit, ruling: k, jobs: jobs.map((j) => ({ module: j.m, tests: j.tests, met: j.met })), regenerated: art.changed }
    : { commit, ruling: k, tests: one.tests, met: one.met, regenerated: art.changed };
}
// A ruling written by BOB, numbered by the tool from the file as it stands on the tranche (lane R17: a hand-numbered
// K5349 repeated one `proc merge` had written). The line file holds `<module or layer> · <the ruling> · <why>` on one
// line; the files a ruling owes (requirements folded, next.md entries; mechanics §9) are committed with it.
export function rulingCmd(o) {
  const R = repo(o.product), T = o.tranche;
  on(R, trancheBranch(T));
  const line = readFileSync(o.lineFile || refuse('--line-file <f> (one line: <module or layer> · <the ruling> · <why>)'), 'utf8').trim();
  if (line.includes('\n') || line.split(' · ').length < 3) refuse('the line file holds one line: <module or layer> · <the ruling> · <why>');
  if (/^-? ?K\d+ · /.test(line)) refuse('write the line without its K number: the tool numbers it');
  const with_ = String(o.files || '').split(',').filter(Boolean);
  R.fetch(trancheBranch(T));
  try { R.g(['merge', '-q', '--ff-only', `origin/${trancheBranch(T)}`]); } catch { refuse(`${trancheBranch(T)} has diverged from origin`); }
  const cur = R.read('build/rulings.md') || '# Rulings\n';
  const k = Math.max(0, ...[...cur.matchAll(/^- K(\d+) · /gm)].map((x) => Number(x[1]))) + 1;
  R.write('build/rulings.md', `${cur.trimEnd()}\n- K${k} · ${today()} · ${line}\n`);
  const commit = commitPush(R, trancheBranch(T), ['build/rulings.md', ...with_], `K${k}: ${line.split(' · ')[1].slice(0, 80)}`);
  return { ruling: `K${k}`, commit };
}
// The product's generated artifacts: rows of the manifest's table `| \`<path>\`[, \`<path>\`…] | <owner> | \`<regenerate>\` | \`<verify>\` |`,
// run in the table's order from the product's root. A manifest with a "Generated artifacts" section and no such row is
// refused, so a table in another form never passes as "nothing to regenerate".
export function artifacts(R) {
  const text = R.read('build/manifest.md') || '';
  const rows = artifactRows(text);
  if (!rows.length && /^## Generated artifacts/m.test(text)) refuse('build/manifest.md has a Generated artifacts section but no row `| `<path>` | <owner> | `<regenerate>` | `<verify>` |` (mechanics §14)');
  return rows.map((r) => ({ ...r, path: r.paths.join(', ') }));
}
// A job's own run (tests and checks) sees the generated artifacts as its merge will make them: each is regenerated in
// the working tree, the run made, and every artifact path put back to HEAD, so a job never commits one (mechanics §14;
// a new word key read by its test resolves before the merge regenerates the rows, bio K5583, BOB #327).
export function withArtifacts(R, fn) {
  const list = artifacts(R), paths = list.flatMap((a) => a.paths);
  for (const a of list) spawnSync('sh', ['-c', a.regen], { cwd: R.dir, encoding: 'utf8' });
  try { return fn(); } finally {
    // paths from the repository root, untrimmed (a porcelain line starts with its status columns)
    const moved = rawGit(R.root, ['status', '--porcelain', '--untracked-files=all', '--', ...paths.map(R.rel)]).split('\n').filter(Boolean).map((l) => l.slice(3));
    const tracked = moved.filter((f) => spawnSync('git', ['-C', R.root, 'cat-file', '-e', `HEAD:${f}`]).status === 0);
    if (tracked.length) R.g(['checkout', '-q', 'HEAD', '--', ...tracked]);
    for (const f of moved.filter((x) => !tracked.includes(x))) spawnSync('rm', ['-rf', '--', join(R.root, f)]);
  }
}
// Regenerate each artifact, verify it, and commit what changed; returns { changed, stale }.
function regenerate(R, why, commit = true) {
  const sh = (c) => spawnSync('sh', ['-c', c], { cwd: R.dir, encoding: 'utf8' });
  const list = artifacts(R), stale = [];
  for (const a of list) { sh(a.regen); if (sh(a.verify).status !== 0) stale.push(a.path); }
  const moved = (p) => { try { R.g(['diff', '--quiet', '--', R.rel(p)]); return false; } catch { return true; } };
  const changed = list.flatMap((a) => a.paths.filter(moved));
  if (changed.length && !stale.length) { R.g(['add', '--', ...changed.map(R.rel)]); if (commit) R.g(['commit', '-q', '-m', `artifacts regenerated ${why}: ${changed.join(', ')}`]); }
  return { changed, stale };
}
function ruling(R, m, text, why) {
  const cur = R.read('build/rulings.md') || '# Rulings\n';
  const k = Math.max(0, ...[...cur.matchAll(/^- K(\d+) · /gm)].map((x) => Number(x[1]))) + 1;
  R.write('build/rulings.md', `${cur.trimEnd()}\n- K${k} · ${today()} · ${m} · ${text} · ${why}\n`);
  return `K${k}`;
}
const rawGit = (dir, args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';
const run = (cmd, args, cwd) => spawnSync(cmd, args, { encoding: 'utf8', cwd, maxBuffer: 1 << 28 });
const lastLine = (r) => `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').pop();
// ---- test runs (lane HANDOFF R14: a run that gives no result says why; a runaway test fails itself) ----

// This process's memory cgroup (v2 or v1): the memory every process shares, and its count of OOM kills (null if unread).
export function memory() {
  const rd = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
  const cg = rd('/proc/self/cgroup') || '';
  const v1 = cg.match(/^\d+:(?:[^:\n]*,)?memory(?:,[^:\n]*)?:(\S*)$/m)?.[1], v2 = cg.match(/^0::(\S*)$/m)?.[1];
  const dir = v1 !== undefined && existsSync('/sys/fs/cgroup/memory') ? join('/sys/fs/cgroup/memory', v1) : v2 !== undefined ? join('/sys/fs/cgroup', v2) : null;
  const limits = [];
  for (let d = dir; d && d.startsWith('/sys/fs/cgroup'); d = dirname(d)) {
    const n = Number((rd(join(d, 'memory.max')) ?? rd(join(d, 'memory.limit_in_bytes')) ?? '').trim());
    if (n > 0) limits.push(n);
    if (d === '/sys/fs/cgroup' || d === '/sys/fs/cgroup/memory') break;
  }
  const limit = Math.min(totalmem(), ...limits);
  const ooms = () => { const t = dir && (rd(join(dir, 'memory.events')) ?? rd(join(dir, 'memory.oom_control'))); const n = t?.match(/^oom_kill (\d+)$/m)?.[1]; return n === undefined ? null : Number(n); };
  return { limit, ooms };
}
// One `node --test` run, its report written to a file (never a pipe), at a file concurrency the memory allows, each test
// process under a heap cap and, by tools/memwatch.mjs, a memory cap: a process over it is killed and named, so a runaway
// test fails by itself (lane R14: in bio, 3 files reached 12 GB outside the JS heap and starved their neighbours).
// Returns the summary, the failed tests, and the results it could not get, each with its cause:
// { tests, pass, fail, failed, noResult: [{ name, cause }], peaks, heavy, report }.
export function runSuite(R, files, o = {}) {
  const mem = memory(), MiB = 1 << 20, heap = Number(o.heapMb) || Math.min(4096, Math.floor(mem.limit / MiB / 4));
  const conc = Math.max(1, Math.min(availableParallelism() - 1, Math.floor((mem.limit * 0.6) / (heap * MiB))));
  const cap = Number(o.capMb) || Math.floor((mem.limit * 0.6) / MiB / conc);
  const dir = join(R.g(['rev-parse', '--absolute-git-dir']), 'civicos-runs'); mkdirSync(dir, { recursive: true });
  const base = join(dir, `${o.label || 'run'}-${new Date().toISOString().replace(/[:.]/g, '-')}`), report = `${base}.tap`, watchLog = `${base}.mem`;
  // A clean environment: under a test runner, NODE_TEST_CONTEXT would send the child's report to the parent instead.
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --max-old-space-size=${heap}`.trim();
  const min = Number(o.timeoutMin) || 30, oom0 = mem.ooms();
  const watch = spawn(process.execPath, [join(PROCESS, 'tools/memwatch.mjs'), String(process.pid), String(cap), watchLog], { stdio: 'ignore' });
  const out = openSync(report, 'w'), err = openSync(`${base}.err`, 'w');
  const r = spawnSync('node', ['--test', '--test-reporter=tap', `--test-concurrency=${conc}`, ...files], { cwd: R.dir, env, stdio: ['ignore', out, err], timeout: min * 60000 });
  closeSync(out); closeSync(err); watch.kill('SIGTERM');
  const ooms = oom0 === null ? null : mem.ooms() - oom0;
  const watched = (existsSync(watchLog) ? readFileSync(watchLog, 'utf8').match(/^\{.*\}$/gm) || [] : []).map((l) => JSON.parse(l)).sort((a, b) => b.mb - a.mb);
  const capped = new Set(watched.filter((x) => x.killed).map((x) => x.file));
  const text = readFileSync(report, 'utf8'), all = `${text}\n${readFileSync(`${base}.err`, 'utf8')}`;
  const n = (k) => Number((text.match(new RegExp(`^(?:ℹ|#) ${k} (\\d+)$`, 'm')) || [])[1] ?? NaN);
  const killedBy = (sig, file) => (file && capped.has(file) ? `over its ${cap} MB memory cap (killed by proc's memory watch)` : sig === 'SIGABRT' && /heap out of memory/.test(all) ? `out of heap (over its ${heap} MB cap)` : sig === 'SIGKILL' && ooms ? 'killed by the memory cgroup (OOM)' : `killed (${sig})`);
  // A test file whose process died is reported by node as `not ok - <file>` with its signal: not a red but no result.
  const noResult = [], dead = new Set();
  for (const x of text.matchAll(/^( *)not ok \d+ - (.+?)(?: # .*)?\n\1 {2}---\n([\s\S]*?)\n\1 {2}\.\.\.$/gm)) {
    const sig = x[3].match(/^ *signal: '(\w+)'$/m)?.[1];
    const name = x[2].trim();
    if (sig) { noResult.push({ name: name.startsWith('/') ? relative(R.root, name) : name, cause: killedBy(sig, name) }); dead.add(name); }
  }
  const failed = [...new Set([...text.matchAll(/^\s*not ok \d+ - (.+?)(?: # .*)?$/gm)].map((x) => x[1].trim()))].filter((x) => !dead.has(x));
  const plan = Number(text.match(/^1\.\.(\d+)$/m)?.[1] ?? NaN), seen = (text.match(/^(?:not )?ok \d+ /gm) || []).length;
  const res = { tests: n('tests'), pass: n('pass'), fail: n('fail'), failed, noResult, report };
  // The run as a whole: the runner itself killed, timed out, or its report cut short (no summary, or fewer results than planned).
  const oomNote = ooms ? `; the memory cgroup killed ${ooms} process(es) for memory during the run` : '';
  const tail = all.trim().split('\n').filter((l) => l.trim()).slice(-3).join(' | ').slice(0, 300);
  let whole = null;
  if (r.error?.code === 'ETIMEDOUT') whole = `timed out after ${min} min`;
  else if (r.signal) whole = `the runner was ${killedBy(r.signal, '(runner)')}${oomNote}`;
  else if (Number.isNaN(res.tests) || Number.isNaN(plan) || seen < plan) whole = `report incomplete: ${seen} of ${Number.isNaN(plan) ? '?' : plan} results, exit ${r.status}${oomNote}; its tail: ${tail}`;
  if (whole) res.noResult.push({ name: 'the whole suite', cause: whole });
  const show = (x) => `${x.file.startsWith('/') ? relative(R.root, x.file) : x.file} ${x.mb} MB`;
  res.peaks = watched.slice(0, 3).map(show);
  res.heavy = watched.filter((x) => x.mb > cap / 2).map(show);
  return res;
}
// A module's tests, every *.test.mjs under its `tests` paths. A report cut short with no kill and no timeout (seen once
// with --test-force-exit and a piped report, never reproduced; lane R14) is run once more, and says so.
export function runTests(R, m, o = {}) {
  const mod = modules(R).find((x) => x.id === m) ?? refuse(`no module ${m} in build/modules.json`);
  const files = (mod.tests || []).flatMap((p) => R.g(['ls-files', '--', R.rel(p)]).split('\n')).filter((f) => f.endsWith('.test.mjs')).map((f) => join(R.root, f));
  if (!files.length) return { tests: 0, pass: 0, fail: 0, failed: [], noResult: [], peaks: [], heavy: [] };
  const first = runSuite(R, files, { ...o, label: m });
  const cut = first.noResult.find((x) => x.name === 'the whole suite' && /^report incomplete/.test(x.cause) && !/memory cgroup/.test(x.cause));
  if (!cut) return first;
  return { ...runSuite(R, files, { ...o, label: `${m}-rerun` }), rerun: `the first run's ${cut.cause.split(';')[0]} (${first.report}); run once more` };
}
// What a run did not pass, by name: the failed tests and the results it could not get. Old ones are inherited (R10).
export const reds = (t) => [...(t.failed || []), ...(t.noResult || []).map((x) => `NO RESULT ${x.name}`)];
const why = (t) => (n) => { const x = (t.noResult || []).find((y) => `NO RESULT ${y.name}` === n); return x ? `${n}: ${x.cause}` : n; };
// A pass's test run (lane R14; Bob, K5326): the named modules' suites and, with --users, every module that uses one of
// them, each run singly on HEAD and, where HEAD has a red or no result, on the base; only a new one counts, as at merge.
export function testsCmd(o) {
  const R = repo(o.product), all = modules(R), named = String(o.modules || '').split(',').filter(Boolean);
  if (!named.length) refuse('--modules <m1,m2,…>');
  for (const m of named) if (!all.some((x) => x.id === m)) refuse(`no module ${m} in build/modules.json`);
  if (R.g(['status', '--porcelain', '--untracked-files=no'])) refuse('commit the work first (locally; nothing is pushed): the base is measured in this same checkout');
  const ref = o.base || `origin/${trancheBranch(o.tranche)}`;
  if (!o.base) R.fetch(trancheBranch(o.tranche));
  history(R, ref, 'HEAD') ?? refuse(`${ref} shares no history with HEAD`);
  const users = o.users ? all.filter((x) => !named.includes(x.id) && (x.uses || []).some((u) => named.includes(u))).map((x) => x.id) : [];
  const list = [...named, ...users], now = withArtifacts(R, () => Object.fromEntries(list.map((m) => [m, runTests(R, m, o)])));
  const redMods = list.filter((m) => reds(now[m]).length);
  const before = redMods.length ? at(R, ref, () => Object.fromEntries(redMods.map((m) => [m, runTests(R, m, o)]))) : {};
  const rows = list.map((m) => {
    const t = now[m], old = before[m] ? reds(before[m]) : [];
    return { module: m, tests: `${t.pass}/${t.tests}`, new: reds(t).filter((n) => !old.includes(n)).map(why(t)), inherited: reds(t).filter((n) => old.includes(n)).map(why(t)), heavy: t.heavy, ...(t.rerun ? { rerun: t.rerun } : {}), report: t.report };
  });
  const bad = rows.filter((x) => x.new.length);
  if (bad.length) process.exitCode = 1;
  return { base: ref, head: R.g(['rev-parse', 'HEAD']), verdict: bad.length ? `new reds or no result in ${bad.map((x) => x.module).join(', ')}` : `no new red, no new NO RESULT in ${list.length} suites`, modules: rows };
}
// Old debt never blocks new work, and new work never adds to it (lane HANDOFF R10; the old process's "no new finding in
// your files"). A failure is judged against the same measure taken on the tranche before the work: only a new one
// refuses. A check's finding is compared without its line numbers, so a finding that only moved is the same finding.
const norm = (c, l) => `${c}: ${l.replace(/^FAIL\s+/, '').replace(/:\d+(?::\d+)?\b/g, '').trim()}`;
const WORDS_TABLE = 'docs/development/ux-substrate/screens/words.json';
// The checks a module's work answers for (mechanics §8), scoped to the module where the check takes one.
export function moduleChecks(R, m) {
  const names = ['format', 'architecture', 'coverage', 'fixtures', ...(existsSync(join(R.dir, WORDS_TABLE)) ? ['words'] : [])];
  const fails = new Set();
  for (const c of names) {
    const r = run('node', [join(PROCESS, `checks/${c}.mjs`), R.dir, ...(c === 'format' ? [] : [m])]);
    const lines = `${r.stdout}`.split('\n').filter((l) => l.startsWith('FAIL'));
    for (const l of lines) fails.add(norm(c, l));
    if (r.status && !lines.length) fails.add(`${c}: ${lastLine(r)}`);
  }
  return { names, fails };
}
// Every check over the whole product (checks/run.mjs), once per layer close.
export function allChecks(R) {
  const r = run('node', [join(PROCESS, 'checks/run.mjs'), R.dir]);
  const fails = new Set(`${r.stdout}`.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => norm('check', l)));
  if (r.status && !fails.size) fails.add(`check: ${lastLine(r)}`);
  return { fails };
}
// A measure taken on another commit in this same checkout (its untracked installs stay in place); the checkout is clean.
function at(R, ref, fn) {
  const back = R.branch(), head = R.g(['rev-parse', 'HEAD']);
  R.g(['checkout', '-q', '--detach', ref]);
  try { return fn(); } finally { R.g(['checkout', '-q', back === 'HEAD' ? head : back]); }
}
const fresh = (now, before) => [...now].filter((x) => !before.has(x));
// §5.6: every job of the layer merged and not re-opened; the checks; the archives owed.
export function layerClose(o) {
  const R = repo(o.product), T = o.tranche, L = Number(o.layer);
  const st = status(o);
  const mods = modules(R).filter((m) => m.layer === L).map((m) => m.id);
  const jobs = st.jobs.filter((j) => mods.includes(j.module));
  const open = jobs.filter((j) => j.state !== 'COMPLETE' || !j.merged);
  if (open.length) refuse(`layer ${L}: ${open.map((j) => `${j.module} ${j.state}${j.merged ? '' : ', not merged'}`).join('; ')}`);
  on(R, trancheBranch(T));
  const art = regenerate(R, `at layer ${L}'s close`);
  if (art.stale.length) refuse(`artifacts stale after regenerating: ${art.stale.join(', ')}`);
  // Every check over the whole product, once per layer: interactions between the layer's merges show here. Judged
  // against the tranche as it opened (its merge base with main), so debt older than the tranche never refuses.
  const now = allChecks(R);
  if (now.fails.size) {
    try { R.g(['rev-parse', '--verify', '-q', 'refs/remotes/origin/main']); } catch { R.fetch('main'); }   // the tranche's start does not move
    const start = history(R, 'origin/main', 'HEAD') ?? refuse('the tranche shares no history with main');
    const added = fresh(now.fails, at(R, start, () => allChecks(R)).fails);
    if (added.length) refuse(`checks: ${added.length} finding(s) new since the tranche opened: ${added.slice(0, 10).join('; ')}`);
  }
  const commit = planEdit(R, T, (text, p) => addOwed(setLine(text, 'Round', fmtRound(p.round, p.layers.map((l) => (l.layer === L ? { ...l, state: 'CLOSED' } : l)))), p, jobs.map((j) => `archive ${j.module}`)), `plan ${T}: layer ${L} closes`);
  return { commit, archive: jobs.map((j) => ({ module: j.module, session: j.session })) };
}
// A job's session archived: its metrics row from archive_session's usage, its address removed, the owed act cleared.
export function jobArchived(o) {
  const R = repo(o.product), T = o.tranche, u = typeof o.usage === 'string' ? JSON.parse(o.usage) : o.usage || {};
  const p = parsePlan(R.read(PLAN)), j = p.jobs.find((x) => x.module === o.module) ?? refuse(`no job for ${o.module}`);
  const size = [...(R.remote(jobBranch(T, o.module), recordPath(T, o.module)) || '').matchAll(/^Size \(\S+\): test runs (\d+), module lines (\d+)/gm)].pop() || [];   // the last completion's
  const csv = `build/metrics/${T}.csv`, cur = R.read(csv) ?? 'session,role,module,cache-read,cache-write,input,output,turns,test runs,module lines\n';
  R.write(csv, `${cur}${[j.session, 'job', o.module, u.cache_read_tokens ?? '', u.cache_write_tokens ?? '', u.input_tokens ?? '', u.output_tokens ?? '', '', size[1] ?? '', size[2] ?? ''].join(',')}\n`);
  const text = R.read(PLAN);
  R.write(PLAN, clearOwed(setLine(text, 'Jobs', fmtJobs(p.jobs.filter((x) => x.module !== o.module))), p, `archive ${o.module}`));
  return commitPush(R, trancheBranch(T), [csv, PLAN], `metrics ${T}: ${j.name} archived`);
}
// A predecessor BOB archived (§5.1, §10): its BOB-final row from archive_session's usage.
// The outgoing BOB answered TAKEN OVER (bio K5413): it deleted every routine into its own session (a successor's delete of
// them is refused by the platform's auto-mode check at random). Its reply, or why none came, is recorded before the archive.
export function bobCleared(o) {
  if (!/^BOB #\d+$/.test(o.name || '') || !SESSION.test(o.session || '')) refuse('--name "BOB #<n>" --session <id> (--reply "<its reply>" | --unanswered "<why>")');
  if (!o.reply === !o.unanswered) refuse('exactly one of --reply "<its reply>" or --unanswered "<why>" (after one message and 20 minutes)');
  const R = repo(o.product), T = o.tranche;
  on(R, trancheBranch(T));
  const csv = `build/metrics/${T}.csv`, cur = R.read(csv) ?? METRICS_HEAD;
  const note = String(o.reply ? `reply: ${o.reply}` : `unanswered: ${o.unanswered}`).replace(/[,\n]/g, ' ');
  R.write(csv, `${cur}${[o.session, 'BOB-cleared', note, '', '', '', '', '', '', ''].join(',')}\n`);
  return commitPush(R, trancheBranch(T), [csv], `metrics ${T}: ${o.name} cleared its routines (${o.reply ? 'replied' : 'unanswered'})`);
}
const METRICS_HEAD = 'session,role,module,cache-read,cache-write,input,output,turns,test runs,module lines\n';
export function bobArchived(o) {
  if (!/^BOB #\d+$/.test(o.name || '') || !SESSION.test(o.session || '')) refuse('--name "BOB #<n>" --session <id> --usage <json>');
  const R = repo(o.product), T = o.tranche, u = typeof o.usage === 'string' ? JSON.parse(o.usage) : o.usage || {};
  on(R, trancheBranch(T));
  const csv = `build/metrics/${T}.csv`, cur = R.read(csv) ?? METRICS_HEAD;
  if (!cur.split('\n').some((l) => l.startsWith(`${o.session},BOB-cleared,`))) refuse(`${o.name} has not cleared its routines: send it TAKEN OVER, then \`proc bob cleared --name "${o.name}" --session ${o.session} --reply "<its reply>"\` (or --unanswered "<why>" after 20 minutes), then archive it (bio K5413)`);
  R.write(csv, `${cur}${[o.session, 'BOB-final', '', u.cache_read_tokens ?? '', u.cache_write_tokens ?? '', u.input_tokens ?? '', u.output_tokens ?? '', '', '', ''].join(',')}\n`);
  return commitPush(R, trancheBranch(T), [csv], `metrics ${T}: ${o.name} archived (BOB-final)`);
}
// A round ends when every layer has closed; its plan is archived whole (DESIGN §2.1).
export function roundClose(o) {
  const R = repo(o.product), T = o.tranche;
  return planEdit(R, T, (text, p) => {
    if (p.layers.some((l) => l.state === 'OPEN')) refuse(`round R${p.round}: layer(s) ${p.layers.filter((l) => l.state === 'OPEN').map((l) => l.layer).join(', ')} still open`);
    if (p.owed.length) refuse(`owed acts first: ${p.owed.join('; ')}`);
    R.write(`build/plan/archive/${T}-R${p.round}.md`, text);
    R.g(['add', '--', R.rel(`build/plan/archive/${T}-R${p.round}.md`)]);
    return `${setLine(text.split(/\n## /)[0].trimEnd(), 'Round', `R${p.round} · closed`)}\n`;
  }, `plan ${T}: round closes`);
}
// §5.8: nothing owed, nothing unpushed; the text that asks ROOT for a successor.
export function handoff(o) {
  const st = status(o);
  if (st.gate.length) refuse(`not at a clean point: ${st.gate.join('; ')}`);
  const R = repo(o.product), p = parsePlan(R.read(PLAN));
  const un = unplacedBobRulings(R);
  if (un.length) refuse(`Bob's rulings with no home a successor reads: ${un.join('; ')}`);
  const n = Number(p.bob.name.split('#')[1]) + 1;
  return { text: `START BOB #${n}: ${trancheBranch(o.tranche)} @ ${R.g(['rev-parse', '--short', 'HEAD'])}` };
}

// ---- commands: job ----

export function jobStart(o) {
  if (!SESSION.test(o.session || '')) refuse('--session <id>');
  const R = repo(o.product), T = o.tranche, m = o.module;
  on(R, jobBranch(T, m));
  R.fetch(trancheBranch(T));
  history(R, `origin/${trancheBranch(T)}`, 'HEAD');
  try { R.g(['merge', '-q', '--no-edit', `origin/${trancheBranch(T)}`]); } catch { refuse(`merging ${trancheBranch(T)} into ${jobBranch(T, m)} conflicts: resolve it, then start`); }
  const path = recordPath(T, m), text = R.read(path), st = parseRecord(text);
  const line = `**Status** · ${o.session} · depth ${Number(o.depth)} · WORKING`;
  const sessions = Number((text || '').match(/^\*\*Sessions\*\* · (\d+)/m)?.[1] || 0) + 1;
  let next = st ? text.replace(RSTATUS, line) : `# ${m} (${T})\n\n${line}\n`;
  next = setLine(next, 'Sessions', String(sessions));
  R.write(path, next);
  writeFileSync(roleFile(R), JSON.stringify({ role: 'job', product: R.rel('.'), tranche: T, module: m, session: o.session }));
  const commit = commitPush(R, jobBranch(T, m), [path], `${m} ${T}: ${o.session} starts`);
  return { commit, start: R.read(startPath(T, m)) ?? R.remote(trancheBranch(T), startPath(T, m)) };
}
export function jobState(o) {
  const s = String(o.set || '').trim();
  if (!STATES.test(s) || s === 'COMPLETE') refuse('--set WORKING | "WAITING: <question>" | "BLOCKED: <tests|context|reading|needs Bob> …" | "NEEDS BOB: <act>" (COMPLETE only by job complete)');
  const R = repo(o.product), T = o.tranche, path = recordPath(T, o.module);
  on(R, jobBranch(T, o.module));
  const text = R.read(path), st = parseRecord(text) ?? refuse(`${path}: run job start first`);
  R.write(path, text.replace(RSTATUS, `**Status** · ${st.session} · depth ${st.depth} · ${s}`));
  return commitPush(R, jobBranch(T, o.module), [path], `${o.module} ${T}: ${s.slice(0, 60)}`);
}
// P20: a report states what it read or ran. Its `**Evidence**` section (a line starting `**Evidence**`, optionally with the
// first item after a `·` or `:`) runs to the next line that starts `**` or `#`; each line is an item (a bullet or number
// marker is dropped). An item counts when it is a command run with its result (a `command` followed by text), a file:line,
// or a test run with its totals (`3/3`, `pass 3`, `3 pass`, `tests 3`). Returns the items, or null with no section.
export const EVIDENCE_FORMS = 'a command run with its result line (`cmd` → result), a file:line (src/x.mjs:12), or a test run with its totals (tests 3, pass 3)';
export const EVIDENCE_ITEM = [/`[^`\n]+`.*\S{3,}/, /[\w./-]+\.\w+:\d+/, /\b\d+\s*\/\s*\d+\b|\bpass(?:ed)?\s*:?\s*\d+|\b\d+\s+pass|\btests?\s*:?\s*\d+/i];
export function evidenceItems(report) {
  const lines = String(report || '').split('\n'), i = lines.findIndex((l) => /^\*\*Evidence\*\*/.test(l));
  if (i < 0) return null;
  const items = [], first = lines[i].replace(/^\*\*Evidence\*\*\s*[·:]?\s*/, '').trim();
  if (first) items.push(first);
  for (const l of lines.slice(i + 1)) {
    if (/^(\*\*|#)/.test(l)) break;
    const t = l.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '').trim();
    if (t) items.push(t);
  }
  return items;
}
// mechanics §6 step 5 whole: tests, checks, the report, COMPLETE, pushed; then the message to send.
export function jobComplete(o) {
  const R = repo(o.product), T = o.tranche, m = o.module, path = recordPath(T, m);
  on(R, jobBranch(T, m));
  const report = readFileSync(o.reportFile, 'utf8').trim();
  if (!/^\*\*Met\*\* · (none|R\d+(, R\d+)*)$/m.test(report)) refuse('the report names the requirement ids it meets: a line "**Met** · R1, R2" (or "**Met** · none")');
  const ev = evidenceItems(report);
  if (!ev) refuse(`the report has no \`**Evidence**\` section (P20): add a line "**Evidence**" and under it at least one item, each ${EVIDENCE_FORMS}`);
  if (!ev.some((i) => EVIDENCE_ITEM.some((re) => re.test(i)))) refuse(`the report's \`**Evidence**\` section lists no item of an accepted form (P20; ${ev.length} line(s) read): each item is ${EVIDENCE_FORMS}`);
  if (R.g(['status', '--porcelain', '--untracked-files=no'])) refuse('commit your module\'s changes first');
  R.fetch(trancheBranch(T));
  try { history(R, `origin/${trancheBranch(T)}`, 'HEAD'); R.g(['merge-base', '--is-ancestor', `origin/${trancheBranch(T)}`, 'HEAD']); } catch { refuse(`merge ${trancheBranch(T)} into your branch first: BOB has changed it`); }
  // `--with <m2>` (RD37's job side): a job that lands only together with another (`proc merge --with`) is tested on
  // its branch merged with the other's, which must already read COMPLETE; the merge is made for the run and undone.
  const partners = String(o.with || '').split(',').filter(Boolean).map((p) => {
    if (p === m) refuse(`--with names ${m} itself`);
    R.fetch(jobBranch(T, p));
    const rec = parseRecord(R.remote(jobBranch(T, p), recordPath(T, p)));
    if (rec?.state !== 'COMPLETE') refuse(`${p}: its record reads ${rec ? rec.state : 'no Status line'}, not COMPLETE: it completes first`);
    return { module: p, head: R.g(['rev-parse', `origin/${jobBranch(T, p)}`]) };
  });
  const together = (fn) => {
    if (!partners.length) return fn();
    const mg = spawnSync('git', ['-C', R.root, 'merge', '-q', '--no-ff', '--no-commit', ...partners.map((p) => p.head)], { encoding: 'utf8' });
    try {
      if (mg.status !== 0) refuse(`merging ${partners.map((p) => p.module).join(', ')} for the run conflicts: ${lastLine(mg)}`);
      return fn();
    } finally { spawnSync('git', ['-C', R.root, 'merge', '--abort']); R.g(['reset', '-q', '--hard', 'HEAD']); }
  };
  const { tests, ck } = together(() => withArtifacts(R, () => ({ tests: runTests(R, m), ck: moduleChecks(R, m) })));
  if (!tests.tests && !tests.noResult.length) refuse(`tests: none ran (${tests.pass}/${tests.tests}); nothing marked complete`);
  // A red or NO RESULT the module already had on the tranche is inherited, named in the record and carried to the merge;
  // a new one refuses, with its cause.
  const base = reds(tests).length ? at(R, `origin/${trancheBranch(T)}`, () => runTests(R, m)) : { failed: [] };
  const newReds = reds(tests).filter((n) => !reds(base).includes(n));
  if (newReds.length || (tests.fail && !reds(tests).length)) refuse(`tests: ${tests.pass}/${tests.tests} pass; new reds: ${newReds.map(why(tests)).join('; ') || 'unnamed'}; nothing marked complete (report: ${tests.report})`);
  const fails = [];
  // mechanics §8: format, architecture, coverage, fixtures, and words where the product has a word table, each scoped
  // to the module where the check takes one; a finding the tranche already had is not this job's.
  const cs = ck.names;
  if (ck.fails.size) fails.push(...fresh(ck.fails, at(R, `origin/${trancheBranch(T)}`, () => moduleChecks(R, m)).fails));
  const own = run('node', [join(PROCESS, 'checks/ownership.mjs'), R.dir, m, history(R, 'HEAD', `origin/${trancheBranch(T)}`), 'HEAD']);
  if (own.status) fails.push(`ownership: ${lastLine(own)}`);
  if (fails.length) refuse(`checks: ${fails.join('; ')}; nothing marked complete`);
  const text = R.read(path), st = parseRecord(text) ?? refuse(`${path}: run job start first`);
  const mod = modules(R).find((x) => x.id === m);
  const lines = (mod.paths || []).flatMap((p) => R.g(['ls-files', '--', R.rel(p)]).split('\n')).filter(Boolean).reduce((n, f) => n + readFileSync(join(R.root, f), 'utf8').split('\n').length, 0);
  const runs = [...text.matchAll(new RegExp(`^Size \\(${st.session}\\): test runs (\\d+)`, 'gm'))].map((x) => Number(x[1])).pop() + 1 || 1;   // this session's runs so far
  const body = `${text.replace(RSTATUS, `**Status** · ${st.session} · depth ${st.depth} · COMPLETE`).trimEnd()}\n\n## Completion (${today()})\n\n${report}\n\nTests: ${tests.pass}/${tests.tests}. Checks: ${cs.join(', ')}, ownership: no new finding.${partners.length ? `\nTested with: ${partners.map((p) => `${p.module} @ ${p.head.slice(0, 10)}`).join(', ')} (it merges with them: proc merge --with)` : ''}${reds(tests).length ? `\nInherited reds: ${JSON.stringify(reds(tests))}` : ''}${tests.heavy.length ? `\nHeavy tests: ${tests.heavy.join(', ')}` : ''}\nSize (${st.session}): test runs ${runs}, module lines ${lines}\n`;
  R.write(path, body);
  const commit = commitPush(R, jobBranch(T, m), [path], `${m} ${T}: COMPLETE`);
  return { commit, tests, bob: addr({ product: o.product, tranche: T, bob: true }), message: `${m.toUpperCase()} (${T}): COMPLETE at ${commit}. Tests ${tests.pass}/${tests.tests}; checks 0. Met: ${report.match(/^\*\*Met\*\* · (.*)$/m)[1]}.` };
}

// ---- steps for Bob (P20) ----

// A step for Bob is written from the very thing he will use. Every label in the steps set in **bold** or in `backticks`
// must occur verbatim in at least one source file, after HTML entity decoding (of the source and of the label). A label
// the steps define themselves (a placeholder) is exempt only when wrapped as <<label>>: `**<<your name>>**`, `<<name>>`.
// Code spans are read first and masked, so a bold label never contains one. On success the steps text is printed
// followed by `verified: <n> labels in <sources>` (n = distinct labels checked, exempt ones not counted) and
// `.git/civicos-steps-ok.json` {sha256, sources, at} is written; the BOB Stop hook (hooks.mjs) lets a numbered list
// with bold labels end a turn only when that file is under 30 minutes old and its sha256 matches `stepsHash` of the list.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·', copy: '©', times: '×', rarr: '→', larr: '←', bull: '•' };
export function decodeEntities(t) {
  return String(t).replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z]+));/g, (m, d, h, n) => {
    if (n) return ENTITIES[n] ?? m;
    const c = d ? Number(d) : parseInt(h, 16);
    try { return String.fromCodePoint(c); } catch { return m; }
  });
}
// The labels of a steps text: [{ label, line, exempt }] in order of appearance.
export function stepLabels(text) {
  const out = [];
  String(text).split('\n').forEach((raw, i) => {
    const note = (label) => { const l = label.trim(); if (l) out.push({ label: l, line: i + 1, exempt: /^<<[\s\S]+>>$/.test(l) }); };
    let line = raw;
    for (const m of raw.matchAll(/(?<!`)`([^`\n]+)`(?!`)/g)) { note(m[1]); line = line.replace(m[0], ' '.repeat(m[0].length)); }
    for (const m of line.matchAll(/\*\*([^*\n]+?)\*\*/g)) note(m[1]);
  });
  return out;
}
// The numbered list of a text, normalised: its item lines (`1.` or `1)` after optional indentation) and the indented
// lines that follow them, each with runs of whitespace collapsed to one space and trimmed, blank lines dropped, joined
// by "\n". Prose between items, and unindented lines, are not part of it. '' when there is no numbered item.
export function numberedList(text) {
  const out = []; let in_ = false;
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const item = /^\s*\d+[.)]\s+\S/.test(raw);
    if (item) in_ = true; else if (!in_ || !/^\s+\S/.test(raw)) { in_ = false; continue; }
    out.push(raw.replace(/\s+/g, ' ').trim());
  }
  return out.join('\n');
}
// A list is "steps for Bob" when it has at least two numbered items, the first numbered 1, and a **bold** label in it.
export function isStepsList(text) {
  const list = numberedList(text), items = list.split('\n').filter((l) => /^\d+[.)]\s/.test(l));
  return items.length >= 2 && /^1[.)]\s/.test(items[0]) && /\*\*[^*\n]+\*\*/.test(list);
}
export const stepsHash = (text) => createHash('sha256').update(numberedList(text) || String(text).replace(/\s+/g, ' ').trim()).digest('hex');
export const STEPS_OK = 'civicos-steps-ok.json';
export function stepsCmd(o) {
  if (typeof o.file !== 'string' || typeof o.source !== 'string') refuse('--file <steps.md> --source <path1,path2,…>');
  const text = existsSync(o.file) ? readFileSync(o.file, 'utf8') : refuse(`${o.file}: no such steps file`);
  const sources = o.source.split(',').map((x) => x.trim()).filter(Boolean);
  if (!sources.length) refuse('--source names no file');
  const hay = sources.map((f) => (existsSync(f) ? decodeEntities(readFileSync(f, 'utf8')) : refuse(`${f}: no such source file`))).join('\n');
  const labels = stepLabels(text), missing = [], seen = new Set();
  for (const l of labels) {
    if (l.exempt) continue;
    seen.add(l.label);
    if (!hay.includes(decodeEntities(l.label))) missing.push(l);
  }
  if (missing.length) refuse(`${missing.length} label(s) in ${o.file} not found verbatim in ${sources.join(', ')}:\n${missing.map((l) => `  line ${l.line}: "${l.label}"`).join('\n')}\nwrite the step from the page's or screen's own words; a placeholder the steps define themselves is wrapped as <<label>>`);
  const R = repo(o.product);
  writeFileSync(join(R.root, '.git', STEPS_OK), JSON.stringify({ sha256: stepsHash(text), sources, at: new Date().toISOString() }));
  return `${text.trimEnd()}\n\nverified: ${seen.size} labels in ${sources.join(', ')}`;
}

// ---- the role skills (DESIGN §3): written from this repository, never by hand ----

export function shims(o) {
  const hook = (role, ev) => `node "${o.process}/tools/hooks.mjs" ${role} ${ev}`;
  const make = (role, desc) => `---\nname: civicos-${role}\ndescription: ${desc}\nhooks:\n  PreToolUse:\n    - hooks:\n        - type: command\n          command: '${hook(role, 'pre')}'\n  Stop:\n    - hooks:\n        - type: command\n          command: '${hook(role, 'stop')}'\n---\n!\`cat "${o.process}/roles/${role.toUpperCase()}.md" || echo "STOP: the process repository is not at ${o.process}; attach it, then invoke this skill again."\`\n`;
  const out = { 'civicos-bob': make('bob', 'CivicOS BOB, the architecture session: invoke at the start of every BOB session, before anything else.'), 'civicos-job': make('job', 'CivicOS module job: invoke at the start of every module job session, before anything else.') };
  if (o.out) for (const [k, v] of Object.entries(out)) { mkdirSync(join(o.out, k), { recursive: true }); writeFileSync(join(o.out, k, 'SKILL.md'), v); }
  return out;
}

// ---- command line ----

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const k = a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase());
    if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) o[k] = argv[++i]; else o[k] = true;
  }
  return o;
}
const COMMANDS = {
  takeover, status, addr, handoff, merge, shims, footprint, history: historyCmd, tests: testsCmd, ruling: rulingCmd, steps: stepsCmd,
  'round open': roundOpen, 'round close': roundClose, 'layer start': layerStart, 'layer close': layerClose,
  'job started': jobStarted, 'job messaged': jobMessaged, 'job route': jobRoute, 'job archived': jobArchived, 'bob archived': bobArchived, 'bob cleared': bobCleared, sizes: (o) => ({ size: sizeLines(o.product) }),
  'job start': jobStart, 'job state': jobState, 'job complete': jobComplete,
};
if (import.meta.url === `file://${process.argv[1]}`) {
  const o = args(process.argv.slice(2));
  const name = COMMANDS[`${o._[0]} ${o._[1]}`] ? `${o._[0]} ${o._[1]}` : o._[0];
  try {
    const fn = COMMANDS[name] ?? refuse(`unknown command "${o._.join(' ')}"; see the header of tools/proc.mjs`);
    if (!o.tranche && name !== 'shims' && name !== 'sizes' && name !== 'steps') refuse('--tranche <T>');
    const r = fn(o);
    console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
    if (name === 'status' && o.gate && r.gate.length) process.exitCode = 1;
  } catch (e) { console.error(`proc: ${e instanceof Refused ? 'refused: ' : ''}${e.message}`); process.exitCode = 1; }
}
