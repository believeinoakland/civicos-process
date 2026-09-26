// legacy: the toy's legacy module, emptied by extraction (PROCESS-MECHANICS §12).
import { checkList } from '../catalog/index.mjs';
import { max, min } from '../stats/src/index.mjs';

// The spread of a list: its largest element less its smallest.
export function range(list) {
  return max(list) - min(list);
}

// The findings the catalogue makes about a list.
export function validate(list) {
  return checkList(list);
}
