// Tests of the certification harness (dryrun/cert/SUITE.md §4 items 2 and 4): the record grammars over the real
// corpus (bio T4–T6, dry runs D1–D7, the T5–T6 message first lines) and each scenario predicate on a passing and a
// failing fixture. Fixtures live in fixtures/cert/ (README there says where each came from).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseMessageLine, parseRecord, parsePlanStatus, parseHandoff, parseCsv, crossCheckSize, validateFile, kindOf, CSV_HEADER } from '../cert/records.mjs';
import { assertRun, PREDICATES } from '../cert/assert.mjs';

const FIX = fileURLToPath(new URL('./fixtures/cert/', import.meta.url));
const read = (p) => readFileSync(join(FIX, p), 'utf8');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

// ---- records.mjs: the corpus ----

test('records: the corpus fails exactly as EXPECTED-FAILURES.txt records (bio T4–T6, D1–D7, T5–T6 messages)', () => {
  const files = [...walk(join(FIX, 'bio')), ...walk(join(FIX, 'dry'))].filter((f) => kindOf(f)).sort();
  files.push(join(FIX, 'messages-T5-T6-D7.txt'));
  assert.ok(files.length >= 70, `${files.length} corpus files`);
  const got = files.flatMap((f) => validateFile(f, readFileSync(f, 'utf8')).errors.map((e) => `${relative(FIX, f)}: ${e}`));
  const want = read('EXPECTED-FAILURES.txt').split('\n').filter(Boolean).map((l) => l.replace(/^checks\/test\/fixtures\/cert\//, ''));
  assert.deepEqual(got, want.map((l) => l));
});

test('records: T6 records, plan and CSV pass non-strict; the records carrying a QUESTION fail strict on no id/version (X3, F5)', () => {
  for (const m of ['id-spaces', 'legacy-checks', 'record-core', 'promotion']) {
    const r = parseRecord(read(`bio/build/jobs/T6/${m}.md`));
    assert.deepEqual(r.errors, [], m);
    assert.equal(r.depth, 2, m);
    assert.equal(r.state, 'COMPLETE', m);
  }
  const ids = parseRecord(read('bio/build/jobs/T6/id-spaces.md'));
  assert.equal(ids.sessionId, 'session_01DAomLCBqmFvF1k6WfbWamt');
  assert.deepEqual(ids.size, { testRuns: 10, moduleLines: 417 });
  assert.deepEqual(ids.messages.map((x) => x.kinds[0]), ['QUESTION', 'ANSWER']);
  const strictErrs = (m) => parseRecord(read(`bio/build/jobs/T6/${m}.md`), { strict: true }).errors.join('\n');
  assert.match(strictErrs('id-spaces'), /an ANSWER has no re=/);
  assert.match(strictErrs('legacy-checks'), /no v= \(strict/);
  assert.deepEqual(parsePlanStatus(read('bio/build/plan/archive/T6.md')).bob, { n: 48, id: 'session_01E4YZNiY3MRoRn59Wr5NnLW', depth: 1 });
  assert.deepEqual(parseCsv(read('bio/build/metrics/T6.csv')).errors, []);
});

test('records: every real message first line passes non-strict but "CHANGE 1"; none passes strict (no id=, X3)', () => {
  const lines = read('messages-T5-T6-D7.txt').split('\n').filter((l) => l.startsWith('From '));
  assert.ok(lines.length >= 80);
  const bad = lines.filter((l) => parseMessageLine(l).errors.length);
  assert.deepEqual(bad, ['From BOB #47 (D7): CHANGE 1']);
  assert.ok(lines.every((l) => parseMessageLine(l, { strict: true }).errors.some((e) => /no id=/.test(e))));
});

test('records: a metrics row and its record\'s Size agree, or the difference is named (T4, T5 findings)', () => {
  const recs = (T) => Object.fromEntries(readdirSync(join(FIX, `bio/build/jobs/${T}`)).map((f) => [`${T}/${f}`, read(`bio/build/jobs/${T}/${f}`)]));
  assert.deepEqual(crossCheckSize(read('bio/build/metrics/T6.csv'), recs('T6')).errors, []);
  const t4 = crossCheckSize(read('bio/build/metrics/T4.csv'), recs('T4')).errors.join('\n');
  assert.match(t4, /session_01WqPRmYSbsF2qV78iQdWxhc \(legacy-index\) test_runs 31, module_lines 11: its record T4\/legacy-index\.md has no readable Size line/);
  const t5 = crossCheckSize(read('bio/build/metrics/T5.csv'), recs('T5')).errors.join('\n');
  assert.match(t5, /\(promotion\) test_runs 72, module_lines 2037: its record T5\/promotion\.md says test runs 20, module lines 2048/);
});

// ---- records.mjs: the grammars, each rule ----

test('records: a message first line, its kinds, fields and strict mode', () => {
  const ok = parseMessageLine('From BOB #48 (T6): ANSWER + CHANGE');
  assert.deepEqual([ok.errors, ok.sender, ok.tranche, ok.kinds], [[], 'BOB #48', 'T6', ['ANSWER', 'CHANGE']]);
  assert.deepEqual(parseMessageLine('From LEGACY-CHECKS #2 (T6): BLOCKED: needs Bob').needsBob, true);
  assert.deepEqual(parseMessageLine('From BOB #47 (T6): START BOB').kinds, ['START BOB']);
  const v = parseMessageLine('From alpha (D8): QUESTION id=alpha-Q1 v=2', { strict: true });
  assert.deepEqual([v.errors, v.id, v.v], [[], 'alpha-Q1', '2']);
  const a = parseMessageLine('From BOB #9 (D8): ANSWER id=B9-7 v=1', { strict: true });
  assert.match(a.errors.join(), /an ANSWER has no re=/);
  assert.deepEqual(parseMessageLine('From BOB #9 (D8): ANSWER id=B9-7 v=1 re=alpha-Q1@2', { strict: true }).errors, []);
  assert.deepEqual(parseMessageLine('From ROOT: STARTED BOB #49 session_01ABCDEFGHIJKLMNOPQRSTUV').named, { name: 'BOB #49', id: 'session_01ABCDEFGHIJKLMNOPQRSTUV' });
  assert.match(parseMessageLine('From ROOT: STARTED BOB #49 session_01ABCDEFGHIJKLMNOPQRSTUV', { strict: true }).errors.join(), /no \(<tranche>\)/);
  assert.match(parseMessageLine('From alpha (D8): HELLO').errors.join(), /kind "HELLO" is not one of/);
  assert.match(parseMessageLine('From alpha: QUESTION').errors.join(), /no \(<tranche>\)/);
  assert.match(parseMessageLine('From alpha (X1): QUESTION').errors.join(), /tranche "X1"/);
  assert.match(parseMessageLine('From alpha (D8): QUESTION v=x').errors.join(), /v=x is malformed/);
  assert.match(parseMessageLine('BACKSTOP (T6, layer 2): check').errors.join(), /not "From <sender>/);
});

const REC = (status, extra = '') => `# Job record\n\n**Status** · ${status}\n**Session** ALPHA #1, \`session_01ManYyUbFq3sKEucLdTy1nU\`, depth 2.\n\n## Questions to BOB\n\n${extra}\n`;

test('records: a job record\'s Status, session id, depth, Size and NEEDS BOB lines', () => {
  assert.deepEqual(parseRecord(REC('COMPLETE.', 'Size: test runs 3, module lines 57')).errors, []);
  assert.match(parseRecord(REC('COMPLETE.')).errors.join(), /COMPLETE with no "Size/);
  assert.match(parseRecord(REC('COMPLETE.', 'Size: test runs about 3, module lines 57')).errors.join(), /last Size line is not/);
  assert.match(parseRecord(REC('DONE.')).errors.join(), /state "DONE" is not one of/);
  assert.match(parseRecord('# r\n\n**Status** · WORKING\n').errors.join('\n'), /names no session id[\s\S]*names no depth/);
  const nb = parseRecord(REC('WAITING on Bob.', 'NEEDS BOB: merge `tranche/T6` into `main`, auto mode refuses it (K153)\nNo `NEEDS BOB` elsewhere.'));
  assert.deepEqual(nb.errors, []);
  assert.deepEqual(nb.open.map((x) => x.act), ['merge `tranche/T6` into `main`']);
  assert.match(parseRecord(REC('BLOCKED.', 'NEEDS BOB: merge to main')).errors.join(), /not "NEEDS BOB: <act>, <why>"/);
  const q = parseRecord(REC('WORKING.', '- **Q1 · id=alpha-Q1 v=2** · what does sum do?\n- **Q1** · ANSWER id=B-3 v=1 re=alpha-Q1@2'), { strict: true });
  assert.deepEqual(q.errors, []);
  assert.deepEqual(q.messages.map((m) => [m.kinds[0], m.id, m.re]), [['QUESTION', 'alpha-Q1', undefined], ['ANSWER', 'B-3', 'alpha-Q1@2']]);
});

test('records: the plan Status line names exactly one BOB id with its depth', () => {
  assert.deepEqual(parsePlanStatus('**Status** · OPEN. BOB: BOB #9 · session_01ManYyUbFq3sKEucLdTy1nU · depth 1.\n').errors, []);
  assert.match(parsePlanStatus('**Status** · OPEN. BOB #9 · session_01ManYyUbFq3sKEucLdTy1nU · depth 1 (took over from session_01ST5gn8EypNUyWbHPtjrbRM)\n').errors.join(), /names 2 session ids/);
  assert.match(parsePlanStatus('**Status** · OPEN. BOB: session_01ManYyUbFq3sKEucLdTy1nU\n').errors.join(), /no "BOB #<n> · <session id> · depth <d>"/);
  assert.match(parsePlanStatus('# Plan\n').errors.join(), /no "\*\*Status\*\*/);
});

const HANDOFF = 'BOB #9 · session_01ManYyUbFq3sKEucLdTy1nU · depth 1.\n\n**Next.** Open T7.\n';
test('records: a handoff carries its depth line, and "NEEDS BOB: start ROOT" ends it with a prompt and steps', () => {
  assert.deepEqual(parseHandoff(HANDOFF).errors, []);
  assert.match(parseHandoff(HANDOFF, { requireStartRoot: true }).errors.join(), /no "NEEDS BOB: start ROOT" line/);
  const good = `${HANDOFF}\nNEEDS BOB: start ROOT, ROOT #1 passed 300k tokens\n\n\`\`\`\nYou are ROOT #2 …\n\`\`\`\n\n1. Open claude.ai/code.\n2. Paste the prompt.\n`;
  assert.deepEqual(parseHandoff(good, { requireStartRoot: true }).errors, []);
  assert.match(parseHandoff(`${HANDOFF}\nNEEDS BOB: start ROOT\n\n1. Open it.\n`).errors.join(), /not followed by the prompt/);
  assert.match(parseHandoff(`${HANDOFF}\nNEEDS BOB: start ROOT\n\n> You are ROOT #2, started by Bob.\n\n## Later\n\n1. x\n`).errors.join(), /does not end with/);
  assert.match(parseHandoff('BOB #47 is `session_01ST5gn8EypNUyWbHPtjrbRM` (depth 0).\n').errors.join(), /no "BOB #<n> · <session id> · depth <d>" line/);
});

test('records: the metrics CSV header, one row per session, roles, counts, empty turns, a job\'s Size', () => {
  const row = (s) => `${CSV_HEADER}\n${s}\n`;
  assert.deepEqual(parseCsv(row('session_01ManYyUbFq3sKEucLdTy1nU,job,alpha,1,2,3,4,,3,57')).errors, []);
  assert.deepEqual(parseCsv(row('session_01ManYyUbFq3sKEucLdTy1nU,BOB-final,,1,2,3,4,,,')).errors, []);
  const e = (s) => parseCsv(row(s)).errors.join('\n');
  assert.match(e('session_01ManYyUbFq3sKEucLdTy1nU,job,alpha,1,2,3,4,,3,57\nsession_01ManYyUbFq3sKEucLdTy1nU,job,alpha,1,2,3,4,,3,57'), /has a row already/);
  assert.match(e('6aad1e65-d6f3-527d-ac3f-24fd6da7931e,job,alpha,1,2,3,4,21,1,17'), /is not a cloud session id[\s\S]*turns "21" is not empty/);
  assert.match(e('session_01ManYyUbFq3sKEucLdTy1nU,probe,,1,2,3,4,,,'), /role "probe"/);
  assert.match(e('session_01ManYyUbFq3sKEucLdTy1nU,job,alpha,1,2,x,4,,,'), /input "x" is not a count[\s\S]*test_runs "" is not a count/);
  assert.match(e('session_01ManYyUbFq3sKEucLdTy1nU,BOB-final,,1,2,3,4,,5,'), /test_runs on a BOB-final row/);
  assert.match(parseCsv('session,role\n').errors.join(), /header is not/);
});

test('records: the CLI exits 1 on a failure and 0 on a pass', () => {
  const cli = fileURLToPath(new URL('../cert/records.mjs', import.meta.url));
  const run = (...a) => { try { execFileSync('node', [cli, ...a], { encoding: 'utf8' }); return 0; } catch (e) { return e.status; } };
  assert.equal(run(join(FIX, 'bio/build/metrics/T6.csv'), join(FIX, 'bio/build/jobs/T6/id-spaces.md')), 0);
  assert.equal(run('--strict', join(FIX, 'bio/build/jobs/T6/id-spaces.md')), 1);
  assert.equal(run('--message', 'From alpha (D8): QUESTION'), 0);
  assert.equal(run('--message', 'From alpha (D8): QUESTION', '--strict'), 1);
});

// ---- assert.mjs ----

test('assert: T6 as it ran reproduces F1 (B2 FAIL: two first messages to each layer-1 job) and passes what it can', () => {
  const { results, failed } = assertRun(join(FIX, 't6/run.json'));
  const by = Object.fromEntries(results.map((r) => [r.id, r]));
  assert.equal(failed, true);
  assert.equal(by.B2.status, 'FAIL');
  assert.match(by.B2.reason, /ID-SPACES #2: 2 first messages \(creation prompt \+ START/);
  for (const id of ['A5', 'D9', 'G4', 'H6']) assert.equal(by[id].status, 'PASS', `${id}: ${by[id].reason}`);
  for (const id of ['A4', 'D3', 'D4', 'E1']) assert.equal(by[id].status, 'UNOBSERVED', `${id}: ${by[id].reason}`);
  assert.match(by.D3.reason, /none with an id= \(X3\)/);
});

const BOB1 = 'session_01BOBoneAAAAAAAAAAAAAAAA', BOB2 = 'session_01BOBtwoBBBBBBBBBBBBBBBB', ROOT = 'session_01ROOTCCCCCCCCCCCCCCCCCC';
const JOB = 'session_01JOBalphaDDDDDDDDDDDDDD';
const ses = (id, title, status, updated, parent, usage = [10, 20, 3, 40]) => ({ ccr: { id, title, session_status: `SESSION_STATUS_${status}`, updated_at: updated, ...(parent ? { parent_session_id: parent } : {}), external_metadata: { usage: { cache_read_tokens: usage[0], cache_write_tokens: usage[1], input_tokens: usage[2], output_tokens: usage[3] } } } });
let tn = 0;
const trg = (target, prompt, { fired, enabled = !fired, run = fired || '2026-10-01T10:05:00Z', id = `trig_${++tn}`, name = '' } = {}) => ({ id, name, enabled, persistent_session_id: target, run_once_at: run, ...(fired ? { last_run: { status: 'ROUTINE_RUN_STATUS_SUCCEEDED', fired_at: fired } } : {}), derived_state: { prompt } });
const snap = (taken_at, sessions, triggers, extra = {}) => ({ taken_at, get_session: sessions, list_triggers: [{ data: triggers }], ...extra });

// Writes a run (run.json, its snapshots and files) into a temporary directory and asserts it.
function runOf(run, snaps, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'cert-run-'));
  snaps.forEach((s, i) => writeFileSync(join(dir, `snap-${i + 1}.json`), JSON.stringify(s)));
  for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), c); }
  writeFileSync(join(dir, 'run.json'), JSON.stringify({ tranche: 'D8', snapshots: snaps.map((_, i) => `snap-${i + 1}.json`), ...run }));
  return (product) => Object.fromEntries(assertRun(join(dir, 'run.json'), product).results.map((r) => [r.id, r]));
}
const SESSIONS = [{ id: ROOT, role: 'ROOT', name: 'ROOT #1' }, { id: BOB1, role: 'BOB', name: 'BOB #1' }, { id: BOB2, role: 'BOB', name: 'BOB #2' }, { id: JOB, role: 'job', name: 'ALPHA #1', module: 'alpha' }];

test('assert A4 (F4): ROOT\'s STARTED to the successor passes; to the archived predecessor, or deleted unfired, fails', () => {
  const live = [ses(ROOT, 'ROOT #1', 'IDLE', 't'), ses(BOB1, 'BOB #1', 'ARCHIVED', '2026-10-01T10:03:00Z', ROOT), ses(BOB2, 'BOB #2', 'RUNNING', 'x', ROOT)];
  const ok = runOf({ sessions: SESSIONS, scenarios: ['A4'] }, [snap('2026-10-01T10:10:00Z', live, [trg(BOB2, `From ROOT: STARTED BOB #2 ${BOB2}`, { fired: '2026-10-01T10:02:00Z' })])])();
  assert.equal(ok.A4.status, 'PASS', ok.A4.reason);
  const bad = runOf({ sessions: SESSIONS, scenarios: ['A4'] }, [snap('2026-10-01T10:10:00Z', live, [trg(BOB1, `From ROOT: STARTED BOB #2 ${BOB2}`, { fired: '2026-10-01T10:04:00Z' })])])();
  assert.equal(bad.A4.status, 'FAIL');
  assert.match(bad.A4.reason, /→ BOB #1 fired 2026-10-01T10:04:00Z, archived 2026-10-01T10:03:00\.000Z; .* targets BOB #1, not the successor it names/);
  const pending = trg(BOB2, `From ROOT: STARTED BOB #2 ${BOB2}`, { id: 'trig_gone' });
  const del = runOf({ sessions: SESSIONS, scenarios: ['A4'] }, [snap('2026-10-01T10:01:00Z', live, [pending]), snap('2026-10-01T10:10:00Z', live, [])])();
  assert.match(del.A4.reason, /trig_gone deleted unfired/);
  assert.equal(runOf({ sessions: SESSIONS, scenarios: ['A4'] }, [snap('2026-10-01T10:10:00Z', live, [])])().A4.status, 'UNOBSERVED');
});

test('assert A5: one id at depth 1 from its parent chain, taken over by a Status-only commit; otherwise FAIL', () => {
  const root = mkdtempSync(join(tmpdir(), 'cert-product-'));
  const g = (args, date) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', env: { ...process.env, ...(date ? { GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date } : {}) } });
  g(['init', '-q', '-b', 'tranche/D8']); g(['config', 'user.email', 't@example.com']); g(['config', 'user.name', 't']);
  const put = (p, c) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); };
  const PLAN = (s) => `# Plan\n\n**Status** · OPEN. BOB: ${s}\n\n**Jobs** · none.\n`;
  put('build/plan/current.md', PLAN(`BOB #1 · ${BOB1} · depth 1`)); put('x.md', 'x\n');
  g(['add', '-A']); g(['commit', '-q', '-m', `open\n\nClaude-Session: https://claude.ai/code/${BOB1}`]);
  put('build/plan/current.md', PLAN(`BOB #2 · ${BOB2} · depth 1`));
  g(['add', '-A']); g(['commit', '-q', '-m', `BOB #2: takeover\n\nClaude-Session: https://claude.ai/code/${BOB2}`]);
  const snaps = [snap('2026-10-01T10:10:00Z', [ses(ROOT, 'ROOT #1', 'IDLE', 't'), ses(BOB2, 'BOB #2', 'RUNNING', 'x', ROOT)], [])];
  const A = runOf({ sessions: SESSIONS, current_bob: BOB2, scenarios: ['A5'] }, snaps);
  assert.equal(A(root).A5.status, 'PASS', A(root).A5.reason);
  // The successor's first commit also changes another file.
  g(['reset', '-q', '--hard', 'HEAD~1']);
  put('build/plan/current.md', PLAN(`BOB #2 · ${BOB2} · depth 1`)); put('x.md', 'y\n');
  g(['add', '-A']); g(['commit', '-q', '-m', `BOB #2: takeover\n\nClaude-Session: https://claude.ai/code/${BOB2}`]);
  assert.match(A(root).A5.reason, /changes more than the Status line \(build\/plan\/current\.md, x\.md\)/);
  // Without git: a Status naming two ids, or a depth its parent chain contradicts.
  const two = runOf({ sessions: SESSIONS, current_bob: BOB2, plan: 'plan.md', scenarios: ['A5'] }, snaps, { 'plan.md': PLAN(`BOB #2 · ${BOB2} · depth 1 (from ${BOB1})`) })();
  assert.match(two.A5.reason, /Status names 2 session ids/);
  const deep = runOf({ sessions: SESSIONS, current_bob: BOB2, plan: 'plan.md', scenarios: ['A5'] }, [snap('t', [ses(ROOT, 'R', 'IDLE', 't', BOB1), ses(BOB1, 'B1', 'ARCHIVED', 't'), ses(BOB2, 'B2', 'RUNNING', 't', ROOT)], [])], { 'plan.md': PLAN(`BOB #2 · ${BOB2} · depth 1`) })();
  assert.match(deep.A5.reason, /parent chain of …BBBBBB has length 2, Status says 1/);
});

test('assert B2 (F1): one first message per job passes; a creation prompt and a START fails', () => {
  const s = [ses(JOB, 'ALPHA #1', 'RUNNING', 't', BOB1)];
  const plan = { 'plan.md': `**Status** · OPEN. BOB #1 · ${BOB1} · depth 1\n\n**Jobs** · ALPHA #1 \`${JOB}\`, started.\n` };
  const ok = runOf({ sessions: SESSIONS, plan: 'plan.md', scenarios: ['B2'] }, [snap('t', s, [trg(BOB1, 'From alpha (D8): QUESTION', { fired: 'f' })])], plan)();
  assert.equal(ok.B2.status, 'PASS', ok.B2.reason);
  const twice = runOf({ sessions: SESSIONS, plan: 'plan.md', scenarios: ['B2'] }, [snap('t', s, [trg(JOB, 'From BOB #1 (D8): START', { fired: 'f', id: 'trig_start' })])], plan)();
  assert.equal(twice.B2.status, 'FAIL');
  assert.match(twice.B2.reason, /ALPHA #1: 2 first messages \(creation prompt \+ START trig_start\)/);
  const unconfirmed = runOf({ sessions: SESSIONS, plan: 'plan.md', scenarios: ['B2'] }, [snap('t', s, [])], { 'plan.md': `**Status** · OPEN. BOB #1 · ${BOB1} · depth 1\n` })();
  assert.match(unconfirmed.B2.reason, /not confirmed in the plan's Jobs line/);
});

test('assert D3/D4 (F3): one ANSWER per question id, a duplicate delivery adding none; two answers FAIL; no ids UNOBSERVED', () => {
  const s = [ses(JOB, 'ALPHA #1', 'RUNNING', 't', BOB1), ses(BOB1, 'BOB #1', 'RUNNING', 't', ROOT)];
  const Q = 'From alpha (D8): QUESTION id=alpha-Q1 v=1';
  const A = (id) => trg(JOB, `From BOB #1 (D8): ANSWER id=${id} v=1 re=alpha-Q1@1`, { fired: 'f' });
  const ok = runOf({ sessions: SESSIONS, scenarios: ['D3', 'D4'] }, [snap('t', s, [trg(BOB1, Q, { fired: 'f' }), trg(BOB1, Q, { fired: 'g' }), A('B1-1')])])();
  assert.equal(ok.D3.status, 'PASS', ok.D3.reason);
  assert.equal(ok.D4.status, 'PASS');
  const two = runOf({ sessions: SESSIONS, scenarios: ['D3', 'D4'] }, [snap('t', s, [trg(BOB1, Q, { fired: 'f' }), trg(BOB1, Q, { fired: 'g' }), A('B1-1'), A('B1-2')])])();
  assert.equal(two.D4.status, 'FAIL');
  assert.match(two.D4.reason, /alpha-Q1: 2 ANSWER triggers/);
  const none = runOf({ sessions: SESSIONS, scenarios: ['D3'] }, [snap('t', s, [trg(BOB1, 'From alpha (D8): QUESTION', { fired: 'f' })])])();
  assert.equal(none.D3.status, 'UNOBSERVED');
  // With git: two answer commits for one question fail, even with one ANSWER trigger.
  const root = mkdtempSync(join(tmpdir(), 'cert-product-'));
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  g('init', '-q', '-b', 'tranche/D8'); g('config', 'user.email', 't@example.com'); g('config', 'user.name', 't');
  g('commit', '-q', '--allow-empty', '-m', 'BOB #1: ANSWER alpha-Q1 (re=alpha-Q1@1)');
  const one = runOf({ sessions: SESSIONS, scenarios: ['D3'] }, [snap('t', s, [trg(BOB1, Q, { fired: 'f' }), A('B1-1')])]);
  assert.equal(one(root).D3.status, 'PASS');
  g('commit', '-q', '--allow-empty', '-m', 'BOB #1: ANSWER alpha-Q1 again, from the late routine (re=alpha-Q1@1)');
  assert.match(one(root).D3.reason, /alpha-Q1: 2 answer commits on tranche\/D8/);
});

test('assert D9 (F4): messages to live sessions pass; a message fired after its target was archived fails', () => {
  const s = [ses(JOB, 'ALPHA #1', 'ARCHIVED', '2026-10-01T10:00:00Z', BOB1), ses(BOB1, 'BOB #1', 'RUNNING', 't', ROOT)];
  const ok = runOf({ sessions: SESSIONS, scenarios: ['D9'] }, [snap('2026-10-01T10:30:00Z', s, [trg(JOB, 'From BOB #1 (D8): CHANGE', { fired: '2026-10-01T09:59:00Z' }), trg('session_01UnseenEEEEEEEEEEEEEEEE', 'From BOB #1 (D8): ANSWER', { fired: 'f' })])])();
  assert.equal(ok.D9.status, 'PASS', ok.D9.reason);
  assert.match(ok.D9.reason, /1 of 2 messages judged/);
  const late = runOf({ sessions: SESSIONS, scenarios: ['D9'] }, [snap('2026-10-01T10:30:00Z', s, [trg(JOB, 'From BOB #1 (D8): CHANGE', { fired: '2026-10-01T10:01:00Z' })])])();
  assert.equal(late.D9.status, 'FAIL');
  // An injected archive dates the archive exactly, and a message still enabled into an archived session fails.
  const inj = runOf({ sessions: SESSIONS, scenarios: ['D9'], injections: [{ fault: 'archive', target: JOB, time: '2026-10-01T09:00:00Z' }] }, [snap('2026-10-01T10:30:00Z', s, [trg(JOB, 'From BOB #1 (D8): CHANGE', { fired: '2026-10-01T09:30:00Z' }), trg(JOB, 'From BOB #1 (D8): ANSWER')])])();
  assert.match(inj.D9.reason, /fired 2026-10-01T09:30:00Z, archived 2026-10-01T09:00:00\.000Z; .*still enabled/);
});

test('assert E1 (F2): a relay on an open NEEDS BOB line passes; a relay without one fails; no relay log is UNOBSERVED', () => {
  const rec = (x) => ({ 'alpha.md': `# r\n\n**Status** · WAITING.\n**Session** \`${JOB}\`, depth 2.\n\n${x}\n` });
  const run = { sessions: SESSIONS, scenarios: ['E1'], records: { alpha: 'alpha.md' }, relays: [{ job: JOB, time: '2026-10-01T10:00:00Z', act: 'merge to main' }] };
  assert.equal(runOf(run, [snap('t', [], [])], rec('NEEDS BOB: merge `tranche/D8` to `main`, auto mode refuses it'))().E1.status, 'PASS');
  const bad = runOf(run, [snap('t', [], [])], rec('Waiting on BOB: Q1 v1.'))();
  assert.equal(bad.E1.status, 'FAIL');
  assert.match(bad.E1.reason, /relay for alpha at 2026-10-01T10:00:00Z \(merge to main\): its record had no open/);
  assert.equal(runOf({ ...run, relays: undefined }, [snap('t', [], [])], rec(''))().E1.status, 'UNOBSERVED');
  // From git, the record is read as it stood at the relay: a NEEDS BOB pushed after the relay does not count.
  const root = mkdtempSync(join(tmpdir(), 'cert-product-'));
  const g = (args, date) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', env: { ...process.env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date } });
  g(['init', '-q', '-b', 'job/D8/alpha'], '2026-10-01T09:00:00Z'); g(['config', 'user.email', 't@example.com'], 'x'); g(['config', 'user.name', 't'], 'x');
  mkdirSync(join(root, 'build/jobs/D8'), { recursive: true });
  writeFileSync(join(root, 'build/jobs/D8/alpha.md'), rec('Waiting on BOB: Q1 v1.')['alpha.md']);
  g(['add', '-A'], 'x'); g(['commit', '-q', '-m', 'r'], '2026-10-01T09:00:00Z');
  writeFileSync(join(root, 'build/jobs/D8/alpha.md'), rec('NEEDS BOB: merge to main, refused')['alpha.md']);
  g(['add', '-A'], 'x'); g(['commit', '-q', '-m', 'r'], '2026-10-01T10:30:00Z');
  const fromGit = runOf({ ...run, records: undefined }, [snap('t', [], [])]);
  assert.equal(fromGit(root).E1.status, 'FAIL');
  const later = runOf({ ...run, records: undefined, relays: [{ job: 'alpha', time: '2026-10-01T10:31:00Z' }] }, [snap('t', [], [])]);
  assert.equal(later(root).E1.status, 'PASS', later(root).E1.reason);
});

test('assert G4: each archived session has one row with its archived usage and its record\'s Size; else FAIL', () => {
  const CSV = (u) => `${CSV_HEADER}\n${JOB},job,alpha,${u},,3,57\n`;
  const rec = { 'alpha.md': `**Status** · COMPLETE.\n**Session** \`${JOB}\`, depth 2.\n\n## Done\n\nSize: test runs 3, module lines 57\n` };
  const archived = [ses(JOB, 'ALPHA #1', 'ARCHIVED', '2026-10-01T10:00:00Z', BOB1, [10, 20, 3, 40])];
  const run = { sessions: SESSIONS, scenarios: ['G4'], csv: 'D8.csv', records: { alpha: 'alpha.md' } };
  assert.equal(runOf(run, [snap('2026-10-01T10:05:00Z', archived, [])], { ...rec, 'D8.csv': CSV('10,20,3,40') })().G4.status, 'PASS');
  const bad = runOf(run, [snap('2026-10-01T10:05:00Z', archived, [trg(JOB, 'From BOB #1 (D8): CHANGE')])], { 'alpha.md': rec['alpha.md'].replace('test runs 3', 'test runs 4'), 'D8.csv': CSV('10,20,3,41') })();
  assert.equal(bad.G4.status, 'FAIL');
  assert.match(bad.G4.reason, /ALPHA #1: output 41 in the CSV, 40 archived; ALPHA #1: CSV test_runs 3, module_lines 57; record Size 4, 57; ALPHA #1: trigger trig_\d+ enabled while it is archived/);
  assert.match(runOf(run, [snap('t', archived, [])], { ...rec, 'D8.csv': `${CSV_HEADER}\n` })().G4.reason, /ALPHA #1: 0 CSV rows/);
  assert.equal(runOf(run, [snap('t', [ses(JOB, 'ALPHA #1', 'IDLE', 't')], [])], { ...rec, 'D8.csv': CSV('1,2,3,4') })().G4.status, 'UNOBSERVED');
});

test('assert H6 (K128): exactly one enabled backstop into the current BOB, due within 20 min + SLACK, at every snapshot', () => {
  const s = [ses(BOB2, 'BOB #2', 'RUNNING', 't', ROOT)];
  const back = (target, run, name = 'BOB backstop') => trg(target, 'BACKSTOP (D8, layer 1): check ALPHA #1', { run, name });
  const run = { sessions: SESSIONS, current_bob: BOB2, scenarios: ['H6'] };
  const ok = runOf(run, [snap('2026-10-01T10:00:00Z', s, [back(BOB2, '2026-10-01T10:20:00Z'), trg(BOB2, 'From alpha (D8): COMPLETE')]), snap('2026-10-01T10:30:00Z', s, [back(BOB2, '2026-10-01T10:40:00Z')]), snap('2026-10-01T11:00:00Z', s, [], { layer_running: false })])();
  assert.equal(ok.H6.status, 'PASS', ok.H6.reason);
  const bad = runOf(run, [snap('2026-10-01T10:00:00Z', s, []), snap('2026-10-01T10:30:00Z', s, [back(BOB2, '2026-10-01T11:30:00Z'), back(BOB1, '2026-10-01T10:40:00Z')])])();
  assert.equal(bad.H6.status, 'FAIL');
  assert.match(bad.H6.reason, /snap-1\.json: 0 enabled backstops into BOB #2; snap-2\.json: backstop trig_\d+ due 2026-10-01T11:30:00Z, later than 20 min \+ SLACK; snap-2\.json: backstop trig_\d+ enabled into BOB #1, not the current BOB/);
  const twice = runOf(run, [snap('2026-10-01T10:00:00Z', s, [back(BOB2, '2026-10-01T10:20:00Z'), back(BOB2, '2026-10-01T10:15:00Z')])])();
  assert.match(twice.H6.reason, /2 enabled backstops into BOB #2/);
});

test('assert: a scenario with no predicate is UNOBSERVED, and fails the run only when required', () => {
  assert.ok(['A4', 'A5', 'B2', 'D3', 'D4', 'D9', 'E1', 'G4', 'H6'].every((id) => PREDICATES[id]));
  const r = runOf({ sessions: SESSIONS, scenarios: ['A1'] }, [snap('t', [], [])]);
  assert.equal(r().A1.status, 'UNOBSERVED');
  const dir = mkdtempSync(join(tmpdir(), 'cert-run-'));
  writeFileSync(join(dir, 'run.json'), JSON.stringify({ scenarios: ['A1'], required: ['A1'] }));
  assert.equal(assertRun(join(dir, 'run.json')).failed, true);
  writeFileSync(join(dir, 'run.json'), JSON.stringify({ scenarios: ['A1'] }));
  assert.equal(assertRun(join(dir, 'run.json')).failed, false);
});
