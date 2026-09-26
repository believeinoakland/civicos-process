// alpha: arithmetic for the dry run's toy product.
export function add(a, b) {
  return a + b;
}

// The sum of a list of finite numbers; refuses (TypeError) the first element that is not one.
export function sum(list) {
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    if (!Number.isFinite(list[i])) throw new TypeError(`sum: element at index ${i} is not a finite number`);
    total += list[i];
  }
  return total;
}
