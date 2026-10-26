// D19
// D19 change
// beta: totals for the dry run's toy product, built on alpha.
import { sum } from '../../alpha/src/index.mjs';

// R1, R4: alpha.sum adds left to right and refuses an element that is not a finite number.
export function total(list) {
  return sum(list);
}
