// beta: totals for the dry run's toy product, built on alpha.
import { add } from '../../alpha/src/index.mjs';

export function total(list) {
  let t = 0;
  for (const x of list) t = add(t, x);
  return t;
}
