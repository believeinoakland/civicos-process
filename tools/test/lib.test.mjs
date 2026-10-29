// tools/lib.mjs: the shared functions moved from the old tool and its hooks at the commit point, by the old tool's own
// tests of them, unchanged but for their imports: the artifacts' rows, the history a merge fetches, a test run's causes
// and reds, a report's Evidence section, and the steps for Bob verified against their source and checked at BOB's Stop (P20).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../lib.mjs';
import { stepsReason, lastAssistantText } from '../lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), TOY = join(HERE, '..', '..', 'dryrun');
const T = 'P1', B1 = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB';

const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const ident = (d, n) => { for (const [k, v] of [['user.name', n], ['user.email', `${n}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v); };

function world() {
  const base = mkdtempSync(join(tmpdir(), 'proc-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const seed = join(base, 'seed');
  execFileSync('git', ['clone', '-q', origin, seed], { stdio: 'ignore' }); ident(seed, 'seed');
  cpSync(TOY, join(seed, 'toy'), { recursive: true });
  writeFileSync(join(seed, 'toy/build/plan/current.md'), `# Plan ${T}\n\n**Status** · OPEN · BOB #1 · ${B1.replace('B', 'C')} · depth 1\n`);
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/tranche/${T}`);
  const bobDir = join(base, 'bob');
  execFileSync('git', ['clone', '-q', '-b', `tranche/${T}`, origin, bobDir], { stdio: 'ignore' }); ident(bobDir, 'bob');
  const plan = join(base, 'round.md');
  writeFileSync(plan, '## Layer 1\n\n**alpha**\n- N1 · Add a comment naming R1 at the top of `alpha/src/index.mjs`.\n');
  return { base, origin, bob: join(bobDir, 'toy'), bobRoot: bobDir, plan };
}

test('artifacts: a row may name several paths; a Generated artifacts section with no row in the parsed form is refused', () => {
  const w = world(), R = P.repo(w.bob), mf = join(w.bob, 'build/manifest.md');
  assert.deepEqual(P.artifacts(R).map((a) => a.paths), [['beta/dist/bundle.txt'], ['legacy/dist/legacy.bundle.txt']]);
  writeFileSync(mf, '# Build manifest\n\n## Generated artifacts\n\n| a | b | c | d |\n| --- | --- | --- | --- |\n| `x/dist`, `y/dist` | x | `node x.mjs` | `node x.mjs --check` |\n');
  assert.deepEqual(P.artifacts(R)[0].paths, ['x/dist', 'y/dist']);
  writeFileSync(mf, '# Build manifest\n\n## Generated artifacts\n\n| artifact | owner | regenerate | inputs |\n| `x/dist` | x | `x/`: `npm run build` | its source |\n');
  assert.throws(() => P.artifacts(R), /no row/);
});

test('a shallow clone fetches the history a merge needs, and only then (lane R8: no full download at session start)', () => {
  const w = world();
  // a job branch forks from the tranche, then the tranche moves 120 commits on
  g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/job/${T}/alpha`);
  for (let i = 0; i < 120; i++) { writeFileSync(join(w.bob, 'build/filler.txt'), `${i}\n`); g(w.bobRoot, 'add', '-A'); g(w.bobRoot, 'commit', '-qm', `filler ${i}`); }
  g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  // a session's clone: its branch's last 5 commits only, as a cloud session starts with its last 50
  const d = join(w.base, 'shallow');
  execFileSync('git', ['clone', '-q', '--depth', '5', '-b', `tranche/${T}`, `file://${w.origin}`, d], { stdio: 'ignore' });
  const R = P.repo(join(d, 'toy'));
  R.fetch(`job/${T}/alpha`);
  assert.equal(g(d, 'rev-parse', '--is-shallow-repository'), 'true');
  assert.throws(() => g(d, 'merge-base', 'HEAD', `origin/job/${T}/alpha`));
  const before = Number(g(d, 'rev-list', '--count', 'HEAD'));
  const base = P.history(R, 'HEAD', `origin/job/${T}/alpha`);
  assert.equal(base, g(d, 'rev-parse', `origin/job/${T}/alpha`));
  assert.ok(Number(g(d, 'rev-list', '--count', 'HEAD')) > before);
  // deepening never moves a ref the session already holds: a pinned origin/job ref stays where it was
  const d2 = join(w.base, 'shallow2');
  execFileSync('git', ['clone', '-q', '--depth', '5', '-b', `tranche/${T}`, `file://${w.origin}`, d2], { stdio: 'ignore' });
  const R2 = P.repo(join(d2, 'toy'));
  R2.fetch(`job/${T}/alpha`);
  const pinned = g(d2, 'rev-parse', `origin/job/${T}/alpha`);
  const other = join(w.base, 'other');
  execFileSync('git', ['clone', '-q', '-b', `job/${T}/alpha`, w.origin, other], { stdio: 'ignore' }); ident(other, 'other');
  g(other, 'commit', '-q', '--allow-empty', '-m', 'the job branch moves on the remote'); g(other, 'push', '-q', 'origin', `HEAD:refs/heads/job/${T}/alpha`);
  assert.throws(() => g(d2, 'merge-base', 'HEAD', `origin/job/${T}/alpha`));
  P.history(R2, 'HEAD', `origin/job/${T}/alpha`);
  assert.notEqual(g(d2, 'rev-list', '--count', 'HEAD'), '5');
  assert.equal(g(d2, 'rev-parse', `origin/job/${T}/alpha`), pinned);
  // a merge base already present costs no fetch
  assert.equal(P.history(R, 'HEAD', 'HEAD~1'), g(d, 'rev-parse', 'HEAD~1'));
});

test('a test run never gives "no result" without its cause; a runaway test fails itself (lane R14)', () => {
  const d = mkdtempSync(join(tmpdir(), 'proc-runs-'));
  execFileSync('git', ['init', '-q', d]);
  const f = (n, body) => { writeFileSync(join(d, n), `import test from 'node:test';\n${body}\n`); return join(d, n); };
  const ok = f('ok.test.mjs', "for (const i of [1, 2]) test(`ok ${i}`, () => {});");
  const red = f('red.test.mjs', "test('a red', () => { throw new Error('red'); });");
  const killed = f('killed.test.mjs', "test('killed', () => { process.kill(process.pid, 'SIGKILL'); });");
  const heap = f('heap.test.mjs', "test('runaway', () => { const a = []; for (;;) a.push(new Array(1e5).fill(1)); });");
  const R = P.repo(d);
  // a file whose process dies is no result, named with its cause, never a red; the others' results stand
  const r = P.runSuite(R, [ok, red, killed, heap], { heapMb: 64, label: 't' });
  assert.deepEqual([r.tests, r.pass, r.failed], [5, 2, ['a red']]);
  assert.deepEqual(r.noResult.map((x) => [x.name, x.cause]).sort(), [['heap.test.mjs', 'out of heap (over its 64 MB cap)'], ['killed.test.mjs', 'killed (SIGKILL)']]);
  assert.deepEqual(P.reds(r).sort(), ['NO RESULT heap.test.mjs', 'NO RESULT killed.test.mjs', 'a red']);
  assert.ok(existsSync(r.report) && r.report.includes('.git/civicos-runs/'));
  assert.ok(r.peaks.length && r.peaks.every((p) => / \d+ MB$/.test(p)));
  // a process over its memory cap is killed by proc's watch and named, whatever holds the memory (here, outside the heap)
  const big = f('big.test.mjs', "test('outside the heap', async () => { const k = []; for (;;) { k.push(Buffer.alloc(32 << 20, 1)); await new Promise((r) => setTimeout(r, 20)); } });");
  const b = P.runSuite(R, [ok, big], { capMb: 300, label: 't' });
  assert.deepEqual(b.noResult, [{ name: 'big.test.mjs', cause: "over its 300 MB memory cap (killed by proc's memory watch)" }]);
  assert.equal(b.pass, 2);
  assert.ok(b.heavy.some((h) => h.startsWith('big.test.mjs ')));
  // the runner itself killed: the whole suite is no result, with its cause
  const parent = f('parent.test.mjs', "test('kills its runner', () => { process.kill(process.ppid, 'SIGKILL'); });");
  assert.match(P.runSuite(R, [parent], { label: 't' }).noResult.find((x) => x.name === 'the whole suite').cause, /^the runner was killed \(SIGKILL\)/);
  // a hung suite is stopped at its timeout
  const hang = f('hang.test.mjs', "test('hangs', () => new Promise((r) => setTimeout(r, 20000)));");
  assert.deepEqual(P.runSuite(R, [hang], { timeoutMin: 0.05, label: 't' }).noResult, [{ name: 'the whole suite', cause: 'timed out after 0.05 min' }]);
});

// ---- P20: evidence in reports, and steps for Bob ----

test('evidenceItems: a command with its result, a file:line and a test total each count; a bare claim or a missing section does not', () => {
  const ok = (r) => (P.evidenceItems(r) || []).some((i) => P.EVIDENCE_ITEM.some((re) => re.test(i)));
  assert.equal(P.evidenceItems('Applied.\n**Met** · none\n'), null);
  assert.equal(ok('**Evidence**\n- `git status` → clean\n**Met** · none'), true);
  assert.equal(ok('**Evidence**\n- src/a/index.mjs:12 adds the comment\n'), true);
  assert.equal(ok('**Evidence** · pass 14 of 14 in tests/a.test.mjs\n'), true);
  assert.equal(ok('**Evidence**\n* it works\n**Met** · none'), false);
  assert.deepEqual(P.evidenceItems('**Evidence**\n1. `a` → b c d\n- x:1\n**Met** · none\nnot an item'), ['`a` → b c d', 'x:1']);
});

test('stepLabels and decodeEntities: bold and code labels are found, <<placeholders>> are exempt, entities decode', () => {
  const t = 'Press **Save &amp; close** then `Settings`.\nName it **<<your name>>** and `<<x>>`; run `a **b** c`.\n';
  assert.deepEqual(P.stepLabels(t).map((l) => [l.label, l.line, l.exempt]), [['Settings', 1, false], ['Save &amp; close', 1, false], ['<<x>>', 2, true], ['a **b** c', 2, false], ['<<your name>>', 2, true]]);
  assert.equal(P.decodeEntities('Save &amp; close &#8212; &#x2014; &mdash; &bogus;'), 'Save & close — — — &bogus;');
});

function stepsWorld() {
  const d = mkdtempSync(join(tmpdir(), 'steps-'));
  execFileSync('git', ['init', '-q', d]);
  writeFileSync(join(d, 'page.html'), '<button>Save &amp; close</button> <a id="x">Settings</a>');
  writeFileSync(join(d, 'screen.js'), "const t = 'Invite a member';\n");
  return d;
}
test('proc steps: a label not in the sources is refused, naming it and its line; found labels print the text, verified count, and the ok file', () => {
  const d = stepsWorld(), f = join(d, 'steps.md'), src = `${join(d, 'page.html')},${join(d, 'screen.js')}`;
  writeFileSync(f, '1. Click **Save & close** in `Settings`.\n2. Press **Invite a member**, then **Send invite** and `Retry`.\n3. Type **<<the member\'s name>>**.\n');
  assert.throws(() => P.stepsCmd({ file: f, source: src, product: d }), (e) => /2 label\(s\)/.test(e.message) && /line 2: "Send invite"/.test(e.message) && /line 2: "Retry"/.test(e.message) && !/Settings/.test(e.message.split('\n').slice(1).join('')) && !/<<the/.test(e.message));
  assert.equal(existsSync(join(d, '.git', P.STEPS_OK)), false, 'nothing recorded on a refusal');
  writeFileSync(f, '1. Click **Save &amp; close** in `Settings`.\n2. Press **Invite a member**.\n3. Type **<<the member\'s name>>**.\n');
  const out = P.stepsCmd({ file: f, source: src, product: d });
  assert.match(out, /^1\. Click \*\*Save &amp; close\*\*/);
  assert.match(out, /verified: 3 labels in .*page\.html.*screen\.js$/);
  const ok = JSON.parse(readFileSync(join(d, '.git', P.STEPS_OK), 'utf8'));
  assert.equal(ok.sha256, P.stepsHash(out), 'the printed text carries the same list hash');
  assert.deepEqual(ok.sources, src.split(','));
  assert.throws(() => P.stepsCmd({ file: f, source: join(d, 'nope.html'), product: d }), /no such source file/);
  assert.throws(() => P.stepsCmd({ file: f, product: d }), /--source/);
});

test('numberedList and isStepsList: only numbered items and their indented lines, whitespace-normalised; bold needed', () => {
  const m = 'Intro\n\n1.  Click   **Save**.\n   then wait\nprose\n2. Press `OK`.\n\nverified: 1 labels in x\n';
  assert.equal(P.numberedList(m), '1. Click **Save**.\nthen wait\n2. Press `OK`.');
  assert.equal(P.isStepsList(m), true);
  assert.equal(P.isStepsList('1. one\n2. two **b**'), true);
  assert.equal(P.isStepsList('1. one\n2. two'), false, 'no bold label');
  assert.equal(P.isStepsList('1. only **one**'), false, 'one item');
  assert.equal(P.isStepsList('2. a **b**\n3. c'), false, 'does not start at 1');
});

test('BOB stop hook: a numbered list with bold labels ends the turn only with fresh, matching proc steps proof (P20)', () => {
  const d = stepsWorld(), f = join(d, 'steps.md'), src = join(d, 'page.html');
  const msg = '1. Click **Save & close**.\n2. Open `Settings`.\n';
  assert.equal(stepsReason('Nothing for Bob to do.', d), null, 'no list, no check');
  assert.equal(stepsReason('1. one\n2. two', d), null, 'no bold label, no check');
  // red on the old code (no steps check at all), green now
  assert.match(stepsReason(msg, d), /no verified steps on record/);
  writeFileSync(f, '1. Click **Save &amp; close**.\n2. Open `Settings`.\n');
  const out = P.stepsCmd({ file: f, source: src, product: d });
  assert.equal(stepsReason(out, d), null, 'the printed steps pass, with the verified line after them');
  assert.equal(stepsReason(`Here you go.\n\n${out}\nNothing for Bob to do.`, d), null, 'prose around the list is not judged');
  assert.match(stepsReason(out.replace('Open', 'Close'), d), /not the list `proc steps` verified/);
  assert.match(stepsReason(out, d, Date.now() + 31 * 60e3), /over 30 minutes old/);
  assert.equal(stepsReason(out, d, Date.now() + 29 * 60e3), null);
});

test('lastAssistantText: last_assistant_message first, else the transcript\'s assistant text after the last user entry', () => {
  const d = mkdtempSync(join(tmpdir(), 'tr-')), tp = join(d, 't.jsonl');
  const row = (o) => JSON.stringify(o);
  writeFileSync(tp, [row({ type: 'user', message: { role: 'user', content: 'hi' } }), row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'old' }] } }),
    row({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result' }] } }), row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'thinking', thinking: '' }] } }),
    row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '1. a **b**' }] } }), row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '2. c' }] } }), 'not json'].join('\n'));
  assert.equal(lastAssistantText({ transcript_path: tp }), '1. a **b**\n2. c');
  assert.equal(lastAssistantText({ transcript_path: tp, last_assistant_message: 'direct' }), 'direct');
  assert.equal(lastAssistantText({}), null);
  assert.equal(lastAssistantText({ transcript_path: join(d, 'missing') }), null);
});
