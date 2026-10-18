// Tests of the words check (checks/words.mjs) against a fake product built in a temporary directory: one module with
// each kind of violation and a clean control for each arm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkWords, isSentence, isPlainSentence, scan } from '../words.mjs';

const WORDS = {
  words: [
    { key: 'refusal.NO_ACCESS', en: 'You cannot see that project here.' },
    { key: 'screen.home.greeting', en: 'Welcome back, {name}. Your team has {count} open items.' },
    { key: 'screen.home.title', en: 'Home' },
    { key: 'refusal.NOT_FOUND', en: 'Nothing by that name is held here.' },
    { key: 'refusal.TOO_LONG', en: 'That is longer than the limit.' },
    { key: 'refusal.TOO_SHORT', en: 'That is shorter than the limit.' },
    { key: 'refusal.BAD_DATE', en: 'That date is not one we can read.' },
    { key: 'refusal.NO_REASON', en: 'A reason is needed for this act.' },
  ],
};

function product(files) {
  const root = mkdtempSync(join(tmpdir(), 'words-'));
  const all = {
    'build/modules.json': JSON.stringify({
      not_product: ['docs/', 'build/'],
      modules: [
        { id: 'setup-words', layer: 1, paths: ['src/setup-words/'], tests: ['test/setup-words/'], uses: [] },
        { id: 'op-declarations', layer: 1, paths: ['src/op-declarations/'], tests: ['test/op-declarations/'], uses: [] },
        { id: 'viol', layer: 2, paths: ['src/viol/'], tests: ['test/viol/'], uses: ['setup-words'] },
        { id: 'clean', layer: 2, paths: ['src/clean/'], tests: ['test/clean/'], uses: ['setup-words'] },
        { id: 'owner', layer: 2, paths: ['src/owner/'], tests: ['test/owner/'], uses: [] },
      ],
    }),
    'build/ops.json': JSON.stringify({ alpha: 'owner', beta: 'owner', gamma: 'owner', delta: 'owner', epsilon: 'owner', zeta: 'owner' }),
    'docs/development/ux-substrate/screens/words.json': JSON.stringify(WORDS),
    'src/setup-words/index.mjs': 'export const x = "This module holds all the English there is.";\n',
    'src/viol/index.mjs': [
      'import { word } from "../setup-words/index.mjs";',
      '// This comment is a sentence in a comment.',
      'export const a = "Your project could not be found here.";',            // line 3: inline sentence
      'export const b = `Hello ${name}, we could not save this.`;',            // line 4: template sentence
      'export const c = "You cannot see that project here.";',                  // line 5: copy
      'export function f() { throw new Error("The store is not open yet."); }', // line 6: a built-in Error: developer text, counted as dev
      'export const ok1 = word("screen.home.title");',
      'export const ok2 = "SELECT id FROM things WHERE name = ? AND kind = ?";',
      'export const ok3 = "a.b.c.d";',
      'console.log("This is only a log line for people.");',
      'export const ok4 = "./some/path/to/a/module.mjs";',
      'export const ok5 = "https://example.org/a/long/page/here";',
      'export const ok6 = /Your project could not be found/;',
      'export const ok7 = "not a sentence";',
      'export const bad = word("screen.gone.away");',                     // line 15: missingkey
    ].join('\n') + '\n',
    'src/clean/index.mjs': [
      'import { word } from "../setup-words/index.mjs";',
      'export const t = word("screen.home.greeting", { name: "A", count: 3 });',
      '// a comment saying Your project could not be found here.',
      'export const css = "color: red; margin: 0 auto; padding: 4px 8px;";',
      'export const ok = "ok";',
    ].join('\n') + '\n',
    'src/owner/index.mjs': 'export const ops = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];\n',
    'test/viol/a.test.mjs': [
      'import { test } from "node:test";',
      'import assert from "node:assert/strict";',
      'import { hasWord } from "../../src/setup-words/index.mjs";',
      'test("You cannot see that project here.", () => {',                      // a title: not a copy
      '  assert.equal(out.says, "You cannot see that project here.");',        // line 5: testcopy exact
      '  assert.ok(out.says.includes("Nothing by that"));',        // short substring: fine
      '  assert.match(out.text, "Welcome back, {name}. Your team has");',       // line 7: 25+ substring
      '  assert.equal(hasWord("screen.home.title"), true);',
      '  assert.equal(hasWord("screen.no.such.key"), false);',                  // negative test: fine
      '  assert.equal(out.code, "NOT_FOUND");',
      '  assert.equal(hasWord("screen.home.missing"), true);',                  // line 11: missingkey
      '});',
      'const ALL = ["alpha", "beta", "gamma", "delta", "epsilon"];',            // line 13: handlist ops
      'const CODES = ["NO_ACCESS", "NOT_FOUND", "TOO_LONG", "TOO_SHORT", "BAD_DATE"];', // line 14: handlist codes
      'const KEYS = ["refusal.NO_ACCESS", "refusal.NOT_FOUND", "refusal.TOO_LONG", "refusal.TOO_SHORT", "refusal.BAD_DATE"];', // line 15
      'const small = ["alpha", "beta", "gamma"];',
      'const mixed = ["alpha", "x1", "x2", "x3", "x4", "x5"];',
    ].join('\n') + '\n',
    'test/clean/a.test.mjs': [
      'import { test } from "node:test";',
      'import assert from "node:assert/strict";',
      'import { word, hasWord } from "../../src/setup-words/index.mjs";',
      'test("shows the greeting", () => {',
      '  assert.equal(out.says, word("screen.home.greeting", { name: "A", count: 3 }));',
      '  assert.equal(hasWord("screen.home.title"), true);',
      '  assert.equal(out.code, "NOT_FOUND");',
      '});',
    ].join('\n') + '\n',
    'test/owner/a.test.mjs': 'const OWN = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];\n', // its own ops: not a hand-list
    'src/viol/words.generated.mjs': '/* GENERATED: do not edit by hand. */\nexport const g = "Your project could not be found here.";\n',
    'src/viol/fixtures/data.mjs': 'export const d = "Your project could not be found here.";\n',
  };
  Object.assign(all, files);
  for (const [p, c] of Object.entries(all)) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); }
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 't@example.com'); g('config', 'user.name', 't');
  g('add', '-A'); g('commit', '-q', '-m', 'base');
  return root;
}

const has = (failures, arm, mod, file, line, tag) =>
  failures.some((f) => f.startsWith(`${arm} ${mod} ${file}:${line} `) && (tag === undefined || (tag === '' ? !/^\S+ \S+ \S+ \[/.test(f) : f.includes(`[${tag}] `))));

test('inline: sentences, templates, copies and error messages are found; code-like strings, comments and logs are not', async () => {
  const { failures } = await checkWords(product({}));
  const F = 'src/viol/index.mjs';
  assert.ok(has(failures, 'inline', 'viol', F, 3, ''), failures.join('\n'));
  assert.ok(has(failures, 'inline', 'viol', F, 4, ''));
  assert.ok(has(failures, 'inline', 'viol', F, 5, 'copy'));
  for (const line of [2, 6, 7, 8, 9, 10, 11, 12, 13, 14]) assert.ok(!failures.some((f) => f.startsWith(`inline viol ${F}:${line} `)), `line ${line}: ${failures.join('\n')}`);
});

test('inline: the clean module, setup-words, generated files and fixtures are never reported', async () => {
  const { failures } = await checkWords(product({}));
  assert.ok(!failures.some((f) => / clean src\/clean/.test(f) || /^inline clean /.test(f)));
  assert.ok(!failures.some((f) => /^inline setup-words /.test(f)));
  assert.ok(!failures.some((f) => f.includes('words.generated.mjs') || f.includes('fixtures/')));
  assert.ok(!failures.some((f) => /^(testcopy|missingkey|handlist) clean /.test(f)));
});

test('inline: a literal in a hand-written word table is tagged table', async () => {
  const root = product({ 'src/clean/words.mjs': 'export const W = { a: "Everyone who looks gets the same answer." };\n' });
  const { failures } = await checkWords(root);
  assert.ok(has(failures, 'inline', 'clean', 'src/clean/words.mjs', 1, 'table'), failures.join('\n'));
});

test('testcopy: an exact copy and a 25+ character substring are found; titles, short pieces and keys are not', async () => {
  const { failures } = await checkWords(product({}));
  const T = 'test/viol/a.test.mjs';
  assert.ok(has(failures, 'testcopy', 'viol', T, 5), failures.join('\n'));
  assert.ok(has(failures, 'testcopy', 'viol', T, 7, 'part'));
  for (const line of [4, 6, 8, 9, 10]) assert.ok(!failures.some((f) => f.startsWith(`testcopy viol ${T}:${line} `)), `line ${line}`);
});

test('missingkey: a literal key words.json lacks is found; a held key and a test of the refusal are not', async () => {
  const { failures } = await checkWords(product({}));
  assert.ok(has(failures, 'missingkey', 'viol', 'src/viol/index.mjs', 15), failures.join('\n'));
  assert.ok(has(failures, 'missingkey', 'viol', 'test/viol/a.test.mjs', 11));
  assert.ok(!failures.some((f) => f.startsWith('missingkey viol test/viol/a.test.mjs:9 ')));
  assert.ok(!failures.some((f) => f.startsWith('missingkey clean ')));
});

test('missingkey: a key listed in words-reads.json that words.json lacks is found', async () => {
  const reads = { modules: { viol: { reads: ['screen.home.title', 'screen.gone.away'], unkeyed: [] }, clean: { reads: ['screen.home.title'], unkeyed: [] } } };
  const { failures } = await checkWords(product({ 'docs/development/ux-substrate/screens/words-reads.json': JSON.stringify(reads, null, 1) }));
  assert.ok(failures.some((f) => /^missingkey viol docs\/development\/ux-substrate\/screens\/words-reads\.json:\d+ screen\.gone\.away$/.test(f)), failures.join('\n'));
  assert.ok(!failures.some((f) => f.includes('words-reads.json') && f.includes('screen.home.title')));
});

test('handlist: 5+ foreign ops, refusal codes and word keys are found; short lists, mixed lists and a module\'s own ops are not', async () => {
  const { failures } = await checkWords(product({}));
  const T = 'test/viol/a.test.mjs';
  assert.ok(has(failures, 'handlist', 'viol', T, 13, '?') && failures.some((f) => f.includes(`${T}:13 [?] ops:`)), failures.join('\n'));
  assert.ok(failures.some((f) => f.includes(`${T}:14 [?] codes:`)));
  assert.ok(failures.some((f) => f.includes(`${T}:15 keys:`)) && has(failures, 'handlist', 'viol', T, 15, ''));
  assert.ok(!failures.some((f) => f.startsWith(`handlist viol ${T}:16 `) || f.startsWith(`handlist viol ${T}:17 `)));
  assert.ok(!failures.some((f) => f.startsWith('handlist owner ')));
});

test('a module argument limits the check to that module', async () => {
  const { failures } = await checkWords(product({}), ['clean']);
  assert.deepEqual(failures, []);
});

test('the scanner: comments, regexes and nested templates are skipped; lines are counted', () => {
  const toks = scan('// "no no no no"\nconst r = /"x y z w"/g; /* "a b c d" */\nconst t = `a ${`b ${1}`} c`;\nconst s = "done";\n');
  const strs = toks.filter((t) => t.t === 'str');
  assert.deepEqual(strs.map((s) => [s.v, s.line]), [['a {} c', 3], ['done', 4]]);
});

test('isSentence: the rule in brief', () => {
  assert.equal(isSentence('Your project could not be found here.'), true);
  assert.equal(isSentence('no such project here, sorry'), false); // lowercase, no stop, no placeholder
  assert.equal(isSentence('no such project here, sorry.'), true);
  assert.equal(isSentence('there are {count} items waiting'), true);
  assert.equal(isSentence('Three words here'), false);
  assert.equal(isSentence('SELECT a FROM b WHERE c = ?'), false);
  assert.equal(isSentence('screen.home.greeting.title.x'), false);
  assert.equal(isSentence('MAX_RETRIES_FOR_THE_STORE_NOW'), false);
});

// Stitched sentences and developer messages (D15; BOB's ruling, P17).
test('inline: a stitched + chain whose joined text is a sentence fails once, tagged stitched; built-in errors are dev, custom ones stay ?', async () => {
  const root = product({
    'src/clean/index.mjs': [
      "export function f(list, n, who, x) {",                                                           // 1
      "  const a = 'The mean of ' + list.length + ' numbers is ' + mean(list) + '.';",                  // 2: stitched
      "  const b = 'Total: ' + n;",                                                                     // 3: not a sentence
      "  const c = `Hello ${who}, we could not save this.`;",                                           // 4: template, as before
      "  if (!x) throw new TypeError(`${who}: not a finite number: ${x}`);",                            // 5: dev
      "  if (!list.length) throw new RefusalError('The list is empty, so nothing was saved.');",        // 6: ?
      "  const d = head + '## Session Log' + tail;",                                                    // 7: scaffolding: passes
      "  return [a, b, c, d];",
      "}",
    ].join('\n') + '\n',
  });
  const r = await checkWords(root);
  const F = 'src/clean/index.mjs';
  const mine = r.failures.filter((f) => f.startsWith('inline clean '));
  assert.ok(has(r.failures, 'inline', 'clean', F, 2, 'stitched'), mine.join('\n'));
  assert.ok(mine.some((f) => f.endsWith('"The mean of {} numbers is {}."')), mine.join('\n'));
  assert.equal(mine.filter((f) => f.includes(`${F}:2 `)).length, 1);
  assert.ok(!mine.some((f) => f.includes(`${F}:7 `)) && !mine.some((f) => f.includes(`${F}:3 `)) && !mine.some((f) => f.includes(`${F}:5 `)));
  assert.ok(has(r.failures, 'inline', 'clean', F, 4, ''));
  assert.ok(has(r.failures, 'inline', 'clean', F, 6, '?'));
  assert.equal(mine.length, 3, mine.join('\n'));
  const only = await checkWords(root, ['clean']);
  assert.equal(only.totals.dev, 1);
  assert.match(only.summary, /dev 1, unkeyed 0$/);
});

// Words B (bio K3930; words-B-design §10): localize(id, en, vars) is a reading; the marker arm; --release.
const mk = (m, f, line, extra) => (x) => x.startsWith(`marker ${m} ${f}:${line} `) && (!extra || x.includes(extra));
test('localize: its id and en are never inline or testcopy findings; its id needs no row', async () => {
  const root = product({
    'src/clean/index.mjs': "import { localize } from '../setup-words/index.mjs';\nexport const a = localize('clean.index.nothing', 'There is nothing to add up yet.');\nexport const b = localize('clean.index.total', `The total is {total}.`, { total: 3 });\n",
    'test/clean/t.test.mjs': "import { localize } from '../../src/setup-words/index.mjs';\nconst x = localize('clean.index.nothing', 'There is nothing to add up yet.');\n",
  });
  const r = await checkWords(root, ['clean']);
  assert.deepEqual(r.failures, [], r.failures.join('\n'));
  assert.match(r.summary, /marker 0,/);
});

test('testcopy [code]: a test copying the en of a product localize call is found (bio K3962); controls are not', async () => {
  const root = product({
    'src/clean/index.mjs': "import { localize } from '../setup-words/index.mjs';\nexport const a = localize('m.a.b', 'the source could not be read today');\nexport const b = localize('m.a.c', 'Sent to {name} on time');\nexport const c = localize('m.a.d', 'Grade {UNREACHABLE_CAPTURE_GRADE} is not reachable');\n",
    'test/clean/code.test.mjs': [
      "import { localize } from '../../src/setup-words/index.mjs';",
      "import assert from 'node:assert/strict';",
      "assert.ok(out.includes('source could not be read today'));",                       // 3: a 25+ character substring (a regex literal is not read): found
      "assert.equal(out.says, 'Sent to {name} on time');",                                  // 4: exact copy, 2+ words, placeholder as it stands: found
      "assert.equal(out.says, localize('m.a.b', 'the source could not be read today'));", // 5: compares with localize: not a finding
      "assert.equal(out.n, 'source');",                                                     // 6: one word
      "assert.equal(out.says, 'could not be read');",                                       // 7: shares under 25 characters
      "assert.deepEqual(names, ['UNREACHABLE_CAPTURE_GRADE']);",                           // 8: an identifier inside a sentence: not a copy (bio K3967)
    ].join('\n') + '\n',
  });
  const r = await checkWords(root, ['clean']);
  const T = 'test/clean/code.test.mjs';
  assert.ok(r.failures.some((x) => x.startsWith(`testcopy clean ${T}:3 [code] `)), r.failures.join('\n'));
  assert.ok(r.failures.some((x) => x.startsWith(`testcopy clean ${T}:4 [code] `)), r.failures.join('\n'));
  for (const line of [5, 6, 7, 8]) assert.ok(!r.failures.some((x) => x.startsWith(`testcopy clean ${T}:${line} `)), `line ${line}`);
  assert.equal(r.totals.testcopy, 2);
});

test('localize: a localize bound to node:test (or any module but setup-words) is not the marker', async () => {
  const root = product({
    'test/clean/t.test.mjs': "import { test as localize } from 'node:test';\nlocalize('R1: The list is empty, so there is no total to show.', () => {});\nlocalize(label, fn);\n",
    'test/clean/u.test.mjs': "import localize from 'node:test';\nlocalize(label, fn);\n",
    'test/clean/v.test.mjs': "const localize = (a, b, c) => a;\nlocalize(label, 1, 2);\n",
    'test/clean/w.test.mjs': "import test from 'node:test';\ntest('R2: a t bound to node:test is plain code', () => {});\n",
  });
  const r = await checkWords(root, ['clean']);
  assert.deepEqual(r.failures, [], r.failures.join('\n'));
});

test('marker: a non-literal id or en, a malformed id, one id with two en, and a marker call in a drawn-screen module fail', async () => {
  const root = product({
    'build/modules.json': JSON.stringify({
      not_product: ['docs/', 'build/'],
      modules: [
        { id: 'setup-words', layer: 1, paths: ['src/setup-words/'], tests: ['test/setup-words/'], uses: [] },
        { id: 'clean', layer: 2, paths: ['src/clean/'], tests: ['test/clean/'], uses: [] },
        { id: 'screens-x', layer: 2, paths: ['src/screens-x/'], tests: [], uses: [] },
      ],
    }),
    'src/clean/index.mjs': [
      "import { localize } from '../setup-words/index.mjs';",
      "export const a = localize('clean.index.one', 'One thing is held here.');",   // 1
      "export const b = localize('clean.index.one', 'A different thing is here.');", // 2: two en
      "export const c = localize('clean.index.one', 'One thing is held here.');",   // 3: same en, fine
      "export const d = localize(id, 'Some sentence is given here.');",              // 4: id not literal
      "export const e = localize('clean.index.two', en);",                           // 5: en not literal
      "export const f = localize('Bad Id', 'Some other sentence here.');",          // 6: malformed id
      "export const g = localize('clean.index.three', 'Part ' + x);",               // 7: en not plain
    ].join('\n') + '\n',
    'src/screens-x/index.mjs': "import { localize } from '../setup-words/index.mjs';\nexport const h = localize('screens-x.index.title', 'A drawn screen title.');\n", // 1: drawn
    'src/viol/index.mjs': 'export const ok = 1;\n', 'test/viol/a.test.mjs': 'export const ok = 1;\n',
    'src/owner/index.mjs': 'export const ok = 1;\n', 'test/owner/a.test.mjs': 'export const ok = 1;\n',
  });
  const { failures } = await checkWords(root, ['clean', 'screens-x']);
  const m = failures.filter((f) => f.startsWith('marker '));
  const F = 'src/clean/index.mjs';
  assert.equal(m.filter(mk('clean', F, 3)).length, 1, m.join('\n'));
  assert.ok(!m.some(mk('clean', F, 2)) && !m.some(mk('clean', F, 4)));
  for (const line of [5, 6, 7, 8]) assert.ok(m.some(mk('clean', F, line)), `line ${line}: ${m.join('\n')}`);
  assert.ok(m.some(mk('screens-x', 'src/screens-x/index.mjs', 2, 'drawn-screen')), m.join('\n'));
  assert.equal(m.length, 6, m.join('\n'));
});

test('--release: each row of words-unreviewed.json fails; without the flag none does', async () => {
  const U = { unreviewed: [{ id: 'clean.index.a', en: 'x', module: 'clean', file: 'src/clean/index.mjs', line: 4 }, { id: 'viol.index.b', en: 'y', module: 'viol', file: 'src/viol/index.mjs', line: 9 }] };
  const root = product({ 'bio-plane/src/setup-words/words-unreviewed.json': JSON.stringify(U) });
  const plain = await checkWords(root, ['clean']);
  assert.ok(!plain.failures.some((f) => f.startsWith('unreviewed ')));
  const all = await checkWords(root, [], { release: true });
  assert.deepEqual(all.failures.filter((f) => f.startsWith('unreviewed ')), ['unreviewed clean src/clean/index.mjs:4 clean.index.a', 'unreviewed viol src/viol/index.mjs:9 viol.index.b']);
  assert.match(all.summary, /unreviewed 2,/);
});

test('marker: the word list\'s own module (setup-words) may hold malformed marker calls in its tests', async () => {
  const root = product({ 'test/setup-words/x.test.mjs': "import { localize } from '../../src/setup-words/index.mjs';\nt(id, en);\nt('Bad', 'x');\n" });
  const r = await checkWords(root, ['setup-words']);
  assert.deepEqual(r.failures.filter((f) => f.startsWith('marker ')), []);
});

test('inline: a sentence on the design\'s unkeyed list (words-reads.json) is not counted, unless it copies a row (bio K3944)', async () => {
  const reads = { modules: { clean: { reads: [], unkeyed: [{ file: 'clean/index.mjs', line: 1, text: 'A builder reads this rationale about the rung, never a member.', why: 'builders' }] } } };
  const root = product({
    'docs/development/ux-substrate/screens/words-reads.json': JSON.stringify(reads),
    'src/clean/index.mjs': "export const a = 'A builder reads this rationale about the rung, never a member.';\nexport const b = 'A member reads this sentence on the screen today.';\n",
  });
  const r = await checkWords(root, ['clean']);
  const inl = r.failures.filter((f) => f.startsWith('inline '));
  assert.equal(inl.length, 1, inl.join('\n'));
  assert.ok(inl[0].includes(':2 '), inl[0]);
  assert.match(r.summary, /unkeyed 1/);
});

// The plain arm (bio K3957): lowercase, unpunctuated prose of 5+ words is an inline finding tagged plain.
test('inline: a lowercase unpunctuated reason of 5+ words is tagged plain; controls are not findings (bio K3957)', async () => {
  const reads = { modules: { clean: { reads: [], unkeyed: [{ file: 'clean/index.mjs', line: 1, text: 'the builder alone reads this note about rungs', why: 'builders' }] } } };
  const root = product({
    'docs/development/ux-substrate/screens/words-reads.json': JSON.stringify(reads),
    'src/setup-words/index.mjs': 'export const x = "This module holds all the English there is.";\n',
    'src/clean/index.mjs': [
      'import { localize } from "../setup-words/index.mjs";',
      'export const a = { why: "no active profile states how long minutes take" };',                     // 2: plain
      'export const b = localize("clean.a.b", "no active profile states how long minutes take");',        // 3: marker reading
      'export const c = { why: "no profile states minutes" };',                                           // 4: 4 words
      'export const d = { why: "no profile states how LONG minutes take" };',                             // 5: ALL-CAPS
      'export const e = { why: "no profile states how R12 minutes take" };',                              // 6: requirement ref
      'export const f = { why: "no profile states how `long` minutes take" };',                           // 7: backtick
      'export const g = { why: " no profile states how long minutes take" };',                            // 8: leading space
      'export const h = { why: "no profile states how snake_case minutes take" };',                       // 9: identifier
      'export const i = { why: "the builder alone reads this note about rungs" };',                       // 10: unkeyed
      'export function j() { throw new Error("no profile states how long minutes take"); }',              // 11: dev text
    ].join('\n') + '\n',
    'test/clean/b.test.mjs': 'export const k = { why: "no profile states how long minutes take" };\n',   // a test file
  });
  const r = await checkWords(root, ['clean']);
  const inl = r.failures.filter((f) => f.startsWith('inline '));
  assert.equal(inl.length, 1, inl.join('\n'));
  assert.ok(inl[0].includes('src/clean/index.mjs:2 [plain] '), inl[0]);
  assert.match(r.summary, /inline 1, plain 1,/);
  assert.equal(r.totals.plain, 1);
});

test('isPlainSentence: the rule in brief; isSentence is unchanged', () => {
  assert.equal(isPlainSentence('no line of the document reads as a roster row'), true);
  assert.equal(isPlainSentence('No line of the document reads as a roster row'), false); // isSentence already takes it
  assert.equal(isPlainSentence('no line reads as a row.'), false);
  assert.equal(isSentence('no line of the document reads as a roster row'), false);
  assert.equal(isPlainSentence('no line of the document reads K3957 as a row'), false);
  assert.equal(isPlainSentence('no line of the document reads N4 as a row'), false);
  assert.equal(isPlainSentence('no line of the document reads DEC-83 as a row'), false);
  assert.equal(isPlainSentence('a line of the document reads as a row '), false);
});
