import { extractionOf } from './a/index.mjs';
export class Store {
  constructor(ctx) {
    extractionOf(ctx).onReading("legacy-store", (e) => {
      const staled = this.markContentStale(e.captureSha, e.chainAfter);
      const ex = this.observeExtraction(e);
      return { staled, observed: { written: ex.written ?? 0, states: ex.states || [], reextraction: !!ex.reextraction } };
    });
  }
  markContentStale(sha, chain) {
    const rows = this.rows(sha);
    for (const r of rows) r.stale = chain;
    return rows.length;
  }
  observeExtraction(e) { return { written: e ? 1 : 0 }; }
  rows() { return []; }
}
