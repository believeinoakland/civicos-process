// The process protocol as the K164 revision of PROCESS-MECHANICS.md and roles/*.md states it (bio K164, K167;
// SUITE.md §4.3). Same interface as rules-current.mjs; every guarded action cites its § and *K164* rule.
// Sessions: S[i] = {r: 'R'|'B'|'J', m: module (job) or BOB number, md, d: boot ticks, st: started, na: needs_action,
//   ar: archived, sbn: START BOB sends (BOB), nr: NEEDS BOB start ROOT (BOB)}.
// Job modes: boot, work, long, wait, idle, hung (ended its turn with its record WORKING, the H4 fault), dead.
// BOB modes: boot, lead, handoff (sent START BOB, leads until its successor takes over), dead.
// Per module, R[m] holds the job record (sid: the session its Status names; st 0/1/2 = none/WORKING/COMPLETE;
// q: id of the question's newest version; qo: open; qr: revised; nd: open NEEDS BOB; rn: RUNNING until;
// sj: sent J<n>; hb: handled B<n>; ch: CHANGEs processed; jl: its message entries above BOB's mark) and BOB's plan
// entry for the job (pj: handled J<n>; sb: sent B<n>; bl: BOB's committed messages above the job's mark; rl: relay
// to Bob recorded; rz: id of the RESUME sent while quiet). Messages: M[j] = {i: logical id (a re-send or a
// duplicate keeps it), k, fr, to, m, n: protocol id, re, a: age, f: fired}.
// The model's timing: a routine fires within 2 minutes, a container starts in under 15, so at a 20-minute check
// every earlier routine has fired or is lost ("no copy in flight") and every new session has taken its first turn.

export const name = 'revised';
export const defaults = { jobs: 3, layer2: 0, loss: 1, dup: 1, death: 1, long: 1, refuse: 1, revise: 1, change: 1, refresh: 1, hang: 1, bobDeath: 1, bkLoss: 1, rootRefuse: 1, faults: 1, maxBoot: 2, maxLat: 2 };
const BUDGETS = ['loss', 'dup', 'death', 'long', 'refuse', 'revise', 'change', 'refresh', 'hang', 'bobDeath', 'bkLoss', 'rootRefuse'];
const none = Object.fromEntries(BUDGETS.map((k) => [k, 0]));

// Every single fault with 3 jobs; the takeover faults in pairs (a duplicated or refused START BOB, a BOB death)
// with 1 job; every pair of faults with 1 job (a lost ANSWER to a revised question, a CHANGE crossing a lost
// COMPLETE, ...); two layers; and BOB's backstop lost with two messages (a lost WAKE, then a lost QUESTION).
export const BOUND_SETS = [
  { set: 'single-fault' },
  { set: 'takeover-pair', jobs: 1, faults: 2, ...none, refresh: 1, dup: 1, rootRefuse: 1, bobDeath: 1, loss: 1 },
  { set: 'job-pair', jobs: 1, faults: 2, refresh: 0, rootRefuse: 0, bobDeath: 0 },
  { set: 'two-layers', jobs: 1, layer2: 1, faults: 1 },
  { set: 'backstop-triple', jobs: 1, faults: 3, ...none, loss: 2, dup: 1, bkLoss: 1 },
];
export const TRANSITION = ['contentInStateFirst', 'answerOncePerVersion', 'answerAppliedToItsVersion', 'closeClean', 'relayNeedsBob', 'noRestartOfLiveJob', 'oneBobPerStartBob', 'startOnce', 'handledOnce'];
export const LIVENESS = ['messagesHandled', 'layersClose'];

const layerOf = (p, m) => (m < p.jobs ? 0 : 1);
const nLayers = (p) => (p.layer2 ? 2 : 1);
const modsOf = (p, L) => Array.from({ length: p.jobs + (p.layer2 ? 1 : 0) }, (_, m) => m).filter((m) => layerOf(p, m) === L);
// Negative controls: `off` names rules to switch off (model.mjs --off a,b); each must then break the property it
// carries (checks/test/model.test.mjs). Never set in a certifying run.
export const RULES = ['markIgnore', 'newestVersion', 'confirmStart', 'recordQuiet', 'archiveFirst', 'resend', 'ackClose', 'rootDedupe', 'watch', 'relayByRecord', 'watchAtOpen', 'wakeMovesWatch', 'restartReads'];
let OFF = new Set();
const on = (r) => !OFF.has(r);
const rec0 = () => ({ sid: -1, st: 0, q: 0, qo: 0, qr: 0, nd: 0, rn: 0, sj: 0, hb: 0, ch: 0, jl: [], pj: 0, sb: 0, bl: [], rl: 0, rz: 0 });

export function init(p) {
  const nm = p.jobs + (p.layer2 ? 1 : 0);
  return {
    L: 0, up: 0, done: 0, bob: 1, w: (p.off || []).includes('watchAtOpen') ? -1 : 1, bk: 1, rs: [1], js: Array(nm).fill(-1),
    S: [{ r: 'R', m: 0, md: 'run', d: 0, st: 0, na: 0, ar: 0 }, { r: 'B', m: 1, md: 'lead', d: 0, st: 1, na: 0, ar: 0, sbn: 0, nr: 0 }],
    R: Array.from({ length: nm }, rec0), M: [], _v: [],
    b: Object.fromEntries([...BUDGETS.map((k) => [k, p[k] ?? 0]), ['f', p.faults]]),
    g: { av: [], hd: [], chs: Array(nm).fill(0), sb: [1] },
  };
}

const clone = (s) => ({
  ...s, _v: [], js: [...s.js], rs: [...s.rs], S: s.S.map((o) => ({ ...o })),
  R: s.R.map((o) => ({ ...o, jl: o.jl.map((e) => ({ ...e })), bl: o.bl.map((e) => ({ ...e })) })),
  M: s.M.map((o) => ({ ...o })), b: { ...s.b }, g: { ...s.g, av: [...s.g.av], hd: [...s.g.hd], chs: [...s.g.chs], sb: [...s.g.sb] },
});
const viol = (t, n) => t._v.push(n);
const booting = (s) => s.S.some((o) => o.md === 'boot' && o.d > 0);
export function key(s) {
  delete s._v;
  if (!booting(s)) s.M.forEach((x) => { x.a = 0; });
  const o = (x) => `${x.i},${x.k},${x.fr},${x.to},${x.a},${x.f}`;
  s.M.sort((a, b) => (o(a) < o(b) ? -1 : o(a) > o(b) ? 1 : 0));
  s.g.av.sort(); s.g.hd.sort(); s.g.sb.sort();
  return JSON.stringify(s);
}

export const nm = (s, i) => { const o = s.S[i]; return o.r === 'R' ? 'ROOT' : o.r === 'B' ? `BOB${o.m}@${i}` : `J${o.m}@${i}`; };
const KIND = { Q: 'QUESTION', C: 'COMPLETE', B: 'BLOCKED', A: 'ANSWER', CH: 'CHANGE', RZ: 'RESUME', SB: 'START BOB', RF: 'REFUSED', WK: 'WAKE' };
const ml = (x) => `${KIND[x.k]}${x.n ? ` ${'QCB'.includes(x.k) ? 'J' : 'B'}${x.n}` : ''}${x.re ? ` re J${x.re}` : ''}`;
const live = (o) => !o.ar && o.md !== 'dead';
// §2, §13: BOB's address is the plan's Status line; a BOB acts while it leads, or after START BOB until its successor takes over.
const activeBob = (s, i) => { const o = s.S[i]; return o.r === 'B' && !o.ar && (o.md === 'lead' || (o.md === 'handoff' && s.bob === i)); };
const inbox = (s, i) => s.M.filter((x) => x.f && x.to === i);
const inFlight = (s, id) => s.M.some((x) => x.i === id);
// §6.1: the record's state, as its Status line names it.
const recState = (R) => (R.nd ? 'NEEDS BOB' : R.qo ? 'WAITING ON BOB' : R.rn ? 'RUNNING' : R.st === 2 ? 'COMPLETE' : 'WORKING');
const confirmed = (s, m) => s.js[m] >= 0 && s.R[m].sid === s.js[m];

function send(s, fr, to, k, m, n, re, i, inState) {
  if (!inState) viol(s, 'contentInStateFirst');
  s.M.push({ i, k, fr, to, m, n, re, a: 0, f: 0 });
}
function handled(s, id) { if (s.g.hd.includes(id)) viol(s, 'handledOnce'); else s.g.hd.push(id); }
const drop = (s, msg) => { s.M.splice(s.M.findIndex((x) => x.i === msg.i && x.f === 1 && x.to === msg.to), 1); };
const can = (s, k) => s.b[k] > 0 && s.b.f > 0;
const spend = (t, k) => { t.b[k]--; t.b.f--; };
function newSession(s, o) { s.S.push({ d: 0, st: 0, na: 0, ar: 0, ...o }); return s.S.length - 1; }

// §13 (*K164*): a job writes the message in its record under its envelope and pushes, then sends it to the address
// in the plan's Status line.
function jobSends(t, m, k) {
  const R = t.R[m]; R.sj++; R.jl.push({ n: R.sj, k });
  send(t, -1, t.bob, k, m, R.sj, 0, `J${m}.${R.sj}`, true);
  return R.sj;
}
// §13 (*K164*): BOB commits the message to the tranche branch (envelope as subject, `sent` mark), pushes, then sends.
function bobSends(t, m, k, re = 0) {
  const R = t.R[m]; R.sb++; R.bl.push({ n: R.sb, k, re });
  if (k !== 'ST') send(t, -1, t.js[m], k, m, R.sb, re, `B${m}.${R.sb}`, true);
  return R.sb;
}
// §13 (*K164*), §6.3: the job reads every BOB message to it above its `handled` mark, in id order, and moves the
// mark; an ANSWER is applied only to the question's newest version, else handled and not applied.
function jobReads(t, m) {
  const R = t.R[m], out = { applied: 0, change: 0, resume: 0 };
  for (const e of R.bl) {
    handled(t, `B${m}.${e.n}`);
    if (e.k === 'A') {
      const apply = R.qo && (e.re === R.q || !on('newestVersion'));
      if (apply) { if (e.re !== R.q) viol(t, 'answerAppliedToItsVersion'); R.qo = 0; out.applied = 1; }
    } else if (e.k === 'CH') { R.st = 1; R.ch++; out.change = 1; }
    else if (e.k === 'RZ') out.resume = 1;
    R.hb = e.n;
  }
  R.bl = [];
  return out;
}
// §13, §5 (*K164*): BOB reads the job's record above the plan's `handled` mark and moves it; it answers a question
// only at its newest version (§6.3), once; it relays an open NEEDS BOB line once, recording the relay (§16).
function bobReads(t, m) {
  const R = t.R[m];
  for (const e of R.jl) {
    handled(t, `J${m}.${e.n}`);
    if (e.k === 'Q' && e.n === R.q && R.qo) {
      const key = `${m}.${e.n}`;
      if (t.g.av.includes(key)) viol(t, 'answerOncePerVersion'); else t.g.av.push(key);
      bobSends(t, m, 'A', e.n);
    }
  }
  R.pj = R.sj; R.jl = [];
  if (R.nd && !R.rl) relay(t, m);
}
function relay(t, m) { if (!t.R[m].nd) viol(t, 'relayNeedsBob'); t.R[m].rl = 1; }

export function actions(s, p) {
  OFF = new Set(p.off || []);
  const out = [];
  const add = (n, f) => { const t = clone(s); if (f(t) !== false) out.push([n, t]); };
  const boots = (f) => { for (let d = 0; d <= p.maxBoot; d++) f(d); };

  // ---- environment: ticks, firing, loss and duplication of a routine (as rules-current.mjs).
  const unfired = s.M.filter((x) => !x.f), bt = booting(s);
  if (bt && !unfired.some((x) => x.a >= p.maxLat))
    add('tick', (t) => { t.M.forEach((x) => { if (!x.f) x.a++; }); t.S.forEach((o) => { if (o.md === 'boot' && o.d > 0) o.d--; }); });
  s.M.forEach((x, j) => {
    if (x.f) return;
    const lbl = `${ml(x)} ${x.fr >= 0 ? nm(s, x.fr) : 'QCB'.includes(x.k) ? `J${x.m}` : x.k === 'RF' || x.k === 'WK' ? 'ROOT' : 'BOB'}->${nm(s, x.to)}`;
    if (x.a >= 1 || !bt) add(`fire ${lbl}`, (t) => { t.M[j].f = 1; t.M[j].a = 0; });
    if (can(s, 'loss')) add(`lose ${lbl}`, (t) => { spend(t, 'loss'); t.M.splice(j, 1); });
    if (can(s, 'dup')) add(`dup ${lbl}`, (t) => { spend(t, 'dup'); t.M.push({ ...t.M[j] }); });
  });
  // §5 (*K164*): BOB's own backstop routine is lost (it then checks nothing until woken).
  if (!s.done && s.bk && can(s, 'bkLoss')) add('lose BOB backstop', (t) => { spend(t, 'bkLoss'); t.bk = 0; });
  // §2, §5 (*K164*, X5): the WATCH into ROOT fires only when BOB has not moved it for an hour: BOB dead, or its backstop lost.
  if (s.w >= 0 && on('watch')) {
    const W = s.S[s.w], n = nm(s, s.w);
    if (W.md === 'dead' || W.ar) {
      if (!s.rs.includes(W.m + 1)) boots((d) => add(`WATCH ${n} fires: ROOT starts BOB${W.m + 1} (boot ${d})`, (t) => {
        if (t.g.sb.includes(W.m + 1)) viol(t, 'oneBobPerStartBob'); else t.g.sb.push(W.m + 1);
        t.rs.push(W.m + 1); newSession(t, { r: 'B', m: W.m + 1, md: 'boot', d, sbn: 0, nr: 0 }); t.w = -1;
      }));
      else add(`WATCH ${n} fires: BOB${W.m + 1} already started`, (t) => { t.w = -1; });
    } else if (!s.bk && !inFlight(s, `WK${W.m}`)) add(`WATCH ${n} fires: ROOT sends WAKE, moves WATCH`, (t) => { send(t, -1, t.w, 'WK', -1, 0, 0, `WK${W.m}`, true); if (!on('wakeMovesWatch')) t.w = -1; });
  }

  s.S.forEach((o, i) => {
    if (o.ar) return;
    const n = nm(s, i);
    if (o.r === 'J') {
      const m = o.m, r = s.R[m];
      if (can(s, 'death') && ['boot', 'work', 'wait', 'idle', 'long', 'hung'].includes(o.md)) add(`die ${n}`, (t) => { spend(t, 'death'); t.S[i].md = 'dead'; });
      // §6.1 (*K164*, X6): RUNNING until <time> pushed before a long command; the model assumes the command ends by then.
      if (can(s, 'long') && o.md === 'work') add(`longCommand ${n}`, (t) => { spend(t, 'long'); t.S[i].md = 'long'; t.R[m].rn = 1; });
      if (o.md === 'long') add(`longCommandEnds ${n}`, (t) => { t.S[i].md = 'work'; t.R[m].rn = 0; });
      // H4: a job ends its turn with nothing pending and its record WORKING.
      if (can(s, 'hang') && o.md === 'work' && recState(r) === 'WORKING') add(`hang ${n}`, (t) => { spend(t, 'hang'); t.S[i].md = 'hung'; });
      // §16: record NEEDS BOB, push, send BLOCKED J<n>: needs Bob, wait (needs_action).
      if (can(s, 'refuse') && o.md === 'work' && r.st !== 2 && !r.nd) add(`refused ${n}`, (t) => {
        spend(t, 'refuse'); t.R[m].nd = jobSends(t, m, 'B'); t.S[i].md = 'wait'; t.S[i].na = 1;
      });
      // §6.3 (*K164*): a revised question is a new QUESTION that replaces the old id.
      if (can(s, 'revise') && m === 0 && r.qo && !r.qr && ['work', 'wait'].includes(o.md)) add(`reviseQuestion ${n}`, (t) => {
        spend(t, 'revise'); const R = t.R[m]; R.qr = 1; R.q = jobSends(t, m, 'Q'); t.S[i].md = 'wait';
      });
      // §6.1 (*K164*, F1): the first act pushes the Status (session id, handled = the START id), which confirms the
      // start; a restart first reads every BOB message above the record's mark (§13).
      if (o.md === 'boot' && o.d === 0) add(`start ${n}`, (t) => {
        const T = t.S[i], R = t.R[m]; T.st = 1; R.sid = i; if (!R.st) R.st = 1;
        if (on('restartReads')) jobReads(t, m); else { R.hb = R.sb; R.bl = []; }
        T.md = R.qo ? 'wait' : R.st === 2 ? 'idle' : 'work';
      });
      if (o.md === 'work') {
        if (r.nd) add(`retryAct ${n}`, (t) => { t.R[m].nd = 0; t.R[m].rl = 0; });
        else if (m === 0 && !r.q) add(`ask ${n}`, (t) => { const R = t.R[m]; R.q = jobSends(t, m, 'Q'); R.qo = 1; t.S[i].md = 'wait'; });
        else if (r.qo) add(`endTurnWaiting ${n}`, (t) => { t.S[i].md = 'wait'; });
        else if (r.st !== 2) add(`complete ${n}`, (t) => { t.R[m].st = 2; jobSends(t, m, 'C'); t.S[i].md = 'idle'; }); // §6.7: COMPLETE, handled B<hb>
        else add(`endTurn ${n}`, (t) => { t.S[i].md = 'idle'; });
      }
      if (['work', 'wait', 'idle', 'hung'].includes(o.md)) inbox(s, i).forEach((x) => add(`handle ${ml(x)} at ${n}`, (t) => {
        const T = t.S[i], R = t.R[m]; drop(t, x);
        if (x.n <= R.hb && on('markIgnore')) return;                                         // §13: at or below the mark, ignored
        if (!on('markIgnore')) R.bl = [{ n: x.n, k: x.k, re: x.re }];
        const e = jobReads(t, m);
        if (e.change || e.applied || (e.resume && T.md === 'hung')) T.md = 'work';
      }));
    }

    if (o.r === 'R') {
      // roles/ROOT.md, §2 (*K164*, X4, F4): START BOB for a BOB already started is ignored; else start it, sending
      // nothing back; one it cannot carry out is answered REFUSED (its loss changes nothing: the requester acts on
      // silence as on REFUSED).
      inbox(s, i).forEach((x) => {
        const b = s.S[x.fr].m + 1;
        if (s.rs.includes(b) && on('rootDedupe')) return add(`ROOT ignores START BOB for BOB${b}`, (t) => { drop(t, x); });
        boots((d) => add(`ROOT startsBob BOB${b} (boot ${d})`, (t) => {
          drop(t, x); if (t.g.sb.includes(b)) viol(t, 'oneBobPerStartBob'); else t.g.sb.push(b);
          t.rs.push(b); newSession(t, { r: 'B', m: b, md: 'boot', d, sbn: 0, nr: 0 });
        }));
        if (can(s, 'rootRefuse')) add(`ROOT refuses START BOB for BOB${b}`, (t) => { spend(t, 'rootRefuse'); drop(t, x); send(t, -1, x.fr, 'RF', -1, 0, 0, `RF${b}`, true); });
      });
    }

    if (o.r === 'B') {
      // §2 (*K164*, X10, X11): the successor pushes its takeover, arms its backstop and its WATCH (deleting its
      // predecessor's), and reads every running job's record (the backstop's reading below).
      if (o.md === 'boot' && o.d === 0) add(`takeover ${n}`, (t) => {
        t.bob = i; t.S[i].md = 'lead'; t.S[i].st = 1; if (!t.done) { t.w = i; t.bk = 1; }
      });
      if (!o.ar && o.md !== 'dead' && !activeBob(s, i) && o.md !== 'boot') inbox(s, i).forEach((x) => add(`ignore ${ml(x)} at ${n}`, (t) => { drop(t, x); }));
      if (!activeBob(s, i)) return;
      if (can(s, 'bobDeath') && !s.done) add(`die ${n}`, (t) => { spend(t, 'bobDeath'); t.S[i].md = 'dead'; });
      inbox(s, i).forEach((x) => add(`handle ${ml(x)} at ${n}`, (t) => {
        drop(t, x);
        if (x.k === 'WK') { if (!t.done) { t.bk = 1; t.w = i; } return; }                   // §2: WAKE is a backstop check
        if (x.k === 'RF') { t.S[i].nr = 1; return; }                                         // §2: NEEDS BOB: start ROOT
        if (x.n > t.R[x.m].pj) bobReads(t, x.m);                                             // §13
      }));
      // §5 (*K164*): the backstop, every 20 min while a layer runs; the record first, the session second.
      if (s.up && !s.done && s.bk) for (const m of modsOf(p, s.L)) {
        const r = s.R[m], j = s.js[m], J = s.S[j];
        if (!on('relayByRecord') && J.md === 'wait' && !r.rl) add(`${n} backstop relays blocked ${nm(s, j)} to Bob`, (t) => relay(t, m));
        if (r.jl.length || (r.nd && !r.rl)) add(`${n} backstop reads record of J${m}`, (t) => bobReads(t, m));
        const newest = r.bl.at(-1);
        // §5 (*K164*, lost ANSWER): the record's `handled` still below the plan's `sent` at a check ⇒ the newest message again, same id.
        if (on('resend') && confirmed(s, m) && live(J) && newest && newest.k !== 'ST' && !inFlight(s, `B${m}.${newest.n}`))
          add(`${n} backstop re-sends ${KIND[newest.k]} B${newest.n} to ${nm(s, j)}`, (t) => { send(t, -1, j, newest.k, m, newest.n, newest.re, `B${m}.${newest.n}`, true); });
        // §5 (*K164*, X6): quiet = confirmed, not running, record WORKING, nothing pushed for 20 min.
        const quiet = (confirmed(s, m) || !on('confirmStart')) && ['idle', 'hung', 'wait', 'long', ...(on('confirmStart') ? [] : ['boot'])].includes(J.md) && (recState(r) === 'WORKING' || (!on('recordQuiet') && r.st !== 2));
        if (quiet && !r.rz) add(`${n} backstop resumes ${nm(s, j)}`, (t) => {
          if (!confirmed(t, m)) viol(t, 'startOnce');
          if (J.md !== 'hung') viol(t, 'noRestartOfLiveJob');
          t.R[m].rz = bobSends(t, m, 'RZ');
        });
        // §5 (*K164*, X12): restart a failed session, or one still quiet after RESUME; archive the old one first.
        const failed = J.md === 'dead', stillQuiet = quiet && r.rz && !inFlight(s, `B${m}.${r.rz}`) && !inbox(s, j).length;
        if (failed || stillQuiet) boots((d) => add(`${n} backstop archives ${nm(s, j)} and restarts J${m} (boot ${d})`, (t) => {
          if (!['dead', 'hung'].includes(J.md)) viol(t, 'noRestartOfLiveJob');
          if (on('archiveFirst')) { t.M = t.M.filter((x) => x.to !== j); t.S[j].ar = 1; }
          t.js[m] = newSession(t, { r: 'J', m, md: 'boot', d }); t.R[m].rz = 0; bobSends(t, m, 'ST');
        }));
        // §4, §13: a forwarded change, committed on the tranche branch first.
        if (can(s, 'change') && r.st === 2) add(`${n} sends CHANGE to ${nm(s, j)}`, (t) => { spend(t, 'change'); t.g.chs[m]++; bobSends(t, m, 'CH'); });
      }
      // §5 each layer, §6.1 (*K164*): all jobs of the layer created concurrently, each prompt START B1.
      if (!s.up && !s.done) {
        const mods = modsOf(p, s.L);
        const go = (k, ds) => {
          if (k === mods.length) return add(`${n} createsJobs L${s.L + 1} (boot ${ds.join(',')})`, (t) => {
            t.up = 1; if (t.w < 0 && !t.done) t.w = i; mods.forEach((m, q) => { t.js[m] = newSession(t, { r: 'J', m, md: 'boot', d: ds[q] }); bobSends(t, m, 'ST'); });
          });
          for (let d = 0; d <= p.maxBoot; d++) go(k + 1, [...ds, d]);
        };
        go(0, []);
      }
      // §5 (*K164*, X16): close when every record is COMPLETE with `handled` at the plan's `sent`, BOB has handled
      // every job message, no NEEDS BOB is open, and no routine to or from the layer's sessions is left.
      if (s.up && !s.done) {
        const mods = modsOf(p, s.L), js = new Set(s.S.map((q, k) => (q.r === 'J' && mods.includes(q.m) ? k : -1)));
        const ok = mods.every((m) => { const R = s.R[m]; return R.st === 2 && (R.hb >= R.sb || !on('ackClose')) && R.pj >= R.sj && !R.nd; }) && !s.M.some((x) => mods.includes(x.m));
        if (ok) add(`${n} closesLayer L${s.L + 1}`, (t) => {
          if (t.M.some((x) => mods.includes(x.m)) || mods.some((m) => t.R[m].ch < t.g.chs[m])) viol(t, 'closeClean');
          js.forEach((k) => { if (k >= 0) t.S[k].ar = 1; });
          t.g.hd = t.g.hd.filter((h) => !mods.includes(Number(h.slice(1).split('.')[0])));
          t.L++; t.up = 0; if (t.L === nLayers(p)) { t.done = 1; t.w = -1; t.bk = 0; }
        });
      }
      // §2 (*K164*): push the handoff, then START BOB to ROOT; lead on until the successor's takeover.
      if (o.md === 'lead' && o.m === 1 && can(s, 'refresh') && s.up) add(`${n} refreshes (START BOB to ROOT)`, (t) => {
        spend(t, 'refresh'); send(t, i, 0, 'SB', -1, 0, 0, `SB${o.m}`, true); t.S[i].md = 'handoff'; t.S[i].sbn = 1;
      });
      // §2 (*K164*, X4): no takeover 20 min after START BOB ⇒ send it once more; after a second silence NEEDS BOB: start ROOT.
      if (o.md === 'handoff' && !o.nr && !inFlight(s, `SB${o.m}`) && !s.S.some((q) => q.r === 'B' && q.m === o.m + 1 && q.md === 'boot')) {
        if (o.sbn === 1) add(`${n} re-sends START BOB`, (t) => { send(t, i, 0, 'SB', -1, 0, 0, `SB${o.m}`, true); t.S[i].sbn = 2; });
        else add(`${n} NEEDS BOB: start ROOT`, (t) => { t.S[i].nr = 1; });
      }
      // §2: the successor archives each earlier BOB once idle or failed, deleting every routine into it.
      if (o.md === 'lead') s.S.forEach((q, k) => {
        if (q.r === 'B' && q.m < o.m && !q.ar && (q.md === 'dead' || !inbox(s, k).length)) add(`${n} archives ${nm(s, k)}`, (t) => {
          t.M = t.M.filter((x) => x.to !== k); t.S[k].ar = 1;
        });
      });
    }
  });
  // §16: Bob approves the act in the refused session, once BOB has relayed it.
  s.R.forEach((r, m) => { const j = s.js[m]; if (j >= 0 && r.rl && s.S[j].na && !s.S[j].ar && s.S[j].md !== 'dead') add(`Bob approves in ${nm(s, j)}`, (t) => { t.S[j].na = 0; t.R[m].nd = 0; t.R[m].rl = 0; t.S[j].md = 'work'; }); });
  return out;
}

export const done = (s) => !!s.done;

export const invariants = {
  oneLiveSessionPerModule: (s) => s.R.every((_, m) => s.S.filter((o) => o.r === 'J' && o.m === m && live(o)).length <= 1),
  // One address: the BOBs acting, plus the addressed BOB when it has died (its Status still names it until a successor takes over).
  exactlyOneBobAddress: (s) => s.S.filter((o, i) => activeBob(s, i) || (s.bob === i && !o.ar && o.md === 'dead')).length === 1,
  noMessageToArchived: (s) => !s.M.some((x) => s.S[x.to].ar),
};
export const terminalOk = (s) => s.M.length === 0;
