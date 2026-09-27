// Explicit-state model of the process protocol, explored exhaustively by BFS (bio K164; dryrun/cert/SUITE.md §4.3).
// node checks/cert/model.mjs [--rules current|revised] [--set <bound set>] [--<bound> n ...]   exits 1 on any violation.
// For each invariant: PASS, or the shortest counterexample (action names). Liveness: messagesHandled (no terminal
// state holds a message) and layersClose (the tranche's close is reachable from every reachable state).
import { pathToFileURL } from 'node:url';
import * as current from './rules-current.mjs';
import * as revised from './rules-revised.mjs';

export const RULES = { current, revised };

export function explore(rules, bounds = {}, { maxStates = 5e6 } = {}) {
  const p = { ...rules.defaults, ...bounds };
  const t0 = Date.now();
  const index = new Map(), keys = [], parent = [], via = [], succ = [], off = [0];
  const names = Object.keys(rules.invariants), first = {}; // name -> [state id, action or null]
  const intern = (s) => {
    const k = rules.key(s);
    let id = index.get(k);
    if (id === undefined) { id = keys.length; index.set(k, id); keys.push(k); }
    return id;
  };
  intern(rules.init(p)); parent.push(-1); via.push(null);
  const doneAt = [], terminalBad = [];
  for (let id = 0; id < keys.length; id++) {
    if (keys.length > maxStates) throw new Error(`more than ${maxStates} states`);
    const s = JSON.parse(keys[id]);
    for (const n of names) if (!(n in first) && !rules.invariants[n](s, p)) first[n] = [id, null];
    if (rules.done(s)) doneAt.push(id);
    const next = rules.actions(s, p);
    if (!next.length && !rules.terminalOk(s)) terminalBad.push(id);
    for (const [a, t] of next) {
      for (const n of t._v) if (!(n in first)) first[n] = [id, a];
      const before = keys.length, c = intern(t);
      if (c === before) { parent.push(id); via.push(a); }
      succ.push(c);
    }
    off.push(succ.length);
  }
  // layersClose: reverse reachability from the done states.
  const n = keys.length, rev = Array.from({ length: n }, () => []), ok = new Uint8Array(n);
  for (let i = 0; i < n; i++) for (let e = off[i]; e < off[i + 1]; e++) rev[succ[e]].push(i);
  const q = [...doneAt]; q.forEach((i) => { ok[i] = 1; });
  while (q.length) for (const j of rev[q.pop()]) if (!ok[j]) { ok[j] = 1; q.push(j); }
  const stuck = ok.indexOf(0);
  if (terminalBad.length) first.messagesHandled = [terminalBad[0], null];
  if (stuck >= 0) first.layersClose = [stuck, null];
  const trace = ([id, a]) => { const t = a ? [a] : []; for (; parent[id] >= 0; id = parent[id]) t.push(via[id]); return t.reverse(); };
  const results = {};
  for (const name of [...names, ...rules.TRANSITION, ...rules.LIVENESS]) results[name] = name in first ? trace(first[name]) : null;
  return { rules: rules.name, bounds: p, states: n, transitions: succ.length, ms: Date.now() - t0, results };
}

// Every bound set of the rules (or the one given), each explored whole; per property the shortest counterexample.
export function certify(rules, overrides = {}) {
  const sets = (overrides.set ? rules.BOUND_SETS.filter((b) => b.set === overrides.set) : rules.BOUND_SETS).map((b) => ({ ...b, ...overrides }));
  const runs = sets.map((b) => explore(rules, b)), results = {};
  for (const r of runs) for (const [k, t] of Object.entries(r.results)) {
    const prev = results[k];
    if (!(k in results) || (t && (!prev || t.length < prev.trace.length))) results[k] = t ? { set: r.bounds.set, trace: t } : null;
  }
  const sum = (f) => runs.reduce((a, r) => a + r[f], 0);
  return { rules: rules.name, runs: runs.map((r) => ({ set: r.bounds.set, states: r.states, ms: r.ms })), states: sum('states'), transitions: sum('transitions'), ms: sum('ms'), results };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2), bounds = {};
  let rules = 'current';
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i].replace(/^--/, '');
    if (k === 'rules') rules = argv[i + 1]; else bounds[k] = k === 'set' ? argv[i + 1] : Number(argv[i + 1]);
  }
  if (!RULES[rules]) { console.error(`unknown rules ${rules}`); process.exit(2); }
  const r = certify(RULES[rules], bounds);
  let bad = 0;
  for (const [name, c] of Object.entries(r.results)) {
    if (!c) { console.log(`${name}: PASS`); continue; }
    bad++;
    console.log(`${name}: FAIL (${c.trace.length} steps, bound set ${c.set})\n  ${c.trace.join('\n  ')}`);
  }
  for (const x of r.runs) console.log(`bound set ${x.set}: ${x.states} states, ${(x.ms / 1000).toFixed(1)} s`);
  console.log(`model --rules ${r.rules}: ${r.states} states, ${r.transitions} transitions, ${(r.ms / 1000).toFixed(1)} s; ${bad} of ${Object.keys(r.results).length} properties violated`);
  process.exit(bad ? 1 : 0);
}
