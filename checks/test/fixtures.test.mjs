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

// ---- the fourth pass ----
const OWN = 'export const run = (x) => x;\nexport const fakeAccount = {};\nexport const own = () => ({ ok: false, reason: "USER_OWN" });\n';

test('rule E: a literal nested in an input object to the function under test is an input; nested in a Response.json it is an answer', () => {
  const root = product({ 'src/user/index.mjs': OWN, 'test/user/nest.test.mjs': [
    'import { run } from "../../src/user/index.mjs";',
    'run({ ok: true, result: { ok: false, reason: "LIB_BUSY" } });',                       // line 2: an input one level down
    'w.lib.put({ rows: [{ ok: false, reason: "LIB_BUSY" }] });',                           // line 3: in a list in a member call
    'Response.json({ ok: true, result: { ok: false, reason: "LIB_BUSY" } });',             // line 4: an answer
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/nest.test.mjs').map((x) => Number(x.split(':')[1].split(' ')[0]));
  assert.deepEqual(f, [4]);
});

test('rule F: a double imported from the user\'s own source is skipped; one imported from another module\'s tests is not', () => {
  const root = product({ 'src/user/index.mjs': OWN, 'test/lib/helper.mjs': 'export const stubOf = {};\n', 'test/user/imp.test.mjs': [
    'import { fakeAccount } from "../../src/user/index.mjs";',                             // line 1: its own
    'import { stubOf } from "../lib/helper.mjs";',                                         // line 2: a test double of another module (K5044: one from the user's own tests is its own)
    'use(fakeAccount, stubOf);',
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/imp.test.mjs').filter((x) => x.startsWith('stub '));
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /imp\.test\.mjs:2 \[import\]/);
});

test('rule G: a why-keyed ok literal and a code pushed into the module\'s own list are its data; a reason-keyed literal and a bare code field are not', () => {
  const root = product({ 'test/user/own.test.mjs': [
    'const a = { ok: false, why: "MEMBER_X_BAD", detail: 1 };',                           // line 1: why: its own data
    'findings.push({ check: "C-1", code: "INFO_X_Y", severity: 1 });',                    // line 2: a finding it builds
    'const b = { ok: false, reason: "LIB_BUSY", detail: 1 };',                            // line 3: an answer
    'const c = { code: "Q_Z_GONE" };',                                                    // line 4: a code no source gives
  ].join('\n') + '\n' });
  const f = lines(checkFixtures(root).failures, 'test/user/own.test.mjs').map((x) => Number(x.split(':')[1].split(' ')[0]));
  assert.deepEqual(f, [3, 4]);
});

// ---- K5044: the check's rules settled after the T51 fixture audit ----
// modules.json order: test-support (0), lib (1), user (2), late (3), other (4); the harness lives in test/harness/, its own tests in test/support/
function product5(files = {}) {
  return product({
    'build/modules.json': JSON.stringify({
      not_product: ['build/'],
      modules: [
        { id: 'test-support', layer: 0, paths: ['test/harness/'], tests: ['test/support/'], uses: [] },
        { id: 'lib', layer: 1, paths: ['src/lib/'], tests: ['test/lib/'], uses: [] },
        { id: 'user', layer: 2, paths: ['src/user/'], tests: ['test/user/'], uses: ['lib'] },
        { id: 'late', layer: 3, paths: ['src/late/'], tests: ['test/late/'], uses: ['lib'] },
        { id: 'other', layer: 4, paths: ['src/other/'], tests: ['test/other/'], uses: [] },
      ],
    }),
    'src/lib/index.mjs': [
      'export function registerJob(e) { return { ok: false, reason: "LIB_BUSY", detail: e }; }',
      'export function deliver(x) { return x; }',
      'export const other = () => ({ ok: false, reason: "LIB_OTHER" });',
      'export const bad = (n) => ({ ok: false, reason: `BAD_${n}` });',
      'export function libOps(a) { return { holdput: () => a.put(), holdget: () => a.get(), ownop: () => 1 }; }',
      'export const DECLARED_OPS = Object.freeze({ declaredop: { classes: ["member"] } });',
    ].join('\n') + '\n',
    'src/user/index.mjs': 'export const own = () => ({ ok: false, reason: "USER_OWN" });\nexport const run = (x) => x;\nexport function userOps() { return { ownop: () => 1 }; }\n',
    ...files,
  });
}
const CONTROL = 'const control = { ok: false, reason: "LIB_BUSY", detail: 1 };'; // a plain hand-built answer: always found
const all = (failures, file) => failures.filter((f) => f.includes(` ${file}:`));
const lineOf = (f) => Number(f.split(':')[1].split(' ')[0]);
// a file whose only finding is the control on its last line
function onlyControl(lines, extra = {}, control = CONTROL) {
  const file = 'test/user/k5044.test.mjs';
  const root = product5({ [file]: [...lines, control].join('\n') + '\n', ...extra });
  const f = all(checkFixtures(root).failures, file);
  assert.deepEqual(f.map(lineOf), [lines.length + 1], f.join('\n'));
  return checkFixtures(root);
}

test('K5044 (1) platform doubles: a store double with fetch, the Workers runtime, the Agent SDK, a bucket, a binding, IndexedDB and a fake network are skipped', () => {
  onlyControl([
    'function stubOf(id) { return { fetch: async (req) => ({ ok: true, result: { ok: false, reason: "LIB_BUSY", detail: id } }) }; }',   // a Durable Object double dispatching to modules
    'const fakeCtx = { waitUntil() {}, answer: () => ({ ok: false, reason: "LIB_BUSY", detail: 1 }) };',
    'function installRuntime() { return { ok: false, reason: "LIB_BUSY", detail: 2 }; }',
    'const stubSdk = { query: () => ({ ok: false, reason: "LIB_BUSY", detail: 3 }) };',
    'const caps = { evidenceStore: () => ({ head: async () => null, get: async () => ({ ok: false, reason: "LIB_BUSY", detail: 4 }), put: async () => 1 }) };',
    'const wired = { calls: [], binding: { send: () => ({ ok: false, reason: "LIB_BUSY", detail: 5 }) } };',
    'function idbOpen() { return { ok: false, reason: "LIB_BUSY", detail: 6 }; }',
    'globalThis.fetch = async () => ({ ok: false, reason: "LIB_BUSY", detail: 7 });',                                                 // a fake external network reply
  ]);
});

test('K5044 (1) fault injection: a stand-in that only throws, never settles, returns undefined or a nameless {ok:false} is skipped', () => {
  onlyControl([
    'const jobs = {};',
    'jobs.registerJob = () => { throw new Error("down"); };',
    'jobs.armJobs = () => new Promise(() => {});',
    'jobs.readHeld = () => {};',
    'const fakeGate = () => ({ ok: false, detail: "no code" });',
    'function stubDown() { throw new Error("x"); }',
  ]);
});

test('K5044 (1) a stand-in that answers is still found (the fault rule is no blanket)', () => {
  const file = 'test/user/answers.test.mjs';
  const { failures } = checkFixtures(product5({ [file]: 'const jobs = {};\njobs.registerJob = () => ({ ok: true, existed: false });\n' }));
  assert.match(all(failures, file).join('\n'), /stand-in registerJob/);
});

test('K5044 (1) a delegating wrapper or spy that calls the same-named function of another object is skipped', () => {
  onlyControl([
    'const jobs = {}; let calls = 0;',
    'jobs.registerJob = (e) => { calls++; return real.registerJob(e); };',
    'const stub = { deliver: (x) => real.deliver(x) };',
  ]);
});

test('K5044 (1) pass-through: an answer literal whose code the same test asserts unchanged, a raw platform error and a lower_snake provider reason are skipped', () => {
  onlyControl([
    'import assert from "node:assert/strict";',
    'const given = { ok: false, reason: "LIB_BUSY", detail: 1 };',
    'assert.equal(out.reason, "LIB_BUSY");',                                      // the same test asserts the code back
    'const raw = { ok: false, error: e.stack };',
    'const provider = { ok: false, reason: "overloaded_error", detail: 1 };',
  ], {}, 'const control = { ok: false, reason: "LIB_OTHER", detail: 1 };');
});

test('K5044 (1) the user\'s own seam: .transact, a check/validate key, a local wrapper of the user\'s own export are skipped', () => {
  onlyControl([
    'import { run } from "../../src/user/index.mjs";',
    'const call = (x) => run(x);',
    'registerJob.transact(() => ({ ok: false, reason: "LIB_BUSY", detail: 1 }));',
    'const cfg = { check: () => ({ ok: false, reason: "LIB_BUSY", detail: 2 }), validate(x) { return { ok: false, reason: "LIB_BUSY", detail: 3 }; } };',
    'call({ ok: false, reason: "LIB_BUSY", detail: 4 });',
  ]);
});

test('K5044 (1) harness-own: test-support\'s own tests and generators, a test shell, stubs imported from the user\'s own tests are skipped', () => {
  const root = product5({
    'test/support/self.test.mjs': 'const a = { ok: false, reason: "LIB_BUSY", detail: 1 };\nconst fakeThing = {};\n',
    'test/harness/pdfgen.mjs': 'export const v = { ok: false, reason: "LIB_BUSY", detail: 1 };\nexport const OFF = { code: "OFF_FRAME" };\n',
    'test/user/own-helper.mjs': 'export const stubOwn = { registerJob: 1 };\n',
    'test/user/shell.test.mjs': [
      'import { stubOwn } from "./own-helper.mjs";',
      'use(stubOwn);',
      'const shell = { name: "test-shell", r: { ok: false, reason: "LIB_BUSY", detail: 1 } };',
      CONTROL,
    ].join('\n') + '\n',
  });
  const { failures } = checkFixtures(root);
  assert.deepEqual(all(failures, 'test/support/self.test.mjs'), []);
  assert.deepEqual(all(failures, 'test/harness/pdfgen.mjs'), []);
  assert.deepEqual(all(failures, 'test/user/shell.test.mjs').map(lineOf), [4]);
});

test('K5044 (1) name clash: a local helper named like a service never handed in, and a snake_case data key, are no stand-in or double', () => {
  const clash = checkFixtures(product5({ 'test/user/clash.test.mjs': ['function deliver(x) { return x; }', 'deliver(1);', 'const row = { double_speak_or_reversal: 1 };'].join('\n') + '\n' }));
  assert.deepEqual(all(clash.failures, 'test/user/clash.test.mjs'), [], clash.failures.join('\n'));
  const handed = checkFixtures(product5({ 'test/user/handed.test.mjs': ['function deliver(x) { return x; }', 'wire({ deliver });'].join('\n') + '\n' }));
  assert.match(all(handed.failures, 'test/user/handed.test.mjs').join('\n'), /stand-in deliver/);
});

test('K5044 (1) an expected value held in a variable used only in assertions is skipped; one also fed in is found', () => {
  const r = onlyControl([
    'import assert from "node:assert/strict";',
    'const expected = { ok: false, reason: "LIB_OTHER", detail: 1 };',
    'assert.deepEqual(out, expected);',
    'const fed = { ok: false, reason: "LIB_OTHER", detail: 2 };',
    'assert.deepEqual(out2, fed);',
  ].slice(0, 3), {}, 'const fed = { ok: false, reason: "LIB_OTHER", detail: 2 };\nuse(fed);');
  assert.ok(r.failures.length > 0);
});

test('K5044 (1) a code the product builds by template (`BAD_${n}`) matches any code of that prefix: not invented, no code failure', () => {
  const file = 'test/user/tpl.test.mjs';
  const { failures, totals } = checkFixtures(product5({ [file]: ['import assert from "node:assert/strict";', 'const r = { ok: false, reason: "BAD_THING", detail: 1 };', 'assert.equal(out.reason, "BAD_OTHER");', 'assert.equal(out.reason, "WORSE_THING");'].join('\n') + '\n' }));
  const f = all(failures, file);
  assert.equal(f.length, 2, f.join('\n'));
  assert.match(f[0], /^answer user .*:2 \[refusal\] .* -> lib \(earlier\)$/);
  assert.match(f[1], /^code user .*:4 /);
  assert.equal(totals.invented, 0);
});

test('K5044 (2) fixtures-generic: accepts the code it names within eight lines; a code it does not name stays a finding; a marker covering nothing fails', () => {
  const file = 'test/user/generic.test.mjs';
  const { failures, items, totals } = checkFixtures(product5({ [file]: [
    '// fixtures-generic: MADE_UP_CODE',
    'const a = { ok: false, reason: "MADE_UP_CODE", detail: 1 };',              // line 2: accepted (an invented tag)
    '',
    'import assert from "node:assert/strict";',
    '// fixtures-generic: SENTINEL_X',
    'assert.equal(out.reason, "SENTINEL_X");',                                   // line 6: a code-class sentinel, accepted
    '',
    '// fixtures-generic: OTHER_NAMED',
    'const b = { ok: false, reason: "NOT_NAMED", detail: 1 };',                  // line 9: the marker names another code: a finding
    '',
    '// fixtures-generic: NOTHING_HERE',                                         // line 11: covers nothing
    'const c = 1;',
  ].join('\n') + '\n' }));
  const f = all(failures, file).sort((a, b) => lineOf(a) - lineOf(b));
  assert.deepEqual(f.map(lineOf), [8, 9, 11], f.join('\n'));
  assert.match(f[0], /idle-generic/);   // OTHER_NAMED covers a candidate but names no code of it: idle
  assert.match(f[1], /refusal invented NOT_NAMED/);
  assert.match(f[2], /idle-generic/);
  assert.equal(items.filter((c) => c.file === file && c.status === 'accepted').length, 2);
  assert.ok(totals.accepted >= 2);
});

test('K5044 (3a) a local builder is reported at each call site with its code, not at its literal', () => {
  const file = 'test/user/builder.test.mjs';
  const { failures } = checkFixtures(product5({ [file]: [
    'const refusedWith = (code, extra = {}) => ({ status: 200, json: { ok: true, result: { ok: false, reason: code, ...extra } } });',   // line 1
    'const a = refusedWith("LIB_BUSY");',                                          // line 2: lib's code
    'const b = refusedWith("MADE_UP_X", { n: 1 });',                               // line 3: no source gives it
    'const c = refusedWith("USER_OWN");',                                          // line 4: the user's own: skipped
    'import assert from "node:assert/strict";',
    'assert.deepEqual(out, refusedWith("LIB_BUSY"));',                             // line 6: an expected value: skipped
  ].join('\n') + '\n' }));
  const f = all(failures, file);
  assert.deepEqual(f.map(lineOf), [2, 3], f.join('\n'));
  assert.match(f[0], /^answer user .* \[builder refusedWith\] .* -> lib \(earlier\)$/);
  assert.match(f[1], /\[builder refusedWith invented MADE_UP_X\]/);
});

test('K5044 (3b) a scripted op table: each entry keyed by a product op that builds an answer is a finding, its provider the module declaring the op', () => {
  const file = 'test/user/optable.test.mjs';
  const { failures } = checkFixtures(product5({ [file]: [
    'const t = await open("x", { plane: {',
    '  holdput: ok({ ok: true, result: { id: 1 } }),',                              // line 2: lib's ops map
    '  holdget: (req) => ({ ok: false, status: 404 }),',                            // line 3: a function building an answer
    '  declaredop: { ok: true, result: 1 },',                                       // line 4: lib's DECLARED_OPS
    '  ownop: ok({ ok: true }),',                                                   // line 5: the user declares it too: its own
    '  notanop: ok({ ok: true }),',                                                 // line 6: no module declares it
    '  holdput2: 5,',
    '} });',
  ].join('\n') + '\n' }));
  const f = all(failures, file);
  assert.deepEqual(f.map(lineOf), [2, 3, 4], f.join('\n'));
  assert.match(f[0], /^answer user .* \[op-table holdput\] .* -> lib \(earlier\)$/);
  assert.match(f[1], /\[op-table holdget\]/);
  assert.match(f[2], /\[op-table declaredop\]/);
});

test('K5044 (4) a contract marker in a harness file covers the stub and every import of it when the provider runs it; without the run the import is found', () => {
  const stub = (id) => [
    `// fixtures-contract: lib ${id}`,
    '// the stub of lib\'s registrar',
    '//', '//', '//', '//', '//', '//', '//', '//',                                  // more than MARK_SPAN lines of comment: the marker covers the whole value
    'export function jobRegistrarStub() {',
    '  function registerJob(e) { return { ok: false, reason: "LIB_BUSY", detail: e }; }',
    '  return { registerJob };',
    '}',
  ].join('\n') + '\n';
  const users = { 'test/user/imp5.test.mjs': 'import { jobRegistrarStub } from "../harness/job-stub.mjs";\nuse(jobRegistrarStub());\n' };
  const ok = checkFixtures(product5({ ...users, 'test/harness/job-stub.mjs': stub('job-registrar'), 'test/lib/run.test.mjs': '// fixtures-run: test-support job-registrar\n' }));
  assert.deepEqual(all(ok.failures, 'test/harness/job-stub.mjs'), [], ok.failures.join('\n'));
  assert.deepEqual(all(ok.failures, 'test/user/imp5.test.mjs'), [], 'the import is covered');
  const imp = ok.items.find((c) => c.file === 'test/user/imp5.test.mjs' && c.cls === 'stub');
  assert.equal(imp.status, 'accepted');
  assert.equal(imp.contract, 'job-registrar');
  const bad = checkFixtures(product5({ ...users, 'test/harness/job-stub.mjs': stub('job-registrar') }));
  assert.ok(all(bad.failures, 'test/harness/job-stub.mjs').some((x) => /contract-no-run/.test(x)), bad.failures.join('\n'));
  assert.ok(all(bad.failures, 'test/user/imp5.test.mjs').length >= 1, 'not run: the import is found');
  const idle = checkFixtures(product5({ 'test/harness/idle.mjs': '// fixtures-contract: lib idle-id\nexport const X = 1;\n', 'test/lib/run.test.mjs': '// fixtures-run: test-support idle-id\n' }));
  assert.match(all(idle.failures, 'test/harness/idle.mjs').join('\n'), /\[idle\]/);
});
