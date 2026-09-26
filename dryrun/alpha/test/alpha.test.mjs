import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add } from '../src/index.mjs';

// Finite numbers across the domain: signs, zero and -0, fractions, extremes.
const FINITE = [0, -0, 1, -1, 2, 3, 0.1, 0.2, -2.5, 1e-300, -1e-300, 123456789, Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER, Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE, Number.EPSILON];

test('R1 add returns a + b for every pair of finite numbers', () => {
  for (const a of FINITE) for (const b of FINITE) assert.equal(add(a, b), a + b, `add(${a}, ${b})`);
});

// Calls add with output channels and state-bearing globals watched; returns what each saw.
function watched(fn) {
  const seen = [];
  const saved = {};
  const spy = (name) => () => { seen.push(name); };
  for (const [obj, key, name] of [[process.stdout, 'write', 'stdout'], [process.stderr, 'write', 'stderr'],
    [console, 'log', 'console.log'], [console, 'error', 'console.error'], [globalThis, 'fetch', 'fetch']]) {
    saved[name] = [obj, key, obj[key]];
    obj[key] = spy(name);
  }
  const before = Object.keys(globalThis).sort().join();
  try { fn(); } finally { for (const [obj, key, v] of Object.values(saved)) obj[key] = v; }
  return { seen, globalsChanged: before !== Object.keys(globalThis).sort().join() };
}

test('R2 add is pure: same result on every call, no output, no global state', () => {
  const first = FINITE.map((a) => FINITE.map((b) => add(a, b)));
  const { seen, globalsChanged } = watched(() => {
    for (let i = 0; i < 3; i++) assert.deepEqual(FINITE.map((a) => FINITE.map((b) => add(a, b))), first);
  });
  assert.deepEqual(seen, []);
  assert.equal(globalsChanged, false);
});
