// The mailboxes between BOB and a module job (PROCESS-MECHANICS §13; bio K168). A message is a numbered entry in its
// writer's own file in git; each side keeps a cursor, the last entry of the other side it has processed; a routine
// carries no content, only "check your mailbox". So a late, duplicated, reordered or lost routine changes nothing: the
// reader always reads everything past its cursor. This tool writes and reads the mailboxes and the addresses, so no
// session hand-writes protocol.
//
//   job → BOB   the job's record `build/jobs/<T>/<module>.md` on `job/<T>/<module>`: entries `## J<n> · <KIND>`;
//               its cursor over BOB's entries in its Status line (`handled B<n>`).
//   BOB → job   `build/jobs/<T>/<module>.bob.md` on `tranche/<T>`: entries `## B<n> · <KIND>`; BOB's cursor over the
//               job's entries in its `**Read** · handled J<n>` line.
//   addresses   the plan's Status line (BOB's session) and `**Jobs**` line (each job's session), `build/plan/current.md`.
//
// Usage: node tools/mail.mjs <command> [--product <dir>] --tranche <T> [--module <m>] [options]
//   BOB:  bob --name "BOB #n" --session <id> --depth <d> [--state OPEN]   write the plan's Status line
//         addjob --module <m> --name "<M> #k" --session <id>             add or replace a job's address
//         post --as bob --module <m> --kind <KIND> [--re J<n>] (--body <text> | --body-file <f>)
//         inbox --as bob --module <m>      done --as bob --module <m> --through J<n>
//         check                            the backstop: every job's state and what each needs
//   job:  start --module <m> --session <id> --depth <d>                   create the record's Status line
//         post --as job …   inbox --as job --module <m>   done --as job --module <m> --through B<n>
//         state --module <m> (--set <STATE> | --running <minutes> --what <command>)
//   any:  addr (--bob | --module <m>)      print a session id to ring
//         ring-text --to <name>            print the doorbell's text
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';

export const KINDS = { job: ['QUESTION', 'REPORT', 'COMPLETE', 'BLOCKED'], bob: ['START', 'ANSWER', 'CHANGE', 'RESUME'] };
const QUIET_MS = 20 * 60e3;
const ENTRY = /^## ([JB])(\d+) · ([A-Z]+)(?: · re ([JB]\d+))?[^\n]*$/gm;
const STATUS = /^\*\*Status\*\* · (session_[0-9A-Za-z]+) · depth (\d+) · (.+?) · handled B(\d+)$/m;
const READ = /^\*\*Read\*\* · handled J(\d+)$/m;

// ---- files ----

export const recordPath = (T, m) => `build/jobs/${T}/${m}.md`;
export const outboxPath = (T, m) => `build/jobs/${T}/${m}.bob.md`;
export const PLAN = 'build/plan/current.md';
export const branchOf = (as, T, m) => (as === 'job' ? `job/${T}/${m}` : `tranche/${T}`);

export function parseEntries(text) {
  const out = [];
  const heads = [...(text || '').matchAll(ENTRY)];
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    out.push({ side: h[1], n: Number(h[2]), kind: h[3], re: h[4] || null, text: text.slice(h.index, end).trimEnd() });
  });
  return out;
}
export const lastId = (text) => Math.max(0, ...parseEntries(text).map((e) => e.n));
export function parseStatus(text) {
  const m = (text || '').match(STATUS);
  return m ? { session: m[1], depth: Number(m[2]), state: m[3], handled: Number(m[4]) } : null;
}
export const readCursor = (text) => Number((text || '').match(READ)?.[1] ?? 0);
export const runningUntil = (state) => { const m = /^RUNNING until (\S+)/.exec(state || ''); return m ? Date.parse(m[1]) : NaN; };

// ---- git ----

function repo(product) {
  const dir = resolve(product || '.');
  const root = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const g = (args, opts = {}) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: opts.quiet ? ['ignore', 'pipe', 'ignore'] : undefined, maxBuffer: 64 << 20 });
  const inRepo = (p) => relative(root, join(dir, p));
  return { dir, root, g, inRepo };
}
function fetchBranch(R, branch) {
  try { R.g(['fetch', '-q', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { quiet: true }); return true; } catch { return false; }
}
function showRemote(R, branch, path) {
  try { return R.g(['show', `origin/${branch}:${R.inRepo(path)}`], { quiet: true }); } catch { return null; }
}
function lastPushMs(R, branch) {
  try { return Number(R.g(['log', '-1', '--format=%ct', `origin/${branch}`], { quiet: true }).trim()) * 1000; } catch { return NaN; }
}
function onBranch(R, branch) {
  const cur = R.g(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  if (cur !== branch) throw new Error(`check out ${branch} first (on ${cur})`);
}
// Commit one file and push it; on a rejected push, rebase on the remote once and push again.
function commitPush(R, branch, path, message) {
  R.g(['add', R.inRepo(path)]);
  // A write that changes nothing (a state or address already as asked) is a success with nothing to push.
  try { R.g(['diff', '--cached', '--quiet', '--', R.inRepo(path)], { quiet: true }); return R.g(['rev-parse', '--short', 'HEAD']).trim(); } catch { /* staged change: commit it */ }
  R.g(['commit', '-q', '-m', message, '--', R.inRepo(path)]); // this file only, never other staged work (bio N420)
  try { R.g(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { quiet: true }); }
  catch { R.g(['pull', '-q', '--rebase', 'origin', branch]); R.g(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`]); }
  return R.g(['rev-parse', '--short', 'HEAD']).trim();
}
const readLocal = (R, p) => { const f = join(R.dir, p); return existsSync(f) ? readFileSync(f, 'utf8') : null; };
const writeLocal = (R, p, text) => { const f = join(R.dir, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };

// ---- commands ----

export function post(o) {
  const { as, tranche: T, module: m, kind, re } = o;
  if (!KINDS[as]?.includes(kind)) throw new Error(`${as} sends one of ${KINDS[as]?.join(', ')}, not ${kind}`);
  if (re && !/^[JB]\d+$/.test(re)) throw new Error(`--re ${re}: not J<n> or B<n>`);
  const body = (o.bodyFile ? readFileSync(o.bodyFile, 'utf8') : o.body || '').trim();
  if (!body) throw new Error('a message has a body (--body or --body-file)');
  const R = repo(o.product), branch = branchOf(as, T, m);
  onBranch(R, branch);
  const path = as === 'job' ? recordPath(T, m) : outboxPath(T, m);
  let text = readLocal(R, path);
  if (as === 'job' && !parseStatus(text)) throw new Error(`${path} has no Status line: run "start" first`);
  if (as === 'bob' && text === null) text = `# BOB to ${m} (${T})\n\n**Read** · handled J0\n`;
  const side = as === 'job' ? 'J' : 'B', n = lastId(text) + 1;
  text = `${text.trimEnd()}\n\n## ${side}${n} · ${kind}${re ? ` · re ${re}` : ''}\n\n${body}\n`;
  writeLocal(R, path, text);
  const commit = commitPush(R, branch, path, `mail ${T} ${m}: ${side}${n} ${kind}${re ? ` re ${re}` : ''}`);
  return { id: `${side}${n}`, commit };
}

export function inbox(o) {
  const { as, tranche: T, module: m } = o;
  const R = repo(o.product), other = as === 'job' ? 'bob' : 'job', branch = branchOf(other, T, m);
  fetchBranch(R, branch);
  const theirs = showRemote(R, branch, other === 'job' ? recordPath(T, m) : outboxPath(T, m));
  const mine = readLocal(R, as === 'job' ? recordPath(T, m) : outboxPath(T, m));
  const cursor = as === 'job' ? parseStatus(mine)?.handled ?? 0 : readCursor(mine);
  return { cursor, entries: parseEntries(theirs).filter((e) => e.n > cursor) };
}

export function done(o) {
  const { as, tranche: T, module: m, through } = o;
  const want = as === 'job' ? 'B' : 'J';
  const k = new RegExp(`^${want}(\\d+)$`).exec(through || '');
  if (!k) throw new Error(`--through ${want}<n>`);
  const R = repo(o.product), branch = branchOf(as, T, m);
  onBranch(R, branch);
  const path = as === 'job' ? recordPath(T, m) : outboxPath(T, m);
  let text = readLocal(R, path);
  if (as === 'bob' && text === null) text = `# BOB to ${m} (${T})\n\n**Read** · handled J0\n`;
  const cur = as === 'job' ? parseStatus(text)?.handled : readCursor(text);
  if (cur === undefined) throw new Error(`${path} has no Status line`);
  const n = Number(k[1]);
  if (n <= cur) return { cursor: cur, moved: false };           // at or below the cursor: nothing to do
  text = as === 'job' ? text.replace(/handled B\d+$/m, `handled B${n}`) : text.replace(READ, `**Read** · handled J${n}`);
  writeLocal(R, path, text);
  return { cursor: n, moved: true, commit: commitPush(R, branch, path, `mail ${T} ${m}: ${as} read through ${want}${n}`) };
}

export function start(o) {
  const { tranche: T, module: m, session, depth } = o;
  if (!/^session_[0-9A-Za-z]+$/.test(session || '')) throw new Error('--session <session id>');
  const R = repo(o.product), branch = branchOf('job', T, m);
  onBranch(R, branch);
  const path = recordPath(T, m);
  let text = readLocal(R, path);
  const st = parseStatus(text);
  const line = `**Status** · ${session} · depth ${Number(depth)} · WORKING · handled B${st ? st.handled : 0}`;
  text = st ? text.replace(STATUS, line) : `# ${m} (${T})\n\n${line}\n`;
  writeLocal(R, path, text);
  return { commit: commitPush(R, branch, path, `mail ${T} ${m}: ${session} starts`) };
}

export function state(o) {
  const { tranche: T, module: m } = o;
  let s = o.set;
  if (o.running) s = `RUNNING until ${new Date(Date.now() + Number(o.running) * 60e3).toISOString().replace(/\.\d+Z$/, 'Z')} (${o.what || 'command'})`;
  if (!s || /·/.test(s)) throw new Error('--set <STATE> (no "·"), or --running <minutes> --what <command>');
  const R = repo(o.product), branch = branchOf('job', T, m);
  onBranch(R, branch);
  const path = recordPath(T, m), text = readLocal(R, path), st = parseStatus(text);
  if (!st) throw new Error(`${path} has no Status line: run "start" first`);
  writeLocal(R, path, text.replace(STATUS, `**Status** · ${st.session} · depth ${st.depth} · ${s} · handled B${st.handled}`));
  return { state: s, commit: commitPush(R, branch, path, `mail ${T} ${m}: state ${s}`) };
}

// The plan's Status line names exactly one session, BOB's (§13); the Jobs line names each job's.
export function bob(o) {
  const { tranche: T, name, session, depth } = o;
  if (!/^(?:[A-Z0-9]+-)?BOB #\d+$/.test(name || '') || !/^session_[0-9A-Za-z]+$/.test(session || '')) throw new Error('--name "BOB #<n>" --session <id> --depth <d>');
  const R = repo(o.product), branch = branchOf('bob', T);
  onBranch(R, branch);
  let text = readLocal(R, PLAN) || `# Plan ${T}\n`;
  const old = text.match(/^\*\*Status\*\* · ([A-Z]+)/m)?.[1];
  const line = `**Status** · ${o.state || old || 'OPEN'} · ${name} · ${session} · depth ${Number(depth)}`;
  text = /^\*\*Status\*\*.*$/m.test(text) ? text.replace(/^\*\*Status\*\*.*$/m, line) : text.replace(/^(# .*\n)/, `$1\n${line}\n`);
  writeLocal(R, PLAN, text);
  return { commit: commitPush(R, branch, PLAN, `plan ${T}: ${name} ${session} · depth ${depth}`) };
}
export function addjob(o) {
  const { tranche: T, module: m, name, session } = o;
  if (!/^[A-Z][A-Z0-9-]* #\d+$/.test(name || '') || !/^session_[0-9A-Za-z]+$/.test(session || '')) throw new Error('--module <m> --name "<M> #k" --session <id>');
  const R = repo(o.product), branch = branchOf('bob', T);
  onBranch(R, branch);
  let text = readLocal(R, PLAN);
  const jobs = parseJobs(text).filter((j) => j.module !== m);
  jobs.push({ module: m, name, session });
  const line = `**Jobs** · ${jobs.map((j) => `${j.module}: ${j.name} ${j.session}`).join('; ')}`;
  text = /^\*\*Jobs\*\*.*$/m.test(text) ? text.replace(/^\*\*Jobs\*\*.*$/m, line) : text.replace(/^(\*\*Status\*\*.*\n)/m, `$1\n${line}\n`);
  writeLocal(R, PLAN, text);
  return { commit: commitPush(R, branch, PLAN, `plan ${T}: ${name} ${session} for ${m}`) };
}
export function parseJobs(text) {
  const line = (text || '').match(/^\*\*Jobs\*\* · (.*)$/m)?.[1] || '';
  return [...line.matchAll(/([a-z][a-z0-9-]*): ([A-Z][A-Z0-9-]* #\d+) (session_[0-9A-Za-z]+)/g)].map((x) => ({ module: x[1], name: x[2], session: x[3] }));
}
// Addresses are read from the remote tranche branch, where a successor BOB writes its own (§2, §13).
export function addr(o) {
  const R = repo(o.product), branch = branchOf('bob', o.tranche);
  fetchBranch(R, branch);
  const plan = showRemote(R, branch, PLAN) ?? readLocal(R, PLAN);
  if (o.bob) { const s = plan?.match(/^\*\*Status\*\* · [A-Z]+ · \S+(?: \S+)? #\d+ · (session_[0-9A-Za-z]+) · depth \d+/m)?.[1]; if (!s) throw new Error('no BOB in the plan\'s Status line'); return s; }
  const j = parseJobs(plan).find((x) => x.module === o.module);
  if (!j) throw new Error(`no job for ${o.module} in the plan's Jobs line`);
  return j.session;
}
export const ringText = (T, to) => `MAIL (${T}) for ${to}: check your mailbox (node tools/mail.mjs inbox).`;

// The backstop (§5): for each job, its state and what it needs, from git alone.
export function check(o) {
  const R = repo(o.product), T = o.tranche, tb = branchOf('bob', T), now = o.now ?? Date.now();
  fetchBranch(R, tb);
  const plan = showRemote(R, tb, PLAN) ?? readLocal(R, PLAN);
  return parseJobs(plan).map((j) => {
    const jb = branchOf('job', T, j.module);
    fetchBranch(R, jb);
    const rec = showRemote(R, jb, recordPath(T, j.module));
    const out = readLocal(R, outboxPath(T, j.module)) ?? showRemote(R, tb, outboxPath(T, j.module));
    const st = parseStatus(rec);
    const r = { ...j, state: st?.state ?? 'NOT STARTED', lastJ: lastId(rec), read: readCursor(out), lastB: lastId(out), handled: st?.handled ?? 0, pushedAgoMin: Math.round((now - lastPushMs(R, jb)) / 60e3), needs: [] };
    if (!st) r.needs.push('UNCONFIRMED');
    if (r.lastJ > r.read) r.needs.push(`READ J${r.read + 1}..J${r.lastJ}`);
    if (st && r.handled < r.lastB) r.needs.push('RING');
    if (/^NEEDS BOB/.test(r.state)) r.needs.push('BOB: relay to Bob');
    const until = runningUntil(r.state);
    const idle = now - lastPushMs(R, jb) >= QUIET_MS;
    if (st && idle && (r.state === 'WORKING' || (!Number.isNaN(until) && until < now))) r.needs.push('QUIET');
    return r;
  });
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const o = args(process.argv.slice(2));
  const cmd = o._[0];
  try {
    if (!o.tranche && cmd !== 'help') throw new Error('--tranche <T>');
    switch (cmd) {
      case 'post': { const r = post(o); console.log(`posted ${r.id} (${r.commit}); now ring: ${ringText(o.tranche, o.as === 'job' ? 'BOB' : o.module)}`); break; }
      case 'inbox': { const r = inbox(o); if (!r.entries.length) console.log(`empty (read through ${o.as === 'job' ? 'B' : 'J'}${r.cursor})`); else for (const e of r.entries) console.log(`${e.text}\n`); break; }
      case 'done': { const r = done(o); console.log(r.moved ? `read through ${o.through} (${r.commit})` : `already read through ${o.as === 'job' ? 'B' : 'J'}${r.cursor}: nothing to do`); break; }
      case 'start': console.log(`started (${start(o).commit})`); break;
      case 'state': { const r = state(o); console.log(`state ${r.state} (${r.commit})`); break; }
      case 'bob': console.log(`plan Status written (${bob(o).commit})`); break;
      case 'addjob': console.log(`job address written (${addjob(o).commit})`); break;
      case 'addr': console.log(addr(o)); break;
      case 'ring-text': console.log(ringText(o.tranche, o.to || 'BOB')); break;
      case 'check': for (const r of check(o)) console.log(`${r.module} ${r.name} ${r.session} · ${r.state} · J${r.lastJ} read J${r.read} · B${r.lastB} handled B${r.handled} · pushed ${r.pushedAgoMin} min ago → ${r.needs.join(', ') || 'nothing'}`); break;
      default: throw new Error(`unknown command "${cmd}"; see the header of tools/mail.mjs`);
    }
  } catch (e) { console.error(`mail: ${e.message}`); process.exitCode = 1; }
}
