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

test('R2 add is pure: no state, no input or output', () => {
  const globalsBefore = Object.getOwnPropertyNames(globalThis).sort();
  const writes = [];
  const out = process.stdout.write, err = process.stderr.write;
  process.stdout.write = (...a) => { writes.push(a); return true; };
  process.stderr.write = (...a) => { writes.push(a); return true; };
  let first, again;
  try {
    first = FINITE.map((a, i) => add(a, FINITE[(i * 7) % FINITE.length]));
    // Interleave other calls, then repeat: results depend on the arguments alone.
    for (const a of FINITE) add(a, a);
    again = FINITE.map((a, i) => add(a, FINITE[(i * 7) % FINITE.length]));
  } finally {
    process.stdout.write = out; process.stderr.write = err;
  }
  assert.deepEqual(again, first);
  assert.deepEqual(writes, []);
  assert.deepEqual(Object.getOwnPropertyNames(globalThis).sort(), globalsBefore);
});

// sum: pending its requirement ids from BOB (job record Q1); written to the best reading.
test('sum returns the left-to-right sum of finite numbers, 0 for an empty list', () => {
  assert.equal(sum([]), 0);
  assert.equal(sum([2, 3]), 5);
  let t = 0;
  for (const x of FINITE) t += x;
  assert.ok(Object.is(sum(FINITE), t));
});

test('sum throws a TypeError for an element that is not a finite number', () => {
  for (const bad of ['1', NaN, Infinity, -Infinity, null, undefined, {}, [1], true, 1n]) {
    assert.throws(() => sum([1, bad, 2]), TypeError, String(bad));
  }
});
