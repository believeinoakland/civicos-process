// The process protocol as PROCESS-MECHANICS.md and roles/*.md state it today (bio K164, SUITE.md §4.3).
// A rule set exports: name, defaults, init(p), actions(s, p) -> [[actionName, nextState]], key(s),
// invariants {name: (s, p) -> true when it holds}, done(s), and the liveness names the engine checks.
// Sessions: S[i] = {r: 'R'|'B'|'J', m: module (job) or BOB number, md: mode, d: boot ticks, st: starts, na: needs_action, ar: archived}.
// Job modes: boot, work, long (long command), wait (ended its turn on a wait), idle (ended its turn), dead.
// Messages: M[j] = {i: model id (the protocol carries none), k: kind, fr: sender session (only where a rule reads it, else -1), to: session, m: module, v: version, a: age, f: fired}.
// Ghost state g records the history the invariants need, garbage-collected in key(); an action that breaks a
// TRANSITION invariant lists its name in t._v (not part of the state).

export const name = 'current';
export const defaults = { jobs: 3, layer2: 0, loss: 1, dup: 1, death: 1, long: 1, refuse: 1, revise: 1, change: 1, refresh: 1, spur: 1, faults: 1, maxBoot: 2, maxLat: 2 };

// The default run explores each bound set exhaustively and reports, per property, the shortest counterexample
// over them: every single fault (and a spurious restart) with 3 jobs; the takeover pair (a refresh whose
// START BOB is duplicated) with 1 job, since two faults over 3 jobs exceed a minute.
export const BOUND_SETS = [
  { set: 'single-fault' },
  { set: 'takeover-pair', jobs: 1, faults: 2, loss: 0, death: 0, long: 0, refuse: 0, revise: 0, change: 0, spur: 0 },
];
export const TRANSITION = ['contentInStateFirst', 'answerOncePerVersion', 'answerAppliedToItsVersion', 'closeClean', 'relayNeedsBob', 'noRestartOfLiveJob', 'oneBobPerStartBob', 'startOnce', 'handledOnce'];
export const LIVENESS = ['messagesHandled', 'layersClose'];

const layerOf = (p, m) => (m < p.jobs ? 0 : 1);
const nLayers = (p) => (p.layer2 ? 2 : 1);
const modsOf = (p, L) => Array.from({ length: p.jobs + (p.layer2 ? 1 : 0) }, (_, m) => m).filter((m) => layerOf(p, m) === L);

export function init(p) {
  const nm = p.jobs + (p.layer2 ? 1 : 0);
  return {
    L: 0, up: 0, done: 0, bob: 1, js: Array(nm).fill(-1),
    S: [{ r: 'R', m: 0, md: 'run', d: 0, st: 0, na: 0, ar: 0 }, { r: 'B', m: 1, md: 'lead', d: 0, st: 1, na: 0, ar: 0 }],
    R: Array.from({ length: nm }, () => ({ st: 0, q: 0, qo: 0, nd: 0, ch: 0, nw: 0, e: -1, ek: '' })),
    M: [], rq: [], nid: 0, _v: [],
    b: { loss: p.loss, dup: p.dup, death: p.death, long: p.long, refuse: p.refuse, revise: p.revise, change: p.change, refresh: p.refresh, spur: p.spur, f: p.faults },
    g: { av: [0, 0, 0], hd: [], chs: Array(nm).fill(0), sb: [], rl: Array(nm).fill(0) },
  };
}

const clone = (s) => ({
  ...s, _v: [], js: [...s.js], S: s.S.map((o) => ({ ...o })), R: s.R.map((o) => ({ ...o })), M: s.M.map((o) => ({ ...o })),
  rq: s.rq.map((o) => [...o]), b: { ...s.b },
  g: { ...s.g, av: [...s.g.av], hd: [...s.g.hd], chs: [...s.g.chs], sb: [...s.g.sb], rl: [...s.g.rl] },
});
const viol = (t, n) => t._v.push(n);
const booting = (s) => s.S.some((o) => o.md === 'boot' && o.d > 0);
// Canonical form: messages sorted by content and model ids renamed in order of appearance; ghost ids no longer
// reachable (no copy in flight, not a record entry the backstop may still read) are dropped.
export function key(s) {
  delete s._v;
  if (!booting(s)) s.M.forEach((x) => { x.a = 0; }); // time is observable only against a container start
  s.M.forEach((x) => { x.o = `${x.k},${x.fr},${x.to},${x.m},${x.v},${x.a},${x.f}`; });
  s.M.sort((a, b) => (a.o < b.o ? -1 : a.o > b.o ? 1 : 0)).forEach((x) => delete x.o);
  const alive = new Set([...s.M.map((x) => x.i), ...s.R.filter((r) => r.nw).map((r) => r.e)]);
  const ren = new Map(), id = (i) => { if (!ren.has(i)) ren.set(i, ren.size); return ren.get(i); };
  s.M.forEach((x) => { x.i = id(x.i); });
  s.R.forEach((r) => { r.e = alive.has(r.e) ? id(r.e) : -1; });
  s.g.hd = s.g.hd.filter((i) => alive.has(i)).map(id).sort((a, b) => a - b);
  s.g.sb = s.g.sb.filter((i) => alive.has(i)).map(id).sort((a, b) => a - b);
  s.nid = ren.size;
  return JSON.stringify(s);
}

// Trace labels name a message by kind and version: model ids are renamed in canonical form.
const ml = (x) => (x.k === 'Q' || x.k === 'A' ? `${x.k}v${x.v}` : x.k);
export const nm = (s, i) => { const o = s.S[i]; return o.r === 'R' ? 'ROOT' : o.r === 'B' ? `BOB${o.m}@${i}` : `J${o.m}@${i}`; };
const live = (o) => !o.ar && o.md !== 'dead';
const reads = (o) => (o.md === 'boot' ? (o.d > 0 ? 'idle' : 'running') : { work: 'running', long: 'idle', wait: 'blocked', idle: 'idle', dead: 'failed', lead: 'running', handoff: 'running', run: 'running' }[o.md]);
const activeBob = (s, i) => { const o = s.S[i]; return o.r === 'B' && !o.ar && (o.md === 'lead' || (o.md === 'handoff' && s.bob === i)); };
const inbox = (s, i) => s.M.filter((x) => x.f && x.to === i);

function send(s, fr, to, k, m, v, inState) {
  if (!inState) viol(s, 'contentInStateFirst');
  s.M.push({ i: s.nid, k, fr, to, m, v, a: 0, f: 0 });
  return s.nid++;
}
function handled(s, id) {
  if (s.g.hd.includes(id)) viol(s, 'handledOnce'); else s.g.hd.push(id);
}
const drop = (s, msg) => { s.M.splice(s.M.findIndex((x) => x.i === msg.i && x.f === 1 && x.to === msg.to), 1); };

// BOB answers the question its job's record holds now (§13 state drives; §6.3), stating no version (§13 has none).
function answer(s, i, m, id) {
  const r = s.R[m];
  if (s.g.av[r.q]) viol(s, 'answerOncePerVersion'); s.g.av[r.q] = 1;
  handled(s, id);
  send(s, -1, s.js[m], 'A', m, r.q, true);
  r.nw = 0;
}
// §16: BOB tells Bob at once; §5: a session reading blocked is relayed whether or not it said so.
function relay(s, m, id) {
  if (!s.R[m].nd) viol(s, 'relayNeedsBob');
  if (id !== undefined) handled(s, id);
  s.g.rl[m] = 1;
}
const can = (s, k) => s.b[k] > 0 && s.b.f > 0;
const spend = (t, k) => { t.b[k]--; t.b.f--; };
function newSession(s, o) { s.S.push({ d: 0, st: 0, na: 0, ar: 0, ...o }); return s.S.length - 1; }

export function actions(s, p) {
  const out = [];
  const add = (n, f) => { const t = clone(s); if (f(t) !== false) out.push([n, t]); };
  const boots = (f) => { for (let d = 0; d <= p.maxBoot; d++) f(d); };

  // ---- environment
  // Ticks: a routine fires 1..maxLat ticks after it is sent, a container starts d ticks after creation. Every
  // session step takes no time, so ages are kept only while a container is starting (key() drops them otherwise).
  const unfired = s.M.filter((x) => !x.f), bt = booting(s);
  if (bt && !unfired.some((x) => x.a >= p.maxLat))
    add('tick', (t) => { t.M.forEach((x) => { if (!x.f) x.a++; }); t.S.forEach((o) => { if (o.md === 'boot' && o.d > 0) o.d--; }); });
  s.M.forEach((x, j) => {
    if (x.f) return;
    const lbl = `${ml(x)} ${x.fr >= 0 ? nm(s, x.fr) : x.k === 'ST' ? 'ROOT' : 'QCB'.includes(x.k) ? `J${x.m}` : 'BOB'}->${nm(s, x.to)}`;
    if (x.a >= 1 || !bt) add(`fire ${lbl}`, (t) => { t.M[j].f = 1; t.M[j].a = 0; });
    if (can(s, 'loss')) add(`lose ${lbl}`, (t) => { spend(t, 'loss'); t.M.splice(j, 1); });
    if (can(s, 'dup')) add(`dup ${lbl}`, (t) => { spend(t, 'dup'); t.M.push({ ...t.M[j] }); });
  });

  s.S.forEach((o, i) => {
    if (o.ar) return;
    const n = nm(s, i);
    if (o.r === 'J') {
      const m = o.m, r = s.R[m];
      if (can(s, 'death') && ['work', 'wait', 'idle', 'long'].includes(o.md)) add(`die ${n}`, (t) => { spend(t, 'death'); t.S[i].md = 'dead'; });
      if (can(s, 'long') && o.md === 'work') add(`longCommand ${n}`, (t) => { spend(t, 'long'); t.S[i].md = 'long'; });
      if (o.md === 'long') add(`longCommandEnds ${n}`, (t) => { t.S[i].md = 'work'; });
      // §16: record NEEDS BOB, push, send BLOCKED: needs Bob, end the turn waiting (reads BLOCKED + needs_action).
      if (can(s, 'refuse') && o.md === 'work' && r.st !== 2) add(`refused ${n}`, (t) => {
        spend(t, 'refuse'); const R = t.R[m]; R.nd = 1; R.nw = 1; R.e = send(t, -1, t.bob, 'B', m, 0, true); R.ek = 'B'; t.S[i].md = 'wait'; t.S[i].na = 1;
      });
      // §6.3: the job revises its question in its record and asks again (the new message names no version, §13).
      if (can(s, 'revise') && m === 0 && r.qo && r.q === 1 && ['work', 'wait'].includes(o.md)) add(`reviseQuestion ${n}`, (t) => {
        spend(t, 'revise'); const R = t.R[m]; R.q = 2; R.nw = 1; R.e = send(t, -1, t.bob, 'Q', m, 2, true); R.ek = 'Q'; t.S[i].md = 'wait';
      });
      // §6.1: a new session starts from its creation prompt and its record.
      if (o.md === 'boot' && o.d === 0) add(`start ${n}`, (t) => {
        const T = t.S[i], R = t.R[m]; T.st = 1; if (!R.st) R.st = 1;
        T.md = R.qo ? 'wait' : R.st === 2 ? 'idle' : 'work';
      });
      if (o.md === 'work') {
        if (r.nd) add(`retryAct ${n}`, (t) => { t.R[m].nd = 0; });                       // §16, the act approved or no longer refused
        else if (m === 0 && !r.q) add(`ask ${n}`, (t) => {                                   // §6.3, §13: record first, then QUESTION
          const R = t.R[m]; R.q = 1; R.qo = 1; R.nw = 1; R.e = send(t, -1, t.bob, 'Q', m, 1, true); R.ek = 'Q'; t.S[i].md = 'wait';
        });
        else if (r.qo) add(`endTurnWaiting ${n}`, (t) => { t.S[i].md = 'wait'; });
        else if (r.st !== 2) add(`complete ${n}`, (t) => {                                  // §6.7: record, push, COMPLETE, end turn
          const R = t.R[m]; R.st = 2; R.nw = 1; R.e = send(t, -1, t.bob, 'C', m, R.ch, true); R.ek = 'C'; t.S[i].md = 'idle';
        });
        else add(`endTurn ${n}`, (t) => { t.S[i].md = 'idle'; });
      }
      if (['work', 'wait', 'idle'].includes(o.md)) inbox(s, i).forEach((x) => add(`handle ${ml(x)} at ${n}`, (t) => {
        const T = t.S[i], R = t.R[m]; drop(t, x);
        if (x.k === 'START') { if (T.st) viol(t, 'startOnce'); T.st = 1; }                    // §5 resume: a second first message
        else if (x.k === 'A') {                                                              // §6.3: bring the work in line with the answer
          if (x.v !== R.q) viol(t, 'answerAppliedToItsVersion');
          if (R.qo) { R.qo = 0; T.md = 'work'; }
        } else if (x.k === 'CH') { R.st = 1; R.ch++; T.md = 'work'; }                        // §5, §6.8: a CHANGE re-opens the job
      }));
    }

    if (o.r === 'R') {
      // roles/ROOT.md: check the handoff, create_session BOB #n+1, then answer STARTED to the sender.
      if (!s.rq.length) inbox(s, i).forEach((x) => boots((d) => add(`ROOT startsBob for SB (boot ${d})`, (t) => {
        drop(t, x); if (t.g.sb.includes(x.i)) viol(t, 'oneBobPerStartBob'); else t.g.sb.push(x.i);
        const b = newSession(t, { r: 'B', m: t.S[x.fr].m + 1, md: 'boot', d }); t.rq.push([x.fr, b]);
      })));
      if (s.rq.length) add(`ROOT sendsStarted to ${nm(s, s.rq[0][0])}`, (t) => { const [to] = t.rq.shift(); send(t, -1, to, 'ST', -1, 0, false); }); // ROOT never pushes (roles/ROOT.md)
    }

    if (o.r === 'B') {
      // §2, §13: the successor pushes its id into the plan's Status line before anything else.
      if (o.md === 'boot' && o.d === 0) add(`takeover ${n}`, (t) => { t.bob = i; t.S[i].md = 'lead'; t.S[i].st = 1; });
      // §2: once the successor has taken over, the predecessor does nothing more (its turns end at once).
      if (o.md === 'handoff' && s.bob !== i) inbox(s, i).forEach((x) => add(`ignore ${ml(x)} at ${n}`, (t) => { drop(t, x); }));
      if (!activeBob(s, i)) return;
      inbox(s, i).forEach((x) => add(`handle ${ml(x)} at ${n}`, (t) => {
        drop(t, x); const R = t.R[x.m];
        if (x.k === 'Q' && R && R.qo) answer(t, i, x.m, x.i);                               // §13: check state, then answer
        else if (x.k === 'B' && R && R.nd) relay(t, x.m, x.i);                               // §16
      }));
      if (s.up && !s.done) for (const m of modsOf(p, s.L)) {                                 // §5 backstop, every 20 min
        const r = s.R[m], j = s.js[m], J = s.S[j], rd = reads(J);
        if (r.nw && r.ek === 'Q' && r.qo) add(`${n} backstop answers record Qv${r.q} of J${m}`, (t) => answer(t, i, m, r.e));
        if (r.nw && r.ek === 'B' && r.nd) add(`${n} backstop relays record B of J${m}`, (t) => relay(t, m, r.e));
        if (rd === 'blocked' && !s.g.rl[m]) add(`${n} backstop relays blocked ${nm(s, j)} to Bob`, (t) => relay(t, m));
        const dead = rd === 'failed', quiet = rd === 'idle' && !r.nw;
        if (dead || (quiet && can(s, 'spur'))) {
          const mark = (t) => { if (!dead) { spend(t, 'spur'); viol(t, 'noRestartOfLiveJob'); } };
          if (quiet) add(`${n} backstop resumes ${nm(s, j)}`, (t) => { mark(t); send(t, -1, j, 'START', m, 0, true); t.R[m].nw = 0; });
          boots((d) => add(`${n} backstop restarts J${m} (boot ${d})`, (t) => { mark(t); t.js[m] = newSession(t, { r: 'J', m, md: 'boot', d }); }));
        }
        // §4, §13: a forwarded change, committed on the tranche branch first.
        if (can(s, 'change') && r.st === 2) add(`${n} sends CHANGE to ${nm(s, j)}`, (t) => { spend(t, 'change'); t.g.chs[m]++; send(t, -1, j, 'CH', m, 0, true); t.R[m].nw = 0; });
      }
      // §5 each layer, §6.1: all jobs of the layer created concurrently.
      if (!s.up && !s.done) {
        const mods = modsOf(p, s.L);
        const go = (k, ds) => {
          if (k === mods.length) return add(`${n} createsJobs L${s.L + 1} (boot ${ds.join(',')})`, (t) => {
            t.up = 1; mods.forEach((m, q) => { t.js[m] = newSession(t, { r: 'J', m, md: 'boot', d: ds[q] }); });
          });
          for (let d = 0; d <= p.maxBoot; d++) go(k + 1, [...ds, d]);
        };
        go(0, []);
      }
      // §5 close, roles/BOB.md: every record complete, no routine of BOB's into a job's session still enabled.
      if (s.up && !s.done) {
        const mods = modsOf(p, s.L), js = new Set(s.S.map((q, k) => (q.r === 'J' && mods.includes(q.m) ? k : -1)));
        const ok = mods.every((m) => s.R[m].st === 2 && !s.R[m].nd) && !s.M.some((x) => !x.f && ['A', 'CH', 'START'].includes(x.k) && js.has(x.to));
        if (ok) add(`${n} closesLayer L${s.L + 1}`, (t) => {
          if (t.M.some((x) => mods.includes(x.m)) || mods.some((m) => t.R[m].ch < t.g.chs[m])) viol(t, 'closeClean');
          js.forEach((k) => { if (k >= 0) t.S[k].ar = 1; });
          t.L++; t.up = 0; if (t.L === nLayers(p)) t.done = 1;
        });
      }
      // §2: push the handoff, then START BOB to ROOT (modelled mid-layer, where it matters); the predecessor goes on until the successor's takeover is pushed.
      if (o.md === 'lead' && o.m === 1 && can(s, 'refresh') && s.up) add(`${n} refreshes (START BOB to ROOT)`, (t) => {
        spend(t, 'refresh'); send(t, i, 0, 'SB', -1, 0, true); t.S[i].md = 'handoff';
      });
      // §2: the successor tells each earlier BOB to delete its own routines, and archives it once idle.
      if (o.md === 'lead') s.S.forEach((q, k) => {
        if (q.r === 'B' && q.m < o.m && !q.ar && !inbox(s, k).length) add(`${n} archives ${nm(s, k)}`, (t) => {
          t.M = t.M.filter((x) => x.to !== k || x.f); t.S[k].ar = 1;
        });
      });
    }
  });
  // §16: Bob approves the act in the refused session, once BOB has relayed it.
  s.R.forEach((r, m) => { const j = s.js[m]; if (j >= 0 && s.g.rl[m] && s.S[j].na && !s.S[j].ar) add(`Bob approves in ${nm(s, j)}`, (t) => { t.S[j].na = 0; t.R[m].nd = 0; t.S[j].md = 'work'; }); });
  return out;
}

export const done = (s) => !!s.done;

export const invariants = {
  oneLiveSessionPerModule: (s) => s.R.every((_, m) => s.S.filter((o) => o.r === 'J' && o.m === m && live(o)).length <= 1),
  exactlyOneBobAddress: (s) => s.S.filter((_, i) => activeBob(s, i)).length === 1,
  noMessageToArchived: (s) => !s.M.some((x) => s.S[x.to].ar),
};
// Liveness, checked by the engine: a terminal state holds no message (messagesHandled); done is reachable from every state (layersClose).
export const terminalOk = (s) => s.M.length === 0;
