// gamma: scaling of numbers for the dry run's toy product, built on alpha.
import { add } from '../../alpha/src/index.mjs';

// R1, R2: alpha.add(x, x), which refuses anything that is not a finite number.
export function double(x) {
  return add(x, x);
}
