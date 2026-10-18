// Tests of the words check (checks/words.mjs) against a fake product built in a temporary directory: one module with
// each kind of violation and a clean control for each arm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkWords, isSentence, scan } from '../words.mjs';

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
      'export function f() { throw new Error("The store is not open yet."); }', // line 6: ? error
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
  assert.ok(has(failures, 'inline', 'viol', F, 6, '?'));
  for (const line of [2, 7, 8, 9, 10, 11, 12, 13, 14]) assert.ok(!failures.some((f) => f.startsWith(`inline viol ${F}:${line} `)), `line ${line}: ${failures.join('\n')}`);
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
