// The scenario asserter (dryrun/cert/SUITE.md §4 item 4): reads a run's manifest `run.json`, the git state of a
// product directory, its records and metrics CSV, and the run's snapshots (raw `get_session` and
// `list_triggers(include_completed)` output), and judges each scenario the run names by the predicate registered
// under its SUITE id. Prints `<id> PASS|FAIL|UNOBSERVED <reason>` per scenario; exits 1 on any FAIL, or on an
// UNOBSERVED among the run's `required` ids.
// Usage: node checks/cert/assert.mjs <run.json> [product-dir]
//
// run.json (paths relative to its own directory):
//   { "run": "R1", "tranche": "T1",
//     "sessions": [{ "id": "session_…", "role": "ROOT|BOB|job|harness", "name": "ALPHA #1", "module": "alpha",
//                    "prompt": true }],            // prompt: created with a first message in create_session's prompt
//     "current_bob": "session_…",                   // else the plan's Status line
//     "scenarios": ["A4", …], "required": [ … ],
//     "snapshots": ["snap-1.json", …],             // { taken_at, get_session: [raw…], list_triggers: [raw…] }
//     "injections": [{ "fault": "archive|duplicate|…", "target": "session_…", "time": "…" }],
//     "relays": [{ "job": "session_…|module", "time": "…", "act": "…" }],   // relays to Bob the harness saw
//     "product": "…", "csv": "…" or ["…"], "plan": "…", "records": { "<module>": "…" } }   // file overrides of git
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseMessageLine, parseRecord, parsePlanStatus, parseCsv } from './records.mjs';

const SLACK_MS = 3 * 60e3;
const BACKSTOP_MS = 20 * 60e3;
const t = (x) => (x ? Date.parse(x) : NaN);

// ---- reading the run ----

const unwrapSession = (x) => x?.ccr ?? x?.session ?? x;
const unwrapTriggers = (x) => (Array.isArray(x) ? x : x?.data ?? x?.triggers ?? []);
const promptOf = (tr) => tr.derived_state?.prompt ?? tr.prompt ?? '';
const firedAt = (tr) => tr.last_run?.fired_at ?? tr.last_fired_at ?? null;
export const isArchived = (s) => /ARCHIVED/i.test(s.session_status ?? s.status ?? '') || s.archived === true;

export function loadRun(runPath, productDir) {
  const dir = dirname(resolve(runPath));
  const run = JSON.parse(readFileSync(runPath, 'utf8'));
  const rel = (p) => resolve(dir, p);
  const product = productDir ? resolve(productDir) : run.product ? rel(run.product) : null;
  const snaps = (run.snapshots || []).map((p) => {
    const s = JSON.parse(readFileSync(rel(p), 'utf8'));
    return {
      file: p, taken_at: s.taken_at, current_bob: s.current_bob, layer_running: s.layer_running !== false,
      sessions: (s.get_session || []).map(unwrapSession),
      triggers: (s.list_triggers || []).flatMap(unwrapTriggers),
    };
  }).sort((a, b) => t(a.taken_at) - t(b.taken_at));
  const git = product ? (args) => execFileSync('git', ['-C', product, ...args], { encoding: 'utf8', maxBuffer: 256 << 20 }) : null;
  const ref = (branch) => {
    if (!git) return null;
    for (const r of [`origin/${branch}`, branch]) { try { git(['rev-parse', '--verify', '--quiet', `${r}^{commit}`]); return r; } catch {} }
    return null;
  };
  const show = (r, path) => { try { return r ? git(['show', `${r}:${path}`]) : null; } catch { return null; } };
  const T = run.tranche;
  const file = (p) => (p && existsSync(rel(p)) ? readFileSync(rel(p), 'utf8') : null);
  const tranche = T ? ref(`tranche/${T}`) : null;
  // `csv` may name several files: a BOB's BOB-final row is written under the tranche it worked in (§10).
  const csvTexts = run.csv ? [].concat(run.csv).map(file) : [show(tranche, `build/metrics/${T}.csv`)];
  const planText = run.plan ? file(run.plan) : show(tranche, 'build/plan/current.md') ?? show(tranche, `build/plan/archive/${T}.md`);
  const sessions = run.sessions || [];
  const moduleOf = (id) => sessions.find((s) => s.id === id)?.module;
  // A job's record: the run's override, else its job branch, else the tranche branch; `at` reads it as it stood then.
  const record = (module, at) => {
    if (run.records?.[module]) return file(run.records[module]);
    const path = `build/jobs/${T}/${module}.md`;
    for (const r of [ref(`job/${T}/${module}`), tranche]) {
      if (!r) continue;
      if (at) {
        const c = git(['log', '-1', `--before=${at}`, '--format=%H', r, '--', path]).trim();
        if (c) return show(c, path);
        continue;
      }
      const x = show(r, path);
      if (x) return x;
    }
    return null;
  };
  // Every trigger seen, keyed by id, as last seen; `seen` lists the snapshots it appears in.
  const triggers = new Map();
  snaps.forEach((s, i) => { for (const tr of s.triggers) triggers.set(tr.id, { ...tr, seen: [...(triggers.get(tr.id)?.seen || []), i] }); });
  const plan = planText ? parsePlanStatus(planText) : null;
  const currentBob = run.current_bob ?? plan?.bob?.id ?? null;
  return { run, dir, product, git, ref, tranche, snaps, sessions, moduleOf, record, csv: csvTexts.some(Boolean) ? { rows: csvTexts.filter(Boolean).flatMap((x) => parseCsv(x).rows) } : null, planText, plan, currentBob, triggers: [...triggers.values()] };
}

// When a session was archived: an injection that archived it, else the `updated_at` of the first snapshot that shows
// it archived (get_session carries no archive time; an archived session is not updated after, measured T5–T6).
export function archivedAt(S, id) {
  const inj = (S.run.injections || []).filter((x) => /archive/i.test(x.fault) && x.target === id).map((x) => t(x.time));
  for (const s of S.snaps) {
    const o = s.sessions.find((x) => x.id === id);
    if (o && isArchived(o)) return Math.min(t(o.updated_at) || t(s.taken_at), ...inj);
  }
  return inj.length ? Math.min(...inj) : Infinity;
}
const observed = (S, id) => S.snaps.some((s) => s.sessions.some((x) => x.id === id)) || (S.run.injections || []).some((x) => x.target === id);
const latest = (S, id) => { for (let i = S.snaps.length - 1; i >= 0; i--) { const o = S.snaps[i].sessions.find((x) => x.id === id); if (o) return o; } return null; };

// A trigger's first line as a message (SUITE §0: a trigger whose prompt's first line matches the grammar), or null.
export function messageOf(tr) {
  const line = promptOf(tr).split('\n')[0];
  if (!line.startsWith('From ')) return null;
  const m = parseMessageLine(line);
  return m.kinds ? { ...m, line } : null;
}
// A backstop (§5, K128): a one-time routine into BOB's own session that is not a message. Its first line has no
// defined grammar (C14): T5 wrote "Backstop check (…)", T6 "BACKSTOP (T6, layer n): …" as a reminder.
export const isBackstop = (tr) => !messageOf(tr) && (/backstop/i.test(promptOf(tr).split('\n')[0]) || /backstop/i.test(tr.name || ''));

const res = (status, reason) => ({ status, reason });
const PASS = (r) => res('PASS', r), FAIL = (r) => res('FAIL', r), UNOBSERVED = (r) => res('UNOBSERVED', r);
const short = (id) => (id ? `…${id.slice(-6)}` : '?');
const nameOf = (S, id) => S.sessions.find((s) => s.id === id)?.name || latest(S, id)?.title || short(id);

// ---- the predicates, keyed by SUITE.md id ----

// Messages whose target was archived when they fired (or is archived while they are still enabled).
function toArchived(S, list) {
  const bad = [];
  let judged = 0;
  for (const tr of list) {
    const target = tr.persistent_session_id;
    if (!target || !observed(S, target)) continue;
    judged++;
    const a = archivedAt(S, target);
    const f = t(firedAt(tr));
    if (!Number.isNaN(f) ? f >= a : (tr.enabled && a < Infinity)) bad.push(`${tr.id} → ${nameOf(S, target)} ${Number.isNaN(f) ? 'still enabled' : `fired ${firedAt(tr)}`}, archived ${new Date(a).toISOString()}`);
  }
  return { bad, judged };
}

export const PREDICATES = {
  // A4 (F4): every trigger from ROOT reaches a live session that reads it (the successor it names), none deleted unfired.
  A4(S) {
    const fromRoot = S.triggers.filter((tr) => /^ROOT/.test(messageOf(tr)?.sender || ''));
    if (!fromRoot.length) return UNOBSERVED('no trigger from ROOT in any snapshot');
    const { bad } = toArchived(S, fromRoot);
    for (const tr of fromRoot) {
      const m = messageOf(tr);
      if (m.named && tr.persistent_session_id !== m.named.id) bad.push(`${tr.id} (${m.line}) targets ${nameOf(S, tr.persistent_session_id)}, not the successor it names`);
      const last = tr.seen.at(-1);
      if (last < S.snaps.length - 1 && !firedAt(tr) && tr.enabled) bad.push(`${tr.id} deleted unfired (last seen in ${S.snaps[last].file})`);
    }
    return bad.length ? FAIL(bad.join('; ')) : PASS(`${fromRoot.length} trigger(s) from ROOT, each to a live successor`);
  },

  // A5: the plan's Status names exactly one id, the current BOB's, at depth 1, equal to its parent chain's length;
  // with git, the BOB's first commit on the tranche branch changes only the Status line.
  A5(S) {
    if (!S.plan) return UNOBSERVED('no plan (no product git and no "plan" in run.json)');
    const bad = [];
    const p = S.plan;
    if (p.ids.length !== 1) bad.push(`Status names ${p.ids.length} session ids`);
    if (!p.bob) bad.push('Status has no "BOB #<n> · <id> · depth <d>"');
    else {
      if (p.bob.depth !== 1) bad.push(`Status depth ${p.bob.depth}, not 1`);
      if (S.run.current_bob && p.bob.id !== S.run.current_bob) bad.push(`Status names ${short(p.bob.id)}, the current BOB is ${short(S.run.current_bob)}`);
      let d = 0, id = p.bob.id, o = latest(S, id);
      while (o && o.parent_session_id) { d++; id = o.parent_session_id; o = latest(S, id); }
      if (o) { if (d !== p.bob.depth) bad.push(`parent chain of ${short(p.bob.id)} has length ${d}, Status says ${p.bob.depth}`); }
      else if (d === 0 && !latest(S, p.bob.id)) bad.push(`${short(p.bob.id)} is in no snapshot, so its depth is unread`);
      if (S.git && S.tranche) {
        const log = S.git(['log', '--reverse', '--format=%H%x09%B%x1e', S.tranche]).split('\x1e').map((x) => x.trim()).filter(Boolean);
        const first = log.find((x) => x.includes(p.bob.id));
        if (!first) bad.push(`no commit on ${S.tranche} carries ${short(p.bob.id)}'s session`);
        else {
          const c = first.split('\t')[0];
          const files = S.git(['diff-tree', '--no-commit-id', '--name-only', '-r', c]).split('\n').filter(Boolean);
          const diff = S.git(['diff', '-U0', `${c}^`, c, '--', 'build/plan/current.md']).split('\n').filter((l) => /^[+-](?![+-])/.test(l));
          if (files.join() !== 'build/plan/current.md' || diff.some((l) => !/^[+-]\*\*Status\*\*/.test(l))) bad.push(`its first commit ${c.slice(0, 10)} changes more than the Status line (${files.join(', ')})`);
        }
      }
    }
    return bad.length ? FAIL(bad.join('; ')) : PASS(`Status: BOB #${p.bob.n} · ${short(p.bob.id)} · depth 1${S.git ? ', taken over by a Status-only commit' : ''}`);
  },

  // B2 (F1): each job gets exactly one first message (its creation prompt, plus every START routine), and its start
  // is confirmed in the plan's Jobs line.
  B2(S) {
    const jobs = S.sessions.filter((s) => s.role === 'job');
    if (!jobs.length) return UNOBSERVED('run.json names no job session');
    const bad = [], ok = [];
    for (const j of jobs) {
      const starts = S.triggers.filter((tr) => tr.persistent_session_id === j.id && messageOf(tr)?.kinds.includes('START'));
      const n = (j.prompt === false ? 0 : 1) + starts.length;
      if (n !== 1) bad.push(`${j.name || short(j.id)}: ${n} first messages (${j.prompt === false ? 'no creation prompt' : 'creation prompt'}${starts.length ? ` + START ${starts.map((x) => x.id).join(', ')}` : ''})`);
      else ok.push(j.name || short(j.id));
      if (S.plan && !(S.plan.jobs || '').includes(j.id)) bad.push(`${j.name || short(j.id)}: its start is not confirmed in the plan's Jobs line`);
    }
    return bad.length ? FAIL(bad.join('; ')) : PASS(`one first message each: ${ok.join(', ')}`);
  },

  // D3/D4 (F3): per question id, exactly one ANSWER (trigger and tranche commit); a late or duplicate delivery adds none.
  D3(S) { return oneAnswerPerId(S); },
  D4(S) { return oneAnswerPerId(S); },

  // D9 (F4): no message targets a session archived when it fires.
  D9(S) {
    const msgs = S.triggers.filter((tr) => messageOf(tr));
    const { bad, judged } = toArchived(S, msgs);
    if (!judged) return UNOBSERVED('no message targets a session seen in a snapshot');
    return bad.length ? FAIL(bad.join('; ')) : PASS(`${judged} of ${msgs.length} messages judged (their target observed), none to an archived session`);
  },

  // E1 (F2): no relay to Bob for a job whose record held no open NEEDS BOB line then.
  E1(S) {
    if (!S.run.relays) return UNOBSERVED('relays to Bob leave no durable state (X7); run.json lists none');
    const bad = [];
    for (const r of S.run.relays) {
      const module = S.moduleOf(r.job) ?? r.job;
      const text = S.record(module, r.time);
      const open = text ? parseRecord(text).open : [];
      if (!open.length) bad.push(`relay for ${module} at ${r.time}${r.act ? ` (${r.act})` : ''}: its record had no open "NEEDS BOB: <act>, <why>"`);
    }
    return bad.length ? FAIL(bad.join('; ')) : PASS(`${S.run.relays.length} relay(s), each on an open NEEDS BOB line`);
  },

  // G4: each archived session has one CSV row, usage equal to its archived usage, a job's Size equal to its record's;
  // no enabled trigger targets it once archived.
  G4(S) {
    if (!S.csv) return UNOBSERVED('no metrics CSV');
    const mine = new Set(S.sessions.map((s) => s.id));
    const archived = [...new Set(S.snaps.flatMap((s) => s.sessions.filter(isArchived).map((x) => x.id)))].filter((id) => !mine.size || mine.has(id));
    if (!archived.length) return UNOBSERVED('no archived session of the run in any snapshot');
    const bad = [];
    const KEYS = [['cache_read', 'cache_read_tokens'], ['cache_write', 'cache_write_tokens'], ['input', 'input_tokens'], ['output', 'output_tokens']];
    for (const id of archived) {
      const o = S.snaps.map((s) => s.sessions.find((x) => x.id === id && isArchived(x))).find(Boolean);
      const u = o.external_metadata?.usage ?? o.usage;
      const rows = S.csv.rows.filter((r) => r.session === id);
      const who = nameOf(S, id);
      if (rows.length !== 1) { bad.push(`${who}: ${rows.length} CSV rows`); continue; }
      const r = rows[0];
      if (!u) bad.push(`${who}: its snapshot carries no usage`);
      else for (const [c, k] of KEYS) if (String(u[k]) !== r[c]) bad.push(`${who}: ${c} ${r[c]} in the CSV, ${u[k]} archived`);
      const module = S.moduleOf(id) ?? (r.role === 'job' ? r.module : null);
      if (r.role === 'job' && module) {
        const text = S.record(module);
        const size = text && parseRecord(text).size;
        if (size && (String(size.testRuns) !== r.test_runs || String(size.moduleLines) !== r.module_lines)) bad.push(`${who}: CSV test_runs ${r.test_runs}, module_lines ${r.module_lines}; record Size ${size.testRuns}, ${size.moduleLines}`);
      }
      const a = archivedAt(S, id);
      for (const s of S.snaps) if (t(s.taken_at) >= a) for (const tr of s.triggers) if (tr.enabled && tr.persistent_session_id === id) bad.push(`${who}: trigger ${tr.id} enabled while it is archived (${s.file})`);
    }
    return bad.length ? FAIL([...new Set(bad)].join('; ')) : PASS(`${archived.length} archived session(s), each one row with its archived usage`);
  },

  // H6 (K128): at every snapshot taken while a layer runs, exactly one enabled backstop targets the current BOB,
  // due within 20 min + SLACK.
  H6(S) {
    const snaps = S.snaps.filter((s) => s.layer_running);
    if (!snaps.length) return UNOBSERVED('no snapshot taken while a layer runs');
    const bad = [];
    for (const s of snaps) {
      const bob = s.current_bob ?? S.currentBob;
      if (!bob) { bad.push(`${s.file}: no current BOB`); continue; }
      const b = s.triggers.filter((tr) => tr.enabled && tr.persistent_session_id === bob && isBackstop(tr));
      if (b.length !== 1) bad.push(`${s.file}: ${b.length} enabled backstops into ${nameOf(S, bob)}`);
      for (const tr of b) if (t(tr.run_once_at) > t(s.taken_at) + BACKSTOP_MS + SLACK_MS) bad.push(`${s.file}: backstop ${tr.id} due ${tr.run_once_at}, later than 20 min + SLACK`);
      const other = s.triggers.filter((tr) => tr.enabled && isBackstop(tr) && tr.persistent_session_id !== bob);
      for (const tr of other) bad.push(`${s.file}: backstop ${tr.id} enabled into ${nameOf(S, tr.persistent_session_id)}, not the current BOB`);
    }
    return bad.length ? FAIL(bad.join('; ')) : PASS(`${snaps.length} snapshot(s), one backstop into the current BOB in each`);
  },
};
// D9 and A4 share their rule with A6's first half; H6 is also H2's "a backstop into the successor, none into p".

function oneAnswerPerId(S) {
  const msgs = S.triggers.map((tr) => ({ tr, m: messageOf(tr) })).filter((x) => x.m);
  const questions = msgs.filter((x) => x.m.kinds.includes('QUESTION'));
  if (!questions.length) return UNOBSERVED('no QUESTION in any snapshot');
  if (!msgs.some((x) => x.m.id)) return UNOBSERVED(`${msgs.length} messages, none with an id= (X3): "handled once" is undecidable`);
  const bad = [];
  const ids = [...new Set(questions.map((x) => x.m.id).filter(Boolean))];
  const noId = questions.filter((x) => !x.m.id).length;
  if (noId) bad.push(`${noId} QUESTION(s) without an id`);
  const log = S.git && S.tranche ? S.git(['log', '--format=%B%x1e', S.tranche]).split('\x1e') : null;
  for (const q of ids) {
    const answers = msgs.filter((x) => x.m.kinds.includes('ANSWER') && (x.m.re || '').split('@')[0] === q);
    if (answers.length > 1) bad.push(`${q}: ${answers.length} ANSWER triggers (${answers.map((x) => x.tr.id).join(', ')})`);
    if (log) {
      const commits = log.filter((b) => new RegExp(`\\bre=${q.replace(/[.#]/g, '\\$&')}(@\\d+)?\\b`).test(b)).length;
      if (commits > 1) bad.push(`${q}: ${commits} answer commits on ${S.tranche}`);
    }
  }
  return bad.length ? FAIL(bad.join('; ')) : PASS(`${ids.length} question id(s), at most one answer each`);
}

export function assertRun(runPath, productDir) {
  const S = loadRun(runPath, productDir);
  const out = [];
  for (const id of S.run.scenarios || []) {
    const p = PREDICATES[id];
    let r;
    try { r = p ? p(S) : UNOBSERVED('no predicate for this scenario yet'); } catch (e) { r = FAIL(`predicate error: ${e.message}`); }
    out.push({ id, ...r });
  }
  const required = new Set(S.run.required || []);
  const failed = out.some((r) => r.status === 'FAIL' || (r.status === 'UNOBSERVED' && required.has(r.id)));
  return { results: out, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [runPath, product] = process.argv.slice(2);
  if (!runPath) { console.error('usage: node checks/cert/assert.mjs <run.json> [product-dir]'); process.exit(2); }
  const { results, failed } = assertRun(runPath, product);
  for (const r of results) console.log(`${r.id} ${r.status} ${r.reason}`);
  process.exitCode = failed ? 1 : 0;
}
