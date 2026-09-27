import { extractionOf } from './a/index.mjs';
import { contentOf } from './b/index.mjs';
export class Store {
  constructor(ctx) {
    contentOf(ctx, { extraction: extractionOf(ctx) }).extraction.onReading("legacy-store", (e) => {
      const ex = this.observeExtraction(e);
      return { observed: { written: ex.written ?? 0, states: ex.states || [], reextraction: !!ex.reextraction } };
    });
  }
  observeExtraction(e) { return { written: e ? 1 : 0 }; }
  rows() { return []; }
}
