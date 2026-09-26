import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, sum } from '../src/index.mjs';

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

// Lists of finite numbers: empty, singletons, mixed signs and magnitudes, prefixes of FINITE.
const LISTS = [[], [0], [-0], [7], [1, 2, 3], [0.1, 0.2, 0.3], [-1, 1], [Number.MAX_VALUE, -Number.MAX_VALUE],
  ...FINITE.map((_, i) => FINITE.slice(0, i + 1)), ...FINITE.map((_, i) => FINITE.slice(i))];

test('R3 sum returns the sum of the numbers in the list, and 0 for an empty list', () => {
  assert.equal(sum([]), 0);
  for (const list of LISTS) assert.equal(sum(list), list.reduce((t, x) => t + x, 0), `sum([${list}])`);
});

// Everything that is not a finite number: non-finite numbers and every other type.
const NOT_FINITE = [NaN, Infinity, -Infinity, '1', '', null, undefined, true, false, 1n, {}, [], [1],
  new Number(1), Symbol('x'), () => 1];

test('R4 sum throws a TypeError naming the index of the first element that is not a finite number', () => {
  for (const bad of NOT_FINITE) {
    for (const [list, first] of [[[bad], 0], [[1, 2, bad], 2], [[1, bad, 3, bad], 1], [[bad, 5, bad], 0]]) {
      assert.throws(() => sum(list), (e) => {
        assert.ok(e instanceof TypeError, `${String(e)} is a TypeError`);
        const named = [...e.message.matchAll(/\d+/g)].map(Number);
        assert.deepEqual(named, [first], `message "${e.message}" names index ${first} alone`);
        return true;
      });
    }
  }
});

test('R2 add and sum are pure: same result on every call, inputs untouched, no output, no global state', () => {
  const run = () => [FINITE.map((a) => FINITE.map((b) => add(a, b))), LISTS.map((l) => sum(l)),
    NOT_FINITE.map((bad) => { try { sum([1, bad]); } catch (e) { return e.message; } })];
  const copies = LISTS.map((l) => [...l]);
  const first = run();
  const { seen, globalsChanged } = watched(() => {
    for (let i = 0; i < 3; i++) assert.deepEqual(run(), first);
  });
  assert.deepEqual(LISTS, copies);
  assert.deepEqual(seen, []);
  assert.equal(globalsChanged, false);
});
