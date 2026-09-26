// legacy: the toy's legacy module, emptied by extraction (PROCESS-MECHANICS §12).
export function max(list) {
  return Math.max(...list);
}

export function min(list) {
  let m = Infinity;
  for (const x of list) {
    if (x < m) m = x;
  }
  return m;
}

// The spread of a list: its largest element less its smallest.
export function range(list) {
  return max(list) - min(list);
}
