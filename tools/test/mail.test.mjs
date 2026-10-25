// tools/mail.mjs against a real remote: a bare origin, one clone as BOB (on the tranche branch) and one as a job (on
// its job branch). Every fault a doorbell can suffer (late, duplicated, reordered, lost) reduces to "read past the
// cursor", so the tests check that reading is idempotent and complete, never how a message arrived.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { post, inbox, done, start, state, bob, addjob, jobbranch, addr, check, parseEntries, parseStatus, ringText, oversize, sizeLines, xwriter, xpost, xinbox, xcheck, xdone } from '../mail.mjs';

const MAIL = join(dirname(fileURLToPath(import.meta.url)), '..', 'mail.mjs');

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
  // a state already as asked (and an address already written) is a success with nothing to commit (SKILLS #1, T7)
  assert.doesNotThrow(() => state({ ...J(w.job), set: 'WAITING ON BOB (J1)' }));
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  assert.doesNotThrow(() => addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 }));
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
  state({ ...J(w.job), running: 30, what: 'suite' });
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

// ---- the size gate (K5015; P20, P13, P19) ----

const put = (product, path, text) => { const f = join(product, path); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };
const bytes = (n) => 'x'.repeat(n);
const lines = (n) => 'r\n'.repeat(n);
// One document at its limit and one byte (or line) over it, for each limit of the design.
const LIMITS = [
  ['build/rulings-active.md', 'lines', lines(80), lines(81), 80],
  ['build/rulings-active.md', 'bytes', bytes(25600), bytes(25601), 25600],
  ['build/handoff.md', 'bytes', bytes(25600), bytes(25601), 25600],
  ['build/plan/big.md', 'bytes', bytes(51200), bytes(51201), 51200],
  ['build/plan/deep/er/big.md', 'bytes', bytes(51200), bytes(51201), 51200],
];
// What a refused command must leave alone: the working tree, HEAD, and the remote branch.
const snap = (w, branch) => `${g(w, 'rev-parse', 'HEAD')}${g(w, 'status', '--porcelain')}${g(w, 'ls-remote', 'origin', branch)}`;

test('size gate: a document 1 over its limit refuses every gated command, names it, and writes nothing', () => {
  for (const [path, unit, , over, limit] of LIMITS) {
    const w = world();
    addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
    start({ ...J(w.job), session: J1, depth: 2 });
    post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
    put(w.bob, path, over); put(w.job, path, over);
    g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'over'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);   // a job is measured on the tranche's tip
    const named = new RegExp(`${path.replace(/[./]/g, '\\$&')} \\d+ ${unit} > ${limit} ${unit}`);
    const before = [snap(w.bob, `tranche/${T}`), snap(w.job, `job/${T}/alpha`)];
    const bobSide = [
      () => bob({ product: w.bob, tranche: T, name: 'BOB #51', session: B1, depth: 1 }),
      () => addjob({ ...J(w.bob), name: 'ALPHA #2', session: J1 }),
      () => post({ ...J(w.bob), as: 'bob', kind: 'CHANGE', body: 'x' }),
      () => inbox({ ...J(w.bob), as: 'bob' }),
      () => xwriter({ product: w.bob, as: 'BOB', session: B1 }),
      () => xpost({ product: w.bob, as: 'BOB', kind: 'NOTICE', body: 'x' }),
      () => xinbox({ product: w.bob, as: 'BOB', from: 'X' }),
      () => xcheck({ product: w.bob, as: 'BOB' }),
    ];
    const jobSide = [
      () => post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'q' }),
      () => post({ ...J(w.job), as: 'job', kind: 'COMPLETE', body: 'c' }),
      () => inbox({ ...J(w.job), as: 'job' }),
    ];
    for (const f of bobSide) assert.throws(f, (e) => named.test(e.message) && /prune them now \(mechanics §17\)/.test(e.message), `${path} ${unit}`);
    // a job is refused only by its own reading set, the plan files; BOB's takeover set never refuses it (K5123)
    if (path.startsWith('build/plan/')) for (const f of jobSide) assert.throws(f, (e) => named.test(e.message) && /BOB prunes them; post BLOCKED with cause reading\./.test(e.message), `${path} ${unit}`);
    assert.deepEqual([snap(w.bob, `tranche/${T}`), snap(w.job, `job/${T}/alpha`)], before, 'nothing written');
  }
});

test('size gate (K5123): a job\'s post and inbox succeed while BOB\'s takeover documents are over their limits; BOB\'s are refused', () => {
  for (const [path, , , over] of LIMITS.filter((l) => !l[0].startsWith('build/plan/'))) {
    const w = world();
    addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
    start({ ...J(w.job), session: J1, depth: 2 });
    post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
    put(w.bob, path, over);
    g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'over'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
    assert.equal(inbox({ ...J(w.job), as: 'job' }).entries.length, 1, path);
    assert.equal(post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'q' }).id, 'J1', path);
    assert.throws(() => post({ ...J(w.bob), as: 'bob', kind: 'ANSWER', body: 'a' }), new RegExp(`${path.replace(/[./]/g, '\\$&')} .*prune them now`), path);
    assert.throws(() => inbox({ ...J(w.bob), as: 'bob' }), /prune them now/, path);
    assert.deepEqual(oversize(w.bob, undefined, 'job'), [], 'a job measures the plan files only');
  }
});

test('size gate (K5123): a job\'s post is still refused while a build/plan file is over its limit', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  start({ ...J(w.job), session: J1, depth: 2 });
  put(w.bob, 'build/plan/big.md', bytes(51201));
  g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'over'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
  assert.throws(() => post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'q' }), /build\/plan\/big\.md 51201 bytes > 51200 bytes/);
  assert.equal(post({ ...J(w.job), as: 'job', kind: 'BLOCKED', body: 'cause reading' }).id, 'J1');
});

test('size gate (K5123): check lists NEAR for BOB\'s documents above 95 % of a limit, and no NEAR at 95 % or over the limit', () => {
  const w = world();
  put(w.bob, 'build/rulings-active.md', lines(77));          // 77 > 76 (95 % of 80)
  put(w.bob, 'build/handoff.md', bytes(24321));              // 95 % of 25,600 is 24,320
  put(w.bob, 'build/plan/p/big.md', bytes(51000));           // plan files are not BOB's two documents: no NEAR
  assert.deepEqual(sizeLines(w.bob), ['NEAR build/rulings-active.md 77 lines / 80 lines', 'NEAR build/handoff.md 24321 / 25600']);
  const r = spawnSync(process.execPath, [MAIL, 'check', '--product', w.bob, '--tranche', T], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^NEAR build\/handoff\.md 24321 \/ 25600$/m);
  assert.match(r.stdout, /^NEAR build\/rulings-active\.md 77 lines \/ 80 lines$/m);
  put(w.bob, 'build/rulings-active.md', lines(76)); put(w.bob, 'build/handoff.md', bytes(24320));
  assert.deepEqual(sizeLines(w.bob), [], 'exactly 95 % is not near');
  put(w.bob, 'build/handoff.md', bytes(25601));
  assert.deepEqual(sizeLines(w.bob), ['SIZE build/handoff.md 25601 > 25600'], 'over the limit is a SIZE line, not also NEAR');
});

test('size gate: a document exactly at its limit passes', () => {
  for (const [path, , atLimit] of LIMITS) {
    const w = world();
    put(w.bob, path, atLimit); put(w.job, path, atLimit);
    assert.deepEqual(oversize(w.bob), []);
    assert.doesNotThrow(() => bob({ product: w.bob, tranche: T, name: 'BOB #51', session: B1, depth: 1 }));
    assert.doesNotThrow(() => addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 }));
    assert.doesNotThrow(() => start({ ...J(w.job), session: J1, depth: 2 }));
    assert.equal(post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'q' }).id, 'J1');
    assert.equal(inbox({ ...J(w.bob), as: 'bob' }).entries.length, 1);
  }
});

test('size gate: archive is not measured; a missing document is not a fault; line and byte limits of one file both count', () => {
  const w = world();
  put(w.bob, 'build/plan/archive/old/huge.md', bytes(900000));
  assert.deepEqual(oversize(w.bob), []);
  for (const f of ['shot.png', 'deep/walk/shot.jpg', 'data.bin', 'x.pdf']) put(w.bob, `build/plan/${f}`, bytes(900000));
  assert.deepEqual(oversize(w.bob), [], 'images and other binaries are never measured');
  for (const f of ['a.md', 'b.txt', 'c.tsv', 'd.csv', 'e.json', 'f.html']) put(w.bob, `build/plan/${f}`, bytes(51201));
  assert.deepEqual(oversize(w.bob).map((v) => v.path), ['a.md', 'b.txt', 'c.tsv', 'd.csv', 'e.json', 'f.html'].map((f) => `build/plan/${f}`), 'text files are');
  for (const f of ['a.md', 'b.txt', 'c.tsv', 'd.csv', 'e.json', 'f.html']) writeFileSync(join(w.bob, 'build/plan', f), '');
  put(w.bob, 'build/rulings-active.md', 'x'.repeat(30000));       // 1 line, 30000 bytes
  assert.deepEqual(oversize(w.bob).map((v) => `${v.unit}:${v.n}`), ['bytes:30000']);
  put(w.bob, 'build/rulings-active.md', 'x\n'.repeat(81));        // 81 lines, 162 bytes
  assert.deepEqual(oversize(w.bob).map((v) => `${v.unit}:${v.n}`), ['lines:81']);
  put(w.bob, 'build/rulings-active.md', 'x'.repeat(100) + '\n' + 'x\n'.repeat(80));   // 81 lines whose last has a newline, and a final line without one counts too
  assert.equal(oversize(w.bob)[0].n, 81);
  put(w.bob, 'build/rulings-active.md', 'x\n'.repeat(79) + 'x');  // 80 lines, the last unterminated
  assert.deepEqual(oversize(w.bob), []);
});

test('size gate: done, state and a job\'s BLOCKED pass while a document is over its limit; the cursor moves, the state is set', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  start({ ...J(w.job), session: J1, depth: 2 });
  post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
  post({ ...J(w.job), as: 'job', kind: 'QUESTION', body: 'q' });
  for (const d of [w.bob, w.job]) put(d, 'build/plan/big.md', bytes(51201));
  g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'over'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
  assert.equal(done({ ...J(w.job), as: 'job', through: 'B1' }).moved, true);
  assert.equal(done({ ...J(w.bob), as: 'bob', through: 'J1' }).moved, true);
  state({ ...J(w.job), set: 'NEEDS BOB' });
  assert.equal(parseStatus(readFileSync(join(w.job, `build/jobs/${T}/alpha.md`), 'utf8')).state, 'NEEDS BOB');
  assert.equal(post({ ...J(w.job), as: 'job', kind: 'BLOCKED', body: 'reading: build/plan/big.md is over its limit' }).id, 'J2');
  assert.deepEqual(addr({ product: w.bob, tranche: T, module: 'alpha' }), J1);
  assert.match(ringText(T, 'BOB'), /^MAIL/);
  assert.throws(() => xdone({ product: w.bob, as: 'BOB', from: 'X', through: 'X1' }), (e) => !/over their limits/.test(e.message));   // not gated (it has no registry here)
  // BOB's other kinds and every other job kind stay refused
  assert.throws(() => post({ ...J(w.bob), as: 'bob', kind: 'ANSWER', re: 'J1', body: 'x' }), /over their limits/);
  assert.throws(() => post({ ...J(w.job), as: 'job', kind: 'REPORT', body: 'x' }), /over their limits/);
});

test('size gate: the exempt list names a document and its reason; a line with no reason exempts nothing', () => {
  const w = world();
  put(w.bob, 'build/plan/big.md', bytes(60000));
  put(w.bob, 'build/plan/other.md', bytes(60000));
  put(w.bob, 'build/plan/size-exempt.txt', 'build/plan/big.md · one atomic table, read whole by its job\nbuild/plan/other.md\n');
  assert.deepEqual(oversize(w.bob).map((v) => v.path), ['build/plan/other.md']);
  put(w.bob, 'build/plan/size-exempt.txt', 'build/plan/big.md · reason\nbuild/plan/other.md · reason\n');
  assert.deepEqual(oversize(w.bob), []);
  assert.doesNotThrow(() => bob({ product: w.bob, tranche: T, name: 'BOB #51', session: B1, depth: 1 }));
});

test('size gate: check is never refused and lists each oversized document as a SIZE line', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  put(w.bob, 'build/rulings-active.md', 'x\n'.repeat(81));
  put(w.bob, 'build/handoff.md', bytes(25601));
  put(w.bob, 'build/plan/p/big.md', bytes(51201));
  put(w.bob, 'build/plan/archive/skip.md', bytes(99999));
  assert.equal(check({ product: w.bob, tranche: T }).length, 1);
  assert.deepEqual(sizeLines(w.bob), [
    'SIZE build/rulings-active.md 81 lines > 80 lines',
    'SIZE build/handoff.md 25601 > 25600',
    'SIZE build/plan/p/big.md 51201 > 51200',
  ]);
  const r = spawnSync(process.execPath, [MAIL, 'check', '--product', w.bob, '--tranche', T], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^alpha ALPHA #1 /m);
  assert.match(r.stdout, /^SIZE build\/handoff\.md 25601 > 25600$/m);
  assert.match(r.stdout, /^SIZE build\/plan\/p\/big\.md 51201 > 51200$/m);
});

test('size gate on the command line: a refused command exits non-zero and writes nothing; done, state and a job\'s BLOCKED exit 0', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  start({ ...J(w.job), session: J1, depth: 2 });
  post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
  put(w.job, 'build/plan/big.md', bytes(51201)); put(w.bob, 'build/plan/big.md', bytes(51201));
  g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'over'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
  const run = (...a) => spawnSync(process.execPath, [MAIL, ...a, '--product', w.job, '--tranche', T, '--module', 'alpha'], { encoding: 'utf8' });
  const before = snap(w.job, `job/${T}/alpha`);
  let r = run('post', '--as', 'job', '--kind', 'QUESTION', '--body', 'q');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /build\/plan\/big\.md 51201 bytes > 51200 bytes; BOB prunes them; post BLOCKED with cause reading\./);
  r = run('inbox', '--as', 'job'); assert.notEqual(r.status, 0);
  assert.equal(snap(w.job, `job/${T}/alpha`), before);
  for (const ok of [['state', '--set', 'NEEDS BOB'], ['post', '--as', 'job', '--kind', 'BLOCKED', '--body', 'cause reading'], ['addr'], ['ring-text', '--to', 'BOB']]) {
    r = run(...ok); assert.equal(r.status, 0, `${ok.join(' ')}: ${r.stderr}`);
  }
  put(w.bob, 'build/plan/big.md', bytes(51200));                      // BOB prunes on the tranche
  g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'pruned'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
  r = run('inbox', '--as', 'job'); assert.equal(r.status, 0, r.stderr);
});

test('size gate: a job is measured on the tranche tip, so a document BOB pruned there no longer refuses it (D17 finding 2)', () => {
  const w = world();
  addjob({ ...J(w.bob), name: 'ALPHA #1', session: J1 });
  start({ ...J(w.job), session: J1, depth: 2 });
  post({ ...J(w.bob), as: 'bob', kind: 'START', body: 'go' });
  put(w.bob, 'build/plan/big.md', bytes(51201));
  g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'over'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
  put(w.job, 'build/plan/big.md', bytes(51201));                       // the job's own copy, never merged
  assert.throws(() => inbox({ ...J(w.job), as: 'job' }), /big\.md 51201 bytes > 51200 bytes; BOB prunes them/);
  put(w.bob, 'build/plan/big.md', bytes(100));                         // BOB prunes on the tranche
  g(w.bob, 'add', '-A'); g(w.bob, 'commit', '-q', '-m', 'pruned'); g(w.bob, 'push', '-q', 'origin', `tranche/${T}`);
  assert.equal(inbox({ ...J(w.job), as: 'job' }).entries.length, 1);    // the job reads its START with its own copy unmerged
});

test('jobbranch (§5.3 (1); bio K4385): creates or fast-forwards a job branch by a plain push, and never forces one that diverged', () => {
  const w = world();
  const remote = (b) => g(w.bob, 'ls-remote', 'origin', `refs/heads/${b}`).split(/\s/)[0];
  writeFileSync(join(w.bob, 'build/plan/note.md'), 'tranche moves\n');
  g(w.bob, 'add', '.'); g(w.bob, 'commit', '-q', '-m', 'tranche work'); g(w.bob, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  const tip = remote(`tranche/${T}`);
  const ff = jobbranch({ product: w.bob, tranche: T, module: 'alpha' });
  assert.equal(ff.action, 'fast-forwarded'); assert.equal(remote(`job/${T}/alpha`), tip);
  assert.equal(jobbranch({ product: w.bob, tranche: T, module: 'alpha' }).action, 'current');
  const made = jobbranch({ product: w.bob, tranche: T, module: 'beta' });
  assert.equal(made.action, 'created'); assert.equal(remote(`job/${T}/beta`), tip);
  /* control: a job branch with its own commit is refused and left exactly as it was */
  g(w.job, 'pull', '-q', 'origin', `job/${T}/alpha`);
  writeFileSync(join(w.job, 'own.md'), 'job work\n'); g(w.job, 'add', '.'); g(w.job, 'commit', '-q', '-m', 'job work');
  g(w.job, 'push', '-q', 'origin', `HEAD:refs/heads/job/${T}/alpha`);
  writeFileSync(join(w.bob, 'build/plan/note.md'), 'tranche moves again\n');
  g(w.bob, 'add', '.'); g(w.bob, 'commit', '-q', '-m', 'more'); g(w.bob, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  const before = remote(`job/${T}/alpha`);
  assert.throws(() => jobbranch({ product: w.bob, tranche: T, module: 'alpha' }), /never forced/);
  assert.equal(remote(`job/${T}/alpha`), before);
});
