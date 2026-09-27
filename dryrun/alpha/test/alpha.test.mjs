import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, mul } from '../src/index.mjs';

// Finite numbers across every class the requirements cover: zeros of both
// signs, integers, fractions, negatives, extremes and subnormals.
const FINITE = [
  0, -0, 1, -1, 2, -3, 0.1, 0.2, -0.5, 1 / 3, 1e-300, -1e-300, 5e-324,
  12345.678, -98765.4321, 2 ** 53 - 1, -(2 ** 53 - 1), 1e308, -1e308,
  Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE, Number.EPSILON,
];

test('R1 add returns a + b for every pair of finite numbers', () => {
  for (const a of FINITE) {
    for (const b of FINITE) {
      assert.ok(Object.is(add(a, b), a + b), `add(${a}, ${b})`);
    }
  }
  assert.equal(add(2, 3), 5);
  assert.equal(add(-1, 1), 0);
});

test('R3 mul returns a * b for every pair of finite numbers', () => {
  for (const a of FINITE) {
    for (const b of FINITE) {
      assert.ok(Object.is(mul(a, b), a * b), `mul(${a}, ${b})`);
    }
  }
  assert.equal(mul(2, 3), 6);
  assert.equal(mul(-4, 0.5), -2);
  assert.equal(mul(7, 0), 0);
});

test('R2 add and mul are pure: same inputs give the same output, in any call order', () => {
  const first = [];
  for (const a of FINITE) {
    for (const b of FINITE) first.push([add(a, b), mul(a, b)]);
  }
  const again = [];
  for (const a of [...FINITE].reverse()) {
    for (const b of [...FINITE].reverse()) again.unshift([add(a, b), mul(a, b)]);
  }
  assert.equal(again.length, first.length);
  for (let i = 0; i < first.length; i++) {
    assert.ok(Object.is(first[i][0], again[i][0]) && Object.is(first[i][1], again[i][1]));
  }
  assert.equal(add.length, 2);
  assert.equal(mul.length, 2);
});
