// alpha: arithmetic for the dry run's toy product.

function finite(x, who) {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`${who}: not a finite number: ${String(x)}`);
  return x;
}

// R1, R5: a + b for finite numbers; anything else throws.
export function add(a, b) {
  return finite(a, 'add') + finite(b, 'add');
}

// R3–R4: left to right, 0 for an empty list; a non-finite element throws.
// Elements are checked, then added as `add` adds them. A running total that overflows to
// ±Infinity is carried on, not refused, since every element is finite (job record Q2).
export function sum(list) {
  let t = 0;
  for (const x of list) t += finite(x, 'sum');
  return t;
}

// R6–R7: -a for a finite number; anything else throws.
export function neg(a) {
  return -finite(a, 'neg');
}

// R8–R9: a - b for finite numbers; anything else throws.
export function sub(a, b) {
  return finite(a, 'sub') - finite(b, 'sub');
}

// R10–R11: the absolute value of a finite number (abs(-0) is +0); anything else throws.
export function abs(a) {
  return Math.abs(finite(a, 'abs'));
}
