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
//         layer start --layer <L> [--usage <status>]   job started --module <m> --name "<M> #k" --session <id>
//         job messaged --module <m>   job route --module <m> [--context-pct <n>] [--session-status <s>]   merge --module <m> [--context <pct>]
//         layer close --layer <L>   job archived --module <m> --usage <json>   bob archived --name --session --usage   round close   handoff
//   job   job start --module <m> --session <id> --depth <d>   job state --module <m> --set <STATE>
//         job complete --module <m> --report-file <f>
//   any   addr (--bob | --module <m>)   shims --out <dir> --process <path>
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeLines } from './mail.mjs';

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
function on(R, want) { const b = R.branch(); if (b !== want) refuse(`check out ${want} first (on ${b})`); }
// Commit the named files and push; a push that loses a race merges the remote once (never a rebase, never a force).
function commitPush(R, branch, paths, message) {
  R.g(['add', '--', ...paths.map(R.rel)]);
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

// §5.1 whole: the Status line, the role file, and everything a successor must act on, from git alone.
export function takeover(o) {
  if (!/^BOB #\d+$/.test(o.name || '') || !SESSION.test(o.session || '')) refuse('--name "BOB #<n>" --session <id> --depth <d>');
  const R = repo(o.product), T = o.tranche;
  const before = parsePlan(R.read(PLAN));
  const commit = planEdit(R, T, (text, p) => setLine(text, 'Status', `${p.state || 'OPEN'} · ${o.name} · ${o.session} · depth ${Number(o.depth)}`, '# '), `plan ${T}: ${o.name} ${o.session} takes over`);
  writeFileSync(roleFile(R), JSON.stringify({ role: 'bob', product: R.rel('.'), tranche: T, session: o.session }));
  const acts = [];
  if (Number(o.depth) !== 1) acts.push(`tell Bob: BOB at depth ${o.depth}, not 1 (P13)`);
  if (before.bob && before.bob.session !== o.session) acts.push(`archive ${before.bob.name} ${before.bob.session} once idle, then: proc bob archived --name "${before.bob.name}" --session ${before.bob.session} --usage '<archive_session usage json>'`, `delete every routine into ${before.bob.session}`);
  acts.push('arm the backstop: send_later into your own session, 60 minutes (DESIGN §2.7)');
  // A product inside this repository (the dry run) reaches the process by its project dir; any other at PROCESS.
  const via = R.root === PROCESS ? '${CLAUDE_PROJECT_DIR:-.}' : PROCESS;
  for (const [k, v] of Object.entries(shims({ process: via }))) {
    const f = join(R.root, '.claude/skills', k, 'SKILL.md');
    if (!existsSync(f) || readFileSync(f, 'utf8') !== v) acts.push(`the role skill .claude/skills/${k}/SKILL.md ${existsSync(f) ? 'differs from' : 'is missing; write it with'} \`proc shims --out <repo>/.claude/skills --process '${via}'\`: rewrite it so, commit and push (DESIGN §3)`);
  }
  const st = status(o);
  for (const s of st.size.filter((x) => x.startsWith('SIZE '))) acts.push(`prune ${s.split(' ')[1]} under its limit (mechanics §17): ${s}`);
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
    let merged = false; try { R.g(['merge-base', '--is-ancestor', `origin/${jb}`, 'HEAD']); merged = true; } catch { /* not merged */ }
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
  if (o.usage && o.usage !== 'allowed') refuse(`usage status is "${o.usage}": no new job starts; tell Bob (K5323)`);
  on(R, trancheBranch(T));
  const text = R.read(PLAN), p = parsePlan(text);
  if (!p.layers.find((l) => l.layer === L && l.state === 'OPEN')) refuse(`layer ${L} is not open in round R${p.round}`);
  const mods = modules(R).filter((m) => m.layer === L && entriesOf(text, L, m.id));
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
  const prior = Number((R.read(`build/jobs/${T}/${m}.md`) || '').match(/^\*\*Sessions\*\* · (\d+)/m)?.[1] || 0);
  return Math.max(0, prior, ...names) + 1;
}
function pushJobBranch(R, T, m) {
  const jb = jobBranch(T, m), tip = R.g(['rev-parse', 'HEAD']);
  R.fetch(jb);
  let head = null; try { head = R.g(['rev-parse', `origin/${jb}`]); } catch { /* new */ }
  if (head) { try { R.g(['merge-base', '--is-ancestor', head, tip]); } catch { return; } }   // holds its own work: the job merges the tranche itself
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
export function merge(o) {
  const R = repo(o.product), T = o.tranche, m = o.module, jb = jobBranch(T, m);
  on(R, trancheBranch(T));
  if (unpushed(R).length) refuse(`the tranche checkout has ${unpushed(R).join(', ')}`);
  R.fetch(trancheBranch(T), jb);
  try { R.g(['merge', '-q', '--ff-only', `origin/${trancheBranch(T)}`]); } catch { refuse(`${trancheBranch(T)} has diverged from origin`); }
  const recText = R.remote(jb, recordPath(T, m)), rec = parseRecord(recText);
  if (rec?.state !== 'COMPLETE') refuse(`${m}: its record reads ${rec ? rec.state : 'no Status line'}, not COMPLETE`);
  const met = (recText.match(/^\*\*Met\*\* · (.*)$/m)?.[1] || '').split(/,\s*/).filter((x) => /^R\d+$/.test(x));
  const base = R.g(['merge-base', 'HEAD', `origin/${jb}`]);
  const own = run('node', [join(PROCESS, 'checks/ownership.mjs'), R.dir, m, base, `origin/${jb}`]);
  if (own.status !== 0) refuse(`${m}: ownership: ${lastLine(own)}`);
  const pre = R.g(['rev-parse', 'HEAD']);
  const mg = spawnSync('git', ['-C', R.root, 'merge', '-q', '--no-ff', `origin/${jb}`, '-m', `Merge ${jb}`], { encoding: 'utf8' });
  if (mg.status !== 0) { spawnSync('git', ['-C', R.root, 'merge', '--abort']); refuse(`${m}: merge conflict; aborted, nothing changed`); }
  // A merged change can make another module's generated artifact stale (D19 finding 1): every artifact the manifest
  // lists is regenerated and verified at each merge, in the manifest's order, and committed with it (mechanics §14).
  const art = regenerate(R, `after merging ${m}`);
  const tests = runTests(R, m);
  const checks = run('node', [join(PROCESS, 'checks/run.mjs'), R.dir]);
  if (art.stale.length || tests.fail || checks.status !== 0) {
    R.g(['reset', '-q', '--keep', pre]);
    refuse(`${m}: after the merge, ${art.stale.length ? `artifacts stale after regenerating: ${art.stale.join(', ')}; ` : ''}tests ${tests.pass}/${tests.tests}${checks.status ? `, checks: ${lastLine(checks)}` : ''}; the merge was undone`);
  }
  const reqPath = `build/requirements/${m}.md`, req = R.read(reqPath);
  if (req && met.length) R.write(reqPath, req.split('\n').map((l) => (met.some((id) => l.includes(`**${id}**`)) ? l.replace(` *(not yet met: ${T})*`, '') : l)).join('\n'));
  const k = ruling(R, m, `Merged ${m} (${jb}): COMPLETE; ownership ${lastLine(own).replace(/^ownership: /, '')}; tests ${tests.pass}/${tests.tests}; checks 0 failures; struck ${met.join(', ') || 'none'}${o.context !== undefined ? `; BOB's context ${o.context} %` : ''}`, '§5.5; P7, P12');
  const commit = commitPush(R, trancheBranch(T), [reqPath, 'build/rulings.md'].filter((p) => R.read(p) !== null), `${k}: merged ${m}`);
  R.fetch(trancheBranch(T));
  if (R.g(['rev-parse', 'HEAD']) !== R.g(['rev-parse', `origin/${trancheBranch(T)}`])) refuse('pushed, but origin does not show the merge: read it by hand');
  return { commit, ruling: k, tests, met, regenerated: art.changed };
}
// The product's generated artifacts: rows of the manifest's table `| \`<path>\`[, \`<path>\`…] | <owner> | \`<regenerate>\` | \`<verify>\` |`,
// run in the table's order from the product's root. A manifest with a "Generated artifacts" section and no such row is
// refused, so a table in another form never passes as "nothing to regenerate".
export function artifacts(R) {
  const text = R.read('build/manifest.md') || '';
  const rows = [...text.matchAll(/^\| (`[^`|]+`(?:, `[^`|]+`)*) \| [^|]+ \| `([^`]+)` \| `([^`]+)` \|$/gm)].map((x) => ({ paths: [...x[1].matchAll(/`([^`]+)`/g)].map((y) => y[1]), regen: x[2], verify: x[3] }));
  if (!rows.length && /^## Generated artifacts/m.test(text)) refuse('build/manifest.md has a Generated artifacts section but no row `| `<path>` | <owner> | `<regenerate>` | `<verify>` |` (mechanics §14)');
  return rows.map((r) => ({ ...r, path: r.paths.join(', ') }));
}
// Regenerate each artifact, verify it, and commit what changed; returns { changed, stale }.
function regenerate(R, why) {
  const sh = (c) => spawnSync('sh', ['-c', c], { cwd: R.dir, encoding: 'utf8' });
  const list = artifacts(R), stale = [];
  for (const a of list) { sh(a.regen); if (sh(a.verify).status !== 0) stale.push(a.path); }
  const moved = (p) => { try { R.g(['diff', '--quiet', '--', R.rel(p)]); return false; } catch { return true; } };
  const changed = list.flatMap((a) => a.paths.filter(moved));
  if (changed.length && !stale.length) { R.g(['add', '--', ...changed.map(R.rel)]); R.g(['commit', '-q', '-m', `artifacts regenerated ${why}: ${changed.join(', ')}`]); }
  return { changed, stale };
}
function ruling(R, m, text, why) {
  const cur = R.read('build/rulings.md') || '# Rulings\n';
  const k = Math.max(0, ...[...cur.matchAll(/^- K(\d+) · /gm)].map((x) => Number(x[1]))) + 1;
  R.write('build/rulings.md', `${cur.trimEnd()}\n- K${k} · ${today()} · ${m} · ${text} · ${why}\n`);
  return `K${k}`;
}
const run = (cmd, args, cwd) => spawnSync(cmd, args, { encoding: 'utf8', cwd, maxBuffer: 1 << 28 });
const lastLine = (r) => `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').pop();
// A module's tests, every *.test.mjs under its `tests` paths, read from the run's own summary lines.
export function runTests(R, m) {
  const mod = modules(R).find((x) => x.id === m) ?? refuse(`no module ${m} in build/modules.json`);
  const files = (mod.tests || []).flatMap((p) => R.g(['ls-files', '--', R.rel(p)]).split('\n')).filter((f) => f.endsWith('.test.mjs')).map((f) => join(R.root, f));
  if (!files.length) return { tests: 0, pass: 0, fail: 0 };
  // A clean environment: under a test runner, NODE_TEST_CONTEXT would send the child's report to the parent instead.
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync('node', ['--test', '--test-reporter=tap', ...files], { encoding: 'utf8', cwd: R.dir, env, maxBuffer: 1 << 28 });
  const n = (k) => Number((`${r.stdout}`.match(new RegExp(`^(?:ℹ|#) ${k} (\\d+)$`, 'm')) || [])[1] ?? NaN);
  const out = { tests: n('tests'), pass: n('pass'), fail: n('fail') };
  if (Number.isNaN(out.tests)) out.fail = 1;
  return out;
}
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
  const checks = run('node', [join(PROCESS, 'checks/run.mjs'), R.dir]);
  if (checks.status !== 0) refuse(`checks: ${lastLine(checks)}`);
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
export function bobArchived(o) {
  if (!/^BOB #\d+$/.test(o.name || '') || !SESSION.test(o.session || '')) refuse('--name "BOB #<n>" --session <id> --usage <json>');
  const R = repo(o.product), T = o.tranche, u = typeof o.usage === 'string' ? JSON.parse(o.usage) : o.usage || {};
  on(R, trancheBranch(T));
  const csv = `build/metrics/${T}.csv`, cur = R.read(csv) ?? 'session,role,module,cache-read,cache-write,input,output,turns,test runs,module lines\n';
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
  const n = Number(p.bob.name.split('#')[1]) + 1;
  return { text: `START BOB #${n}: ${trancheBranch(o.tranche)} @ ${R.g(['rev-parse', '--short', 'HEAD'])}` };
}

// ---- commands: job ----

export function jobStart(o) {
  if (!SESSION.test(o.session || '')) refuse('--session <id>');
  const R = repo(o.product), T = o.tranche, m = o.module;
  on(R, jobBranch(T, m));
  R.fetch(trancheBranch(T));
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
// mechanics §6 step 5 whole: tests, checks, the report, COMPLETE, pushed; then the message to send.
export function jobComplete(o) {
  const R = repo(o.product), T = o.tranche, m = o.module, path = recordPath(T, m);
  on(R, jobBranch(T, m));
  const report = readFileSync(o.reportFile, 'utf8').trim();
  if (!/^\*\*Met\*\* · (none|R\d+(, R\d+)*)$/m.test(report)) refuse('the report names the requirement ids it meets: a line "**Met** · R1, R2" (or "**Met** · none")');
  if (R.g(['status', '--porcelain', '--untracked-files=no'])) refuse('commit your module\'s changes first');
  R.fetch(trancheBranch(T));
  try { R.g(['merge-base', '--is-ancestor', `origin/${trancheBranch(T)}`, 'HEAD']); } catch { refuse(`merge ${trancheBranch(T)} into your branch first: BOB has changed it`); }
  const tests = runTests(R, m);
  if (tests.fail || !tests.tests) refuse(`tests: ${tests.pass}/${tests.tests} pass; nothing marked complete`);
  const fails = [];
  // mechanics §8: format, architecture, coverage, fixtures, and words where the product has a word table, each scoped
  // to the module where the check takes one; ownership against the merge base.
  const cs = ['format', 'architecture', 'coverage', 'fixtures', ...(existsSync(join(R.dir, 'docs/development/ux-substrate/screens/words.json')) ? ['words'] : [])];
  for (const c of cs) { const r = run('node', [join(PROCESS, `checks/${c}.mjs`), R.dir, ...(c === 'format' ? [] : [m])]); if (r.status) fails.push(`${c}: ${lastLine(r)}`); }
  const own = run('node', [join(PROCESS, 'checks/ownership.mjs'), R.dir, m, R.g(['merge-base', 'HEAD', `origin/${trancheBranch(T)}`]), 'HEAD']);
  if (own.status) fails.push(`ownership: ${lastLine(own)}`);
  if (fails.length) refuse(`checks: ${fails.join('; ')}; nothing marked complete`);
  const text = R.read(path), st = parseRecord(text) ?? refuse(`${path}: run job start first`);
  const mod = modules(R).find((x) => x.id === m);
  const lines = (mod.paths || []).flatMap((p) => R.g(['ls-files', '--', R.rel(p)]).split('\n')).filter(Boolean).reduce((n, f) => n + readFileSync(join(R.root, f), 'utf8').split('\n').length, 0);
  const runs = [...text.matchAll(new RegExp(`^Size \\(${st.session}\\): test runs (\\d+)`, 'gm'))].map((x) => Number(x[1])).pop() + 1 || 1;   // this session's runs so far
  const body = `${text.replace(RSTATUS, `**Status** · ${st.session} · depth ${st.depth} · COMPLETE`).trimEnd()}\n\n## Completion (${today()})\n\n${report}\n\nTests: ${tests.pass}/${tests.tests}. Checks: ${cs.join(', ')}, ownership 0 failures.\nSize (${st.session}): test runs ${runs}, module lines ${lines}\n`;
  R.write(path, body);
  const commit = commitPush(R, jobBranch(T, m), [path], `${m} ${T}: COMPLETE`);
  return { commit, tests, bob: addr({ product: o.product, tranche: T, bob: true }), message: `${m.toUpperCase()} (${T}): COMPLETE at ${commit}. Tests ${tests.pass}/${tests.tests}; checks 0. Met: ${report.match(/^\*\*Met\*\* · (.*)$/m)[1]}.` };
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
  takeover, status, addr, handoff, merge, shims,
  'round open': roundOpen, 'round close': roundClose, 'layer start': layerStart, 'layer close': layerClose,
  'job started': jobStarted, 'job messaged': jobMessaged, 'job route': jobRoute, 'job archived': jobArchived, 'bob archived': bobArchived,
  'job start': jobStart, 'job state': jobState, 'job complete': jobComplete,
};
if (import.meta.url === `file://${process.argv[1]}`) {
  const o = args(process.argv.slice(2));
  const name = COMMANDS[`${o._[0]} ${o._[1]}`] ? `${o._[0]} ${o._[1]}` : o._[0];
  try {
    const fn = COMMANDS[name] ?? refuse(`unknown command "${o._.join(' ')}"; see the header of tools/proc.mjs`);
    if (!o.tranche && name !== 'shims') refuse('--tranche <T>');
    const r = fn(o);
    console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
    if (name === 'status' && o.gate && r.gate.length) process.exitCode = 1;
  } catch (e) { console.error(`proc: ${e instanceof Refused ? 'refused: ' : ''}${e.message}`); process.exitCode = 1; }
}
