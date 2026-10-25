// Tests of the fixtures check (checks/fixtures.mjs) against a fake product built in a temporary directory: one hand-built
// refusal, one named stub, one invented code, one accepted later-provider contract, one clean file; each asserted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkFixtures } from '../fixtures.mjs';

// modules.json order: lib (1), user (2), late (3), other (4)
function product(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fixtures-'));
  const all = {
    'build/modules.json': JSON.stringify({
      not_product: ['build/'],
      modules: [
        { id: 'lib', layer: 1, paths: ['src/lib/'], tests: ['test/lib/'], uses: [] },
        { id: 'user', layer: 2, paths: ['src/user/'], tests: ['test/user/'], uses: ['lib'] },
        { id: 'late', layer: 3, paths: ['src/late/'], tests: ['test/late/'], uses: ['lib'] },
        { id: 'other', layer: 4, paths: ['src/other/'], tests: ['test/other/'], uses: [] },
      ],
    }),
    'src/lib/index.mjs': 'export function registerJob(e) { return { ok: false, reason: "LIB_BUSY", detail: e }; }\n',
    'src/user/index.mjs': 'export const own = () => ({ ok: false, reason: "USER_OWN" });\n',
    'src/late/index.mjs': 'export const give = () => ({ ok: false, reason: "LATE_REFUSED" });\n',
    'src/other/index.mjs': 'export const x = 1;\n',
    // the user's tests, one file per kind
    'test/user/refusal.test.mjs': [
      'import { test } from "node:test";',
      'import { registerJob } from "../../src/lib/index.mjs";',
      'const answer = { ok: false, reason: "LIB_BUSY", detail: { n: 1 } };',           // line 3: a hand-built refusal of lib
      'const own = { ok: false, reason: "USER_OWN" };',                                // line 4: the user\'s own shape: not reported
      'test("x", () => { registerJob(answer); });',
    ].join('\n') + '\n',
    'test/user/stub.test.mjs': [
      'function fakeStore() { return {}; }',                                           // line 1: a named double
      'const jobs = {};',
      'jobs.registerJob = (e) => ({ ok: true });',                                     // line 3: a stand-in for lib\'s registerJob
      'registerJob(1);',                                                               // a call of the real service: not reported
      'fakeStore();',
    ].join('\n') + '\n',
    'test/user/code.test.mjs': [
      'import assert from "node:assert/strict";',
      'assert.equal(out.reason, "NO_ROOM");',                                          // line 2: a code no source gives
      'assert.equal(out.reason, "LIB_BUSY");',                                         // a code lib gives: fine
      'const SIZE = "MAX_SIZE";',                                                       // not at a code position: fine
    ].join('\n') + '\n',
    'test/user/contract.test.mjs': [
      '// fixtures-contract: late L-refused',
      'const lateAnswer = { ok: false, reason: "LATE_REFUSED" };',                      // line 2: accepted, late runs it
      '',
      '// fixtures-contract: late L-unrun',
      'const unrun = { ok: false, reason: "LATE_REFUSED", detail: 1 };',                // line 5: late never runs L-unrun
      '',
      '// fixtures-contract: lib L-early',
      'const early = { ok: false, reason: "LIB_BUSY" };',                               // line 8: the provider is earlier
      '',
      '// fixtures-contract: late L-idle',
      'const nothing = 1;',                                                             // line 11: the marker covers nothing
    ].join('\n') + '\n',
    'test/user/clean.test.mjs': [
      'import { test } from "node:test";',
      'import assert from "node:assert/strict";',
      'test("clean", () => {',
      '  assert.deepEqual(out, { ok: false, reason: "LIB_BUSY", detail: {} });',        // an expected value: not a hand-built answer
      '  assert.equal(out.reason, "LIB_BUSY");',
      '});',
    ].join('\n') + '\n',
    // the provider's test running the contract
    'test/late/contract.test.mjs': [
      '// fixtures-run: user L-refused',
      '// fixtures-run: user L-early',
      '// fixtures-run: user L-gone',                                                   // line 3: no user marks L-gone
      'import { give } from "../../src/late/index.mjs";',
    ].join('\n') + '\n',
  };
  Object.assign(all, files);
  for (const [p, c] of Object.entries(all)) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); }
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 't@example.com'); g('config', 'user.name', 't');
  g('add', '-A'); g('commit', '-q', '-m', 'base');
  return root;
}

const find = (failures, cls, file, line) => failures.filter((f) => f.startsWith(`${cls} user ${file}:${line} `));

test('answer: a hand-built refusal of another module is found with its provider; the module\'s own shape is not', () => {
  const { failures } = checkFixtures(product());
  const hit = find(failures, 'answer', 'test/user/refusal.test.mjs', 3);
  assert.equal(hit.length, 1, failures.join('\n'));
  assert.match(hit[0], /\[refusal\]/);
  assert.match(hit[0], /-> lib \(earlier\)$/);
  assert.equal(find(failures, 'answer', 'test/user/refusal.test.mjs', 4).length, 0);
});

test('stub: a named double and a stand-in for another module\'s service are found; a call of the real service is not', () => {
  const { failures } = checkFixtures(product());
  const dbl = find(failures, 'stub', 'test/user/stub.test.mjs', 1);
  assert.equal(dbl.length, 1, failures.join('\n'));
  assert.match(dbl[0], /\[decl\]/);
  const st = find(failures, 'stub', 'test/user/stub.test.mjs', 3);
  assert.equal(st.length, 1);
  assert.match(st[0], /\[stand-in registerJob\]/);
  assert.match(st[0], /-> lib \(earlier\)$/);
  assert.equal(find(failures, 'stub', 'test/user/stub.test.mjs', 4).length, 0);
});

test('code: a refusal code no product source gives is found; a code a source gives, and a plain constant, are not', () => {
  const { failures } = checkFixtures(product());
  const hit = find(failures, 'code', 'test/user/code.test.mjs', 2);
  assert.equal(hit.length, 1, failures.join('\n'));
  assert.match(hit[0], /-> \?$/);
  assert.equal(find(failures, 'code', 'test/user/code.test.mjs', 3).length, 0);
  assert.equal(find(failures, 'code', 'test/user/code.test.mjs', 4).length, 0);
});

test('an invented code inside a hand-built answer is one answer failure tagged invented, not also a code failure', () => {
  const root = product({ 'test/user/inv.test.mjs': 'const r = { ok: false, reason: "JOB_TABLE_FULL" };\n' });
  const { failures, totals } = checkFixtures(root);
  const hit = find(failures, 'answer', 'test/user/inv.test.mjs', 1);
  assert.equal(hit.length, 1, failures.join('\n'));
  assert.match(hit[0], /\[refusal invented JOB_TABLE_FULL\]/);
  assert.equal(find(failures, 'code', 'test/user/inv.test.mjs', 1).length, 0);
  assert.ok(totals.invented >= 1);
});

test('contract (K4995): accepted only when the provider is later and its test runs the contract; every other marker fails by name', () => {
  const { failures, items, totals } = checkFixtures(product());
  const F = 'test/user/contract.test.mjs';
  assert.equal(find(failures, 'answer', F, 2).length, 0, 'accepted');
  const acc = items.find((c) => c.file === F && c.line === 2);
  assert.equal(acc.status, 'accepted');
  assert.equal(acc.contract, 'L-refused');
  assert.equal(totals.accepted, 1);
  assert.match(find(failures, 'answer', F, 5)[0], /contract-no-run/);
  assert.match(find(failures, 'answer', F, 8)[0], /contract-not-later/);
  assert.match(find(failures, 'contract', F, 10)[0], /\[idle\]/);
  assert.ok(failures.some((f) => f.startsWith('contract user test/late/contract.test.mjs:3 [orphan-run]')), failures.join('\n'));
});

test('clean: an expected value in an assertion, an own shape and the real service called produce no failure', () => {
  const { failures } = checkFixtures(product());
  assert.deepEqual(failures.filter((f) => f.includes('test/user/clean.test.mjs')), []);
});

test('a module argument limits the report to that user module; a clean product has no failures', () => {
  const root = product();
  assert.deepEqual(checkFixtures(root, ['other']).failures, []);
  assert.ok(checkFixtures(root, ['user']).failures.length > 0);
  const clean = product({ 'test/user/refusal.test.mjs': 'export const a = 1;\n', 'test/user/stub.test.mjs': 'export const b = 1;\n', 'test/user/code.test.mjs': 'export const c = 1;\n', 'test/user/contract.test.mjs': 'export const d = 1;\n', 'test/late/contract.test.mjs': 'export const e = 1;\n' });
  const r = checkFixtures(clean);
  assert.deepEqual(r.failures, [], r.failures.join('\n'));
  assert.match(r.summary, /answer 0 .*stub 0, code 0, contract 0, accepted 0/);
});

test('answer: a spread is no key and an input object is no answer (ok must be written true or false)', () => {
  const root = product({ 'test/user/inputs.test.mjs': [
    'const ok = { a: 1 };',
    'call({ ...ok, reason: "x" });',             // a spread named ok, with reason: an input
    'call({ ok: flag, reason: "x" });',          // ok is not a literal: not an answer
    'call({ ok: false, reason: "LIB_BUSY" });',  // line 4: an answer
  ].join('\n') + '\n' });
  const { failures } = checkFixtures(root);
  assert.deepEqual(failures.filter((f) => f.includes('inputs.test.mjs')).map((f) => f.split(' ')[2]), ['test/user/inputs.test.mjs:4']);
});
