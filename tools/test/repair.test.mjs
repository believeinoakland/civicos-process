// lane-process-repair Phase 1 (bio K5791; lane-process-repair/CHARTER.md): the first aid, against a real remote seeded
// with the dry run's toy product, as tools/test/proc.test.mjs does. a: one background command merges a list of COMPLETE
// jobs, upstream first, and a hand-written wait on a proc process is refused; b: the Stop check is one fetch with no
// deepening; c: every create_session proc prints starts on whole history with large files left out; d: merged job and
// prep branches go to the prune-branches workflow as a request; e: a new module's first job fills its own empty row;
// f: a BOB another has taken over writes nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../proc.mjs';
import { preReason, stopReason } from '../hooks.mjs';
import { fillModuleRow, rowFill } from '../../checks/lib.mjs';
import { checkOwnership } from '../../checks/ownership.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), TOY = join(HERE, '..', '..', 'dryrun');
const T = 'P1', B1 = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB', B2 = 'session_01DDDDDDDDDDDDDDDDDDDDDDDD';
const J1 = 'session_01AAAAAAAAAAAAAAAAAAAAAAAA', J2 = 'session_01CCCCCCCCCCCCCCCCCCCCCCCC';
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const ident = (d, n) => { for (const [k, v] of [['user.name', n], ['user.email', `${n}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v); };
const O = (product, extra = {}) => ({ product, tranche: T, ...extra });
const REPORT = 'Applied.\n**Evidence**\n- `node --test` → tests 1, pass 1\n**Met** · none\n';

function world(plan = '## Layer 1\n\n**alpha**\n- N1 · Add `alpha/src/a.txt`.\n\n**beta**\n- N2 · Add `beta/src/b.txt`.\n', seedEdit = null) {
  const base = mkdtempSync(join(tmpdir(), 'repair-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const seed = join(base, 'seed');
  execFileSync('git', ['clone', '-q', origin, seed], { stdio: 'ignore' }); ident(seed, 'seed');
  cpSync(TOY, join(seed, 'toy'), { recursive: true });
  writeFileSync(join(seed, 'toy/build/plan/current.md'), `# Plan ${T}\n\n**Status** · OPEN · BOB #1 · ${B1.replace('B', 'E')} · depth 1\n`);
  if (seedEdit) seedEdit(join(seed, 'toy'));
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/tranche/${T}`);
  const bobRoot = join(base, 'bob');
  execFileSync('git', ['clone', '-q', '-b', `tranche/${T}`, origin, bobRoot], { stdio: 'ignore' }); ident(bobRoot, 'bob');
  const planFile = join(base, 'round.md');
  writeFileSync(planFile, plan);
  return { base, origin, seed, bob: join(bobRoot, 'toy'), bobRoot, plan: planFile };
}
// BOB opens the round and starts layer 1; each named job is started and given its session.
function started(w, mods) {
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  mods.forEach(([m, s]) => P.jobStarted(O(w.bob, { module: m, name: `${m.toUpperCase()} #1`, session: s })));
}
function job(w, m, s) {
  const d = join(w.base, `job-${m}`);
  execFileSync('git', ['clone', '-q', '-b', `job/${T}/${m}`, w.origin, d], { stdio: 'ignore' }); ident(d, m);
  const dir = join(d, 'toy');
  P.jobStart(O(dir, { module: m, session: s, depth: 2 }));
  return { root: d, dir };
}
function complete(w, m, s, file, extra = {}) {
  const j = job(w, m, s);
  writeFileSync(join(j.dir, file), `${m}\n`);
  g(j.root, 'add', '.'); g(j.root, 'commit', '-qm', `${m}: its entry`);
  const rep = join(w.base, `report-${m}.md`); writeFileSync(rep, REPORT);
  P.jobComplete(O(j.dir, { module: m, reportFile: rep, ...extra }));
  return j;
}
const exitCode = (fn) => { const before = process.exitCode; try { return fn(); } finally { process.exitCode = before; } };

// ---- a ----

test('a: merge --modules merges the named COMPLETE jobs in modules.json order, one commit each; a refused one is reported and the rest go on; `ready` finds them', () => {
  const w = world();
  started(w, [['alpha', J1], ['beta', J2]]);
  complete(w, 'alpha', J1, 'alpha/src/a.txt');
  complete(w, 'beta', J2, 'beta/src/b.txt');
  const pre = g(w.bobRoot, 'rev-parse', 'HEAD');
  const r = P.merge(O(w.bob, { modules: 'beta,alpha', context: 7 }));
  assert.deepEqual(r.order, ['alpha', 'beta']);   // upstream first: beta uses alpha
  assert.deepEqual(r.merged.map((x) => x.module), ['alpha', 'beta']);
  assert.deepEqual([r.refused, r.left], [[], []]);
  assert.equal(g(w.bobRoot, 'rev-list', '--count', '--first-parent', `${pre}..HEAD`), '2');
  assert.equal(g(w.bobRoot, 'rev-parse', 'HEAD'), g(w.bobRoot, 'rev-parse', `origin/tranche/${T}`));
  assert.deepEqual(P.status(O(w.bob)).jobs.map((j) => [j.module, j.merged, j.needs]), [['alpha', true, []], ['beta', true, []]]);
  // nothing is ready now; naming a merged job again is refused as already merged, never merged twice
  assert.deepEqual(P.merge(O(w.bob, { modules: 'ready' })).order, []);
  const again = exitCode(() => P.merge(O(w.bob, { modules: 'alpha' })));
  assert.match(again.refused[0].why, /alpha: already merged/);
  assert.throws(() => P.merge(O(w.bob, { modules: 'gamma' })), /no module gamma/);
  assert.throws(() => P.merge(O(w.bob, { modules: 'alpha', with: 'beta' })), /takes no --with/);
});

test('a: a refused job in a list does not stop the others', () => {
  const w = world();
  started(w, [['alpha', J1], ['beta', J2]]);
  const a = job(w, 'alpha', J1);   // alpha stays WORKING
  P.jobState(O(a.dir, { module: 'alpha', set: 'WAITING: a question' }));
  complete(w, 'beta', J2, 'beta/src/b.txt');
  const r = exitCode(() => P.merge(O(w.bob, { modules: 'alpha,beta' })));
  assert.deepEqual(r.merged.map((x) => x.module), ['beta']);
  assert.match(r.refused[0].why, /alpha: its record reads WAITING/);
});

test('a: a hand-written wait on a proc process is refused for every role; reading, committing and running proc are not', () => {
  const bash = (role, command, ti = {}) => preReason(role, { tool_name: 'Bash', tool_input: { command, ...ti } }, { tranche: T, module: 'alpha' });
  const waits = [
    'while pgrep -f "proc.mjs merge" >/dev/null; do sleep 5; done; echo done',   // BOB #332's loop: it finds itself
    'pgrep -fa proc.mjs',
    'until [ ! -f /home/user/bio/.git/civicos-running.json ]; do sleep 10; done',
    'sleep 120 && node /home/user/civicos-process/tools/proc.mjs status --product bio --tranche T53',
    'node tools/proc.mjs status --tranche T53; sleep 30',
    'pidof node && cat .git/civicos-running.json',
    'for i in 1 2 3; do node tools/proc.mjs status --tranche T53 | grep MERGE && break; sleep 60; done',
  ];
  for (const role of ['bob', 'job']) for (const c of waits) assert.match(bash(role, c, { run_in_background: true }) || '', /hand-written wait/, `${role}: ${c}`);
  const fine = [
    'node tools/proc.mjs status --product bio --tranche T53',
    'git commit -qm "proc: while a merge runs, nothing else writes"',
    'grep -n "while" tools/proc.mjs',
    'cat .git/civicos-running.json',
    'for m in a b; do node tools/proc.mjs job state --module $m --set WORKING --tranche T53; done',
    'sleep 5',   // a wait on nothing of proc's is not this rule's
  ];
  for (const c of fine) assert.equal(bash('bob', c), null, c);
});

// ---- b ----

test('b: the Stop check fetches once and never deepens a shallow clone; it names the owed acts; status needs no deepening on a full clone', () => {
  const w = world();
  started(w, [['alpha', J1], ['beta', J2]]);
  complete(w, 'alpha', J1, 'alpha/src/a.txt');
  // a shallow BOB checkout (a session started before item c)
  const sh = join(w.base, 'shallow');
  execFileSync('git', ['clone', '-q', '--depth', '1', '-b', `tranche/${T}`, `file://${w.origin}`, sh], { stdio: 'ignore' }); ident(sh, 'bob');
  writeFileSync(join(sh, '.git', 'civicos-role.json'), JSON.stringify({ role: 'bob', product: 'toy', tranche: T, session: B1 }));
  const depth = () => g(sh, 'rev-list', '--count', 'HEAD');
  const before = depth();
  const t0 = Date.now();
  assert.equal(stopReason('bob', { ...P.readRole(sh), root: sh }), null);
  assert.ok(Date.now() - t0 < 3000, `the check took ${Date.now() - t0} ms`);
  assert.equal(depth(), before);
  assert.equal(g(sh, 'rev-parse', '--is-shallow-repository'), 'true');
  // it fetched the job branches with the tranche, in that one fetch
  assert.ok(g(sh, 'rev-parse', `refs/remotes/origin/job/${T}/alpha`));
  // an owed act refuses the end of BOB's turn
  P.layerStart(O(w.bob, { layer: 1, modules: 'beta' }));
  g(sh, 'pull', '-q', '--no-rebase', 'origin', `tranche/${T}`);
  assert.match(stopReason('bob', { ...P.readRole(sh), root: sh }) || '', /owed: message beta/);
  // on the full checkout, status reads the merge state without fetching more history
  assert.deepEqual(P.status(O(w.bob)).jobs.find((j) => j.module === 'alpha').needs, ['MERGE']);
});

// ---- c ----

test('c: every create_session proc prints (layer start, job route) carries clone_depth and blob_limit_kb', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  const specs = P.layerStart(O(w.bob, { layer: 1 })).specs;
  for (const s of specs) assert.deepEqual([s.clone_depth, s.blob_limit_kb], [1000000, 100]);
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const route = P.jobRoute(O(w.bob, { module: 'alpha', sessionStatus: 'archived' }));
  assert.deepEqual([route.action, route.clone_depth, route.blob_limit_kb], ["create_session", 1000000, 100]);
});

// ---- d ----

test('d: prune lists merged job and prep branches, never an open tranche\'s, a protected or an unmerged one; --apply pushes the workflow\'s request and changes nothing else', () => {
  const w = world();
  const s = w.seed, main0 = g(s, 'rev-parse', 'main');
  // a closed tranche (main holds it) and its merged job; a merged prep; an unmerged prep; the restore point and a study
  for (const r of ['tranche/T0', 'job/T0/alpha', 'prep/old', 'snapshot/pre-refactor-2026-09-25', 'study/constructs', 'land/bob/x']) g(s, 'push', '-q', 'origin', `${main0}:refs/heads/${r}`);
  g(s, 'checkout', '-q', '-b', 'side'); writeFileSync(join(s, 'side.txt'), 'x\n'); g(s, 'add', '.'); g(s, 'commit', '-qm', 'side');
  g(s, 'push', '-q', 'origin', 'HEAD:refs/heads/prep/unmerged');
  // the open tranche P1 moves past main; its job branches stay whatever main holds
  started(w, [['alpha', J1]]);
  const out = P.prune(O(w.bob));
  assert.deepEqual(out.list.sort(), ['job/T0/alpha', 'prep/old']);
  assert.deepEqual(out.kept, { protected: 0, open: 2, unmerged: 1 });   // job/P1/alpha and job/P1/beta; prep/unmerged
  assert.ok(out.open.includes(T));
  const tip = g(w.bobRoot, 'rev-parse', 'HEAD');
  const ap = P.prune(O(w.bob, { apply: true }));
  assert.match(ap.pushed, /^prune\/\d{8}T\d{6}$/);
  const req = JSON.parse(g(w.bobRoot, 'show', `${ap.commit}:toy/build/plan/prune-request.json`));
  assert.deepEqual([req.limit, req.dry_run], [0, false]);
  const tsv = g(w.bobRoot, 'show', `${ap.commit}:toy/${req.list}`).split('\n').map((l) => l.split('\t'));
  assert.deepEqual(tsv.map((x) => x[0]).sort(), ['job/T0/alpha', 'prep/old']);
  assert.ok(tsv.every((x) => /^[0-9a-f]{40}$/.test(x[1])));
  assert.equal(g(w.bobRoot, 'ls-remote', 'origin', `refs/heads/${ap.pushed}`).split('\t')[0], ap.commit);
  // the tranche, the checkout and its index are untouched
  assert.equal(g(w.bobRoot, 'rev-parse', 'HEAD'), tip);
  assert.equal(g(w.bobRoot, 'rev-parse', `origin/tranche/${T}`), tip);
  assert.equal(g(w.bobRoot, 'status', '--porcelain'), '');
});

// ---- e ----

const NEW = (dir) => {
  const f = join(dir, 'build/modules.json');
  // two new modules on adjacent one-line rows, as bio writes them (K1185): their fills touch, so git conflicts
  writeFileSync(f, readFileSync(f, 'utf8').replace(/(\n    \{\n      "id": "stats")/, '\n    {"id": "gamma", "layer": 1, "paths": [], "tests": [], "uses": ["alpha"]},\n    {"id": "delta", "layer": 1, "paths": [], "tests": [], "uses": []},$1'));
  const l = join(dir, 'build/layers.md');
  writeFileSync(l, readFileSync(l, 'utf8').replace('| catalog, alpha, beta |', '| catalog, alpha, beta, gamma, delta |'));
};
function newModuleJob(w, m, s) {
  const j = job(w, m, s);
  mkdirSync(join(j.dir, `${m}/src`), { recursive: true }); mkdirSync(join(j.dir, `${m}/test`), { recursive: true });
  writeFileSync(join(j.dir, `${m}/src/index.mjs`), `export const name = '${m}';\n`);
  writeFileSync(join(j.dir, `${m}/test/index.test.mjs`), `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { name } from '../src/index.mjs';\ntest('${m} names itself', () => assert.equal(name, '${m}'));\n`);
  g(j.root, 'add', '.'); g(j.root, 'commit', '-qm', `${m}: written`);
  return j;
}

test('e: a new module\'s first job fills its own empty row at COMPLETE; ownership takes exactly that; two such merges meet in modules.json and both rows land', () => {
  const w = world('## Layer 1\n\n**gamma**\n- N1 · Write gamma.\n\n**delta**\n- N2 · Write delta.\n', NEW);
  started(w, [['gamma', J1], ['delta', J2]]);
  const rep = join(w.base, 'r.md'); writeFileSync(rep, REPORT);
  const gm = newModuleJob(w, 'gamma', J1);
  // with no paths named, the tool says how; a path that is not there is refused
  assert.throws(() => P.jobComplete(O(gm.dir, { module: 'gamma', reportFile: rep })), /gamma is a new module.*--paths <its code paths> --tests <its test paths>/);
  assert.throws(() => P.jobComplete(O(gm.dir, { module: 'gamma', reportFile: rep, paths: 'gamma/src/', tests: 'gamma/tests/' })), /gamma\/tests\/ names no file/);
  const done = P.jobComplete(O(gm.dir, { module: 'gamma', reportFile: rep, paths: 'gamma/src/', tests: 'gamma/test/' }));
  assert.equal(done.tests.tests, 1);   // its own test ran
  const row = JSON.parse(g(gm.root, 'show', `origin/job/${T}/gamma:toy/build/modules.json`)).modules.find((x) => x.id === 'gamma');
  assert.deepEqual([row.paths, row.tests, row.uses], [['gamma/src/'], ['gamma/test/'], ['alpha']]);
  // the fill is its own: ownership on the branch accepts it
  const base = g(gm.root, 'merge-base', 'HEAD', `origin/tranche/${T}`);
  assert.deepEqual(checkOwnership(gm.dir, 'gamma', base).failures, []);
  // a second COMPLETE with the same fill is no change; another fill is refused
  assert.throws(() => P.jobComplete(O(gm.dir, { module: 'gamma', reportFile: rep, paths: 'gamma/', tests: 'gamma/test/' })), /already names its paths and tests/);

  const dm = newModuleJob(w, 'delta', J2);
  P.jobComplete(O(dm.dir, { module: 'delta', reportFile: rep, paths: 'delta/src/', tests: 'delta/test/' }));
  // both merge: the second meets the first's fill in modules.json, and the tool applies its own fill to the tranche's copy
  const r = P.merge(O(w.bob, { modules: 'gamma,delta' }));
  assert.deepEqual([r.merged.map((x) => x.module), r.refused], [['gamma', 'delta'], []]);
  const rows = JSON.parse(readFileSync(join(w.bob, 'build/modules.json'), 'utf8')).modules;
  assert.deepEqual(rows.filter((x) => ['gamma', 'delta'].includes(x.id)).map((x) => [x.id, x.paths, x.tests]), [['gamma', ['gamma/src/'], ['gamma/test/']], ['delta', ['delta/src/'], ['delta/test/']]]);
  assert.equal(spawnSync('node', [join(HERE, '../../checks/format.mjs'), w.bob], { encoding: 'utf8' }).stdout.includes('names no file'), false);
});

test('e: ownership refuses any other change to modules.json: another row, a row already filled, a half fill', () => {
  const before = JSON.stringify({ modules: [{ id: 'a', layer: 1, paths: ['a/'], tests: ['a/t/'], uses: [] }, { id: 'n', layer: 1, paths: [], tests: [], uses: ['a'] }] });
  const edit = (f) => { const x = JSON.parse(before); f(x.modules); return JSON.stringify(x); };
  assert.deepEqual(rowFill(before, edit((m) => { m[1].paths = ['n/']; m[1].tests = ['n/t/']; }), 'n').fill, { paths: ['n/'], tests: ['n/t/'] });
  assert.match(rowFill(before, edit((m) => { m[1].paths = ['n/']; m[1].tests = ['n/t/']; m[0].paths = ['a/', 'x/']; }), 'n').why, /the row of a changed/);
  assert.match(rowFill(before, edit((m) => { m[0].paths = ['a2/']; }), 'a').why, /already named its paths/);
  assert.match(rowFill(before, edit((m) => { m[1].paths = ['n/']; }), 'n').why, /both its paths and its tests/);
  assert.match(rowFill(before, edit((m) => { m[1].paths = ['n/']; m[1].tests = ['n/t/']; m[1].uses = []; }), 'n').why, /beyond its paths and tests/);
  assert.match(rowFill(before, edit((m) => m.reverse()), 'n').why, /reordered/);
  // the row is filled in place, every other byte unchanged, in one-line and in pretty form
  const one = '{"modules": [\n    {"id": "n", "layer": 1, "paths": [], "tests": [], "uses": []},\n    {"id": "m", "layer": 1, "paths": [], "tests": [], "uses": []}\n]}\n';
  assert.equal(fillModuleRow(one, 'n', { paths: ['n/'], tests: ['n/t/', 'n/u.mjs'] }), one.replace('"paths": [], "tests": []', '"paths": ["n/"], "tests": ["n/t/", "n/u.mjs"]'));
  assert.equal(fillModuleRow(one, 'x', { paths: ['x/'], tests: ['x/'] }), null);
  assert.equal(fillModuleRow(fillModuleRow(one, 'n', { paths: ['n/'], tests: ['n/t/'] }), 'n', { paths: ['z/'], tests: ['z/'] }), null);
  const pretty = JSON.stringify({ modules: [{ id: 'n', paths: [], tests: [] }] }, null, 2);
  assert.deepEqual(JSON.parse(fillModuleRow(pretty, 'n', { paths: ['n/'], tests: ['t/'] })).modules[0], { id: 'n', paths: ['n/'], tests: ['t/'] });
});

// ---- f ----

test('f: once another BOB has taken over, every writing command of the old one refuses, a merge list stops, and its turn may end', () => {
  const w = world();
  started(w, [['alpha', J1], ['beta', J2]]);
  const ja = complete(w, 'alpha', J1, 'alpha/src/a.txt');
  complete(w, 'beta', J2, 'beta/src/b.txt');
  // BOB #3 takes over from its own checkout
  const b3 = join(w.base, 'bob3');
  execFileSync('git', ['clone', '-q', '-b', `tranche/${T}`, w.origin, b3], { stdio: 'ignore' }); ident(b3, 'bob3');
  P.takeover(O(join(b3, 'toy'), { name: 'BOB #3', session: B2, depth: 1 }));
  // the old BOB: its merge, its list, its CLI writes all refuse, naming the successor; reads still work
  assert.throws(() => P.merge(O(w.bob, { module: 'alpha' })), /BOB #3 \(session_01D+\) has taken over tranche P1/);
  const r = exitCode(() => P.merge(O(w.bob, { modules: 'alpha,beta' })));
  assert.deepEqual([r.merged, r.refused.length, r.left], [[], 1, ['beta']]);
  assert.throws(() => P.withRunning('round close', O(w.bob), P.roundClose), /has taken over/);
  assert.throws(() => P.withRunning('ruling', O(w.bob, { lineFile: '/dev/null' }), P.rulingCmd), /has taken over/);
  assert.equal(P.withRunning('status', O(w.bob), P.status).superseded.name, 'BOB #3');
  // its turn may end even with an act owed: the acts are its successor's now
  P.layerStart(O(join(b3, 'toy'), { layer: 1, modules: 'beta' }));   // owes a message to beta's live session
  g(w.bobRoot, 'pull', '-q', '--no-rebase', 'origin', `tranche/${T}`);
  assert.match(readFileSync(join(w.bob, P.PLAN), 'utf8'), /\*\*Owed\*\* · message beta/);
  assert.equal(stopReason('bob', { ...P.readRole(w.bobRoot), root: w.bobRoot }), null);
  // the successor is not refused; the old BOB taking over again is the one route back
  assert.equal(P.merge(O(join(b3, 'toy'), { module: 'alpha' })).ruling.startsWith('K'), true);
  assert.doesNotThrow(() => P.withRunning('takeover', O(w.bob, { name: 'BOB #4', session: B1, depth: 1 }), P.takeover));
  // a job's checkout is never judged by the Status line
  assert.equal(P.supersededBy(P.repo(ja.dir), T), null);
});
