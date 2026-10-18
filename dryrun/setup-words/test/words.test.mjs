import { test } from 'node:test';
import assert from 'node:assert/strict';
import { word, hasWord } from '../index.mjs';

test('R1 word fills each placeholder and refuses an unknown key', () => {
  assert.ok(hasWord('alpha.sum.total'));
  assert.ok(!word('alpha.sum.total', { total: 7 }).includes('{total}'));
  assert.ok(word('alpha.sum.total', { total: 7 }).includes('7'));
  assert.throws(() => word('no.such.key'), RangeError);
});

test('R2 hasWord is true only for a key the table holds', () => {
  assert.equal(hasWord('beta.total.empty'), true);
  assert.equal(hasWord('beta.total.nonesuch'), false);
});

test('R3 every sentence comes from the design stream\'s words.json, word for word', async () => {
  const { readFileSync } = await import('node:fs');
  const rows = JSON.parse(readFileSync(new URL('../../docs/development/ux-substrate/screens/words.json', import.meta.url), 'utf8')).words;
  for (const r of rows) assert.equal(word(r.key, {}), r.en);
});
