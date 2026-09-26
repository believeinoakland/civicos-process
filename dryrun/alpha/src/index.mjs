// alpha: arithmetic for the dry run's toy product.
export function add(a, b) {
  return a + b;
}

// The sum of a list of finite numbers, left to right with `add`; 0 for an empty list.
export function sum(list) {
  let t = 0;
  for (const x of list) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`sum: not a finite number: ${String(x)}`);
    t = add(t, x);
  }
  return t;
}
