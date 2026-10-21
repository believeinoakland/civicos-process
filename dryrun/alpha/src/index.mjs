// alpha: arithmetic for the dry run's toy product.

function finite(x, who) {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`${who}: not a finite number: ${String(x)}`);
  return x;
}

// R1, R5: a + b for finite numbers; anything else throws.
export function add(a, b) {
  return finite(a, 'add') + finite(b, 'add');
}

// R3–R4, R6: left to right, 0 for an empty list; a non-finite element throws, and so does a list that is
// not an array (nothing is iterated). Elements are checked, then added as `add` adds them. A running total
// that overflows to ±Infinity is carried on, not refused, since every element is finite (job record Q2).
export function sum(list) {
  if (!Array.isArray(list)) throw new TypeError(`sum: not an array: ${typeof list}`);
  let t = 0;
  for (const x of list) t += finite(x, 'sum');
  return t;
}
