// setup-words: the toy's word table, read by key (bio's setup-words in miniature; D15).
import { readFileSync } from 'node:fs';

const ROWS = new Map(JSON.parse(readFileSync(new URL('../docs/development/ux-substrate/screens/words.json', import.meta.url), 'utf8')).words.map((w) => [w.key, w.en]));

// R1: the sentence for a key, each {name} replaced by vars[name]; an unknown key throws a RangeError.
export function word(key, vars = {}) {
  if (!ROWS.has(key)) throw new RangeError(`UNKNOWN_WORD ${key}`);
  return ROWS.get(key).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// R2: true when the table holds the key.
export function hasWord(key) {
  return ROWS.has(key);
}
