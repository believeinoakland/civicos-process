// alpha: arithmetic for the dry run's toy product.
export function add(a, b) {
  return a + b;
}

// R3–R4: left to right with `add`, 0 for an empty list; a non-finite element throws.
export function sum(list) {
  let t = 0;
  for (const x of list) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`sum: not a finite number: ${String(x)}`);
    t = add(t, x);
  }
  return t;
}
