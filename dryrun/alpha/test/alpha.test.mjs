import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, sum } from '../src/index.mjs';

// Finite numbers covering every class: zeros of both signs, subnormals, the extremes,
// fractions whose sum rounds, integers beyond 2^53, and seeded random values.
const EDGES = [0, -0, 1, -1, 0.1, 0.2, 0.3, 1.5, -2.75, 2 ** 53, 2 ** 53 + 2, -(2 ** 53),
  Number.MIN_VALUE, -Number.MIN_VALUE, Number.EPSILON, Number.MAX_VALUE, -Number.MAX_VALUE,
  Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 1e-300, 1e300, 123456.789];
function* seeded(n, seed = 12345) {
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    const scale = 10 ** ((s % 40) - 20);
    yield ((s / 2 ** 31) - 0.5) * scale;
  }
}
const FINITE = [...EDGES, ...seeded(200)];

test('R1 add returns a + b for every pair of finite numbers in each class', () => {
  for (const a of FINITE) {
    for (const b of FINITE) {
      assert.ok(Object.is(add(a, b), a + b), `add(${a}, ${b})`);
    }
  }
  assert.equal(add(2, 3), 5);
  assert.equal(add(-1, 1), 0);
  assert.equal(add(Number.MAX_VALUE, Number.MAX_VALUE), Infinity); // a + b, overflow included
});

// Every kind of value that is not a finite number.
const NOT_FINITE = () => ['1', '', NaN, Infinity, -Infinity, null, undefined, {}, [1], [], true, false, 1n,
  Symbol('x'), () => 1, new Number(1)];

test('R5 add throws a TypeError when either argument is not a finite number, coercing nothing', () => {
  for (const bad of NOT_FINITE()) {
    for (const ok of [0, -1, 2.5, Number.MAX_VALUE]) {
      assert.throws(() => add(bad, ok), TypeError, `add(${typeof bad}, ${ok})`);
      assert.throws(() => add(ok, bad), TypeError, `add(${ok}, ${typeof bad})`);
    }
    for (const bad2 of NOT_FINITE()) assert.throws(() => add(bad, bad2), TypeError);
  }
  assert.throws(() => add('1', 2), TypeError); // beta's report: once returned '12'
});

test('R2 add and sum are pure: no state, no input or output', () => {
  const globalsBefore = Object.getOwnPropertyNames(globalThis).sort();
  const writes = [];
  const out = process.stdout.write, err = process.stderr.write;
  process.stdout.write = (...a) => { writes.push(a); return true; };
  process.stderr.write = (...a) => { writes.push(a); return true; };
  let first, again;
  try {
    const run = () => [...FINITE.map((a, i) => add(a, FINITE[(i * 7) % FINITE.length])),
      ...FINITE.map((_, i) => sum(FINITE.slice(i)))];
    first = run();
    // Interleave other calls (throwing ones included), then repeat: results depend on the arguments alone.
    for (const a of FINITE) { add(a, a); sum([a, a]); assert.throws(() => sum([a, NaN])); }
    again = run();
  } finally {
    process.stdout.write = out; process.stderr.write = err;
  }
  assert.deepEqual(again, first);
  assert.deepEqual(writes, []);
  assert.deepEqual(Object.getOwnPropertyNames(globalThis).sort(), globalsBefore);
  const list = [1, 2, 3];
  sum(list);
  assert.deepEqual(list, [1, 2, 3]); // the argument is not changed
});

test('R3 sum adds the elements left to right with add, and returns 0 for an empty list', () => {
  assert.ok(Object.is(sum([]), 0));
  const leftToRight = (list) => list.reduce((t, x) => add(t, x), 0);
  // Every prefix of the classes and of the seeded values, forwards and backwards.
  for (const base of [EDGES, FINITE, [...FINITE].reverse()]) {
    for (let n = 1; n <= base.length; n++) {
      const list = base.slice(0, n);
      assert.ok(Object.is(sum(list), leftToRight(list)), `sum of ${n}`);
    }
  }
  // Order matters: ordinary floating-point addition, not a correctly rounded sum.
  assert.equal(sum([0.1, 0.2]), 0.30000000000000004);
  assert.equal(sum([1e16, 1, 1]), 1e16);
  assert.equal(sum([1, 1, 1e16]), 1e16 + 2);
  assert.ok(Object.is(sum([-0]), 0)); // 0 + -0 is +0, as add gives
  // A running total that overflows is carried as floating-point addition carries it (job record Q2).
  assert.equal(sum([Number.MAX_VALUE, Number.MAX_VALUE, 1]), Infinity);
  assert.equal(sum([Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE]), Infinity);
});

test('R4 sum throws a TypeError for an element that is not a finite number, coercing and skipping nothing', () => {
  for (const bad of NOT_FINITE()) {
    for (const list of [[bad], [bad, 1], [1, bad], [1, bad, 2], [...FINITE, bad]]) {
      assert.throws(() => sum(list), TypeError, `${typeof bad} in a list of ${list.length}`);
    }
  }
});
import { test as d24 } from 'node:test'; d24('D25 old red', () => { throw new Error('old debt, seeded by D25'); });
