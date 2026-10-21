// beta: totals for the dry run's toy product, built on alpha.
import { sum } from '../../alpha/src/index.mjs';

// R1, R4: alpha.sum adds left to right and refuses an element that is not a finite number.
// R5: a list that is not an array is refused here, naming total, before alpha.sum would name sum.
export function total(list) {
  if (!Array.isArray(list)) throw new TypeError(`total: not an array: ${typeof list}`);
  return sum(list);
}
