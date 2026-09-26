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
  r.commit({ 'src/b/more.mjs': 'x', 'test/b/more.test.mjs': 'x', 'build/jobs/T1/b.md': 'x' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'HEAD~1').failures, []);
  r.commit({ 'src/a/index.mjs': 'changed', 'build/jobs/T1/a.md': 'x' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'HEAD~1').failures, ["build/jobs/T1/a.md: outside b's paths, tests and job record", "src/a/index.mjs: outside b's paths, tests and job record"]);
});

test('ownership: an extracting module may remove from its legacy module, never add', () => {
  const r = repo(base());
  r.commit({ 'src/legacy.mjs': 'export const old = 1;\n' });
  assert.deepEqual(checkOwnership(r.root, 'b', 'HEAD~1').failures, []);
  r.commit({ 'src/legacy.mjs': 'export const old = 1;\nexport const added = 3;\n' });
  assert.match(checkOwnership(r.root, 'b', 'HEAD~1').failures.join('\n'), /may only remove code from legacy/);
  assert.match(checkOwnership(r.root, 'a', 'HEAD~1').failures.join('\n'), /outside a's paths/);
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

test('format: modules out of layer order fail', () => {
  const m = JSON.parse(MODULES());
  m.modules.push({ id: 'c', layer: 1, paths: ['src/c/'], tests: [], uses: [] });
  const { root } = repo(base({ 'build/modules.json': JSON.stringify(m) }));
  assert.match(checkFormat(root).failures.join('\n'), /c: layer 1 after layer 2/);
});
