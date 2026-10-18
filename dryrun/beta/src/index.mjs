// beta: totals for the dry run's toy product, built on alpha.
import { sum } from '../../alpha/src/index.mjs';
import { word } from '../../setup-words/index.mjs';

// R1, R4: alpha.sum adds left to right and refuses an element that is not a finite number.
export function total(list) {
  return sum(list);
}

// R5: what a person reads for a list: its total, or why there is none (D15 plants the sentence inline).
export function describeTotal(list) {
  if (list.length === 0) return word('beta.total.empty');
  return String(total(list));
}
