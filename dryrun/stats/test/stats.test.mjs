import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean } from '../src/index.mjs';
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

test('R3 mean is pure: no state, no input or output', () => {
  const globalsBefore = Object.getOwnPropertyNames(globalThis).sort();
  const writes = [];
  const out = process.stdout.write, err = process.stderr.write;
  process.stdout.write = (...a) => { writes.push(a); return true; };
  process.stderr.write = (...a) => { writes.push(a); return true; };
  let first, again;
  try {
    const run = () => [...lists()].map(mean);
    first = run();
    // Interleave other calls (throwing ones included), then repeat: results depend on the arguments alone.
    for (const a of FINITE) { mean([a, a]); mean([]); assert.throws(() => mean([a, NaN])); }
    again = run();
  } finally {
    process.stdout.write = out; process.stderr.write = err;
  }
  assert.deepEqual(again, first);
  assert.deepEqual(writes, []);
  assert.deepEqual(Object.getOwnPropertyNames(globalThis).sort(), globalsBefore);
  const list = [1, 2, 3];
  mean(list);
  assert.deepEqual(list, [1, 2, 3]); // the argument is not changed
});
