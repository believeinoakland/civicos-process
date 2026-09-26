// Tests of the four checks against small product repositories built in a temporary directory.
// Each test builds exactly the state it needs, and asserts the named failure appears or does not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
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
  r.commit({ 'src/b/more.mjs': 'x', 'test/b/more.test.mjs': 'x', 'build/jobs/T1/b.md': 'x', 'build/jobs/D1/b.md': 'x' });
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

test('format: modules out of layer order fail', () => {
  const m = JSON.parse(MODULES());
  m.modules.push({ id: 'c', layer: 1, paths: ['src/c/'], tests: [], uses: [] });
  const { root } = repo(base({ 'build/modules.json': JSON.stringify(m) }));
  assert.match(checkFormat(root).failures.join('\n'), /c: layer 1 after layer 2/);
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
