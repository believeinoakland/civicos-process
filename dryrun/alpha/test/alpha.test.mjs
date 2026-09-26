import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, sum } from '../src/index.mjs';

const finite = [0, -0, 1, -1, 2, 3, 0.1, 0.2, -7.5, 1e300, -1e300, Number.MAX_SAFE_INTEGER, Number.MIN_VALUE];
const notFinite = [NaN, Infinity, -Infinity, '1', '', null, undefined, true, {}, [], 1n];

test('R1 add returns a + b for every pair of finite numbers', () => {
  for (const a of finite) for (const b of finite) assert.equal(add(a, b), a + b);
});

test('R3 sum returns the sum of the numbers in the list, and 0 for an empty list', () => {
  assert.equal(sum([]), 0);
  for (const a of finite) assert.equal(sum([a]), 0 + a);
  for (const a of finite) for (const b of finite) assert.equal(sum([a, b]), 0 + a + b);
  assert.equal(sum(finite), finite.reduce((t, x) => t + x, 0));
});

test('R4 sum throws a TypeError naming the index of the first non-finite-number element', () => {
  for (const bad of notFinite) {
    for (const [list, index] of [[[bad], 0], [[1, 2, bad], 2], [[1, bad, 3, bad], 1]]) {
      assert.throws(() => sum(list), (e) => e instanceof TypeError && new RegExp(`\\b${index}\\b`).test(e.message));
    }
  }
});

test('R2 add and sum are pure: same inputs give the same result, and the list is not changed', () => {
  const list = [1, 2, 3];
  const results = [sum(list), sum(list)];
  assert.deepEqual(list, [1, 2, 3]);
  assert.equal(results[0], results[1]);
  assert.equal(add(2, 3), add(2, 3));
});
