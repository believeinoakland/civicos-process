// stats: statistics for the toy product; extracted from legacy during D3.
import { sum } from '../../alpha/src/index.mjs';

// R1–R2: alpha.sum / length, 0 for an empty list; alpha.sum refuses a non-finite element.
export function mean(list) {
  const total = sum(list);
  return list.length ? total / list.length : 0;
}
