// tools/record.mjs at its interface (build/requirements/record.md R1-R13), against a real remote: a bare origin and
// clones of it, the state branch opened by `epochOpen` as a build opens it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as REC from '../record.mjs';

const { repo, ghRepo, unpushed, commitPush, epoch, epochOpen, epochClose, stateRead, stateList, stateWrite, parsePlan, fmtPlan, planEdit, stop, resume, recordAct, addr, paths, metricsRow, unmeasuredRow, METRICS_HEAD, status, statusLines, contextShare, readingSizes, Refused, TRANCHE } = REC;
const HERE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const S = (c) => `session_01${c.repeat(24)}`;
const BOB = S('B');
const put = (d, p, text) => { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), text); };

// A product: a bare origin with `tranche`, one clone on it, and the epoch's state branch opened with a plan.
function world({ plan = true } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'record-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const d = clone(base, origin, 'p', null);
  put(d, 'build/epochs.md', '# Epochs (labels only: nothing here points into a state branch)\n');
  put(d, 'src/a.mjs', 'export const a = 1;\n');
  g(d, 'add', '.'); g(d, 'commit', '-q', '-m', 'seed'); g(d, 'branch', '-M', TRANCHE); g(d, 'push', '-q', 'origin', TRANCHE);
  g(d, 'push', '-q', 'origin', `${TRANCHE}:refs/heads/main`);
  g(d, 'branch', '-q', '--set-upstream-to', `origin/${TRANCHE}`);
  if (plan) {
    epochOpen({ product: d });
    stateWrite(repo(d), { 'plan.md': fmtPlan({ state: 'OPEN', bob: { name: 'BOB #1', session: BOB }, owed: [], layers: { 1: 'STARTED' } }) }, 'plan');
  }
  return { base, origin, d };
}
function clone(base, origin, name, branch) {
  const d = join(base, name);
  execFileSync('git', ['clone', '-q', ...(branch ? ['-b', branch] : []), origin, d], { stdio: 'ignore' });
  for (const [k, v] of [['user.name', name], ['user.email', `${name}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v);
  return d;
}
const worktree = (d) => `${g(d, 'rev-parse', 'HEAD')} ${g(d, 'rev-parse', '--abbrev-ref', 'HEAD')} ${g(d, 'status', '--porcelain')} ${g(d, 'worktree', 'list').split('\n').length}`;

test('R1: repo opens a product checkout from a subdirectory and answers its plumbing, its relative paths and its remote name', () => {
  const w = world({ plan: false });
  mkdirSync(join(w.d, 'sub'));
  const R = repo(join(w.d, 'sub'));
  assert.equal(R.root, g(w.d, 'rev-parse', '--show-toplevel'));
  assert.equal(R.rel('x.md'), 'sub/x.md');
  assert.equal(R.branch(), TRANCHE);
  assert.deepEqual(R.heads('refs/heads/*').sort(), ['main', TRANCHE]);
  assert.equal(R.remote(TRANCHE, '../src/a.mjs'), 'export const a = 1;');
  assert.equal(R.remote(TRANCHE, 'absent.md'), null);
  assert.equal(R.read('../src/a.mjs'), 'export const a = 1;\n');
  R.write('n.md', 'n\n'); assert.equal(readFileSync(join(w.d, 'sub/n.md'), 'utf8'), 'n\n');
  g(w.d, 'remote', 'set-url', 'origin', 'https://github.com/own/prod.git');
  assert.deepEqual(ghRepo(R), { owner: 'own', repo: 'prod' });
});

test('R2: the state branch is read and written by plumbing, with no checkout and no second worktree; a write is one pushed commit', () => {
  const w = world(), R = repo(w.d), e = epoch(R), before = worktree(w.d);
  const tip0 = g(w.d, 'rev-parse', `origin/state/${e}`);
  const c = stateWrite(R, { 'jobs/a.md': 'A\n', 'jobs/b.md': 'B\n' }, 'two files');
  assert.equal(worktree(w.d), before, 'the checkout is untouched');
  assert.equal(g(w.origin, 'rev-parse', `state/${e}`).slice(0, 7), c, 'pushed');
  assert.equal(g(w.origin, 'rev-list', '--count', `${tip0}..state/${e}`), '1', 'one commit');
  assert.equal(stateRead(R, 'jobs/a.md'), 'A');
  assert.deepEqual(stateList(R, 'jobs'), ['jobs/a.md', 'jobs/b.md']);
  stateWrite(R, { 'jobs/b.md': null }, 'remove');
  assert.deepEqual(stateList(R, 'jobs'), ['jobs/a.md']);
  assert.equal(stateWrite(R, { 'jobs/a.md': 'A\n' }, 'same'), g(w.origin, 'rev-parse', `state/${e}`).slice(0, 7), 'a write that changes nothing makes no commit');
});

test('R2: a write that loses a race is re-applied on the new tip and pushed, never forced: the other writer\'s commit stays', () => {
  const w = world(), R = repo(w.d), e = epoch(R);
  const other = clone(w.base, w.origin, 'other', `state/${e}`);
  // the first push from the product loses: a pre-push hook lets the other writer push first, once
  const hook = join(w.d, '.git/hooks/pre-push'), mark = join(w.base, 'raced');
  writeFileSync(hook, `#!/bin/sh\n[ -e ${mark} ] && exit 0\ntouch ${mark}\ncd ${other} && echo O > lanes-other.md && git add . && git commit -q -m other && git push -q origin HEAD:state/${e}\nexit 0\n`);
  chmodSync(hook, 0o755);
  stateWrite(R, { 'jobs/mine.md': 'M\n' }, 'mine');
  assert.ok(existsSync(mark), 'the race happened');
  const log = g(w.origin, 'log', '--format=%s', `state/${e}`);
  assert.match(log, /^mine\nother\n/, 'mine on top of the other, which is kept');
  assert.equal(stateRead(R, 'jobs/mine.md'), 'M');
  assert.equal(stateRead(R, 'lanes-other.md'), 'O');
});

test('R3: epochOpen opens the next epoch\'s state branch empty and logs its label on the tranche', () => {
  const w = world({ plan: false });
  const r = epochOpen({ product: w.d });
  assert.equal(r.epoch, 'E1');
  assert.equal(g(w.origin, 'ls-tree', '--name-only', 'state/E1'), 'epoch.md');
  assert.equal(g(w.origin, 'rev-list', '--count', 'state/E1'), '1', 'an orphan: one commit, no parent');
  assert.match(g(w.origin, 'show', `${TRANCHE}:build/epochs.md`), /^- E1 · opened \d{4}-\d\d-\d\d$/m);
  assert.throws(() => epochOpen({ product: w.d }), /E1 is still open/);
});

test('R3: epochClose is refused while an ask is open, and once none is, deletes the state branch and logs the close', () => {
  const w = world(), R = repo(w.d);
  stateWrite(R, { 'asks/A1.md': '# A1\n\n**From** · X #1\nq\n**Status** · RECEIVED\n' }, 'ask');
  assert.throws(() => epochClose({ product: w.d }), (e) => e instanceof Refused && /asks still open: A1 RECEIVED/.test(e.message));
  assert.match(g(w.origin, 'branch', '--list', 'state/E1'), /state\/E1/, 'still there');
  stateWrite(R, { 'asks/A1.md': '# A1\n\n**From** · X #1\nq\n**Status** · CLOSED\n' }, 'closed');
  const r = epochClose({ product: w.d });
  assert.equal(r.prune.deleted, true, 'deleted (the bare fixture allows it)');
  assert.equal(g(w.origin, 'branch', '--list', 'state/E1'), '', 'gone from origin');
  assert.match(g(w.origin, 'show', `${TRANCHE}:build/epochs.md`), /^- E1 · opened \S+ · closed \d{4}-\d\d-\d\d$/m);
  assert.equal(epoch(R), null);
});

test('R3: a delete the proxy refuses is printed as the prune workflow\'s dispatch (the route platform names), never forced', () => {
  const w = world(), R = repo(w.d);
  writeFileSync(join(w.origin, 'hooks', 'pre-receive'), '#!/bin/sh\nwhile read o n r; do [ "$n" = "0000000000000000000000000000000000000000" ] && { echo "deletes refused" >&2; exit 1; }; done\nexit 0\n');
  chmodSync(join(w.origin, 'hooks', 'pre-receive'), 0o755);
  const r = epochClose({ product: w.d });
  assert.equal(r.prune.deleted, false);
  assert.deepEqual([r.prune.dispatch.tool, r.prune.dispatch.workflow_id, r.prune.dispatch.inputs.ref], ['actions_run_trigger', 'prune.yml', 'state/E1']);
  assert.match(g(w.origin, 'show', 'state/E1:epoch.md'), /^closed /m, 'marked closed, so no epoch reads open');
  assert.equal(epoch(R), null);
});

test('R4: commitPush commits only the files named on the branch named and pushes; unpushed lists what is not pushed', () => {
  const w = world({ plan: false }), R = repo(w.d);
  put(w.d, 'one.md', '1\n'); put(w.d, 'src/a.mjs', 'export const a = 2;\n');
  const c = commitPush(R, TRANCHE, ['one.md'], 'one');
  assert.equal(g(w.origin, 'rev-parse', '--short', TRANCHE), c);
  assert.equal(g(w.origin, 'show', '--name-only', '--format=', TRANCHE), 'one.md');
  assert.deepEqual(unpushed(R), ['uncommitted changes'], 'the other change is left alone');
  g(w.d, 'checkout', '-q', 'src/a.mjs');
  put(w.d, 'two.md', '2\n'); g(w.d, 'add', 'two.md'); g(w.d, 'commit', '-q', '-m', 'local');
  assert.deepEqual(unpushed(R), [`1 commit(s) on ${TRANCHE} not pushed`]);
});

test('R4: a push to any branch but the role\'s own, as its role record names it, is refused before anything is written', () => {
  const w = world({ plan: false }), R = repo(w.d);
  writeFileSync(join(w.d, '.git', REC.ROLE_FILE), JSON.stringify({ role: 'job', module: 'alpha', session: S('A') }));
  put(w.d, 'one.md', '1\n');
  const head = g(w.d, 'rev-parse', 'HEAD'), remote = g(w.origin, 'rev-parse', TRANCHE);
  assert.throws(() => commitPush(R, TRANCHE, ['one.md'], 'one'), (e) => e instanceof Refused && /a push to tranche is refused: this session's role pushes to job\/alpha only/.test(e.message));
  assert.deepEqual([g(w.d, 'rev-parse', 'HEAD'), g(w.origin, 'rev-parse', TRANCHE)], [head, remote], 'nothing committed, nothing pushed');
  g(w.d, 'checkout', '-q', '-b', 'job/alpha');
  commitPush(R, 'job/alpha', ['one.md'], 'own');
  assert.equal(g(w.origin, 'show', 'job/alpha:one.md'), '1');
  writeFileSync(join(w.d, '.git', REC.ROLE_FILE), JSON.stringify({ role: 'process', branch: 'lane-x', session: S('P') }));
  assert.throws(() => commitPush(R, 'job/alpha', ['one.md'], 'x'), /pushes to lane-x only/);
  assert.equal(REC.ownBranch({ role: 'bob', session: BOB }), TRANCHE);
});

test('R5: the two path tables are data and no path is in both, or under one of the other', () => {
  const { durable, transient } = paths();
  assert.ok(durable.length && transient.length);
  assert.ok(Object.isFrozen(durable) && Object.isFrozen(transient));
  const under = (a, b) => a === b || (b.endsWith('/') && a.startsWith(b)) || (a.endsWith('/') && b.startsWith(a));
  for (const d of durable) for (const t of transient) assert.ok(!under(d, t), `${d} and ${t}`);
  assert.ok(transient.includes('plan.md') && durable.includes('build/plan/'), 'the transient plan and the durable plan are different paths');
});

// A halted build, modelled on the measured halt of REC-7 (Civicsmith, 30 Oct): one open pull request, three idle merged
// job sessions, one archived unmerged job; an owed act, an open ask, an undelivered message, a stop.
function halted() {
  const w = world(), R = repo(w.d);
  const job = (name, sess, state, pr, extra = '') => `# x (transient)\n\n**Status** · ${name} · ${sess} · ${state}${pr ? ` · PR #${pr}` : ''}\n**Runs** · 1\n**Owed** · none\n${extra}`;
  stateWrite(R, {
    'plan.md': fmtPlan({ state: 'OPEN', bob: { name: 'BOB #7', session: BOB }, owed: ['archive LEDGER #1'], layers: { 3: 'STARTED' } }),
    'jobs/ledger.md': job('LEDGER #1', S('L'), 'COMPLETE', 41),
    'jobs/auth.md': job('AUTH #1', S('U'), 'MERGED', 38, '**Merges** · abc1234 2026-10-30 0\n'),
    'jobs/feed.md': job('FEED #2', S('F'), 'MERGED', 39),
    'jobs/mail.md': job('MAIL #1', S('M'), 'MERGED', 40),
    'jobs/search.md': job('SEARCH #1', '-', 'WORKING', 42),
    'lanes/UX.md': `# UX (transient)\n\n**Status** · LIVE UX #3 ${S('X')} · WAITING: a colour\n`,
    'asks/A4.md': '# A4\n\n**From** · LEDGER #1 · s · 2026-10-30 · QUESTION #2\nIs it?\n**Status** · RECEIVED\n',
    'asks/A3.md': '# A3\n\n**Status** · CLOSED\n',
    'undelivered/M1.md': 'to session_01X: COMPLETE #1 ledger\n',
  }, 'a halt');
  stop(R, 'a process flaw', { ledger: 'complete-allowed', search: 'abandoned' }, 'a0f8c6f7845c');
  return w;
}

test('R6: status on a fresh clone of a halted build tells everything open, idle, merged, unmerged and owed, with sizes (N2-8)', () => {
  const w = halted();
  const fresh = clone(w.base, w.origin, 'fresh', TRANCHE);   // a fresh session: nothing but the clone
  const s = status({ product: fresh });
  assert.equal(s.epoch, 'E1');
  assert.deepEqual(s.plan.bob, { name: 'BOB #7', session: BOB });
  assert.deepEqual(s.open, ['ledger COMPLETE PR #41', 'search WORKING PR #42']);
  assert.deepEqual(s.idle.sort(), [`auth AUTH #1 ${S('U')}`, `feed FEED #2 ${S('F')}`, `mail MAIL #1 ${S('M')}`]);
  assert.deepEqual(s.merged.sort(), ['auth', 'feed', 'mail']);
  assert.deepEqual(s.unmerged, ['ledger PR #41', 'search PR #42 (no session)']);
  assert.deepEqual(s.owed, ['plan: archive LEDGER #1']);
  assert.deepEqual(s.asks, [{ id: 'A4', status: 'RECEIVED' }]);
  assert.deepEqual(s.undelivered, [{ id: 'M1', text: 'to session_01X: COMPLETE #1 ledger' }]);
  assert.match(s.lanes[0].line, /WAITING: a colour/);
  assert.equal(s.pin, 'a0f8c6f7845c');
  for (const f of s.files) assert.ok(f.bytes > 0, f.path);
  assert.ok(s.files.some((f) => f.path === 'state/E1:plan.md'));
  const lines = statusLines(s).join('\n');
  for (const want of [/^STOPPED a process flaw · a0f8c6f7845c · ledger complete-allowed; search abandoned: take no new step$/m, /^pin: a0f8c6f7845c$/m, /^unmerged: ledger PR #41; search PR #42 \(no session\)$/m, /^owed: plan: archive LEDGER #1$/m, /^SIZE state\/E1:jobs\/ledger\.md \d+$/m, /^undelivered: M1 /m]) assert.match(lines, want);
});

test('R6: a job\'s owed acts are listed beside the plan\'s', () => {
  const w = world(), R = repo(w.d);
  stateWrite(R, { 'jobs/a.md': `# a\n\n**Status** · A #1 · ${S('A')} · COMPLETE · PR #3\n**Owed** · mark PR #3 ready; post the report\n` }, 'a');
  assert.deepEqual(status({ product: w.d }).owed, ['a: mark PR #3 ready', 'a: post the report']);
});

test('R7: status prints the context share from get_session\'s output and REFRESH past the role\'s threshold', () => {
  const gs = (used, max = 1000000, st = 'SESSION_STATUS_RUNNING') => ({ ccr: { session_status: st, external_metadata: { context_usage: { max_tokens: max, used_tokens: used } } } });
  assert.deepEqual([contextShare(gs(510000), 'job').pct, contextShare(gs(510000), 'job').refresh], [51, true]);
  assert.equal(contextShare(gs(500000), 'job').refresh, false, 'half is not past half');
  assert.equal(contextShare(gs(410000), 'bob').refresh, true);
  assert.equal(contextShare(gs(390000), 'bob').refresh, false);
  assert.equal(contextShare(gs(560000), 'root').refresh, true);
  assert.equal(contextShare(gs(540000), 'root').refresh, false);
  assert.equal(contextShare(gs(510000), 'lane').refresh, true);
  assert.match(contextShare(JSON.stringify(gs(510000)), 'job').line, /^context: 51 % of 1000000 \(threshold 50 %\) REFRESH$/);
  assert.match(contextShare({}, 'job').line, /unknown/);
  const s = status({ product: world().d, role: 'job', session: gs(600000) });
  assert.match(statusLines(s).join('\n'), /^context: 60 % .* REFRESH$/m);
});

test('R7: no platform status is read as a work state: the session\'s status changes nothing printed', () => {
  const gs = (st) => ({ ccr: { session_status: st, status_bucket: st, external_metadata: { context_usage: { max_tokens: 100, used_tokens: 30 } } } });
  const a = contextShare(gs('SESSION_STATUS_IDLE'), 'job'), b = contextShare(gs('SESSION_STATUS_RUNNING'), 'job'), c = contextShare(gs('SESSION_STATUS_ARCHIVED'), 'job');
  assert.deepEqual(a, b); assert.deepEqual(b, c);
  assert.ok(!/IDLE|RUNNING|ARCHIVED/.test(a.line));
});

test('R8: a remote act is written as done only from the call\'s result; a refusal or no result leaves it owed', () => {
  const w = world(), R = repo(w.d);
  planEdit(R, (p) => ({ ...p, owed: ['archive OLD #1', 'merge PR #4'] }), 'owe');
  for (const bad of [undefined, null, '', { error: 'Permission denied by the classifier' }, { status: 'refused' }, '{"isError":true}', 'not json', []]) {
    assert.throws(() => recordAct(R, 'archive OLD #1', bad), /not recorded as done/, JSON.stringify(bad));
  }
  assert.deepEqual(parsePlan(stateRead(R, 'plan.md')).owed, ['archive OLD #1', 'merge PR #4'], 'still owed');
  assert.equal(recordAct(R, 'archive OLD #1', { session: { id: 'session_01OLD', status: 'archived' } }).recorded, true);
  assert.deepEqual(parsePlan(stateRead(R, 'plan.md')).owed, ['merge PR #4']);
  assert.equal(recordAct(R, 'nothing owed', '{"ok":true}').recorded, false);
  assert.deepEqual(Object.keys(REC).filter((k) => /request/i.test(k)), [], 'there is no function that records a request');
});

test('R9: an address is read from the record at the moment of use, never from a side branch', () => {
  const w = world(), R = repo(w.d);
  assert.equal(addr(R, 'bob'), BOB);
  planEdit(repo(clone(w.base, w.origin, 'bob2', TRANCHE)), (p) => ({ ...p, bob: { name: 'BOB #2', session: S('C') } }), 'successor');
  assert.equal(addr(R, 'bob'), S('C'), 'the successor\'s address, written elsewhere, is read at once');
  stateWrite(R, { 'jobs/alpha.md': `# a\n\n**Status** · ALPHA #1 · ${S('A')} · WORKING\n`, 'lanes/UX.md': `# UX\n\n**Status** · LIVE UX #2 ${S('X')}\n` }, 'addresses');
  assert.equal(addr(R, { module: 'alpha' }), S('A'));
  assert.equal(addr(R, { lane: 'UX' }), S('X'));
  assert.throws(() => addr(R, { module: 'beta' }), /no live session for beta/);
  // the neoProcess lane: main only; the lane's own branch moving first is not read (issue 123)
  const hand = (sess) => `# Handoff\n\n**From** · neoProcess #9 (\`${sess}\`), the lane's address.\n`;
  put(w.d, 'lane-neoprocess/HANDOFF.md', hand(S('N'))); g(w.d, 'add', '.'); g(w.d, 'commit', '-q', '-m', 'h'); g(w.d, 'push', '-q', 'origin', `${TRANCHE}:main`);
  put(w.d, 'lane-neoprocess/HANDOFF.md', hand(S('Z'))); g(w.d, 'add', '.'); g(w.d, 'commit', '-q', '-m', 'side'); g(w.d, 'push', '-q', 'origin', 'HEAD:refs/heads/claude/lane-side');
  assert.equal(addr(R, 'process'), S('N'), 'main\'s address, not the side branch\'s nor the working tree\'s');
  g(w.d, 'push', '-q', 'origin', 'HEAD:main');
  assert.equal(addr(R, 'process'), S('Z'), 'read again at the moment of use once main has it');
});

test('R10: a stop writes STOPPED <why> · <version> with each unmerged job\'s choice, a resume RESUMED <version>; status shows both', () => {
  const w = world(), R = repo(w.d);
  assert.throws(() => stop(R, 'x', { a: 'maybe' }, 'abc1234'), /complete-allowed or abandoned/);
  assert.throws(() => stop(R, 'x', {}, 'not-a-sha'), /process version/);
  assert.throws(() => resume(R, 'abc1234'), /not stopped/);
  stop(R, 'flaw · in\nthe gate', { alpha: 'complete-allowed', beta: 'abandoned' }, 'abc1234');
  const text = stateRead(R, 'plan.md');
  assert.match(text, new RegExp(`^\\*\\*Status\\*\\* · OPEN · BOB #1 · ${BOB} · STOPPED flaw in the gate · abc1234$`, 'm'));
  assert.match(text, /^\*\*Choices\*\* · alpha complete-allowed; beta abandoned$/m);
  assert.deepEqual(status({ product: w.d }).stop, { why: 'flaw in the gate', version: 'abc1234', choices: { alpha: 'complete-allowed', beta: 'abandoned' } });
  assert.throws(() => stop(R, 'again', {}, 'abc1234'), /already stopped/);
  resume(R, 'def5678');
  const after = stateRead(R, 'plan.md');
  assert.match(after, new RegExp(`^\\*\\*Status\\*\\* · OPEN · BOB #1 · ${BOB} · RESUMED def5678$`, 'm'));
  assert.ok(!/Choices/.test(after));
  const s = status({ product: w.d });
  assert.deepEqual([s.stop, s.resumed, s.pin], [null, 'def5678', 'def5678']);
  assert.match(statusLines(s).join('\n'), /^RESUMED def5678$/m);
  assert.deepEqual(parsePlan(after).bob, { name: 'BOB #1', session: BOB }, 'the BOB in the line is still read');
});

test('R11: a metrics row is appended keyed by its session id; an unmeasured session is named so, never estimated', () => {
  let csv = metricsRow(null, ['session_01A', 'job', 'A #1', 'a', 1, 2, 3, 4, '', '', '', '']);
  assert.equal(csv, `${METRICS_HEAD}session_01A,job,A #1,a,1,2,3,4,,,,\n`);
  const u = unmeasuredRow('session_01B', 'job', 'B #1', 'b', 'archive refused, by the classifier\nagain');
  assert.deepEqual(u.slice(4, 11), ['', '', '', '', '', '', ''], 'no count is estimated');
  assert.equal(u[11], 'unmeasured: archive refused  by the classifier again');
  csv = metricsRow(csv, u);
  assert.equal(csv.split('\n').filter(Boolean).length, 3);
  csv = metricsRow(csv, ['session_01B', 'job', 'B #1', 'b', 5, 6, 7, 8, '', '', '', '']);   // measured later: replaces its unmeasured row
  assert.deepEqual(csv.split('\n').filter(Boolean).slice(1), ['session_01A,job,A #1,a,1,2,3,4,,,,', 'session_01B,job,B #1,b,5,6,7,8,,,,']);
  assert.equal(REC.metricsFile('N2'), 'build/metrics/N2.csv');
});

test('R12: no record path is a module\'s path or test in this product, so a record write never touches a module', () => {
  const mods = JSON.parse(readFileSync(join(HERE, 'build/modules.json'), 'utf8'));
  const own = mods.modules.flatMap((m) => [...(m.paths || []), ...(m.tests || [])]);
  const hit = (a, b) => a === b || (b.endsWith('/') && a.startsWith(b)) || (a.endsWith('/') && b.startsWith(a));
  for (const p of paths().durable) for (const o of own) assert.ok(!hit(p, o), `${p} is ${o}`);
  assert.ok(mods.not_product.includes('build/'), 'the build state is not product');
});

test('R13: status prints the role\'s reading set with sizes, and every state file it read with its size', () => {
  const w = world(), R = repo(w.d);
  put(w.d, 'build/requirements/a.md', 'x'.repeat(321));
  const s = status({ product: w.d, set: ['build/requirements/a.md', 'absent.md'] });
  assert.deepEqual(s.set, [{ path: 'build/requirements/a.md', bytes: 321 }, { path: 'absent.md', bytes: null }]);
  const lines = statusLines(s);
  assert.ok(lines.includes('SIZE build/requirements/a.md 321'));
  assert.ok(lines.includes('SIZE absent.md absent'));
  assert.ok(lines.some((l) => /^SIZE state\/E1:plan\.md \d+$/.test(l)));
  assert.deepEqual(readingSizes(R, ['build/requirements/a.md']), [{ path: 'build/requirements/a.md', bytes: 321 }]);
});

// N2-6 (REC-5): the refresh record and the pre event's writes are gone; an archive is recorded from what the call returned.
test('R8: the lane\'s predecessor is recorded archived only from what archive_session returned, or unmeasured with the refusal', async () => {
  const P = await import('../proc.mjs');
  const w = world({ plan: false });
  g(w.d, 'checkout', '-q', '-b', 'lanebranch');
  put(w.d, 'lane-neoprocess/HANDOFF.md', `# H\n\n**From** · neoProcess #10 (\`${S('N')}\`), the lane's address. Before it #9 \`${S('O')}\`, #8 \`${S('P')}\`.\n`);
  g(w.d, 'add', '.'); g(w.d, 'commit', '-q', '-m', 'h'); g(w.d, 'push', '-q', 'origin', 'lanebranch');
  writeFileSync(join(w.d, '.git', REC.ROLE_FILE), JSON.stringify({ role: 'process', product: '.', session: S('N'), branch: 'lanebranch' }));
  const o = { product: w.d }, rows = () => g(w.d, 'show', `origin/lanebranch:${P.LANE_METRICS}`).split('\n').slice(1);
  assert.equal(P.REFRESH_FILE, undefined, 'no refresh record'); assert.equal(P.keepRefresh, undefined);
  assert.throws(() => P.processArchived({ ...o, session: S('Q'), refused: 'x' }), /is not owed/);
  for (const bad of ['{"error":"Permission denied"}', '{}', 'not json']) assert.throws(() => P.processArchived({ ...o, usage: bad }), /shows no archive/, bad);
  assert.equal(existsSync(join(w.d, P.LANE_METRICS)), false, 'nothing written from a request or a failure');
  const r = P.processArchived({ ...o, refused: 'Permission denied by the classifier, [External System Writes]' });
  assert.deepEqual([r.archived, r.unmeasured], [S('O'), true]);
  assert.deepEqual(rows(), [`${S('O')},process,neoProcess #9,,,,,,,,,unmeasured: Permission denied by the classifier  [External System Writes]`]);
  assert.throws(() => P.processArchived({ ...o, refused: 'again' }), /already recorded/);
  P.processArchived({ ...o, usage: '{"session_id":"x","cache_read_tokens":5,"cache_write_tokens":4,"input_tokens":3,"output_tokens":2}' });
  assert.deepEqual(rows(), [`${S('O')},process,neoProcess #9,,5,4,3,2,,,,`], 'the measured row replaces the unmeasured one');
  assert.throws(() => P.processArchived({ ...o, usage: '{"cache_read_tokens":1}' }), /already recorded/);
});

test('R8: the hooks\' pre event writes no record; the post event records the fresh reader and a background worker once the call has run', async () => {
  const H = await import('../hooks.mjs'), P = await import('../proc.mjs');
  const w = world({ plan: false }), ctx = { role: 'bob', session: BOB, root: w.d };
  writeFileSync(join(w.d, '.git', REC.ROLE_FILE), JSON.stringify({ role: 'bob', session: BOB, product: '.' }));
  const HOOKS = join(HERE, 'tools', 'hooks.mjs');
  const run = (ev, input) => execFileSync('node', [HOOKS, ev], { input: JSON.stringify({ session_id: BOB, ...input }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: w.d } });
  run('pre', { tool_name: 'Skill', tool_input: { skill: 'neoprocess-reader' } });
  run('pre', { tool_name: 'Agent', tool_input: { description: 'w1', prompt: 'x', run_in_background: true }, tool_use_id: 't1' });
  assert.equal(REC.readLocal(w.d, H.READER_FILE), null, 'the pre event records nothing');
  assert.equal(REC.readLocal(w.d, P.WORKERS_FILE), null);
  H.postRecord('bob', { tool_name: 'Skill', tool_input: { skill: 'neoprocess-reader' } }, ctx);
  assert.equal(REC.readLocal(w.d, H.READER_FILE).session, BOB);
  H.postRecord('bob', { tool_name: 'Agent', tool_input: { description: 'w1', run_in_background: true }, tool_use_id: 't1' }, ctx);
  H.postRecord('bob', { tool_name: 'Agent', tool_input: { description: 'w2', run_in_background: true }, tool_use_id: 't2' }, ctx);
  assert.deepEqual(P.runningWorkers(w.d, BOB).map((x) => x.description), ['w1', 'w2']);
  assert.equal(H.postRecord('bob', { tool_name: 'Agent', tool_input: { description: 'fg' } }, ctx), null, 'a foreground worker is not a background one');
  assert.equal(REC.recordLocal(join(w.base, 'nowhere'), 'x.json', {}), null, 'no checkout: nothing recorded, nothing thrown');
});
