// Tests of the architecture, coverage, ownership and format checks against small product repositories built in a temporary directory.
// Each test builds exactly the state it needs, and asserts the named failure appears or does not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkArchitecture, importsOf } from '../architecture.mjs';
import { checkCoverage } from '../coverage.mjs';
import { checkOwnership } from '../ownership.mjs';
import { checkFormat } from '../format.mjs';

const REQ = (ids) => `# m\n\n## Public\n\n### Purpose\n\nx\n\n### Provides\n\n${ids}\n\n## Private\n\n### Uses\n\nNone.\n\n### Invariants\n\n### Satisfies\n`;

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), 'product-'));
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', 't@example.com'); g('config', 'user.name', 't');
  const write = (fs) => { for (const [p, c] of Object.entries(fs)) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); } };
  write(files);
  g('add', '-A'); g('commit', '-q', '-m', 'base');
  return { root, g, write, commit: (fs) => { write(fs); g('add', '-A'); g('commit', '-q', '-m', 'next'); } };
}

const MODULES = (extra = {}) => JSON.stringify({
  not_product: ['docs/', 'build/'],
  modules: [
    { id: 'legacy', layer: 1, legacy: true, paths: ['src/legacy.mjs'], tests: [], uses: [] },
    { id: 'a', layer: 1, paths: ['src/a/'], tests: ['test/a/'], uses: [] },
    { id: 'b', layer: 2, from: 'legacy', paths: ['src/b/'], tests: ['test/b/'], uses: ['a'] },
    ...(extra.more || []),
  ],
});
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | legacy, a |\n| 2 | Two | b |\n';

const base = (over = {}) => ({
  'build/modules.json': MODULES(), 'build/layers.md': LAYERS,
  'src/legacy.mjs': 'export const old = 1;\nexport const moved = 2;\n',
  'src/a/index.mjs': 'export const a = 1;\n',
  'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = a;\n",
  'test/a/a.test.mjs': '// R1 R2\n', 'test/b/b.test.mjs': '// R1\n',
  'build/requirements/a.md': REQ('- **R1** one\n- **R2** two'),
  'build/requirements/b.md': REQ('- **R1** one'),
  ...over,
});

test('importsOf finds static, re-export, dynamic and require forms, and skips comments and packages', () => {
  const src = "import x from './x.mjs';\nexport { y } from \"../y.js\";\nconst z = await import('./z.mjs');\nconst w = require('./w');\nimport fs from 'node:fs';\n// import q from './q.mjs';\n/* import r from './r.mjs' */\nimport './side.mjs';\n";
  assert.deepEqual(importsOf(src), ['./x.mjs', '../y.js', './z.mjs', './w', './side.mjs']);
});

test('architecture: a clean repository passes', () => {
  const { root } = repo(base());
  assert.deepEqual(checkArchitecture(root).failures, []);
});

test('architecture: an unowned product file fails, a not_product file does not', () => {
  const { root } = repo(base({ 'stray.mjs': 'x', 'docs/note.md': 'x' }));
  assert.deepEqual(checkArchitecture(root).failures, ['stray.mjs: owned by no module']);
});

test('architecture: an import of a later module fails', () => {
  const { root } = repo(base({ 'src/a/index.mjs': "import { b } from '../b/index.mjs';\n" }));
  assert.match(checkArchitecture(root).failures.join('\n'), /src\/a\/index\.mjs \(a\): imports src\/b\/index\.mjs of b, which is not earlier/);
});

test('architecture: an import of an earlier module not declared in uses fails', () => {
  const { root } = repo(base({ 'src/b/index.mjs': "import { old } from '../legacy.mjs';\n" }));
  assert.match(checkArchitecture(root).failures.join('\n'), /which b does not declare in uses/);
});

test('architecture: an import naming no tracked file is counted, not judged', () => {
  const { root } = repo(base({ 'test/a/a.test.mjs': "const fixture = `import x from '../lib/w.mjs';`;\n// R1 R2\n" }));
  const r = checkArchitecture(root);
  assert.deepEqual(r.failures, []);
  assert.match(r.summary, /\(1 naming no tracked file, not judged\)/);
});

test('architecture: named modules limit the check to their own files', () => {
  const { root } = repo(base({ 'src/a/index.mjs': "import { b } from '../b/index.mjs';\n", 'stray.mjs': 'x' }));
  assert.deepEqual(checkArchitecture(root, ['b']).failures, []);
  assert.equal(checkArchitecture(root, ['a']).failures.length, 1);
});

test('architecture: the most specific path owns a nested file', () => {
  const m = JSON.parse(MODULES());
  m.modules[0].tests = ['test/'];
  const { root } = repo(base({ 'build/modules.json': JSON.stringify(m), 'test/legacy.test.mjs': "import '../src/legacy.mjs';\n", 'test/b/b.test.mjs': "import '../../src/b/index.mjs';\n// R1\n" }));
  assert.deepEqual(checkArchitecture(root).failures, []);
});

test('coverage: every live id named passes; a missing id is named; a retired id needs no test', () => {
  const { root } = repo(base({ 'build/requirements/a.md': REQ('- **R1** one\n- **R2** two\n- **R3** three\n- **R4** four *(retired 2026-09-26)*') }));
  const r = checkCoverage(root);
  assert.deepEqual(r.failures, ['a: 1 of 3 live ids named by no test: R3']);
  assert.match(r.summary, /3 of 4 live requirement ids/);
});

test('coverage: an id in bold after a signature is an id; a plain mention is not', () => {
  const { root } = repo(base({ 'build/requirements/a.md': REQ('- `f(x) → y` — **R1** one\n- **R2** two, unlike R7') }));
  assert.match(checkCoverage(root, ['a']).summary, /2 of 2 live requirement ids/);
});

test('coverage: an id named only by another module\'s test does not count', () => {
  const { root } = repo(base({ 'test/a/a.test.mjs': '// R1\n', 'test/b/b.test.mjs': '// R1 R2\n' }));
  assert.deepEqual(checkCoverage(root, ['a']).failures, ['a: 1 of 2 live ids named by no test: R2']);
});

test('ownership: own paths, own tests and own job record pass; another module\'s file fails', () => {
  const r = repo(base());
  r.commit({ 'src/b/more.mjs': 'x', 'test/b/more.test.mjs': 'x', 'build/jobs/T1/b.md': 'x', 'build/jobs/D1/b.md': 'x', 'build/jobs/T51b/b.md': 'x' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'HEAD~1').failures, []);
  r.commit({ 'src/a/index.mjs': 'changed', 'build/jobs/T1/a.md': 'x' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'HEAD~1').failures, ["build/jobs/T1/a.md: outside b's paths, tests and job record", "src/a/index.mjs: outside b's paths, tests and job record"]);
});

test('ownership: an extracting module may remove from its legacy module, never add', () => {
  const r = repo(base());
  r.commit({ 'src/legacy.mjs': 'export const old = 1;\n' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'HEAD~1').failures, []);
  r.commit({ 'src/legacy.mjs': 'export const old = 1;\nexport const added = 3;\n' });
  assert.match(checkOwnership(r.root, 'b', 'HEAD~1').failures.join('\n'), /src\/legacy\.mjs:2-2: added lines that neither import from nor use the module's own paths/);
  assert.match(checkOwnership(r.root, 'a', 'HEAD~1').failures.join('\n'), /outside a's paths/);
});

const BODY = 'export function moved(x) {\n  const y = x * 2;\n  const z = y + 1;\n  const w = z * 3;\n  const v = w - 2;\n  const u = v / 2;\n  return u + y;\n}\n';
const CALLER = BODY + '\nexport class Store {\n  run(x) {\n    return moved(x);\n  }\n}\n';

test('ownership: an extraction may rewire the legacy caller of the moved code to its own module (D4)', () => {
  const r = repo(base({ 'src/legacy.mjs': CALLER }));
  r.commit({
    'src/b/moved.mjs': BODY,
    'src/legacy.mjs': "import {\n  moved,\n} from './b/moved.mjs';\n\nexport { moved as movedAgain } from './b/moved.mjs';\nexport class Store {\n  run(x) {\n    return moved(x);\n  }\n  twice(x) {\n    return moved(moved(x));\n  }\n}\n",
  });
  const c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.ok(c.added.includes('src/legacy.mjs:1  import {'), c.added.join('\n'));
  assert.ok(c.added.some((a) => /return moved\(moved\(x\)\)/.test(a)));
  assert.match(c.summary, /legacy: \d+ line\(s\) added, \d+ removed/);
});

test('ownership: a legacy line that spreads an own import (...fooOps(x)) is a use; obj.fooOps is not (N175)', () => {
  const FOO = 'export function fooOps(x) {\n  const y = x * 2;\n  const z = y + 1;\n  const w = z * 3;\n  return { w };\n}\n';
  const r = repo(base({ 'src/legacy.mjs': FOO + 'export const api = {\n  keep: 1,\n};\n' }));
  r.commit({ 'src/b/foo.mjs': FOO, 'src/legacy.mjs': "import { fooOps } from './b/foo.mjs';\nexport const api = {\n  keep: 1,\n  ...fooOps(x),\n};\n" });
  const c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.ok(c.added.some((a) => /\.\.\.fooOps\(x\),/.test(a)), c.added.join('\n'));
  const pad = 'export const p1 = 1;\nexport const p2 = 2;\nexport const p3 = 3;\nexport const p4 = 4;\nexport const p5 = 5;\nexport const p6 = 6;\nexport const p7 = 7;\n';
  const r2 = repo(base({ 'src/legacy.mjs': "import { fooOps } from './b/foo.mjs';\nexport const api = {\n  keep: 1,\n};\n" + pad + FOO }));
  r2.commit({ 'src/b/foo.mjs': FOO, 'src/legacy.mjs': "import { fooOps } from './b/foo.mjs';\nexport const api = {\n  keep: 1,\n  ...obj.fooOps(x),\n};\n" + pad });
  assert.match(checkOwnership(r2.root, 'b', 'HEAD~1').failures.join('\n'), /src\/legacy\.mjs:4-4: added lines that neither import from nor use the module's own paths/);
});

test('ownership: an extraction fails on an added import of another module, an unrelated addition, or a net addition', () => {
  const r = repo(base({ 'src/legacy.mjs': CALLER }));
  r.commit({
    'src/b/moved.mjs': 'export function moved(x) { return x * 2 + 1; }\n',
    'src/legacy.mjs': "import { moved } from './b/moved.mjs';\nimport { a } from './a/index.mjs';\n\nexport class Store {\n  run(x) {\n    return moved(x);\n  }\n}\n\nexport const unrelated = 3;\n",
  });
  const f = checkOwnership(r.root, 'b', 'HEAD~1').failures.join('\n');
  assert.match(f, /src\/legacy\.mjs:2: adds to an import or re-export of \.\/a\/index\.mjs, which is not the module's own/);
  assert.match(f, /src\/legacy\.mjs:10-10: added lines that neither import from nor use the module's own paths/);
  const r2 = repo(base({ 'src/legacy.mjs': 'export function moved() { return 1; }\n' }));
  r2.commit({ 'src/b/moved.mjs': 'export function moved() { return 1; }\n', 'src/legacy.mjs': "import { moved } from './b/moved.mjs';\nexport function one() {\n  return moved();\n}\nexport const two = () => moved();\n" });
  assert.match(checkOwnership(r2.root, 'b', 'HEAD~1').failures.join('\n'), /legacy: b adds 5 line\(s\) and removes 1; an extraction's net change to its legacy modules is a removal/);
});

test('ownership: a base that exists only as origin/<base> is found there', () => {
  const r = repo(base());
  r.g('update-ref', 'refs/remotes/origin/tranche/X1', 'HEAD');
  r.commit({ 'src/b/more.mjs': 'x' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'tranche/X1').failures, []);
});

test('ownership: a product in a subdirectory of its repository is checked on its own paths', () => {
  const r = repo({ 'README.md': 'outer\n', ...Object.fromEntries(Object.entries(base()).map(([k, v]) => [`toy/${k}`, v])) });
  r.commit({ 'toy/src/b/more.mjs': 'x', 'README.md': 'changed outside the product\n' });
  assert.deepEqual(checkOwnership(join(r.root, 'toy'), 'b', 'HEAD~1').failures, []);
});

test('format: a clean build state passes', () => {
  const { root } = repo(base());
  assert.deepEqual(checkFormat(root).failures, []);
});

test('format: a use of a later module, a doubly claimed path, a stale layer row and a bad requirements file all fail', () => {
  const m = JSON.parse(MODULES());
  m.modules[1].uses = ['b'];
  m.modules[2].paths.push('src/a/');
  const { root } = repo(base({
    'build/modules.json': JSON.stringify(m),
    'build/layers.md': LAYERS.replace('| 2 | Two | b |', '| 2 | Two | b, c |'),
    'build/requirements/zz.md': '# zz\n\n- **R1** x\n- **R1** y\n',
  }));
  const f = checkFormat(root).failures.join('\n');
  assert.match(f, /a: uses b, which is not earlier in the order/);
  assert.match(f, /b: path src\/a\/ is also claimed by a/);
  assert.match(f, /layer 2 lists b, c, but modules.json has b/);
  assert.match(f, /zz\.md: names no module/);
  assert.match(f, /zz\.md: section "## Public" missing/);
  assert.match(f, /zz\.md: ids given twice: R1/);
});

test('format: an entry may be listed under two modules, never twice under one', () => {
  const plan = '# Plan\n\n**a**\n- N1 · x\n- D-5 · y\n\n**b** (3 ids)\n- N1 · x\n';
  let { root } = repo(base({ 'build/plan/current.md': plan }));
  assert.deepEqual(checkFormat(root).failures, []);
  ({ root } = repo(base({ 'build/plan/current.md': plan + '- D-5 · again\n- D-5 · twice\n' })));
  assert.deepEqual(checkFormat(root).failures, ['build/plan/current.md: entry ids given twice under one module: D-5']);
});

test('format: merge-conflict markers in the build state fail, naming file and line (N440)', () => {
  const marked = '<<<<<<< HEAD\n' + LAYERS + '=======\n' + LAYERS + '>>>>>>> other\n';
  const f = checkFormat(repo(base({ 'build/layers.md': marked })).root).failures;
  assert.ok(f.includes('build/layers.md:1: merge-conflict marker'), f.join('\n'));
  assert.ok(f.includes('build/layers.md:6: merge-conflict marker'), f.join('\n'));
  assert.ok(f.includes('build/layers.md:11: merge-conflict marker'), f.join('\n'));
  assert.deepEqual(checkFormat(repo(base()).root).failures, []);
});

test('format: every paths and tests entry names an existing file or directory (K1007)', () => {
  const m = JSON.parse(MODULES());
  m.modules[1].tests.push('test/a-extra/');
  const pass = repo(base({ 'build/modules.json': JSON.stringify(m) }));
  mkdirSync(join(pass.root, 'test/a-extra'));
  assert.deepEqual(checkFormat(pass.root).failures, [], 'an existing, still empty tests directory counts');
  const r = repo(base({ 'src/gone.mjs': 'x\n', 'build/modules.json': JSON.stringify({ ...JSON.parse(MODULES()), modules: JSON.parse(MODULES()).modules.map((x) => x.id === 'legacy' ? { ...x, paths: ['src/legacy.mjs', 'src/gone.mjs'] } : x) }) }));
  assert.deepEqual(checkFormat(r.root).failures, []);
  r.g('rm', '-q', 'src/gone.mjs'); r.g('commit', '-q', '-m', 'delete');
  assert.deepEqual(checkFormat(r.root).failures, ['build/modules.json: legacy: paths entry src/gone.mjs names no file or directory in the product']);
  r.g('rm', '-rq', 'test/b/'); r.g('commit', '-q', '-m', 'delete tests');
  assert.match(checkFormat(r.root).failures.join('\n'), /b: tests entry test\/b\/ names no file or directory/);
});

test('format: modules out of layer order fail', () => {
  const m = JSON.parse(MODULES());
  m.modules.push({ id: 'c', layer: 1, paths: ['src/c/'], tests: [], uses: [] });
  const { root } = repo(base({ 'build/modules.json': JSON.stringify(m) }));
  assert.match(checkFormat(root).failures.join('\n'), /c: layer 1 after layer 2/);
});

test('format: an approval ruling after the cut-over states its standing-list decision (§16, bio K1177)', () => {
  const head = '# Rulings\n\n';
  const line = (n, text) => `- K${n} · 2026-10-02 · process · ${text} · §16, P17\n`;
  const bare = 'Bob approved, in BOB #9\'s session, archiving BOB #8 (refused by the permission check)';
  // At or before the cut-over (K1181) the history is exempt; after it, the bare approval fails.
  assert.deepEqual(checkFormat(repo(base({ 'build/rulings.md': head + line(1181, bare) })).root).failures, []);
  const f = checkFormat(repo(base({ 'build/rulings.md': head + line(1181, bare) + line(1182, bare) })).root).failures;
  assert.deepEqual(f, [`build/rulings.md:4: K1182 records Bob's approval of a refused act but states no standing-list decision ("standing list: added \`<rule>\`" or "standing list: not added (<why>)", §16)`]);
  // Either decision, stated, passes.
  for (const d of ['standing list: added `mcp__claude-code-remote__archive_session`', 'standing list: not added (a one-off act at a boundary)']) {
    assert.deepEqual(checkFormat(repo(base({ 'build/rulings.md': head + line(1182, `${bare}; ${d}`) })).root).failures, [], d);
  }
  // A decision with no rule or no reason is no decision.
  for (const d of ['standing list: added', 'standing list: added archive_session', 'standing list: not added', 'standing list: not added ()']) {
    assert.equal(checkFormat(repo(base({ 'build/rulings.md': head + line(1182, `${bare}; ${d}`) })).root).failures.length, 1, d);
  }
  // Recognised by naming the permission check without citing §16; not recognised when nothing was approved (a refusal
  // still waiting on Bob) or when no refusal is cited (Bob approving a requirement).
  const noCite = '- K1183 · 2026-10-02 · UX stream · PR #8 merged; the auto-mode check flagged it and Bob approved · P17\n';
  assert.equal(checkFormat(repo(base({ 'build/rulings.md': head + noCite })).root).failures.length, 1);
  const waiting = line(1184, 'Archiving BOB #8 was refused by the permission check; NEEDS BOB, the approval to type named');
  const req = '- K1185 · 2026-10-02 · capture · Bob approved R31 as drafted · P5\n';
  assert.deepEqual(checkFormat(repo(base({ 'build/rulings.md': head + waiting + req })).root).failures, []);
  // The cut-over is configurable.
  assert.deepEqual(checkFormat(repo(base({ 'build/rulings.md': head + line(1182, bare) })).root, { approvalsLastExempt: 1182 }).failures, []);
});

test('ownership: a module extracted from two legacy modules removes from each and is judged per module (D5)', () => {
  const mods = JSON.stringify({ not_product: ['build/'], modules: [
    { id: 'cat', layer: 1, legacy: true, paths: ['src/cat.mjs'], tests: [], uses: [] },
    { id: 'b', layer: 2, from: ['cat', 'legacy'], paths: ['src/b/'], tests: ['test/b/'], uses: [] },
    { id: 'legacy', layer: 2, legacy: true, paths: ['src/legacy.mjs'], tests: [], uses: ['*earlier'] },
  ] });
  const r = repo(base({ 'build/modules.json': mods, 'src/cat.mjs': 'export const keep = 1;\nexport function gone() {\n  return 2;\n}\n', 'src/legacy.mjs': CALLER }));
  r.commit({ 'src/b/moved.mjs': BODY, 'src/cat.mjs': 'export const keep = 1;\n', 'src/legacy.mjs': "import { moved } from './b/moved.mjs';\n\nexport class Store {\n  run(x) {\n    return moved(x);\n  }\n}\n" });
  const c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.match(c.summary, /cat: 0 line\(s\) added, 3 removed; legacy: 1 line\(s\) added, \d+ removed/);
  r.commit({ 'src/cat.mjs': 'export const keep = 1;\nexport const more = 3;\n' });
  assert.match(checkOwnership(r.root, 'b', 'HEAD~1').failures.join('\n'), /src\/cat\.mjs:2-2: added lines that neither import from nor use/);
  const bad = JSON.parse(mods); bad.modules[1].from = ['cat', 'b'];
  const r2 = repo(base({ 'build/modules.json': JSON.stringify(bad), 'src/cat.mjs': 'x\n' }));
  assert.match(checkFormat(r2.root).failures.join('\n'), /from b, which is no legacy module/);
});

test('ownership: the net removal is judged over all the legacy modules together (D5 finding)', () => {
  const mods = JSON.stringify({ not_product: ['build/'], modules: [
    { id: 'cat', layer: 1, legacy: true, paths: ['src/cat.mjs'], tests: [], uses: [] },
    { id: 'b', layer: 2, from: ['cat', 'legacy'], paths: ['src/b/'], tests: ['test/b/'], uses: [] },
    { id: 'legacy', layer: 2, legacy: true, paths: ['src/legacy.mjs'], tests: [], uses: ['*earlier'] },
  ] });
  const r = repo(base({ 'build/modules.json': mods, 'src/cat.mjs': 'export const keep = 1;\nexport function gone(x) {\n  const a = x;\n  const b = a;\n  return b;\n}\n', 'src/legacy.mjs': 'export function v(x) {\n  return x;\n}\n' }));
  r.commit({ 'src/b/gone.mjs': 'export function gone(x) { return x; }\n', 'src/cat.mjs': 'export const keep = 1;\n', 'src/legacy.mjs': "import { gone } from './b/gone.mjs';\nexport function v(x) {\n  const y = gone(x);\n  return y;\n}\n" });
  const c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.match(c.summary, /cat: 0 line\(s\) added, 5 removed; legacy: 3 line\(s\) added, 1 removed/);
});

// K140 (SUITE G5, gap X8): a changed line that only removes is a removal, not an addition.
const K140 = (f) => readFileSync(new URL(`./fixtures/cert/k140/${f}`, import.meta.url), 'utf8');
const B_CONTENT = 'export function contentOf(ctx, deps) {\n  return { extraction: deps.extraction };\n}\n';

test('ownership: a legacy line that only loses a key is a removal, not an addition (K140, the T5 content case)', () => {
  const r = repo(base({ 'src/legacy.mjs': K140('legacy-before.mjs') }));
  r.commit({ 'src/b/index.mjs': B_CONTENT, 'src/legacy.mjs': K140('legacy-after.mjs') });
  const c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.ok(!c.added.some((a) => /return \{ observed/.test(a)), c.added.join('\n'));
  assert.deepEqual(c.edited, ['src/legacy.mjs:7  return { observed: { written: ex.written ?? 0, states: ex.states || [], reextraction: !!ex.reextraction } };']);
  assert.deepEqual(c.added, ["src/legacy.mjs:2  import { contentOf } from './b/index.mjs';", 'src/legacy.mjs:5  contentOf(ctx, { extraction: extractionOf(ctx) }).extraction.onReading("legacy-store", (e) => {']);
  assert.match(c.summary, /legacy: 2 line\(s\) added, 8 removed/);
});

test('ownership: a legacy import that only loses a name is a removal, even from another module (K140)', () => {
  const r = repo(base({ 'src/legacy.mjs': "import { a, other } from './a/index.mjs';\nexport const old = a + other;\nexport const moved = 2;\n" }));
  r.commit({ 'src/b/index.mjs': 'export const moved = 2;\n', 'src/legacy.mjs': "import { a } from './a/index.mjs';\nexport const old = a;\n" });
  const c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.deepEqual(c.added, []);
  assert.equal(c.edited.length, 2);
});

test('ownership: a changed legacy line that adds or replaces anything is still listed and judged (K140)', () => {
  const r = repo(base({ 'src/legacy.mjs': K140('legacy-before.mjs') }));
  r.commit({ 'src/b/index.mjs': B_CONTENT, 'src/legacy.mjs': K140('legacy-after.mjs').replace('return { observed:', 'return { extra: 1, observed:') });
  let c = checkOwnership(r.root, 'b', 'HEAD~1');
  assert.match(c.failures.join('\n'), /src\/legacy\.mjs:7-7: added lines that neither import from nor use the module's own paths/);
  assert.ok(c.added.some((a) => /^src\/legacy\.mjs:7 {2}return \{ extra: 1/.test(a)), c.added.join('\n'));
  assert.deepEqual(c.edited, []);
  const r2 = repo(base({ 'src/legacy.mjs': "import { a } from './a/index.mjs';\nexport const old = a;\nexport function moved() {\n  return 1;\n}\n" }));
  r2.commit({ 'src/b/index.mjs': 'export const moved = 2;\n', 'src/legacy.mjs': "import { a, b } from './a/index.mjs';\nexport const old = 'a';\n" });
  c = checkOwnership(r2.root, 'b', 'HEAD~1');
  const f = c.failures.join('\n');
  assert.match(f, /src\/legacy\.mjs:1: adds to an import or re-export of \.\/a\/index\.mjs/);
  assert.match(f, /src\/legacy\.mjs:2-2: added lines that neither import from nor use/);
  assert.equal(c.added.length, 2);
  // Only removing `this.` so that the line now calls the module's own import is a rewire: listed, judged, passing.
  const r3 = repo(base({ 'src/legacy.mjs': 'export class Store {\n  run(x) {\n    return this.moved(x);\n  }\n  moved(x) {\n    return x;\n  }\n}\n' }));
  r3.commit({ 'src/b/index.mjs': 'export const moved = (x) => x;\n', 'src/legacy.mjs': "import { moved } from './b/index.mjs';\nexport class Store {\n  run(x) {\n    return moved(x);\n  }\n}\n" });
  c = checkOwnership(r3.root, 'b', 'HEAD~1');
  assert.deepEqual(c.failures, []);
  assert.deepEqual(c.edited, []);
  assert.ok(c.added.includes('src/legacy.mjs:4  return moved(x);'), c.added.join('\n'));
});

test('ownership: onlyRemoves reads tokens, and a string literal is one token (K140)', async () => {
  const { onlyRemoves, removalEdits } = await import('../ownership.mjs');
  assert.equal(onlyRemoves('return { staled, observed };', 'return { observed };'), true);
  assert.equal(onlyRemoves('f(a,  b)', 'f(a,b)'), true);
  assert.equal(onlyRemoves('x = foo;', 'x = bar;'), false);
  assert.equal(onlyRemoves("say('abc def')", "say('abc')"), false);
  const hunk = { gone: ['const x = f(a, b);'], lines: [{ n: 1, text: 'const x = f(a);' }, { n: 2, text: 'const y = 2;' }] };
  assert.deepEqual([...removalEdits(hunk)].map((l) => l.n), [1]);
});

// N656 (bio K1763; P15, P17): a statement of a limit on Anthropic's accounts, plans or terms cites the register or Bob.
const TERMS = (f) => readFileSync(new URL(`./fixtures/terms/${f}`, import.meta.url), 'utf8');
const withRegister = (over = {}) => base({ 'build/terms/anthropic.md': TERMS('register.md'), ...over });

process.env.CIVICOS_TERMS_CHECK = '1'; // N656 is opt-in until certified (P3)
test('format: a limit on Anthropic\'s terms citing a register id passes; an uncited one fails, naming file and line (N656, K1763)', () => {
  assert.deepEqual(checkFormat(repo(withRegister({ 'docs/architecture/cited.md': TERMS('cited.md') })).root).failures, []);
  assert.deepEqual(checkFormat(repo(withRegister({ 'docs/architecture/uncited.md': TERMS('uncited.md') })).root).failures,
    ['docs/architecture/uncited.md:4: uncited limit on Anthropic\'s terms ("A Team plan seat may not serve the other members of the group.")']);
});

test('format: an AT or U id the register does not define fails (N656, K1763)', () => {
  const f = checkFormat(repo(withRegister({ 'docs/architecture/missing.md': TERMS('missing-id.md') })).root).failures;
  assert.equal(f.length, 1, f.join('\n'));
  assert.match(f[0], /^docs\/architecture\/missing\.md:3: uncited limit on Anthropic's terms \("Anthropic's terms forbid sharing a Pro subscription \(AT-99\)\."\): AT-99 not in build\/terms\/anthropic\.md$/);
});

test('format: a limit labelled Bob\'s choice with his ruling passes; the ruling alone does not (N656, K1763 (2))', () => {
  const f = checkFormat(repo(withRegister({ 'build/plan/next.md': TERMS('bobs-choice.md') })).root).failures;
  assert.deepEqual(f, ['build/plan/next.md:4: uncited limit on Anthropic\'s terms ("The subscription token serves only its own member (K1755).")']);
});

test('format: code spans, fenced blocks and ordinary product text are not claims about the terms (N656)', () => {
  assert.deepEqual(checkFormat(repo(withRegister({ 'docs/architecture/product.md': TERMS('product-text.md') })).root).failures, []);
});

test('format: rulings are read from K1764 on; the register itself and files out of scope are not read (N656)', () => {
  const claim = 'A Team plan seat may not serve the other members of the group.';
  const rulings = `# Rulings\n\n- K1763 · 2026-10-06 · process · ${claim} · P15\n- K1764 · 2026-10-06 · process · ${claim} · P15\n`;
  const f = checkFormat(repo(withRegister({ 'build/rulings.md': rulings, 'build/jobs/T1/a.md': claim, 'docs/development/x.md': claim })).root).failures;
  assert.deepEqual(f, [`build/rulings.md:4: uncited limit on Anthropic's terms ("${claim}")`]);
});

test('format: the register named in the manifest is used; a product with no register skips the arm (N656)', () => {
  const uncited = { 'docs/architecture/uncited.md': TERMS('uncited.md') };
  assert.deepEqual(checkFormat(repo(base(uncited)).root).failures, [], 'no register: skipped');
  assert.doesNotMatch(checkFormat(repo(base(uncited)).root).summary, /terms register/);
  const manifest = '# Build manifest\n\n| what | where |\n| --- | --- |\n| what Anthropic\'s plans and terms permit or forbid | `build/legal/terms.md` |\n';
  const moved = repo(base({ ...uncited, 'build/manifest.md': manifest, 'build/legal/terms.md': TERMS('register.md') })).root;
  assert.equal(checkFormat(moved).failures.length, 1);
  assert.match(checkFormat(moved).summary, /terms register build\/legal\/terms\.md/);
  const named = repo(base({ ...uncited, 'build/manifest.md': manifest, 'build/terms/anthropic.md': TERMS('register.md') })).root;
  assert.deepEqual(checkFormat(named).failures, [], 'the manifest names a register that does not exist: skipped');
});

// P19, mechanics §8.4 (bio K3923): an entry of next.md names one of P19's hard reasons; current.md is not judged.
const NEXT = (...lines) => `# Next\n\n**a**\n\n${lines.join('\n')}\n`;
test('format: a next.md entry names a P19 hard reason; any other reason or none fails, naming line and id (§8.4, P19, K3923)', () => {
  const ok = NEXT(
    "- N1 · wait · hard reason: Bob's pending decision on the name",
    '- N2 · ship · hard reason: a deployment outside the tranche',
    '- N3 · size · hard reason: A measurement outside the tranche',
    '- N4 · dns · hard reason: outside the product, the domain does not exist yet');
  assert.deepEqual(checkFormat(repo(base({ 'build/plan/next.md': ok })).root).failures, []);
  const bad = NEXT("- N1 · fine · hard reason: Bob's call", '- N2 · order · hard reason: P10 (the order)', '- N3 · nothing said');
  assert.deepEqual(checkFormat(repo(base({ 'build/plan/next.md': bad })).root).failures, [
    'build/plan/next.md:6: N2 names no P19 hard reason (Bob\'s, a deployment, a measurement, outside the product) : "P10 (the order)"',
    'build/plan/next.md:7: N3 names no P19 hard reason (Bob\'s, a deployment, a measurement, outside the product)',
  ]);
  const cur = '# Current\n\n**a**\n\n- N9 · no reason here at all\n';
  assert.deepEqual(checkFormat(repo(base({ 'build/plan/current.md': cur })).root).failures, [], 'current.md is not judged');
});

// P19, mechanics §8.4 (bio K5015): a line of current.md, of the running fix round's plan file it names, or of the
// handoff that defers work fails, naming file and line, unless it cites next.md.
test('format: a deferring line in current.md, the named fix-round plan or the handoff fails unless it cites next.md (§8.4, P19, K5015)', () => {
  const failures = (files) => checkFormat(repo(base(files)).root).failures;
  const cur = (...lines) => `# Current\n\n**a**\n\nSee build/plan/fix-round-9-T51.md and build/plan/archive/fix-round-1-T51.md.\n${lines.join('\n')}\n`;
  assert.deepEqual(failures({ 'build/plan/current.md': cur('Clean line.', 'Waits as an entry of next.md (N5), "next fix round" in words.') }), [], 'a line citing next.md passes');
  // each phrase, in current.md
  for (const [i, phrase] of ['next fix round', 'next round', 'a later round', 'later tranche', 'deferred to'].entries()) {
    assert.deepEqual(failures({ 'build/plan/current.md': cur(`- the sheet work is ${phrase} (X)`) }),
      [`build/plan/current.md:6: defers work ("${phrase}") without citing next.md; work that waits is an entry of next.md only, with its P19 reason (P19)`], `phrase ${i}`);
  }
  assert.deepEqual(failures({ 'build/plan/current.md': cur('The Next Fix Round takes it.') }).length, 1, 'case-insensitive');
  // the fix round's plan file, only when current.md names it and it exists outside the archive
  const fr = '# Fix round 9\n\nok\nThe rest goes in the next fix round.\nThis waits (next.md N7), a later tranche.\n';
  assert.deepEqual(failures({ 'build/plan/current.md': cur(), 'build/plan/fix-round-9-T51.md': fr }),
    ['build/plan/fix-round-9-T51.md:4: defers work ("next fix round") without citing next.md; work that waits is an entry of next.md only, with its P19 reason (P19)']);
  assert.deepEqual(failures({ 'build/plan/current.md': cur(), 'build/plan/archive/fix-round-1-T51.md': fr }), [], 'an archived plan is not judged');
  assert.deepEqual(failures({ 'build/plan/current.md': '# Current\n\n**a**\n', 'build/plan/fix-round-9-T51.md': fr }), [], 'a fix-round file current.md does not name is not judged');
  assert.deepEqual(failures({ 'build/plan/current.md': cur(), 'build/plan/other-plan.md': fr, 'build/plan/next.md': NEXT(fr) }), [], 'no other plan file, and not next.md, is judged');
  // the handoff
  assert.deepEqual(failures({ 'build/handoff.md': '# Handoff\n\nFine.\nDeferred to the sheets job.\n' }),
    ['build/handoff.md:4: defers work ("Deferred to") without citing next.md; work that waits is an entry of next.md only, with its P19 reason (P19)']);
  assert.deepEqual(failures({ 'build/handoff.md': '# Handoff\n\nDeferred to next.md N3.\n' }), []);
});

// §8.6 (bio K3923): run.mjs runs the words check where the product has a word table.
test('run.mjs: the words check runs where the product has words.json; a planted inline sentence fails it, exit 1', () => {
  const words = { 'docs/development/ux-substrate/screens/words.json': JSON.stringify({ words: [{ key: 'screen.home.title', en: 'Home' }] }) };
  const run = (files) => {
    const { root } = repo(base({ ...words, ...files }));
    const r = spawnSync('node', [fileURLToPath(new URL('../run.mjs', import.meta.url)), root], { encoding: 'utf8' });
    return { out: r.stdout, code: r.status };
  };
  const bad = run({ 'src/a/index.mjs': 'export const a = "Your project could not be found here.";\n' });
  assert.match(bad.out, /^words: .*; [1-9]\d* failures?$/m, bad.out);
  assert.equal(bad.code, 1);
  const good = run({});
  assert.match(good.out, /^words: .*; 0 failures$/m, good.out);
  assert.equal(good.code, 0, good.out);
  const none = spawnSync('node', [fileURLToPath(new URL('../run.mjs', import.meta.url)), repo(base()).root], { encoding: 'utf8' });
  assert.doesNotMatch(none.stdout, /^words:/m, 'no word table: the check is skipped');
});
