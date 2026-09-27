import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, max, min, distinct, median } from '../src/index.mjs';
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

test('R3 mean, max, min, distinct and median are pure: no state, no input or output', () => {
  const globalsBefore = Object.getOwnPropertyNames(globalThis).sort();
  const writes = [];
  const out = process.stdout.write, err = process.stderr.write;
  process.stdout.write = (...a) => { writes.push(a); return true; };
  process.stderr.write = (...a) => { writes.push(a); return true; };
  let first, again;
  try {
    const run = () => [...lists()].map((l) => [mean(l), max(l), min(l), distinct(l), distinct([...l, l[0]]), median(l)]);
    first = run();
    // Interleave other calls (throwing ones included), then repeat: results depend on the arguments alone.
    for (const a of FINITE) {
      for (const f of [mean, max, min, median]) { f([a, a]); assert.throws(() => f([a, NaN])); }
      mean([]); distinct([]); distinct([a, a]); assert.throws(() => max([])); assert.throws(() => min([]));
      assert.throws(() => median([]));
    }
    again = run();
  } finally {
    process.stdout.write = out; process.stderr.write = err;
  }
  assert.deepEqual(again, first);
  assert.deepEqual(writes, []);
  assert.deepEqual(Object.getOwnPropertyNames(globalThis).sort(), globalsBefore);
  for (const f of [mean, max, min, distinct, median]) {
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

// Distinct by the definition: no pair i < j whose elements a Set holds as one (SameValueZero).
function noTwoSame(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) if (new Set([list[i], list[j]]).size === 1) return false;
  return true;
}

test('R9 distinct is true when no two elements are the same value as a Set compares them, else false; [] is distinct', () => {
  assert.equal(distinct([]), true);
  const o = {}, a = [1], f = () => 1, s = Symbol('s');
  // Values of every kind, including ones a Set treats specially: NaN is one value, +0 and -0 are one value,
  // objects are compared by identity, and no coercion ('1' and 1, 1n and 1, null and undefined differ).
  const KINDS = [0, -0, 1, -1, 1.5, NaN, Infinity, -Infinity, '1', '', 'a', 1n, 0n, true, false, null, undefined,
    o, {}, a, [1], f, s, Symbol('s'), new Number(1), Number.MIN_VALUE, Number.MAX_VALUE, 2 ** 53, 2 ** 53 + 2];
  let checked = 0;
  // Every list of up to three elements drawn from the kinds, with repeats: every pair and triple, in every order.
  for (const x of KINDS) {
    assert.equal(distinct([x]), true);
    for (const y of KINDS) {
      assert.equal(distinct([x, y]), noTwoSame([x, y]), `[${String(x)}, ${String(y)}]`);
      for (const z of KINDS) { assert.equal(distinct([x, y, z]), noTwoSame([x, y, z])); checked++; }
    }
  }
  assert.ok(checked === KINDS.length ** 3);
  // Longer lists: every prefix and suffix of the finite classes and seeded values, with and without a repeat
  // placed at each end and in the middle.
  for (const list of lists()) {
    assert.equal(distinct(list), noTwoSame(list));
    for (const at of [0, list.length >> 1, list.length]) {
      const withRepeat = [...list.slice(0, at), list[list.length - 1], ...list.slice(at)];
      assert.equal(distinct(withRepeat), false);
    }
  }
  assert.equal(distinct(KINDS), false); // 0 and -0
  assert.equal(distinct(KINDS.filter((x) => !Object.is(x, -0))), true);
  assert.equal(distinct([NaN, NaN]), false);
  assert.equal(distinct([0, -0]), false);
  assert.equal(distinct([o, {}]), true);
  assert.equal(distinct([o, o]), false);
  assert.equal(distinct([, undefined]), false); // a hole is read as undefined, as a Set built from the list reads it
  const long = Array.from({ length: 1e6 }, (_, i) => i); // long lists: one pass
  assert.equal(distinct(long), true);
  long.push(999999);
  assert.equal(distinct(long), false);
});

// Exact arithmetic for R10: every finite double is an integer multiple of 2^-1074, so x * 2^1075 is an
// exact BigInt, and so is the sum of two of them, which is twice their exact mean in the same units.
function units(x) {
  const v = new DataView(new ArrayBuffer(8));
  v.setFloat64(0, x);
  const hi = v.getUint32(0), lo = v.getUint32(4);
  const e = (hi >>> 20) & 0x7ff;
  const m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  const mag = e === 0 ? m : (m | (1n << 52n)) << BigInt(e - 1);
  return (hi >>> 31 ? -mag : mag) * 2n;
}
// The doubles next above and below a finite x (non-finite at the ends of the range).
function step(x, dir) {
  if (x === 0) return dir * Number.MIN_VALUE;
  const v = new DataView(new ArrayBuffer(8));
  v.setFloat64(0, x);
  v.setBigUint64(0, v.getBigUint64(0) + ((x > 0) === (dir > 0) ? 1n : -1n));
  return v.getFloat64(0);
}
// The order the median is taken in, independently of the module: by exact value, -0 below +0.
const key = (x) => units(x) * 2n - (Object.is(x, -0) ? 1n : 0n);
const sortedRef = (list) => [...list].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
const show = (list) => `[${list.slice(0, 6).map((x) => (Object.is(x, -0) ? '-0' : String(x))).join(', ')}${list.length > 6 ? ', …' : ''}] (${list.length})`;

// Full compliance for one list: odd, the middle element of the sorted list, itself (sign of zero included);
// even, the double nearest the exact mean of the two middle elements (no other double is nearer), lying
// between them, and a zero carrying the sign of the mean it rounds (+0 for an exact zero unless both are -0).
function checkMedian(list) {
  const got = median(list);
  const s = sortedRef(list), mid = s.length >> 1;
  if (s.length % 2) { assert.ok(Object.is(got, s[mid]), `median of ${show(list)}: ${got} is not ${s[mid]}`); return; }
  const a = s[mid - 1], b = s[mid];
  assert.ok(Number.isFinite(got), `median of ${show(list)} is finite`);
  assert.ok(a <= got && got <= b, `median of ${show(list)} lies between the middle two`);
  const twice = units(a) + units(b);
  const off = (y) => { const d = units(y) * 2n - twice; return d < 0n ? -d : d; };
  for (const n of [step(got, 1), step(got, -1)]) {
    if (Number.isFinite(n)) assert.ok(off(got) <= off(n), `median of ${show(list)}: ${n} is nearer the mean than ${got}`);
  }
  // A zero result carries the sign of the exact mean it rounds; an exact zero is +0 unless both are -0.
  const negative = twice < 0n || (twice === 0n && Object.is(a, -0) && Object.is(b, -0));
  if (got === 0) assert.ok(Object.is(got, negative ? -0 : 0), `sign of the zero median of ${show(list)}`);
}

test('R10 median is the middle of the sorted list, or the mean of the middle two; [] is a RangeError, a non-finite element a TypeError', () => {
  let checked = 0;
  // Every prefix and suffix of the classes and seeded values, forwards and backwards (odd and even lengths).
  for (const list of lists()) { checkMedian(list); checked++; }
  // Every ordering of every list of up to four elements drawn from the edge classes, with repeats.
  const SMALL = [0, -0, 1, -1, 0.1, 0.2, 2 ** 53, 2 ** 53 + 2, Number.MIN_VALUE, -Number.MIN_VALUE,
    Number.MAX_VALUE, -Number.MAX_VALUE, 1e-300, 1e300];
  for (const x of SMALL) {
    checkMedian([x]);
    for (const y of SMALL) {
      checkMedian([x, y]);
      for (const z of SMALL) {
        checkMedian([x, y, z]);
        for (const w of SMALL) { checkMedian([x, y, z, w]); checked++; }
      }
    }
  }
  assert.ok(checked >= SMALL.length ** 4);
  // Pairs over the whole range: rounding, subnormals, overflow of a + b, opposite signs, adjacent doubles.
  for (const a of FINITE) for (const b of [a, step(a, 1), step(a, -1), -a, ...EDGES]) if (Number.isFinite(b)) checkMedian([a, b]);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([5]), 5);
  assert.equal(median([1, 2]), 1.5);
  assert.equal(median([0.1, 0.2]), 0.15000000000000002); // (0.1 + 0.2) / 2, the double nearest the exact mean
  assert.equal(median([Number.MAX_VALUE, Number.MAX_VALUE]), Number.MAX_VALUE); // no overflow to Infinity
  assert.equal(median([-Number.MAX_VALUE, -Number.MAX_VALUE]), -Number.MAX_VALUE);
  assert.equal(median([Number.MIN_VALUE, Number.MIN_VALUE]), Number.MIN_VALUE);
  assert.ok(Object.is(median([0, -0, 1]), 0) && Object.is(median([-0, 0, 1]), 0)); // -0 sorts below +0
  assert.ok(Object.is(median([0, -0, -1]), -0) && Object.is(median([-0, -0]), -0) && Object.is(median([-0, 0]), 0));
  const long = Array.from({ length: 1e6 + 1 }, (_, i) => (i * 7919) % (1e6 + 1)); // long lists: no spread or recursion limit
  assert.equal(median(long), 5e5);
  // Refusals: an empty list with a RangeError; an element that is not a finite number, anywhere, with a TypeError.
  assert.throws(() => median([]), RangeError);
  assert.throws(() => median(new Array(0)), RangeError);
  for (const bad of NOT_FINITE()) {
    for (const list of [[bad], [bad, 1], [1, bad], [1, bad, 2], [...FINITE, bad], [bad, ...FINITE]]) {
      assert.throws(() => median(list), (e) => e instanceof TypeError && e.message.startsWith('median: not a finite number'),
        `median: ${typeof bad} in a list of ${list.length}`);
    }
  }
  assert.throws(() => median([1, , 2]), TypeError); // a hole is read as undefined
});
