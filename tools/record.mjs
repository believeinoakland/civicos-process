// The record (build/requirements/record.md; REQUIREMENTS.md §3): the git record every role reads and writes. The durable
// tranche branch holds the build's facts, the epoch's orphan state branch its transient lines, one writer per file; `status`
// reads the whole state a role needs in one call. Every other module reaches git through `repo` (R1). Extracted from
// proc-legacy (N2-5); tools/proc.mjs re-exports what it still calls.
//
// The state branch `state/<epoch>`, read and written by plumbing (no checkout, no second worktree):
//   plan.md                **Status** · <STATE> · <BOB name> · <session>[ · STOPPED <why> · <version> | · RESUMED <version>]
//                          **Owed** · <act>; …   **Layers** · 1 STARTED   **Retiring** · …   **Choices** · <module> <choice>; …
//   jobs/<module>.md, lanes/<id>.md, asks/A<n>.md, refusals/<id>.md, issues/<id>.md, undelivered/<id>.md
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, resolve } from 'node:path';

export const TRANCHE = 'tranche';                 // fixed: a merge queue cannot target a wildcard (JOB-LIFE §1)
export const jobBranch = (m) => `job/${m}`;
export const stateBranch = (e) => `state/${e}`;
export const ROLE_FILE = 'proc-role.json';
const SESSION = /^session_[0-9A-Za-z]+$/;
const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);
export class Refused extends Error {}
export const refuse = (msg) => { throw new Refused(msg); };

// ---- the path tables (R5; REC-1): every path of the record is durable (the tranche) or transient (the state branch) ----

const PATHS = Object.freeze({
  durable: Object.freeze(['build/epochs.md', 'build/lanes.md', 'build/lanes/', 'build/metrics/', 'build/plan/', 'build/requirements/', 'build/process-issues/', 'build/handoff.md', 'build/manifest.md', 'build/modules.json', 'build/layers.md', 'build/grants.json']),
  transient: Object.freeze(['epoch.md', 'plan.md', 'jobs/', 'lanes/', 'asks/', 'refusals/', 'issues/', 'undelivered/']),
});
export const paths = () => PATHS;

// ---- git (R1) ----

export function repo(product) {
  const dir = resolve(product || '.');
  const root = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const g = (args, env) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20, env: env ? { ...process.env, ...env } : process.env }).trim();
  const rel = (p) => relative(root, join(dir, p)) || '.';
  const read = (p) => { const f = join(dir, p); return existsSync(f) ? readFileSync(f, 'utf8') : null; };
  const write = (p, text) => { const f = join(dir, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };
  const fetch = (...branches) => { for (const b of branches) { try { g(['fetch', '-q', 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`]); } catch { /* absent */ } } };
  const remote = (branch, p) => { try { return g(['show', `origin/${branch}:${rel(p)}`]); } catch { return null; } };
  const branch = () => g(['rev-parse', '--abbrev-ref', 'HEAD']);
  const heads = (glob) => { try { return g(['ls-remote', '--heads', 'origin', glob]).split('\n').filter(Boolean).map((l) => l.split(/\s+/)[1].replace('refs/heads/', '')); } catch { return []; } };
  return { dir, root, g, rel, read, write, fetch, remote, branch, heads };
}
export function ghRepo(R) {
  const m = R.g(['remote', 'get-url', 'origin']).match(/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return { owner: m?.[1] ?? '?', repo: m?.[2] ?? '?' };
}
export function readRole(root) { const f = join(root, '.git', ROLE_FILE); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; }
// The branch a role pushes to, as its role record names it (R4): a job its module's branch, a lane of the process its own
// branch, every other role the tranche. No role record: no role to hold to.
export function ownBranch(role) {
  if (!role) return null;
  if (role.role === 'job') return role.module ? jobBranch(role.module) : null;
  if (role.branch) return role.branch;
  return TRANCHE;
}
export function unpushed(R) {
  const out = [];
  if (R.g(['status', '--porcelain', '--untracked-files=no'])) out.push('uncommitted changes');
  const b = R.branch();
  try { const n = Number(R.g(['rev-list', '--count', `origin/${b}..HEAD`])); if (n) out.push(`${n} commit(s) on ${b} not pushed`); } catch { out.push(`${b} has never been pushed`); }
  return out;
}
// Commit the named files on the current branch and push; a lost race merges the remote once (never a rebase, never a
// force). A push to a branch other than the role's own, as its role record names it, is refused before anything is written.
export function commitPush(R, branch, paths, message) {
  const own = ownBranch(readRole(R.root));
  if (own && branch !== own) refuse(`a push to ${branch} is refused: this session's role pushes to ${own} only`);
  const gone = (p) => !existsSync(join(R.root, R.rel(p)));
  const del = paths.filter(gone), keep = paths.filter((p) => !del.includes(p));
  if (del.length) R.g(['rm', '-q', '--cached', '--ignore-unmatch', '--', ...del.map(R.rel)]);
  if (keep.length) R.g(['add', '--', ...keep.map(R.rel)]);
  try { R.g(['diff', '--cached', '--quiet']); } catch { R.g(['commit', '-q', '-m', message]); }
  try { R.g(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`]); }
  catch { R.g(['pull', '-q', '--no-rebase', '--no-edit', 'origin', branch]); R.g(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`]); }
  return R.g(['rev-parse', '--short', 'HEAD']);
}
function on(R, want) { const b = R.branch(); if (b !== want) refuse(`check out ${want} first (on ${b})`); }

// ---- the state branch (R2; PROTOCOL §7d): an orphan, written by plumbing, one writer per file ----

// A remote branch deleted from here when the proxy allows it (a bare fixture does), else by the product's prune
// workflow (`.github/workflows/prune.yml`, written by shims; REP 4), whose dispatch is printed as the act owed.
export function pruneRef(R, ref) {
  const r = spawnSync('git', ['-C', R.root, 'push', '-q', 'origin', `:refs/heads/${ref}`], { encoding: 'utf8' });
  if (r.status === 0) { try { R.g(['update-ref', '-d', `refs/remotes/origin/${ref}`]); } catch { /* none */ } return { ref, deleted: true }; }
  return { ref, deleted: false, dispatch: { tool: 'actions_run_trigger', ...ghRepo(R), workflow_id: 'prune.yml', ref: 'main', inputs: { ref } }, why: `the proxy refused the delete: ${(r.stderr || '').trim().split('\n').pop() || 'no reason given'}` };
}
// The one open state branch on origin: a `state/*` head whose own `epoch.md` is not marked closed (`epoch close` marks it
// before the delete, since a closed epoch's branch may linger until the prune workflow deletes it). None means no epoch is open.
export function epoch(R) {
  const open = (e) => { R.fetch(stateBranch(e)); try { return !/^closed /m.test(R.g(['show', `origin/${stateBranch(e)}:epoch.md`])); } catch { return false; } };
  const all = R.heads('refs/heads/state/*').map((b) => b.slice('state/'.length)).filter(open);
  if (all.length > 1) refuse(`more than one open state branch on origin (${all.map((e) => `state/${e}`).join(', ')}): close the old epoch first`);
  return all[0] ?? null;
}
export const needEpoch = (R) => epoch(R) ?? refuse('no epoch is open: run `epoch open` first');
export function stateRead(R, path, e = needEpoch(R)) { R.fetch(stateBranch(e)); try { return R.g(['show', `origin/${stateBranch(e)}:${path}`]); } catch { return null; } }
export function stateList(R, dir, e = needEpoch(R)) { R.fetch(stateBranch(e)); try { return R.g(['ls-tree', '-r', '--name-only', `origin/${stateBranch(e)}`, `${dir}/`]).split('\n').filter(Boolean); } catch { return []; } }
// Write files (text, or null to remove) as one commit on the state branch and push; a lost race is re-applied on the
// new tip (every file has one writer, so the same change on the newer tree is the right result), never forced.
export function stateWrite(R, files, message, e = needEpoch(R)) {
  const b = stateBranch(e), idx = join(tmpdir(), `proc-index-${process.pid}-${Math.random().toString(36).slice(2)}`);
  const env = { GIT_INDEX_FILE: idx };
  try {
    for (let tries = 0; ; tries++) {
      R.fetch(b);
      const tip = R.g(['rev-parse', `origin/${b}`]);
      rmSync(idx, { force: true });
      R.g(['read-tree', tip], env);
      for (const [p, text] of Object.entries(files)) {
        if (text === null) { R.g(['update-index', '--force-remove', '--', p], env); continue; }
        const blob = execFileSync('git', ['-C', R.root, 'hash-object', '-w', '--stdin'], { input: text, encoding: 'utf8' }).trim();
        R.g(['update-index', '--add', '--cacheinfo', `100644,${blob},${p}`], env);
      }
      const tree = R.g(['write-tree'], env);
      if (tree === R.g(['rev-parse', `${tip}^{tree}`])) return tip.slice(0, 7);   // nothing to write
      const commit = execFileSync('git', ['-C', R.root, 'commit-tree', tree, '-p', tip, '-m', message], { encoding: 'utf8' }).trim();
      const r = spawnSync('git', ['-C', R.root, 'push', '-q', 'origin', `${commit}:refs/heads/${b}`], { encoding: 'utf8' });
      if (r.status === 0) { R.fetch(b); return commit.slice(0, 7); }
      if (tries >= 3) refuse(`the state branch ${b} could not be pushed after 4 tries: ${(r.stderr || '').trim().split('\n').pop()}`);
    }
  } finally { rmSync(idx, { force: true }); }
}

// ---- epochs (R3): `open` makes the next epoch's branch from nothing (an orphan commit holding one file), after the
// previous one is gone; `close` refuses while anything is open or live, then deletes the branch outright: the one remote
// delete the process makes, of a `state/*` branch only (Bob, 29 Oct: really thrown away) ----

const LIVE_LINE = /· LIVE |· (STARTING|WORKING|WAITING|BLOCKED|NEEDS BOB|COMPLETE|REOPENED|MERGED)/;
const statusOf = (text) => (text || '').match(/^\*\*Status\*\* · ([A-Z][A-Z ]*?)\s*$/m)?.[1] ?? null;
export const jobFiles = (R, e) => stateList(R, 'jobs', e).filter((p) => /^jobs\/[^/]+\.md$/.test(p));
export function epochOpen(o) {
  const R = repo(o.product);
  if (epoch(R)) refuse(`epoch ${epoch(R)} is still open: close it first`);
  on(R, TRANCHE);
  const log = R.read('build/epochs.md') ?? '# Epochs (labels only: nothing here points into a state branch)\n';
  const n = Math.max(0, ...[...log.matchAll(/^- E(\d+) /gm)].map((x) => Number(x[1]))) + 1, e = `E${n}`;
  const blob = execFileSync('git', ['-C', R.root, 'hash-object', '-w', '--stdin'], { input: `# ${e}\n\nopened ${now()}\n`, encoding: 'utf8' }).trim();
  const idx = join(tmpdir(), `proc-index-${process.pid}`), env = { GIT_INDEX_FILE: idx };
  rmSync(idx, { force: true });
  R.g(['read-tree', '--empty'], env);
  R.g(['update-index', '--add', '--cacheinfo', `100644,${blob},epoch.md`], env);
  const tree = R.g(['write-tree'], env); rmSync(idx, { force: true });
  const commit = execFileSync('git', ['-C', R.root, 'commit-tree', tree, '-m', `${e} opens`], { encoding: 'utf8' }).trim();
  R.g(['push', '-q', 'origin', `${commit}:refs/heads/${stateBranch(e)}`]);
  R.write('build/epochs.md', `${log.trimEnd()}\n- ${e} · opened ${today()}\n`);
  const c = commitPush(R, TRANCHE, ['build/epochs.md'], `epoch ${e} opens`);
  return { epoch: e, commit: c };
}
export function epochClose(o) {
  const R = repo(o.product), e = needEpoch(R);
  on(R, TRANCHE);
  const open = stateList(R, 'asks', e).filter((p) => /^asks\/A\d+\.md$/.test(p)).map((p) => [p.slice(5, -3), statusOf(stateRead(R, p, e))]).filter(([, s]) => s !== 'CLOSED').map(([id, s]) => `${id} ${s}`);
  if (open.length) refuse(`asks still open: ${open.join(', ')}`);
  const unrouted = stateList(R, 'refusals', e).map((p) => (stateRead(R, p, e) || '').match(/^\*\*Refused\*\* · (R[\w-]+) · .* · OPEN$/m)?.[1]).filter(Boolean);
  if (unrouted.length) refuse(`refusals still open: ${unrouted.join(', ')} (route each with \`proc refused routed\`, before the close PR merges: its row rides the PR; DRYRUN §4.21)`);
  const live = [...jobFiles(R, e), ...stateList(R, 'lanes', e)].map((p) => [p, stateRead(R, p, e) || '']).filter(([, t]) => LIVE_LINE.test(t)).map(([p]) => p);
  if (live.length) refuse(`sessions still live on the state branch: ${live.join(', ')} (archive them and record it first)`);
  const plan = parsePlan(stateRead(R, 'plan.md', e) || '');
  if (plan.owed.length) refuse(`acts still owed: ${plan.owed.join('; ')}`);
  // the epoch's process reports outlive its state branch: kept under build/process-issues/ on the tranche (issue 75)
  const reports = stateList(R, 'issues', e).map((p) => { const f = `build/process-issues/${p.slice('issues/'.length)}`; R.write(f, stateRead(R, p, e) || ''); return f; });
  const marked = stateWrite(R, { 'epoch.md': `${stateRead(R, 'epoch.md', e) || `# ${e}`}\nclosed ${now()}\n` }, `${e} closes`, e);
  const prune = pruneRef(R, stateBranch(e));
  const log = R.read('build/epochs.md') || '';
  // Mid-tranche (an account move, a stop) the closed line is written now; at a tranche's close it is already in the close PR.
  R.write('build/epochs.md', log.replace(new RegExp(`^- ${e} · opened (\\S+)$`, 'm'), `- ${e} · opened $1 · closed ${today()}`));
  return { epoch: e, marked, prune, reports, commit: commitPush(R, TRANCHE, ['build/epochs.md', ...reports], `epoch ${e} closes`) };
}

// ---- the plan's transient lines; a stop and a resume in its Status line (R10; PLN-5) ----

const STATUS = /^\*\*Status\*\* · ([A-Z]+) · (BOB #\d+) · (session_[0-9A-Za-z]+)(?: · (STOPPED (.+?) · (\S+)|RESUMED (\S+)))?$/m;
export const CHOICES = ['complete-allowed', 'abandoned'];
export function parsePlan(text) {
  const t = text || '', s = t.match(STATUS);
  const owed = (t.match(/^\*\*Owed\*\* · (.*)$/m)?.[1] ?? '').split('; ').map((x) => x.trim()).filter((x) => x && x !== 'none');
  const layers = Object.fromEntries([...(t.match(/^\*\*Layers\*\* · (.*)$/m)?.[1] ?? '').matchAll(/(\d+) (STARTED|CLOSED)/g)].map((x) => [Number(x[1]), x[2]]));
  const retiring = [...(t.match(/^\*\*Retiring\*\* · (.*)$/m)?.[1] ?? '').matchAll(/(BOB #\d+) (session_[0-9A-Za-z]+) (running|released)/g)].map((x) => ({ name: x[1], session: x[2], state: x[3] }));
  const choices = Object.fromEntries([...(t.match(/^\*\*Choices\*\* · (.*)$/m)?.[1] ?? '').matchAll(/([a-z][a-z0-9-]*) (complete-allowed|abandoned)/g)].map((x) => [x[1], x[2]]));
  const stop = s?.[4]?.startsWith('STOPPED') ? { why: s[5], version: s[6], choices } : null;
  const resumed = s?.[7] ?? null;
  return { state: s?.[1] ?? null, bob: s ? { name: s[2], session: s[3] } : null, owed, layers, retiring, stop, resumed, pin: stop?.version ?? resumed };
}
export const fmtPlan = (p) => `# Plan (transient)\n\n**Status** · ${p.state} · ${p.bob.name} · ${p.bob.session}${p.stop ? ` · STOPPED ${p.stop.why} · ${p.stop.version}` : p.resumed ? ` · RESUMED ${p.resumed}` : ''}\n**Owed** · ${p.owed.join('; ') || 'none'}\n${Object.keys(p.layers || {}).length ? `**Layers** · ${Object.entries(p.layers).map(([l, s]) => `${l} ${s}`).join('; ')}\n` : ''}${(p.retiring || []).length ? `**Retiring** · ${p.retiring.map((r) => `${r.name} ${r.session} ${r.state}`).join('; ')}\n` : ''}${p.stop && Object.keys(p.stop.choices || {}).length ? `**Choices** · ${Object.entries(p.stop.choices).map(([m, c]) => `${m} ${c}`).join('; ')}\n` : ''}`;
export function planEdit(R, edit, message) {
  const p = parsePlan(stateRead(R, 'plan.md') || '');
  return stateWrite(R, { 'plan.md': fmtPlan(edit(p)) }, message);
}
// A stop: why, the process version it is recorded at, and each unmerged job's choice; at most one at a time.
export function stop(R, why, choices = {}, version) {
  const w = String(why || '').replace(/\s*[\n·]\s*/g, ' ').trim();
  if (!w) refuse('a stop names why');
  if (!/^[0-9a-f]{7,40}$/.test(version || '')) refuse('a stop names the process version (a commit) it is recorded at');
  for (const [m, c] of Object.entries(choices)) if (!CHOICES.includes(c)) refuse(`${m}: the choice is ${CHOICES.join(' or ')}, not ${c}`);
  const p = parsePlan(stateRead(R, 'plan.md') || '');
  if (!p.bob) refuse('no plan on the state branch to stop');
  if (p.stop) refuse(`already stopped: ${p.stop.why} · ${p.stop.version}`);
  return planEdit(R, (q) => ({ ...q, stop: { why: w, version, choices }, resumed: null }), `plan: STOPPED ${w.slice(0, 50)} · ${version}`);
}
// A resume clears the stop and names the process version the build runs from then on.
export function resume(R, version) {
  if (!/^[0-9a-f]{7,40}$/.test(version || '')) refuse('a resume names the process version (a commit) the build runs from');
  const p = parsePlan(stateRead(R, 'plan.md') || '');
  if (!p.stop) refuse('not stopped: nothing to resume');
  return planEdit(R, (q) => ({ ...q, stop: null, resumed: version }), `plan: RESUMED ${version}`);
}
// What every role's `status` shows of a stop or a resume.
export const stopOf = (p) => ({ stop: p?.stop ?? null, resumed: p?.resumed ?? null, pin: p?.pin ?? null });

// ---- a remote act recorded from its result (R8; REC-5) ----

// `result` is what the tool call returned. A refusal, an error or nothing at all records nothing: the act stays owed.
// There is no function that records a request.
export function actDone(result) {
  if (result === null || result === undefined || result === '') return false;
  const r = typeof result === 'string' ? (() => { try { return JSON.parse(result); } catch { return null; } })() : result;
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  if (r.error || r.isError || /^(refused|denied|failed|error)/i.test(String(r.status || ''))) return false;
  return Object.keys(r).length > 0;
}
// A session's local records (`.git/<name>`, never committed): written by the command or the post event that took the
// act's result, never by a pre event (N2-6); read back as null when absent or unreadable.
export function recordLocal(root, name, value) { try { writeFileSync(join(root, '.git', name), JSON.stringify(value)); return value; } catch { return null; } }
export function readLocal(root, name) { try { return JSON.parse(readFileSync(join(root, '.git', name), 'utf8')); } catch { return null; } }
export function recordAct(R, act, result) {
  if (!act) refuse('recordAct: the act');
  if (!actDone(result)) refuse(`${act} is not recorded as done: the call's result shows no success (${JSON.stringify(result ?? null).slice(0, 100)}); it stays owed`);
  const p = parsePlan(stateRead(R, 'plan.md') || '');
  if (!p.owed.includes(act)) return { act, recorded: false, why: 'not owed' };
  return { act, recorded: true, commit: planEdit(R, (q) => ({ ...q, owed: q.owed.filter((x) => x !== act) }), `done: ${act.slice(0, 60)}`) };
}

// ---- addresses (R9; REC-6): read at the moment of use from main of the process repository or the product's record ----

const FROM = /^\*\*From\*\* · neoProcess #(\d+) \(`(session_[0-9A-Za-z]+)`\)/m;
// who: 'bob', { module }, { lane }, or 'process' (the neoProcess lane, from the process repository's `main` only).
export function addr(R, who, opts = {}) {
  if (who === 'process') {
    const P = opts.process || R;
    P.fetch('main');
    const m = (P.remote('main', 'lane-neoprocess/HANDOFF.md') || '').match(FROM);
    return m?.[2] ?? refuse('no lane address on the process repository\'s main (lane-neoprocess/HANDOFF.md\'s From line)');
  }
  const e = opts.epoch ?? needEpoch(R);
  if (who === 'bob') return parsePlan(stateRead(R, 'plan.md', e) || '').bob?.session ?? refuse('no BOB in the plan\'s Status line');
  if (who?.lane) return (stateRead(R, `lanes/${who.lane}.md`, e) || '').match(/^\*\*Status\*\* · LIVE \S+ #\d+ (session_[0-9A-Za-z]+)/m)?.[1] ?? refuse(`lane ${who.lane} has no live session`);
  if (who?.module) return (stateRead(R, `jobs/${who.module}.md`, e) || '').match(/^\*\*Status\*\* · [A-Z][A-Z0-9-]* #\d+ · (session_[0-9A-Za-z]+) · /m)?.[1] ?? refuse(`no live session for ${who.module}`);
  return refuse('addr: bob, { module }, { lane } or process');
}

// ---- metrics (R11; SES-10) ----

export const METRICS_HEAD = 'session,role,name,module,cache-read,cache-write,input,output,test runs,module lines,reviewed,note\n';
export const metricsFile = (T) => `build/metrics/${T}.csv`;
// One row keyed by its session id: the session's unmeasured row replaced, else the row appended.
export function metricsRow(csv, row) {
  const lines = (csv || METRICS_HEAD).replace(/\n$/, '').split('\n'), i = lines.findIndex((l, k) => k > 0 && l.startsWith(`${row[0]},`) && /,unmeasured/.test(l));
  if (i > 0) lines[i] = row.join(','); else lines.push(row.join(','));
  return `${lines.join('\n')}\n`;
}
// A session whose usage could not be read is named unmeasured with the reason, its counts left empty, never estimated.
export const unmeasuredRow = (session, role, name, module, why) => [session, role, name, module || '', '', '', '', '', '', '', '', `unmeasured: ${String(why || 'no reason given').replace(/[,\n]/g, ' ').trim()}`];

// ---- status (R6, R7, R13; REC-3, REC-7): the whole record a role needs, from git, in one call ----

// SESSIONS SES 5: BOB refreshes past 40 % of its window, a job or lane past half, ROOT past 55 %.
export const THRESHOLDS = { bob: 40, job: 50, lane: 50, process: 50, onboard: 50, root: 55 };
// The context share from what `get_session` returned (measured 30 Oct: ccr.external_metadata.context_usage
// { max_tokens, used_tokens }). The session's platform status is never read here (PLT-11).
export function contextShare(session, role) {
  let s = session; if (typeof s === 'string') { try { s = JSON.parse(s); } catch { s = null; } }
  const u = (s?.ccr ?? s)?.external_metadata?.context_usage;
  const threshold = THRESHOLDS[role] ?? null;
  if (!u || !(Number(u.max_tokens) > 0) || !Number.isFinite(Number(u.used_tokens))) return { pct: null, threshold, refresh: false, line: 'context: unknown (get_session gave no context_usage)' };
  const pct = Math.round((1000 * Number(u.used_tokens)) / Number(u.max_tokens)) / 10;
  const refresh = threshold !== null && pct > threshold;
  return { pct, threshold, refresh, line: `context: ${pct} % of ${u.max_tokens}${threshold !== null ? ` (threshold ${threshold} %)` : ''}${refresh ? ' REFRESH' : ''}` };
}
const bytesOf = (t) => (t === null ? null : Buffer.byteLength(t, 'utf8'));
const JOB_LINE = /^\*\*Status\*\* · ([A-Z][A-Z0-9-]* #\d+) · (session_[0-9A-Za-z]+|-) · (.+?)(?: · PR #(\d+))?$/m;
const field = (t, k) => t.match(new RegExp(`^\\*\\*${k}\\*\\* · (.*)$`, 'm'))?.[1] ?? null;
const listOf = (v) => (v || '').split('; ').map((x) => x.trim()).filter((x) => x && x !== 'none');
// o: { product, role, session (get_session's output), set (the role's reading set: paths), epoch }
export function status(o) {
  const R = repo(o.product), e = o.epoch ?? needEpoch(R);
  const files = [];
  const read = (p) => { const t = stateRead(R, p, e); files.push({ path: `${stateBranch(e)}:${p}`, bytes: bytesOf(t) }); return t || ''; };
  const planText = read('plan.md'), plan = parsePlan(planText);
  const jobs = jobFiles(R, e).map((p) => {
    const t = read(p), m = t.match(JOB_LINE);
    if (!m) return null;
    const merges = listOf(field(t, 'Merges'));
    const j = { module: p.slice(5, -3), name: m[1], session: m[2] === '-' ? null : m[2], state: m[3], pr: m[4] ? Number(m[4]) : null, owed: listOf(field(t, 'Owed')), line: (t.match(/^\*\*Status\*\* · .*$/m) || [''])[0] };
    j.merged = j.state === 'MERGED' || merges.length > 0;
    return j;
  }).filter(Boolean);
  const lanes = stateList(R, 'lanes', e).filter((p) => /^lanes\/[^/]+\.md$/.test(p)).map((p) => ({ id: p.slice(6, -3), line: (read(p).match(/^\*\*Status\*\* · .*$/m) || [''])[0] }));
  const asks = stateList(R, 'asks', e).filter((p) => /^asks\/A\d+\.md$/.test(p)).map((p) => ({ id: p.slice(5, -3), status: statusOf(read(p)) })).filter((a) => a.status !== 'CLOSED');
  const refusals = stateList(R, 'refusals', e).map((p) => read(p).match(/^\*\*Refused\*\* · (R[\w-]+) · .* · OPEN$/m)?.[1]).filter(Boolean);
  const undelivered = stateList(R, 'undelivered', e).map((p) => ({ id: p.slice('undelivered/'.length).replace(/\.md$/, ''), text: read(p).trim().split('\n')[0] }));
  const owed = [...plan.owed.map((x) => `plan: ${x}`), ...jobs.flatMap((j) => j.owed.map((x) => `${j.module}: ${x}`))];
  const halted = {
    open: jobs.filter((j) => !j.merged).map((j) => `${j.module} ${j.state}${j.pr ? ` PR #${j.pr}` : ''}`),
    idle: jobs.filter((j) => j.merged && j.session).map((j) => `${j.module} ${j.name} ${j.session}`),
    merged: jobs.filter((j) => j.merged).map((j) => j.module),
    unmerged: jobs.filter((j) => !j.merged && j.pr).map((j) => `${j.module} PR #${j.pr}${j.session ? '' : ' (no session)'}`),
    owed,
  };
  const set = (o.set || []).map((p) => ({ path: p, bytes: bytesOf(R.read(p)) }));
  const context = o.session !== undefined ? contextShare(o.session, o.role) : null;
  return { epoch: e, plan: { state: plan.state, bob: plan.bob, layers: plan.layers, retiring: plan.retiring }, ...stopOf(plan), jobs, lanes, asks, refusals, undelivered, ...halted, set, files, context };
}
// The status as lines, for any role: everything open, idle, merged, unmerged and owed, with sizes.
export function statusLines(s) {
  const l = [`epoch ${s.epoch} · plan ${s.plan.state ?? '?'} · ${s.plan.bob ? `${s.plan.bob.name} ${s.plan.bob.session}` : 'no BOB'}`];
  if (s.stop) l.push(`STOPPED ${s.stop.why} · ${s.stop.version}${Object.keys(s.stop.choices).length ? ` · ${Object.entries(s.stop.choices).map(([m, c]) => `${m} ${c}`).join('; ')}` : ''}: take no new step`);
  if (s.resumed) l.push(`RESUMED ${s.resumed}`);
  l.push(`pin: ${s.pin ?? 'unknown'}`);
  for (const j of s.jobs) l.push(`job ${j.line.replace(/^\*\*Status\*\* · /, '')}`);
  for (const x of s.lanes) l.push(`lane ${x.id}: ${x.line.replace(/^\*\*Status\*\* · /, '')}`);
  for (const [k, v] of [['open', s.open], ['idle', s.idle], ['merged', s.merged], ['unmerged', s.unmerged], ['owed', s.owed]]) l.push(`${k}: ${v.join('; ') || 'none'}`);
  l.push(`asks open: ${s.asks.map((a) => `${a.id} ${a.status}`).join('; ') || 'none'}`);
  l.push(`refusals open: ${s.refusals.join('; ') || 'none'}`);
  l.push(`undelivered: ${s.undelivered.map((u) => `${u.id} ${u.text}`).join('; ') || 'none'}`);
  for (const f of [...s.files, ...s.set]) l.push(`SIZE ${f.path} ${f.bytes ?? 'absent'}`);
  if (s.context) l.push(s.context.line);
  return l;
}
// A session's reading set as read from the working tree, with sizes (R13).
export const readingSizes = (R, list) => list.map((p) => ({ path: p, bytes: bytesOf(R.read(p)) }));
