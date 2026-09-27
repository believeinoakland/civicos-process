// tools/mail.mjs against a real remote: a bare origin, one clone as BOB (on the tranche branch) and one as a job (on
// its job branch). Every fault a doorbell can suffer (late, duplicated, reordered, lost) reduces to "read past the
// cursor", so the tests check that reading is idempotent and complete, never how a message arrived.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { post, inbox, done, start, state, bob, addjob, addr, check, parseEntries, parseStatus, ringText } from '../mail.mjs';

const T = 'D1';
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const J1 = 'session_01AAAAAAAAAAAAAAAAAAAAAAAA', B1 = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB';

function world() {
  const base = mkdtempSync(join(tmpdir(), 'mail-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const seed = join(base, 'seed');
  execFileSync('git', ['clone', '-q', origin, seed], { stdio: 'ignore' });
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t'], ['commit.gpgsign', 'false']]) g(seed, 'config', k, v);
  mkdirSync(join(seed, 'toy/build/plan'), { recursive: true });
  writeFileSync(join(seed, 'toy/build/plan/current.md'), `# Plan ${T}\n\n**Status** · OPEN · no BOB yet\n`);
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/tranche/${T}`); g(seed, 'push', '-q', 'origin', `main:refs/heads/job/${T}/alpha`);
  const clone = (name, branch) => {
    const d = join(base, name);
    execFileSync('git', ['clone', '-q', '-b', branch, origin, d], { stdio: 'ignore' });
    for (const [k, v] of [['user.name', name], ['user.email', `${name}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v);
    return join(d, 'toy');
  };
  return { bob: clone('bob', `tranche/${T}`), job: clone('job', `job/${T}/alpha`) };
}
const J = (product) => ({ product, tranche: T, module: 'alpha' });

test('addresses: the plan names one BOB and each job; a job reads BOB\'s from the remote', () => {
  const w = world();
  bob({ product: w.bob, tranche: T, name: 'BOB #50', session: B1, depth: 1 });
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  addjob({ ...J(w.bob), name: 'ALPHA #2', session: J1.replace('A', 'C') });   // a restart replaces the address
  const plan = readFileSync(join(w.bob, 'build/plan/current.md'), 'utf8');
  assert.match(plan, /^\*\*Status\*\* · OPEN · BOB #50 · session_01B+ · depth 1$/m);
  assert.equal((plan.match(/session_/g) || []).length, 2);
  assert.equal(addr({ product: w.job, tranche: T, bob: true }), B1);
  assert.equal(addr({ ...J(w.job) }), J1.replace('A', 'C'));
  assert.throws(() => bob({ product: w.bob, tranche: T, name: 'BOB 50', session: B1, depth: 1 }), /--name/);
  assert.match(ringText(T, 'BOB'), /^MAIL \(D1\) for BOB: check your mailbox/);
});

test('a round trip: START, QUESTION, ANSWER, COMPLETE, each read once past its cursor', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  assert.equal(post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'Start the job.' }).id, 'B1');
  start({ ...J(w.job), session: J1, depth: 2 });
  let box = inbox({ ...J(w.job), as: 'job' });
  assert.deepEqual(box.entries.map((e) => `B${e.n} ${e.kind}`), ['B1 START']);
  done({ ...J(w.job), as: 'job', through: 'B1' });
  assert.equal(inbox({ ...J(w.job), as: 'job' }).entries.length, 0);       // a duplicate doorbell finds nothing

  assert.equal(post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'Is 0 allowed?' }).id, 'J1');
  box = inbox({ ...J(w.bob), as: 'bob' });
  assert.deepEqual(box.entries.map((e) => `J${e.n} ${e.kind}`), ['J1 QUESTION']);
  assert.equal(post({ ...J(w.bob), as: 'bob', kind: 'ANSWER', re: 'J1', body: 'Yes.' }).id, 'B2');
  done({ ...J(w.bob), as: 'bob', through: 'J1' });
  box = inbox({ ...J(w.job), as: 'job' });
  assert.equal(box.entries[0].re, 'J1');
  done({ ...J(w.job), as: 'job', through: 'B2' });
  post({ ...J(w.job), as: 'job', kind: 'COMPLETE', body: 'Done. Size: test runs 1, module lines 3' });
  assert.deepEqual(inbox({ ...J(w.bob), as: 'bob' }).entries.map((e) => e.kind), ['COMPLETE']);
});

test('lost and late doorbells: several entries posted with no doorbell are all read at the next look, in order', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  start({ ...J(w.job), session: J1, depth: 2 });
  post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'first version' });
  post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'revised: replaces J1' });
  post({ ...J(w.job), as: 'job', kind: 'REPORT', body: 'beta is stale' });
  const box = inbox({ ...J(w.bob), as: 'bob' });
  assert.deepEqual(box.entries.map((e) => e.n), [1, 2, 3]);
  assert.match(box.entries[1].text, /revised/);
});

test('the cursor only moves forward: a stale or repeated "done" changes nothing', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  start({ ...J(w.job), session: J1, depth: 2 });
  post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
  post({ ...J(w.bob), as: 'bob', kind: 'CHANGE', body: 'merge the tranche' });
  assert.equal(done({ ...J(w.job), as: 'job', through: 'B2' }).moved, true);
  assert.deepEqual(done({ ...J(w.job), as: 'job', through: 'B1' }), { cursor: 2, moved: false });
  assert.deepEqual(done({ ...J(w.job), as: 'job', through: 'B2' }), { cursor: 2, moved: false });
  assert.equal(parseStatus(readFileSync(join(w.job, `build/jobs/${T}/alpha.md`), 'utf8')).handled, 2);
});

test('the rules are enforced: kinds by side, a branch per side, a body, a Status line before posting', () => {
  const w = world();
  assert.throws(() => post({ ...J(w.job), as: 'job', kind: 'ANSWER', body: 'x' }), /one of QUESTION/);
  assert.throws(() => post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'x' }), /no Status line/);
  assert.throws(() => post({ ...J(w.job), as: 'bob', kind: 'START', body: 'x' }), /check out tranche\/D1/);
  start({ ...J(w.job), session: J1, depth: 2 });
  assert.throws(() => post({ ...J(w.job), as: 'job', kind: 'QUESTION' }), /body/);
  assert.throws(() => done({ ...J(w.job), as: 'job', through: 'J1' }), /--through B<n>/);
});

test('state: WORKING, RUNNING until a stated time, a wait; the cursor and session are kept', () => {
  const w = world();
  start({ ...J(w.job), session: J1, depth: 2 });
  state({ ...J(w.job), running: 30, what: 'the full suite' });
  let st = parseStatus(readFileSync(join(w.job, `build/jobs/${T}/alpha.md`), 'utf8'));
  assert.match(st.state, /^RUNNING until \d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ \(the full suite\)$/);
  state({ ...J(w.job), set: 'WAITING ON BOB (J1)' });
  st = parseStatus(readFileSync(join(w.job, `build/jobs/${T}/alpha.md`), 'utf8'));
  assert.deepEqual([st.session, st.depth, st.state, st.handled], [J1, 2, 'WAITING ON BOB (J1)', 0]);
  assert.throws(() => state({ ...J(w.job), set: 'A · B' }), /no "·"/);
});

test('check: what each job needs, from git alone', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
  let [r] = check({ product: w.bob, tranche: T });
  assert.deepEqual(r.needs, ['UNCONFIRMED']);                              // no record on its branch yet
  start({ ...J(w.job), session: J1, depth: 2 });
  post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'q' });
  [r] = check({ product: w.bob, tranche: T });
  assert.deepEqual(r.needs, ['READ J1..J1', 'RING']);                      // BOB unread; the job has not read B1
  done({ ...J(w.job), as: 'job', through: 'B1' });
  done({ ...J(w.bob), as: 'bob', through: 'J1' });
  [r] = check({ product: w.bob, tranche: T });
  assert.deepEqual(r.needs, []);
  [r] = check({ product: w.bob, tranche: T, now: Date.now() + 25 * 60e3 }); // WORKING, nothing pushed for 25 min
  assert.deepEqual(r.needs, ['QUIET']);
  state({ ...J(w.job), running: 60, what: 'suite' });
  [r] = check({ product: w.bob, tranche: T, now: Date.now() + 25 * 60e3 }); // a long command, not yet due: not quiet
  assert.deepEqual(r.needs, []);
  [r] = check({ product: w.bob, tranche: T, now: Date.now() + 90 * 60e3 }); // past its time
  assert.deepEqual(r.needs, ['QUIET']);
  state({ ...J(w.job), set: 'NEEDS BOB' });
  [r] = check({ product: w.bob, tranche: T });
  assert.deepEqual(r.needs, ['BOB: relay to Bob']);
});

test('parseEntries reads headings, kinds and re, and nothing else', () => {
  const e = parseEntries('# x\n\n**Status** · s\n\n## J1 · QUESTION\n\nwhy?\n\n## J2 · REPORT · re B3\n\nstale\n## not an entry\n');
  assert.deepEqual(e.map((x) => [x.side, x.n, x.kind, x.re]), [['J', 1, 'QUESTION', null], ['J', 2, 'REPORT', 'B3']]);
  assert.match(e[1].text, /stale\n## not an entry/);
});

test('a push rejected because the branch moved is rebased once and pushed', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  const other = join(w.bob, '..', '..', 'bob2');                            // BOB's own other commit, from another checkout
  execFileSync('git', ['clone', '-q', '-b', `tranche/${T}`, join(w.bob, '..', '..', 'origin.git'), other], { stdio: 'ignore' });
  for (const [k, v] of [['user.name', 'b2'], ['user.email', 'b2@t'], ['commit.gpgsign', 'false']]) g(other, 'config', k, v);
  writeFileSync(join(other, 'toy/note.md'), 'x\n'); g(other, 'add', '.'); g(other, 'commit', '-q', '-m', 'note'); g(other, 'push', '-q');
  assert.equal(post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' }).id, 'B1');
  assert.match(g(w.bob, 'log', '--format=%s', `origin/tranche/${T}`, '-3'), /mail D1 alpha: B1 START\nnote/);
});
