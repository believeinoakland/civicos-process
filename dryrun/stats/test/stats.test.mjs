import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, max, min } from '../src/index.mjs';
import { sum } from '../../alpha/src/index.mjs';

// Finite numbers covering every class: zeros of both signs, subnormals, the extremes,
// fractions whose sum rounds, integers beyond 2^53, and seeded random values.
const EDGES = [0, -0, 1, -1, 0.1, 0.2, 0.3, 1.5, -2.75, 2 ** 53, 2 ** 53 + 2, -(2 ** 53),
  Number.MIN_VALUE, -Number.MIN_VALUE, Number.EPSILON, Number.MAX_VALUE, -Number.MAX_VALUE,
  Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 1e-300, 1e300, 123456.789];
function* seeded(n, seed = 54321) {
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    const scale = 10 ** ((s % 40) - 20);
    yield ((s / 2 ** 31) - 0.5) * scale;
  }
}
const FINITE = [...EDGES, ...seeded(200)];
// Every prefix and suffix of the classes and the seeded values, forwards and backwards.
function* lists() {
  for (const base of [EDGES, FINITE, [...FINITE].reverse()]) {
    for (let n = 1; n <= base.length; n++) { yield base.slice(0, n); yield base.slice(-n); }
  }
}

test('R1 mean is alpha.sum(list) / list.length, and 0 for an empty list', () => {
  assert.ok(Object.is(mean([]), 0));
  for (const list of lists()) {
    assert.ok(Object.is(mean(list), sum(list) / list.length), `mean of ${list.length}`);
  }
  assert.equal(mean([1, 2, 3, 4]), 2.5);
  assert.equal(mean([5]), 5);
  assert.ok(Object.is(mean([-0]), 0)); // alpha.sum([-0]) is +0
  assert.equal(mean([0.1, 0.2]), 0.30000000000000004 / 2); // the sum as alpha.sum adds it
  // A running total that overflows makes the mean Infinity, as alpha.sum's total does.
  assert.equal(mean([Number.MAX_VALUE, Number.MAX_VALUE]), Infinity);
  assert.equal(mean(new Array(1e6).fill(1)), 1); // long lists: no spread or recursion limit
});

const NOT_FINITE = () => ['1', '', NaN, Infinity, -Infinity, null, undefined, {}, [1], [], true, false, 1n,
  Symbol('x'), () => 1, new Number(1)];

test('R2 mean refuses an element that is not a finite number as alpha.sum does', () => {
  for (const bad of NOT_FINITE()) {
    for (const list of [[bad], [bad, 1], [1, bad], [1, bad, 2], [...FINITE, bad]]) {
      let expected;
      try { sum(list); } catch (e) { expected = e; }
      assert.ok(expected, `alpha.sum refuses ${typeof bad}`);
      assert.throws(() => mean(list), (e) => e.constructor === expected.constructor && e.message === expected.message,
        `${typeof bad} in a list of ${list.length}`);
    }
  }
});

test('R3 mean, max and min are pure: no state, no input or output', () => {
  const globalsBefore = Object.getOwnPropertyNames(globalThis).sort();
  const writes = [];
  const out = process.stdout.write, err = process.stderr.write;
  process.stdout.write = (...a) => { writes.push(a); return true; };
  process.stderr.write = (...a) => { writes.push(a); return true; };
  let first, again;
  try {
    const run = () => [...lists()].map((l) => [mean(l), max(l), min(l)]);
    first = run();
    // Interleave other calls (throwing ones included), then repeat: results depend on the arguments alone.
    for (const a of FINITE) {
      for (const f of [mean, max, min]) { f([a, a]); assert.throws(() => f([a, NaN])); }
      mean([]); assert.throws(() => max([])); assert.throws(() => min([]));
    }
    again = run();
  } finally {
    process.stdout.write = out; process.stderr.write = err;
  }
  assert.deepEqual(again, first);
  assert.deepEqual(writes, []);
  assert.deepEqual(Object.getOwnPropertyNames(globalThis).sort(), globalsBefore);
  for (const f of [mean, max, min]) {
    const list = [3, 1, 2];
    f(list);
    assert.deepEqual(list, [3, 1, 2]); // the argument is not changed
  }
});

// The largest (or smallest) as the definition gives it: an element of the list that no element
// exceeds (or undercuts). Among equal zeros, +0 is the larger and -0 the smaller, as Math gives them.
function largest(list) { let m = list[0]; for (const x of list) if (x > m || (x === 0 && m === 0 && Object.is(m, -0))) m = x; return m; }
function smallest(list) { let m = list[0]; for (const x of list) if (x < m || (x === 0 && m === 0 && Object.is(x, -0))) m = x; return m; }

test('R4 max returns the largest number in a non-empty list', () => {
  for (const list of lists()) {
    const got = max(list);
    assert.ok(list.some((x) => Object.is(x, got)), `max of ${list.length} is an element`);
    assert.ok(list.every((x) => x <= got), `no element exceeds max of ${list.length}`);
    assert.ok(Object.is(got, largest(list)), `max of ${list.length}`);
    assert.ok(Object.is(got, Math.max(...list)), `max of ${list.length} agrees with Math.max`);
  }
  assert.equal(max([5]), 5);
  assert.equal(max([1, 3, 2]), 3);
  assert.equal(max([-3, -1, -2]), -1);
  assert.equal(max([2, 2, 2]), 2);
  assert.ok(Object.is(max([-0, 0]), 0));
  assert.ok(Object.is(max([0, -0]), 0));
  assert.ok(Object.is(max([-0]), -0));
  assert.equal(max([-Number.MAX_VALUE, Number.MIN_VALUE]), Number.MIN_VALUE);
  const long = Array.from({ length: 1e6 }, (_, i) => (i * 7919) % 1e6); // no spread or recursion limit
  assert.equal(max(long), 1e6 - 1);
});

test('R5 max refuses an empty list with a RangeError', () => {
  assert.throws(() => max([]), RangeError);
  assert.throws(() => max(new Array(0)), RangeError);
});

test('R6 min returns the smallest number in a non-empty list', () => {
  for (const list of lists()) {
    const got = min(list);
    assert.ok(list.some((x) => Object.is(x, got)), `min of ${list.length} is an element`);
    assert.ok(list.every((x) => x >= got), `no element undercuts min of ${list.length}`);
    assert.ok(Object.is(got, smallest(list)), `min of ${list.length}`);
    assert.ok(Object.is(got, Math.min(...list)), `min of ${list.length} agrees with Math.min`);
  }
  assert.equal(min([5]), 5);
  assert.equal(min([1, 3, 2]), 1);
  assert.equal(min([-3, -1, -2]), -3);
  assert.equal(min([2, 2, 2]), 2);
  assert.ok(Object.is(min([-0, 0]), -0));
  assert.ok(Object.is(min([0, -0]), -0));
  assert.ok(Object.is(min([0]), 0));
  assert.equal(min([Number.MAX_VALUE, -Number.MIN_VALUE]), -Number.MIN_VALUE);
  const long = Array.from({ length: 1e6 }, (_, i) => ((i * 7919) % 1e6) + 1); // no spread or recursion limit
  assert.equal(min(long), 1);
});

test('R7 min refuses an empty list with a RangeError', () => {
  assert.throws(() => min([]), RangeError);
  assert.throws(() => min(new Array(0)), RangeError);
});

test('R8 max and min refuse an element that is not a finite number with a TypeError; zeros as Math compares them', () => {
  for (const [f, who, pick] of [[max, 'max', Math.max], [min, 'min', Math.min]]) {
    for (const bad of NOT_FINITE()) {
      for (const list of [[bad], [bad, 1], [1, bad], [1, bad, 2], [...FINITE, bad]]) {
        assert.throws(() => f(list), (e) => e instanceof TypeError && e.message.startsWith(`${who}: not a finite number`),
          `${who}: ${typeof bad} in a list of ${list.length}`);
      }
    }
    assert.throws(() => f([]), RangeError); // the empty list is refused first, as a RangeError
    for (const list of [[0], [-0], [0, -0], [-0, 0], [-0, -0, 0], [1, -0, 0], [-1, 0, -0]]) {
      assert.ok(Object.is(f(list), pick(...list)), `${who} of [${list.map((x) => Object.is(x, -0) ? '-0' : x)}]`);
    }
  }
});
