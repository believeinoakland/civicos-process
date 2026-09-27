// STUB (bio K164): the revised mechanics' rule set, to be written by the revision's designer.
// It must export the same interface as rules-current.mjs (name, defaults, init, actions, key, invariants,
// done, terminalOk, LIVENESS), each guarded action citing the revised mechanics' §.
// Until then it re-exports the current rules, so `--rules revised` reports the current findings.
export * from './rules-current.mjs';
export const name = 'revised (stub: current rules)';
