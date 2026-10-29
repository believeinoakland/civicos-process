// tools/neo.mjs against a real remote: a bare origin seeded with the dry run's toy product on the fixed `tranche` branch,
// one clone as BOB. The state branch by plumbing, an epoch, the ask's whole life through a lane, the lane's life, the
// queue and the generated handoff, and each refusal the protocol names (PROTOCOL §3–§8, SESSIONS §6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as N from '../neo.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), TOY = join(HERE, '..', '..', 'dryrun');
const B1 = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB', B2 = 'session_01BBBBBBBBBBBBBBBBBBBBBBB2', J1 = 'session_01AAAAAAAAAAAAAAAAAAAAAAAA', L1 = 'session_01LLLLLLLLLLLLLLLLLLLLLLLL';
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const ident = (d, n) => { for (const [k, v] of [['user.name', n], ['user.email', `${n}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v); };
const f = (dir, name, text) => { const p = join(dir, name); writeFileSync(p, text); return p; };

function world() {
  const base = mkdtempSync(join(tmpdir(), 'neo-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const seed = join(base, 'seed');
  execFileSync('git', ['clone', '-q', origin, seed], { stdio: 'ignore' }); ident(seed, 'seed');
  cpSync(TOY, join(seed, 'toy'), { recursive: true });
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/${N.TRANCHE}`);
  const clone = (name) => { const d = join(base, name); execFileSync('git', ['clone', '-q', '-b', N.TRANCHE, origin, d], { stdio: 'ignore' }); ident(d, name); return { dir: join(d, 'toy'), root: d }; };
  return { base, origin, bob: clone('bob'), clone };
}
const O = (w, extra = {}) => ({ product: w.bob.dir, ...extra });

test('an epoch, an ask through a dormant lane, the lane\'s life, the queue, the handoff, the epoch closed', () => {
  const w = world(), o = (x) => O(w, x);
  // no epoch: everything that needs the state branch refuses; takeover before an epoch too
  assert.throws(() => N.status(o()), /no epoch is open/);
  const e1 = N.epochOpen(o());
  assert.equal(e1.epoch, 'E1');
  assert.deepEqual(w.bob.root && N.repo(w.bob.dir).heads('refs/heads/state/*'), ['state/E1']);
  assert.throws(() => N.epochOpen(o()), /E1 is still open/);
  // the state branch is an orphan: one root commit, no parent, sharing nothing with the tranche
  assert.equal(g(w.bob.root, 'rev-list', '--max-parents=0', '--count', 'origin/state/E1'), '1');
  assert.throws(() => g(w.bob.root, 'merge-base', 'origin/state/E1', `origin/${N.TRANCHE}`));
  assert.match(readFileSync(join(w.bob.dir, 'build/epochs.md'), 'utf8'), /^- E1 · opened \d{4}/m);

  // takeover: the Status line on the state branch, the role file, an empty queue
  const tk = N.takeover(o({ name: 'BOB #1', session: B1 }));
  assert.equal(N.readRole(w.bob.root).role, 'bob');
  assert.deepEqual(tk.queue, []);
  assert.equal(N.addr(o({ bob: true })), B1);
  assert.equal(N.status(o()).bob.session, B1);
  // the tranche checkout is untouched by state writes: no commit, nothing unpushed
  assert.deepEqual(N.unpushed(N.repo(w.bob.dir)), []);
  // a job's transient line (the job commands come with the job's life): alpha is live
  N.stateWrite(N.repo(w.bob.dir), { 'jobs/alpha.md': `**Status** · ALPHA #1 · ${J1} · WORKING\n` }, 'alpha working');
  assert.equal(N.addr(o({ module: 'alpha' })), J1);

  // a lane opened: the register and the charter on the tranche, DORMANT on the state branch, its start owed
  const charter = f(w.base, 'charter.md', 'Area: the toy\'s arithmetic. You decide what sum means.\n');
  assert.throws(() => N.laneOpen(o({ id: 'ARITH', area: 'arithmetic', charterFile: charter, canon: 'no/such.md' })), /no such file/);
  const lo = N.laneOpen(o({ id: 'ARITH', area: 'arithmetic', charterFile: charter, canon: 'build/requirements/alpha.md' }));
  assert.equal(lo.start.title, 'ARITH #1');
  assert.match(lo.start.prompt, /^\/goal /);
  assert.equal(lo.start.model, 'claude-opus-5-5');
  assert.throws(() => N.laneOpen(o({ id: 'ARITH2', area: 'arithmetic', charterFile: charter })), /one lane, one area/);
  assert.deepEqual(N.lanes(N.repo(w.bob.dir)).map((l) => [l.id, l.status]), [['ARITH', 'OPEN']]);
  assert.deepEqual(N.status(o()).owed, ['start lane ARITH']);
  assert.match(N.status(o()).gate.join(';'), /owed: start lane ARITH/);
  // a charter over 4 KB is refused (SESSIONS §6)
  assert.throws(() => N.laneOpen(o({ id: 'BIG', area: 'big', charterFile: f(w.base, 'big.md', 'x'.repeat(5000)) })), /limit is 4096/);

  // an ask: opened verbatim, numbered; a repeat refused; routed to the lane; asked (the lane is dormant: create_session first)
  const msg = f(w.base, 'q.md', 'QUESTION #1: may sum([]) be 0, or must it refuse an empty list? My reading: 0 (R3 says left to right).\n');
  assert.throws(() => N.askRoute(o({ ask: 'A1', answer: true, reason: 'x' })), /no ask A1/);
  const a1 = N.askOpen(o({ from: 'ALPHA #1', session: J1, number: 1, messageFile: msg }));
  assert.equal(a1.ask, 'A1');
  assert.throws(() => N.askOpen(o({ from: 'ALPHA #1', session: J1, number: 1, messageFile: msg })), /already recorded as A1/);
  assert.throws(() => N.askOpen(o({ from: 'ALPHA #1', session: J1, number: 2, messageFile: f(w.base, 'bad.md', 'hello\n') })), /begins QUESTION or REPORT/);
  // an unrouted RECEIVED ask stops the turn
  assert.match(N.status(o()).gate.join(';'), /A1 reads RECEIVED with nothing dispatched/);
  assert.throws(() => N.askRoute(o({ ask: 'A1', lane: 'NOPE', reason: 'x' })), /no lane NOPE/);
  assert.throws(() => N.askRoute(o({ ask: 'A1', lane: 'ARITH', answer: true, reason: 'x' })), /exactly one/);
  N.askRoute(o({ ask: 'A1', lane: 'ARITH', reason: 'what sum means is the area\'s design' }));
  assert.throws(() => N.askRoute(o({ ask: 'A1', answer: true, reason: 'x' })), /already routed/);
  // a decision before a question is refused; a dispatch needs a brief in the template; the Working line is write-ahead
  assert.throws(() => N.askDecided(o({ ask: 'A1', answerFile: f(w.base, 'd.md', 'DECISION: 0\n') })), /reads RECEIVED/);
  assert.throws(() => N.askDispatch(o({ ask: 'A1', stage: 'question', briefFile: f(w.base, 'b0.md', 'read stuff\n'), due: 30 })), /template/);
  const brief = f(w.base, 'b1.md', 'Brief A1 · for BOB #1 · today\nTask: write the question in the area\'s terms.\nRead whole, and nothing else: build/requirements/alpha.md\nWrite your result to: asks/A1/question.md\nForm of the result: one question\nIf you need something not listed above, stop and write what it is in the result; do not search for it.\nEnd with the line: DONE A1 · question\nModel: Sonnet · Effort: medium · Due: 30\n');
  const d1 = N.askDispatch(o({ ask: 'A1', stage: 'question', briefFile: brief, due: 30, by: 'BOB #1' }));
  assert.equal(d1.agent.run_in_background, true);
  assert.throws(() => N.askDispatch(o({ ask: 'A1', stage: 'question', briefFile: brief, due: 30 })), /already has work out/);
  const R = N.repo(w.bob.dir);
  assert.match(N.stateRead(R, 'asks/A1/brief-question.md'), /^Brief A1/);
  let st = N.status(o());
  assert.equal(st.working.length, 1); assert.equal(st.working[0].late, false);
  assert.match(st.queue.map((q) => q.item).join(';'), /RECEIVED A1 WORKING/);
  assert.doesNotMatch(st.gate.join(';'), /A1 reads/);
  // past its due the backstop lists it LATE
  assert.equal(N.status(o({ now: Date.now() + 31 * 60e3 })).working[0].late, true);
  assert.match(N.status(o({ now: Date.now() + 31 * 60e3 })).queue.map((q) => q.item).join(';'), /A1 LATE/);
  // the question recorded, Working cleared; the lane is dormant, so the create_session is printed first and the start owed
  const aa = N.askAsk(o({ ask: 'A1', questionFile: f(w.base, 'q1.md', 'Does the arithmetic area define sum([]) as 0 or as a refusal? Alpha needs it for R3.\n') }));
  assert.equal(aa.start.title, 'ARITH #1');
  assert.equal(aa.send.session_id, '<the new session>');
  assert.throws(() => N.askAsk(o({ ask: 'A1', questionFile: brief })), /already asked/);
  st = N.status(o());
  assert.equal(st.working.length, 0);
  assert.match(st.queue.map((q) => q.item).join(';'), /^ASKED A1$/);
  // the lane's session recorded live; its own start command reads the charter and the ask; a wrong session is refused
  N.laneStarted(o({ id: 'ARITH', name: 'ARITH #1', session: L1 }));
  assert.deepEqual(N.status(o()).owed, []);
  assert.equal(N.addr(o({ lane: 'ARITH' })), L1);
  assert.throws(() => N.laneStart(o({ id: 'ARITH', session: J1 })), /names session_01LL/);
  const lane = w.clone('lane');
  const ls = N.laneStart({ product: lane.dir, id: 'ARITH', session: L1 });
  assert.match(ls.charter, /You decide what sum means/);
  assert.deepEqual(ls.asks.map((a) => a.id), ['A1']);
  assert.equal(N.readRole(lane.root).role, 'lane');
  // the decision, from the lane's clone (one writer per file: the ask is BOB's, but the decision stage is recorded by BOB
  // from the lane's message; here BOB records it)
  assert.throws(() => N.askDecided(o({ ask: 'A1', answerFile: f(w.base, 'd0.md', 'I think 0.\n') })), /DECISION/);
  N.askDecided(o({ ask: 'A1', answerFile: f(w.base, 'd1.md', 'DECISION: sum([]) is 0.\nRationale: the identity of addition.\nChanges: alpha R3\'s meaning: none (it already says 0 for an empty list).\nBob\'s: nothing.\n') }));
  assert.throws(() => N.askDecided(o({ ask: 'A1', answerFile: f(w.base, 'd1.md', 'DECISION: x\n') })), /already has its decision/);
  st = N.status(o());
  assert.match(st.queue.map((q) => q.item).join(';'), /^DECIDED A1$/);
  assert.match(st.gate.join(';'), /A1 reads DECIDED with nothing dispatched/);
  // the close: a CHANGE names files; the fold and the decision line go to the tranche in one commit; then the reply
  assert.throws(() => N.askClose(o({ ask: 'A1', replyFile: f(w.base, 'r0.md', 'CHANGE: R3 now reads …\n') })), /names the files/);
  const req = join(w.bob.dir, 'build/requirements/alpha.md');
  writeFileSync(req, `${readFileSync(req, 'utf8')}\n(ARITH: sum([]) is 0, L-ARITH-1.)\n`);
  const before = g(w.bob.root, 'rev-parse', 'HEAD');
  const cl = N.askClose(o({ ask: 'A1', replyFile: f(w.base, 'r1.md', 'CHANGE: R3 as it now reads: sum([]) is 0 (the identity of addition). Merge tranche.\n'), files: 'build/requirements/alpha.md' }));
  assert.equal(cl.send.session_id, J1);
  assert.match(cl.send.message, /^CHANGE: R3/);
  assert.equal(g(w.bob.root, 'rev-list', '--count', `${before}..HEAD`), '1');
  assert.match(g(w.bob.root, 'show', '--stat', '--format=', 'HEAD'), /build\/lanes\/ARITH\/decisions\.md[\s\S]*build\/requirements\/alpha\.md|build\/requirements\/alpha\.md[\s\S]*build\/lanes\/ARITH\/decisions\.md/);
  assert.match(readFileSync(join(w.bob.dir, 'build/lanes/ARITH/decisions.md'), 'utf8'), /^- L-ARITH-1 · \d{4}-\d{2}-\d{2} · A1 · sum\(\[\]\) is 0\. · build\/requirements\/alpha\.md$/m);
  assert.deepEqual(N.unpushed(R), []);
  assert.throws(() => N.askClose(o({ ask: 'A1', replyFile: f(w.base, 'r1.md', 'ANSWER: x\n') })), /is closed/);
  st = N.status(o());
  assert.deepEqual(st.queue, []); assert.deepEqual(st.gate, []);
  const a = N.parseAsk(N.stateRead(R, 'asks/A1.md'));
  assert.equal(a.status, 'CLOSED'); assert.equal(a.from.number, 1); assert.equal(a.lane, 'ARITH');
  assert.match(a.Replied.head, /^\d{4}-\d{2}-\d{2} · [0-9a-f]{7}$/);

  // an ask BOB answers itself closes without a lane; one that needs Bob takes his decision only
  N.askOpen(o({ from: 'ALPHA #1', session: J1, number: 2, messageFile: f(w.base, 'q2.md', 'QUESTION #2: wording of R1?\n') }));
  N.askRoute(o({ ask: 'A2', answer: true, reason: 'wording only (mechanics §7)' }));
  assert.equal(N.askClose(o({ ask: 'A2', replyFile: f(w.base, 'r2.md', 'ANSWER: R1 means a + b.\n') })).send.session_id, J1);
  N.askOpen(o({ from: 'ARITH #1', session: L1, number: 1, messageFile: f(w.base, 'q3.md', 'QUESTION #1: may sum refuse a list over 1e6 elements? That changes R3\'s meaning.\n') }));
  N.askRoute(o({ ask: 'A3', bob: true, reason: 'a change to what R3 means (P5)' }));
  assert.match(N.status(o()).queue.map((q) => q.item).join(';'), /NEEDS BOB A3/);
  assert.throws(() => N.askDecided(o({ ask: 'A3', answerFile: f(w.base, 'd3.md', 'DECISION: no\n') })), /Bob's decision \(--bob\)/);
  assert.throws(() => N.askDecided(o({ ask: 'A2', bob: true, answerFile: f(w.base, 'd3.md', 'x\n') })), /only an ask that NEEDS BOB/);
  N.askDecided(o({ ask: 'A3', bob: true, answerFile: f(w.base, 'd3b.md', 'Bob, 29 Oct: no limit; a list is a list.\n') }));
  assert.equal(N.askClose(o({ ask: 'A3', replyFile: f(w.base, 'r3.md', 'ANSWER: Bob decided: no limit (his, P5).\n') })).send.session_id, L1);

  // the handoff is generated, under 4 KB, and refuses at an unclean point
  const h = N.handoff(o({ next: 'close the lane' }));
  assert.match(h.text, /^HANDOFF for BOB #2 · /); assert.match(h.text, /Lanes: ARITH ARITH #1/);
  assert.ok(Buffer.byteLength(h.text) < 4096);
  assert.throws(() => N.handoff(o({ noteFile: f(w.base, 'n.md', 'a\n'.repeat(12)) })), /ten lines/);
  N.askOpen(o({ from: 'ALPHA #1', session: J1, number: 3, messageFile: f(w.base, 'q4.md', 'REPORT #3: beta\'s bundle is stale.\n') }));
  assert.throws(() => N.handoff(o()), /A4 reads RECEIVED/);
  N.askRoute(o({ ask: 'A4', answer: true, reason: 'routed to beta' })); N.askClose(o({ ask: 'A4', replyFile: f(w.base, 'r4.md', 'ANSWER: noted; beta regenerates it.\n') }));

  // a successor BOB: the Status line moves, the predecessor's archive is owed in its acts
  const tk2 = N.takeover(o({ name: 'BOB #2', session: B2 }));
  assert.deepEqual(tk2.previous, { name: 'BOB #1', session: B1 });
  assert.match(tk2.acts.join(';'), /archive BOB #1/);
  assert.equal(N.addr(o({ bob: true })), B2);

  // the lane's life ends: re-chartered, routed (live), archived with its usage, closed; the epoch closes and the branch is gone
  N.laneCharter(o({ id: 'ARITH', charterFile: f(w.base, 'c2.md', 'Area: arithmetic, now including statistics.\n'), why: 'Bob suggested statistics join it' }));
  assert.match(readFileSync(join(w.bob.dir, 'build/lanes/ARITH/charter.md'), 'utf8'), /^\*\*Sessions\*\* · 1$[\s\S]*statistics/m);
  assert.deepEqual(N.laneRoute(o({ id: 'ARITH' })), { action: 'message', session: L1 });
  assert.equal(N.laneRoute(o({ id: 'ARITH', contextPct: 60 })).action, 'create_session');
  assert.deepEqual(N.status(o()).owed, ['start lane ARITH']);
  assert.throws(() => N.epochClose(o()), /sessions still live on the state branch: jobs\/alpha\.md, lanes\/ARITH\.md/);
  N.laneStarted(o({ id: 'ARITH', name: 'ARITH #2', session: L1.replace('L', 'M') }));
  assert.throws(() => N.laneClose(o({ id: 'ARITH', why: 'done' })), /live session/);
  N.laneArchived(o({ id: 'ARITH', session: L1.replace('L', 'M'), usage: JSON.stringify({ cache_read_tokens: 10, cache_write_tokens: 2, input_tokens: 1, output_tokens: 3 }) }));
  assert.match(readFileSync(join(w.bob.dir, 'build/metrics/lanes.csv'), 'utf8'), /,lane,ARITH,10,2,1,3$/m);
  assert.equal(N.status(o()).lanes[0].live, false);
  N.laneClose(o({ id: 'ARITH', why: 'the area folded into the product\'s' }));
  assert.deepEqual(N.lanes(R).map((l) => l.status), ['CLOSED']);
  // nothing open, nothing live, nothing owed: the epoch closes and the branch is gone
  assert.throws(() => N.epochClose(o()), /sessions still live on the state branch: jobs\/alpha\.md/);
  N.stateWrite(R, { 'jobs/alpha.md': `**Status** · ALPHA #1 · ${J1} · ARCHIVED\n` }, 'alpha archived');
  assert.equal(N.epochClose(o()).epoch, 'E1');
  assert.deepEqual(R.heads('refs/heads/state/*'), []);
});

test('the epoch closes only when nothing is open, and the state branch is really gone; a lost push is re-applied', () => {
  const w = world(), o = (x) => O(w, x);
  N.epochOpen(o());
  N.takeover(o({ name: 'BOB #1', session: B1 }));
  const R = N.repo(w.bob.dir), other = w.clone('other'), R2 = N.repo(other.dir);
  // two writers, different files, racing: the second push is rejected once and re-applied on the new tip, nothing lost
  N.stateWrite(R, { 'jobs/alpha.md': '**Status** · ALPHA #1 · session_01AAAAAAAAAAAAAAAAAAAAAAAA · WORKING\n' }, 'alpha working');
  R2.fetch('state/E1');
  N.stateWrite(R, { 'jobs/beta.md': '**Status** · BETA #1 · session_01AAAAAAAAAAAAAAAAAAAAAAA2 · WORKING\n' }, 'beta working');
  N.stateWrite(R2, { 'lanes/X.md': '**Status** · DORMANT\n' }, 'x dormant');   // R2's tip was stale: re-fetched and re-applied
  assert.deepEqual(N.stateList(R, 'jobs').sort(), ['jobs/alpha.md', 'jobs/beta.md']);
  assert.equal(N.stateRead(R, 'lanes/X.md'), '**Status** · DORMANT');
  // removal, and an unchanged write that makes no commit
  const tip = g(w.bob.root, 'rev-parse', 'origin/state/E1');
  assert.equal(N.stateWrite(R, { 'lanes/X.md': '**Status** · DORMANT\n' }, 'no change'), tip.slice(0, 7));
  N.stateWrite(R, { 'jobs/beta.md': null }, 'beta gone');
  assert.deepEqual(N.stateList(R, 'jobs'), ['jobs/alpha.md']);
  assert.throws(() => N.epochClose(o()), /sessions still live on the state branch: jobs\/alpha\.md/);
  N.stateWrite(R, { 'jobs/alpha.md': '**Status** · ALPHA #1 · session_01AAAAAAAAAAAAAAAAAAAAAAAA · ARCHIVED\n' }, 'alpha archived');
  const ec = N.epochClose(o());
  assert.equal(ec.epoch, 'E1');
  assert.deepEqual(R.heads('refs/heads/state/*'), []);
  assert.match(readFileSync(join(w.bob.dir, 'build/epochs.md'), 'utf8'), /^- E1 · opened \S+ · closed \S+$/m);
  assert.throws(() => N.status(o()), /no epoch is open/);
  assert.equal(N.epochOpen(o()).epoch, 'E2');
  // nothing durable points into a state branch: the tranche's files hold no state commit hash
  const hashes = g(w.bob.root, 'rev-list', '--all').split('\n');
  let durable = ''; try { durable = g(w.bob.root, 'grep', '-l', '-E', '[0-9a-f]{40}', `origin/${N.TRANCHE}`, '--', 'toy/build'); } catch { /* no match: exit 1 */ }
  assert.equal(durable, '');
  assert.ok(hashes.length > 0);
});
