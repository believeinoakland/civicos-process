// alpha: arithmetic for the dry run's toy product.
export function add(a, b) {
  return a + b;
}

// The sum of a list of finite numbers; 0 for an empty list. Anything else in the list is a TypeError
// naming its index: nothing is coerced or skipped.
export function sum(list) {
  let t = 0;
  for (let i = 0; i < list.length; i++) {
    if (typeof list[i] !== 'number' || !Number.isFinite(list[i])) {
      throw new TypeError(`sum: element at index ${i} is not a finite number`);
    }
    t = add(t, list[i]);
  }
  return t;
}
