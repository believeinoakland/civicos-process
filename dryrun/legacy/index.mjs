// legacy: the toy's legacy module, emptied by extraction (PROCESS-MECHANICS §12).
export function mean(list) {
  let t = 0;
  for (const x of list) t += x;
  return list.length ? t / list.length : 0;
}

export function max(list) {
  return Math.max(...list);
}
