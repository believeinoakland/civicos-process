// stats: statistics for the toy product; extracted from legacy (mean in D3, max and min in D4),
// and from catalog (distinct in D5).
import { sum } from '../../alpha/src/index.mjs';
import { word } from '../../setup-words/index.mjs';

// R1–R2: alpha.sum / length, 0 for an empty list; alpha.sum refuses a non-finite element.
export function mean(list) {
  const total = sum(list);
  return list.length ? total / list.length : 0;
}

// The extreme of a non-empty list of finite numbers, by a loop (no spread, so no argument limit).
// R8: an empty list is a RangeError first; an element that is not a finite number is a TypeError.
// `pick(x, m)` is Math.max or Math.min, so +0 and -0 come out as those give them.
function extreme(list, who, pick) {
  if (list.length === 0) throw new RangeError(`${who}: empty list`);
  let m;
  for (const x of list) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`NOT_FINITE ${who} ${String(x)}`);
    m = m === undefined ? x : pick(x, m);
  }
  return m;
}

// R4–R5, R8: the largest number in a non-empty list; an empty list is a RangeError.
export function max(list) {
  return extreme(list, 'max', Math.max);
}

// R6–R7, R8: the smallest number in a non-empty list; an empty list is a RangeError.
export function min(list) {
  return extreme(list, 'min', Math.min);
}

// R9: true when no two elements are the same value as a Set compares them (SameValueZero), by one
// pass that stops at the first repeat; an empty list is distinct.
export function distinct(list) {
  const seen = new Set();
  for (const x of list) {
    if (seen.has(x)) return false;
    seen.add(x);
  }
  return true;
}

// R10: the word table's sentence for the count and the mean of a list (the row stats.mean.of).
export function describeMean(list) {
  return word('stats.mean.of', { count: list.length, mean: mean(list) });
}

// R11: the middle value of the list sorted ascending, or for an even length the mean of the two middle values.
// An empty list is a RangeError first; an element that is not a finite number is a TypeError, as R8.
// The list is sorted as a copy, so the argument is not changed (R3).
export function median(list) {
  if (list.length === 0) throw new RangeError('median: empty list');
  for (const x of list) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`NOT_FINITE median ${String(x)}`);
  }
  const sorted = list.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : mean([sorted[mid - 1], sorted[mid]]);
}
