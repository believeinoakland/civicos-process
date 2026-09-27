// gamma: scaling of numbers for the dry run's toy product, built on alpha.
import { add } from '../../alpha/src/index.mjs';

// R1, R2: alpha.add(x, x), which refuses anything that is not a finite number.
export function double(x) {
  return add(x, x);
}

// R4: 3 * x by alpha.add, which refuses anything that is not a finite number (ruling D9-K1).
// x + x is exact, so (x + x) + x rounds once, exactly as 3 * x does. When x + x overflows,
// 3 * x overflows to the same infinity, and add would refuse it as an argument, so it is returned.
export function triple(x) {
  const d = add(x, x);
  return Number.isFinite(d) ? add(d, x) : d;
}
