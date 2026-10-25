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

// ---- the tightening of the second pass (rules 1-5): each with a positive and a negative ----
const LIB = "export function registerJob(e) { return { ok: false, reason: \"LIB_BUSY\", detail: e }; }\nexport function listOwnedThings() { return []; }\nexport function attach(x) { return x; }\nexport const settings = {};\n";
const lines = (failures, file) => failures.filter((f) => f.includes(` ${file}:`));

test('rule 1: an extent is an answer only inside a stub or double, or given to one; extent data passed in is not', () => {
  const root = product({ 'src/lib/index.mjs': LIB, 'test/user/extent.test.mjs': [
    'const fakeReader = () => ({ extent: { kind: "pdf-page", page: 1 } });',   // line 1: inside a double
    'const units = [{ extent: { kind: "pdf-page", page: 2 } }];',              // line 2: data
    'w.content.mint({ extent: { kind: "pdf-page", page: 3 } });',              // line 3: an input to a module call
    'stubReader({ extent: { kind: "pdf-page", page: 4 } });',                  // line 4: answered by a stub
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/extent.test.mjs');
  const at = (n) => f.filter((x) => x.includes(`extent.test.mjs:${n} [extent]`)).length;
  assert.equal(at(1), 1, f.join('\n'));
  assert.equal(at(4), 1);
  assert.equal(at(2) + at(3), 0);
});

test('rule 2: a refusal literal handed to a member call or an imported helper is an input; one a double or a Response builds is an answer', () => {
  const root = product({ 'src/lib/index.mjs': LIB, 'test/user/input.test.mjs': [
    'import { attach } from "../../src/lib/index.mjs";',
    'w.lib.registerNote({ ok: false, reason: "LIB_BUSY" });',                 // line 2: a member call on the provider: an input
    'attach({ ok: false, reason: "LIB_BUSY" });',                             // line 3: an imported helper: an input
    'new Response.json({ ok: false, reason: "LIB_BUSY" });',                  // line 4: builds an answer
    'const keep = { ok: false, reason: "LIB_BUSY" };',                        // line 5: held as a value
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/input.test.mjs').map((x) => Number(x.split(':')[1].split(' ')[0]));
  assert.deepEqual(f, [4, 5]);
});

test('rule 3: platform doubles are never stubs; a double of a module is', () => {
  const root = product({ 'test/user/platform.test.mjs': [
    'class FakeDate {}', 'const fakeBinding = {};', 'const alarmDouble = {};', 'const fakeFetch = () => 1;', 'const fakeR2 = {};', 'const clockStub = {};',
    'const fakePlane = {};',                                                   // line 7: a module's double
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/platform.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /platform\.test\.mjs:7 \[decl\]/);
});

test('rule 4: a bare local stub counts only when it stands in for another module\'s exported name', () => {
  const root = product({ 'src/lib/index.mjs': LIB, 'test/user/spy.test.mjs': [
    'const stub = { listOwnedThings: () => [] };',                             // line 1: stands in for lib\'s export
    'const fake = { localThing: () => 1 };',                                   // line 2: a local spy
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/spy.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /spy\.test\.mjs:1 \[spy standing in listOwnedThings\].*-> lib \(earlier\)$/);
});

test('rule 5: a code fed in and asserted to come out is allowed; a code only asserted is not', () => {
  const root = product({ 'test/user/pass.test.mjs': [
    'import assert from "node:assert/strict";',
    'const out = run({ reason: "ECHO_ME" });',                                 // fed in
    'assert.equal(out.reason, "ECHO_ME");',                                    // line 3: asserted back: pass-through
    'assert.equal(out2.reason, "ONLY_ASSERTED");',                             // line 4: no input anywhere
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/pass.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /^code user test\/user\/pass\.test\.mjs:4 /);
});

// ---- the third pass (rules A-D): each with a positive and a negative ----
test('rule A: a bare spy standing in for a one-word export (`settings`) is not reported; one for a compound export is', () => {
  const root = product({ 'src/lib/index.mjs': LIB, 'test/user/spyword.test.mjs': [
    'const stub = { settings: 1 };',                                          // line 1: a common property name
    'const fake = { listOwnedThings: () => [] };',                            // line 2: a seam
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/spyword.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /spyword\.test\.mjs:2 \[spy standing in listOwnedThings\]/);
});

test('rule B: an answer inside a plug-in registrar call is the user\'s own code; the same literal held as a value is not', () => {
  const root = product({ 'test/user/plugin.test.mjs': [
    'p.registerStep("zz", { check: () => ({ ok: false, reason: "LIB_BUSY" }) });', // line 1: own plug-in
    'onAlarm(() => ({ ok: false, reason: "LIB_BUSY" }));',                         // line 2: own handler
    'const held = { ok: false, reason: "LIB_BUSY" };',                             // line 3: an answer
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/plugin.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /plugin\.test\.mjs:3 /);
});

test('rule C: a literal given to the user\'s own function under test is an input; one given to a helper from its own tests is an answer', () => {
  const root = product({
    'src/user/index.mjs': 'export const run = (x) => x;\nexport const own = () => ({ ok: false, reason: "USER_OWN" });\n',
    'test/user/helper.mjs': 'export const wrap = (x) => x;\n',
    'test/user/under.test.mjs': [
      'import { run } from "../../src/user/index.mjs";',
      'import { wrap } from "./helper.mjs";',
      'run({ ok: false, reason: "LIB_BUSY" });',                                    // line 3: the function under test
      'wrap({ ok: false, reason: "LIB_BUSY" });',                                   // line 4: a test helper
    ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/under.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /under\.test\.mjs:4 /);
});

test('rule D: a code under a data key (`why: { code }`) is data; a bare code field is a refusal code', () => {
  const root = product({ 'test/user/data.test.mjs': [
    'const bad = { why: { code: "X_Y_Z", step: "nowhere" } };',                 // line 1: data
    'const gone = { code: "Q_Z_GONE" };',                                       // line 2: a code no source gives
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/data.test.mjs');
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /^code user test\/user\/data\.test\.mjs:2 /);
});
