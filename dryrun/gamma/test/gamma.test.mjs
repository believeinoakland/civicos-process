import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add } from '../../alpha/src/index.mjs';
import { double } from '../src/index.mjs';

// Every class of finite number: zeros of both signs, subnormals, extremes (doubling MAX_VALUE
// overflows), integers around 2^53, fractions that round, and 500 seeded values across magnitudes.
function finites() {
  const out = [0, -0, Number.MIN_VALUE, -Number.MIN_VALUE, 2.2250738585072014e-308, Number.MAX_VALUE, -Number.MAX_VALUE,
    Number.MAX_VALUE / 2, Number.MAX_VALUE / 2 + 2 ** 970, 1, -1, 7, 2 ** 53, 2 ** 53 + 2, Number.MAX_SAFE_INTEGER,
    -Number.MAX_SAFE_INTEGER, 0.1, 0.2, 1 / 3, -5.5, Number.EPSILON, 1e-300, 1e300];
  let s = 4242;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 500; i++) out.push((rnd() - 0.5) * 10 ** Math.floor(rnd() * 600 - 300));
  return out;
}

test('R1 double(x) returns alpha.add(x, x) for every class of finite number', () => {
  for (const x of finites()) {
    assert.ok(Object.is(double(x), add(x, x)), `double(${x}) = ${double(x)}, expected ${add(x, x)}`);
    assert.ok(Object.is(double(x), x + x));
  }
});

// Every kind of value that is not a finite number.
const refused = [NaN, Infinity, -Infinity, '1', '', null, undefined, true, false, 1n, {}, [], [1], () => 1, Symbol('x'), new Number(1)];

test('R2 double refuses anything that is not a finite number with a TypeError, as alpha.add does, coercing nothing', () => {
  for (const bad of refused) {
    const name = typeof bad === 'symbol' ? 'Symbol' : String(bad);
    assert.throws(() => add(bad, bad), TypeError);
    assert.throws(() => double(bad), TypeError, `double(${name}) did not throw a TypeError`);
  }
  assert.throws(() => double(), TypeError);
});

test('R3 double is pure: no state, no input or output', () => {
  const xs = finites();
  const first = xs.map((x) => double(x));
  const again = [...xs].reverse().map((x) => double(x)).reverse();
  for (let i = 0; i < xs.length; i++) assert.ok(Object.is(first[i], again[i]));
  const globals = Object.keys(globalThis).sort();
  const log = [];
  const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info,
    out: process.stdout.write, err: process.stderr.write };
  console.log = console.error = console.warn = console.info = (...a) => log.push(a);
  process.stdout.write = process.stderr.write = (...a) => { log.push(a); return true; };
  try {
    for (const x of xs) double(x);
    for (const bad of refused) try { double(bad); } catch {}
  } finally {
    Object.assign(console, { log: orig.log, error: orig.error, warn: orig.warn, info: orig.info });
    process.stdout.write = orig.out; process.stderr.write = orig.err;
  }
  assert.deepEqual(log, []);
  assert.deepEqual(Object.keys(globalThis).sort(), globals);
});
