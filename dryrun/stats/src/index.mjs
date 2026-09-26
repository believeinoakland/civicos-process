// stats: statistics for the toy product; extracted from legacy (mean in D3, max and min in D4).
import { sum } from '../../alpha/src/index.mjs';

// R1–R2: alpha.sum / length, 0 for an empty list; alpha.sum refuses a non-finite element.
export function mean(list) {
  const total = sum(list);
  return list.length ? total / list.length : 0;
}

// The extreme of a non-empty list of finite numbers, by a loop (no spread, so no argument limit).
// An empty list is a RangeError; an element that is not a finite number is a TypeError (QUESTION 1).
// `pick(x, m)` is Math.max or Math.min, so +0 and -0 come out as those give them.
function extreme(list, who, pick) {
  if (list.length === 0) throw new RangeError(`${who}: empty list`);
  let m;
  for (const x of list) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`${who}: not a finite number: ${String(x)}`);
    m = m === undefined ? x : pick(x, m);
  }
  return m;
}

// R4–R5: the largest number in a non-empty list; an empty list is a RangeError.
export function max(list) {
  return extreme(list, 'max', Math.max);
}

// R6–R7: the smallest number in a non-empty list; an empty list is a RangeError.
export function min(list) {
  return extreme(list, 'min', Math.min);
}
