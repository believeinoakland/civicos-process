// beta: totals for the dry run's toy product, built on alpha.
import { add } from '../../alpha/src/index.mjs';

export function total(list) {
  let t = 0;
  for (const x of list) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`total: not a finite number: ${String(x)}`);
    t = add(t, x);
  }
  return t;
}
