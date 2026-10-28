// tools/proc.mjs and tools/hooks.mjs against a real remote: a bare origin seeded with the dry run's toy product, one
// clone as BOB (on the tranche branch) and one as a job (on its job branch). One round, one job, end to end, and each
// refusal the design names (lane-process-redesign/DESIGN.md §2.4, §2.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../proc.mjs';
import { preReason, stopReason } from '../hooks.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), TOY = join(HERE, '..', '..', 'dryrun');
const T = 'P1', B1 = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB', J1 = 'session_01AAAAAAAAAAAAAAAAAAAAAAAA';
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const ident = (d, n) => { for (const [k, v] of [['user.name', n], ['user.email', `${n}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v); };

function world() {
  const base = mkdtempSync(join(tmpdir(), 'proc-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const seed = join(base, 'seed');
  execFileSync('git', ['clone', '-q', origin, seed], { stdio: 'ignore' }); ident(seed, 'seed');
  cpSync(TOY, join(seed, 'toy'), { recursive: true });
  writeFileSync(join(seed, 'toy/build/plan/current.md'), `# Plan ${T}\n\n**Status** · OPEN · BOB #1 · ${B1.replace('B', 'C')} · depth 1\n`);
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/tranche/${T}`);
  const bobDir = join(base, 'bob');
  execFileSync('git', ['clone', '-q', '-b', `tranche/${T}`, origin, bobDir], { stdio: 'ignore' }); ident(bobDir, 'bob');
  const plan = join(base, 'round.md');
  writeFileSync(plan, '## Layer 1\n\n**alpha**\n- N1 · Add a comment naming R1 at the top of `alpha/src/index.mjs`.\n');
  return { base, origin, bob: join(bobDir, 'toy'), bobRoot: bobDir, plan };
}
const O = (product, extra = {}) => ({ product, tranche: T, ...extra });
const jobClone = (w) => {
  const d = join(w.base, 'job');
  execFileSync('git', ['clone', '-q', '-b', `job/${T}/alpha`, w.origin, d], { stdio: 'ignore' }); ident(d, 'job');
  return { dir: join(d, 'toy'), root: d };
};

test('one round end to end: takeover, round, layer, a job by its tool, merge, close, handoff; the hooks at each step', () => {
  const w = world();
  // takeover: the Status line names the new BOB; the predecessor's archive and the backstop are owed acts
  const tk = P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  assert.match(readFileSync(join(w.bob, P.PLAN), 'utf8'), new RegExp(`^\\*\\*Status\\*\\* · OPEN · BOB #2 · ${B1} · depth 1$`, 'm'));
  assert.ok(tk.acts.some((a) => /archive BOB #1/.test(a)) && tk.acts.some((a) => /backstop/.test(a)));
  assert.equal(P.readRole(w.bobRoot).role, 'bob');
  assert.deepEqual(tk.size, []);
  // the role skills are absent in this product: writing them is owed; once written by `proc shims`, nothing is
  assert.ok(tk.acts.some((a) => /civicos-bob\/SKILL\.md is missing/.test(a)));
  P.shims({ out: join(w.bobRoot, '.claude/skills'), process: join(HERE, '..', '..') });
  assert.equal(P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 })).acts.filter((a) => /role skill/.test(a)).length, 0);

  // a round's plan is fixed when it opens; a second open while it runs is refused
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  assert.throws(() => P.roundOpen(O(w.bob, { round: 'R2', plan: w.plan })), /round R1 is still open/);

  // layer start: the job branch, the START, and one create_session owed, exactly as printed
  const ls = P.layerStart(O(w.bob, { layer: 1 }));
  assert.equal(ls.specs.length, 1);
  const spec = ls.specs[0];
  assert.deepEqual([spec.action, spec.title, spec.source_revision], ['create_session', 'ALPHA #1', `job/${T}/alpha`]);
  assert.deepEqual(P.status(O(w.bob)).owed, ['start alpha']);
  assert.throws(() => P.layerStart(O(w.bob, { layer: 1, usage: 'rejected' })), /usage status is "rejected"/);

  // BOB's hooks: the printed call passes; any other is refused; a hand merge, a push to main, a doorbell, an early PR merge refused
  const ctx = () => ({ ...P.readRole(w.bobRoot), root: w.bobRoot, plan: readFileSync(join(w.bob, P.PLAN), 'utf8') });
  const cs = (ti) => preReason('bob', { tool_name: 'mcp__claude-code-remote__create_session', tool_input: ti }, ctx());
  assert.equal(cs({ title: spec.title, source_revision: spec.source_revision, prompt: spec.prompt }), null);
  assert.match(cs({ title: spec.title, source_revision: spec.source_revision, prompt: 'You are ALPHA. Do as you like.' }), /prompt/);
  assert.match(cs({ title: 'BETA #1', source_revision: `job/${T}/beta`, prompt: spec.prompt }), /no start is owed for beta/);
  // a lane's successor is not a job start: its title names no module (R12)
  assert.equal(cs({ title: 'PROCESS-REDESIGN #3', source_revision: 'lane/process-redesign', prompt: 'You are PROCESS-REDESIGN #3.' }), null);
  // with no module list to read, a job-like title is judged a job's (fails closed)
  assert.match(preReason('bob', { tool_name: 'mcp__claude-code-remote__create_session', tool_input: { title: 'PROCESS-REDESIGN #3' } }, { ...ctx(), root: '/nonexistent' }), /no start is owed/);
  assert.match(preReason('bob', { tool_name: 'mcp__claude-code-remote__create_session', tool_input: { title: 'PROCESS-REDESIGN #3' } }, { ...ctx(), product: 'no-such-dir' }), /no start is owed/);
  const bash = (role, command, c = ctx()) => preReason(role, { tool_name: 'Bash', tool_input: { command } }, c);
  assert.match(bash('bob', `git merge --no-ff origin/job/${T}/alpha`), /proc.mjs merge/);
  assert.match(bash('bob', 'git push origin HEAD:main'), /main/);
  assert.match(bash('bob', 'git push --force origin tranche/P1'), /force/);
  assert.equal(bash('bob', 'git push origin HEAD:refs/heads/tranche/P1'), null);
  assert.match(preReason('bob', { tool_name: 'mcp__claude-code-remote__create_trigger', tool_input: { persistent_session_id: J1 } }, ctx()), /own backstop/);
  assert.equal(preReason('bob', { tool_name: 'mcp__claude-code-remote__create_trigger', tool_input: { persistent_session_id: B1 } }, ctx()), null);
  assert.match(preReason('bob', { tool_name: 'mcp__github__merge_pull_request', tool_input: {} }, ctx()), /CLOSING/);
  // only the product's own PRs wait for the close; a process-repository PR is BOB's to merge mid-round (bio K5345)
  const own = w.origin.replace(/\.git$/, '').split('/').slice(-2);
  const mpr = (owner, repo) => preReason('bob', { tool_name: 'mcp__github__merge_pull_request', tool_input: { owner, repo, pullNumber: 1 } }, ctx());
  assert.match(mpr(own[0], own[1]), /CLOSING/);
  assert.equal(mpr('believeinoakland', 'civicos-process'), null);
  // BOB may not end its turn while a start is owed
  assert.match(stopReason('bob', ctx()), /owed: start alpha/);
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  assert.equal(stopReason('bob', ctx()), null);
  assert.equal(P.addr(O(w.bob, { module: 'alpha' })), J1);

  // the job: start merges the tranche and reads its START; its hooks
  const job = jobClone(w);
  const js = P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  assert.match(js.start, /N1 · Add a comment naming R1/);
  const jctx = () => ({ ...P.readRole(job.root), root: job.root });
  assert.match(stopReason('job', jctx()), /WORKING/);
  assert.match(bash('job', 'git push origin HEAD:refs/heads/tranche/P1', jctx()), /only its own branch/);
  assert.equal(bash('job', `git push origin HEAD:refs/heads/job/${T}/alpha`, jctx()), null);
  assert.equal(bash('job', 'git push', jctx()), null);
  assert.match(preReason('job', { tool_name: 'mcp__claude-code-remote__create_session', tool_input: {} }, jctx()), /starts no session/);
  // a question is a state, so a successor BOB sees it; the turn may end on it
  P.jobState(O(job.dir, { module: 'alpha', set: 'WAITING: may the comment name R2 too?' }));
  assert.equal(stopReason('job', jctx()), null);
  assert.deepEqual(P.status(O(w.bob)).jobs[0].needs, ['ANSWER']);
  assert.throws(() => P.jobState(O(job.dir, { module: 'alpha', set: 'DONE' })), /--set/);
  P.jobState(O(job.dir, { module: 'alpha', set: 'WORKING' }));

  // the change, uncommitted: the stop hook names it; complete refuses until it is committed, and without a Met line
  const src = join(job.dir, 'alpha/src/index.mjs');
  writeFileSync(src, `// R1: add returns a + b.\n${readFileSync(src, 'utf8')}`);
  assert.match(stopReason('job', jctx()), /uncommitted/);
  const rep = join(w.base, 'report.md');
  writeFileSync(rep, 'Applied N1.\n');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /Met/);
  writeFileSync(rep, 'Applied N1.\n**Met** · none\n');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /commit your module/);
  g(job.root, 'commit', '-qam', 'alpha: N1');
  const done = P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  assert.equal(done.bob, B1);
  assert.match(done.message, /COMPLETE at \w+\. Tests \d+\/\d+; checks 0/);
  assert.equal(stopReason('job', jctx()), null);
  const rec = g(job.root, 'show', `origin/job/${T}/alpha:toy/build/jobs/${T}/alpha.md`);
  assert.match(rec, /· COMPLETE$/m);
  assert.match(rec, /^Size \(session_\w+\): test runs 1, module lines \d+$/m);
  assert.match(rec, /Checks: format, architecture, coverage, fixtures, ownership: no new finding\./);
  assert.doesNotMatch(rec, /Inherited reds/);

  // the merge: one command, gates, ruling line, pushed and verified
  assert.deepEqual(P.status(O(w.bob)).jobs[0].needs, ['MERGE']);
  const before = g(w.bobRoot, 'rev-parse', 'HEAD');
  const mg = P.merge(O(w.bob, { module: 'alpha', context: 12 }));
  // one commit: the merge itself carries the regenerated artifacts and the ruling line (lane R9)
  assert.equal(g(w.bobRoot, 'rev-list', '--count', '--first-parent', `${before}..HEAD`), '1');
  assert.equal(g(w.bobRoot, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length, 3);
  assert.match(g(w.bobRoot, 'show', '--stat', '--format=%s', 'HEAD'), /merged alpha[\s\S]*build\/rulings\.md/);
  assert.match(mg.ruling, /^K\d+$/);
  assert.match(readFileSync(join(w.bob, 'build/rulings.md'), 'utf8'), /BOB's context 12 %/);
  // alpha's change made beta's bundle (which embeds alpha) stale: the merge regenerated and committed it (D19 finding 1)
  assert.ok(mg.regenerated.includes('beta/dist/bundle.txt'));
  assert.equal(execFileSync('node', ['beta/scripts/bundle.mjs', '--verify'], { cwd: w.bob }).toString().includes('STALE'), false);
  assert.match(readFileSync(join(w.bob, 'build/rulings.md'), 'utf8'), /· alpha · Merged alpha \(job\/P1\/alpha\): COMPLETE; ownership/);
  assert.match(readFileSync(join(w.bob, 'alpha/src/index.mjs'), 'utf8'), /^\/\/ R1: add/);
  assert.equal(P.status(O(w.bob)).jobs[0].merged, true);

  // the session stays to its layer's close: a CHANGE goes to it by message, a full or archived one gets a fresh session
  assert.deepEqual(P.jobRoute(O(w.bob, { module: 'alpha' })), { action: 'message', session: J1 });
  assert.equal(P.jobRoute(O(w.bob, { module: 'alpha', contextPct: 60 })).action, 'create_session');
  assert.equal(P.jobRoute(O(w.bob, { module: 'alpha', sessionStatus: 'SESSION_STATUS_ARCHIVED' })).title, 'ALPHA #2');

  // layer close owes the archive; the round cannot close while it is owed; the archive writes the metrics row
  const lc = P.layerClose(O(w.bob, { layer: 1 }));
  assert.deepEqual(lc.archive, [{ module: 'alpha', session: J1 }]);
  assert.throws(() => P.roundClose(O(w.bob)), /owed acts first: archive alpha/);
  assert.throws(() => P.handoff(O(w.bob)), /not at a clean point/);
  P.jobArchived(O(w.bob, { module: 'alpha', usage: JSON.stringify({ cache_read_tokens: 10, cache_write_tokens: 2, input_tokens: 1, output_tokens: 3 }) }));
  assert.match(readFileSync(join(w.bob, `build/metrics/${T}.csv`), 'utf8'), new RegExp(`^${J1},job,alpha,10,2,1,3,,1,\\d+$`, 'm'));
  // the outgoing BOB deletes its own routines first (bio K5413): no archive before its reply, or why none came, is recorded
  const C1 = B1.replace('B', 'C');
  assert.throws(() => P.bobArchived(O(w.bob, { name: 'BOB #1', session: C1, usage: '{}' })), /has not cleared its routines/);
  assert.throws(() => P.bobCleared(O(w.bob, { name: 'BOB #1', session: C1 })), /exactly one of --reply/);
  P.bobCleared(O(w.bob, { name: 'BOB #1', session: C1, reply: 'ROUTINES DELETED, 2' }));
  assert.match(readFileSync(join(w.bob, `build/metrics/${T}.csv`), 'utf8'), /^session_01CB+,BOB-cleared,reply: ROUTINES DELETED  2,/m);
  P.bobArchived(O(w.bob, { name: 'BOB #1', session: C1, usage: '{"cache_read_tokens":5}' }));
  assert.match(readFileSync(join(w.bob, `build/metrics/${T}.csv`), 'utf8'), /^session_01CB+,BOB-final,,5,/m);
  P.roundClose(O(w.bob));
  assert.ok(existsSync(join(w.bob, `build/plan/archive/${T}-R1.md`)));
  assert.match(P.handoff(O(w.bob)).text, new RegExp(`^START BOB #3: tranche/${T} @ \\w+$`));
  // the tranche's footprint: its commits by kind since main (the toy's main is the seed)
  const fp = P.footprint(O(w.bob));
  assert.ok(fp.kinds.product >= 1 && fp.kinds['job records'] >= 3 && fp.kinds['other build state'] >= 5, JSON.stringify(fp));
  assert.equal(fp.merges, 1);
  assert.match(fp.bookkeeping, /^\d+ %$/);
});

test('merge refuses a job that is not COMPLETE, and a job with a red test cannot mark itself complete', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  assert.throws(() => P.merge(O(w.bob, { module: 'alpha' })), /reads WORKING, not COMPLETE/);
  // a job that breaks its own tests cannot mark itself complete
  const t = join(job.dir, 'alpha/test/alpha.test.mjs');
  writeFileSync(t, `${readFileSync(t, 'utf8')}\nimport { test as t2 } from 'node:test'; t2('R1 broken', () => { throw new Error('red'); });\n`);
  g(job.root, 'commit', '-qam', 'alpha: red');
  const rep = join(w.base, 'report.md'); writeFileSync(rep, '**Met** · none\n');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /tests: \d+\/\d+ pass; new reds: R1 broken; nothing marked complete/);
  assert.equal(P.parseRecord(readFileSync(join(job.dir, `build/jobs/${T}/alpha.md`), 'utf8')).state, 'WORKING');
});

test('shims: one skill per role, hooks in the frontmatter, the role text loaded from the process repository', () => {
  const s = P.shims({ process: '/home/user/civicos-process' });
  assert.match(s['civicos-job'], /^---\nname: civicos-job\n/);
  assert.match(s['civicos-job'], /command: 'node "\/home\/user\/civicos-process\/tools\/hooks.mjs" job stop'/);
  assert.match(s['civicos-bob'], /!`cat "\/home\/user\/civicos-process\/roles\/BOB.md"/);
});

test('status lists a document over its limit for BOB to prune (mechanics §17); takeover owes the prune; nothing is refused', () => {
  const w = world();
  writeFileSync(join(w.bob, 'build/handoff.md'), 'x'.repeat(25601));
  const st = P.status(O(w.bob));
  assert.deepEqual(st.size, ['SIZE build/handoff.md 25601 > 25600']);
  const tk = P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  assert.ok(tk.acts.some((a) => /^prune build\/handoff\.md under its limit/.test(a)));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  assert.equal(P.layerStart(O(w.bob, { layer: 1 })).specs.length, 1);
});

test('artifacts: a row may name several paths; a Generated artifacts section with no row in the parsed form is refused', () => {
  const w = world(), R = P.repo(w.bob), mf = join(w.bob, 'build/manifest.md');
  assert.deepEqual(P.artifacts(R).map((a) => a.paths), [['beta/dist/bundle.txt'], ['legacy/dist/legacy.bundle.txt']]);
  writeFileSync(mf, '# Build manifest\n\n## Generated artifacts\n\n| a | b | c | d |\n| --- | --- | --- | --- |\n| `x/dist`, `y/dist` | x | `node x.mjs` | `node x.mjs --check` |\n');
  assert.deepEqual(P.artifacts(R)[0].paths, ['x/dist', 'y/dist']);
  writeFileSync(mf, '# Build manifest\n\n## Generated artifacts\n\n| artifact | owner | regenerate | inputs |\n| `x/dist` | x | `x/`: `npm run build` | its source |\n');
  assert.throws(() => P.artifacts(R), /no row/);
});

test('a START names the product\'s standing rules for every job when the product has them', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  mkdirSync(join(w.bob, 'build/situations'), { recursive: true });
  writeFileSync(join(w.bob, P.JOBRULES), '# Every job\n');
  const ls = P.layerStart(O(w.bob, { layer: 1 }));
  assert.match(readFileSync(join(w.bob, P.startPath(T, 'alpha')), 'utf8'), /read `build\/situations\/job\.md` whole/);
  assert.equal(ls.specs.length, 1);
});

test('a ruling of Bob\'s with no home is owed at takeover and refuses the handoff until placed (bio K5311; DESIGN §2.6)', () => {
  const w = world(), day = new Date().toISOString().slice(0, 10);
  const add = (line) => writeFileSync(join(w.bob, 'build/rulings.md'), `${readFileSync(join(w.bob, 'build/rulings.md'), 'utf8').trimEnd()}\n${line}\n`);
  if (!existsSync(join(w.bob, 'build/rulings.md'))) writeFileSync(join(w.bob, 'build/rulings.md'), '# Rulings\n');
  add(`- K9001 · ${day} · Weekly usage is Bob's to watch, Bob's (P14) · "Don't worry about weekly usage."`);
  add(`- K9002 · ${day} · alpha · Merged alpha · §5.5`);
  g(w.bobRoot, 'add', '-A'); g(w.bobRoot, 'commit', '-qm', 'rulings'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  const tk = P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  assert.deepEqual(tk.acts.filter((a) => /K900/.test(a)).map((a) => a.match(/K900\d/)[0]), ['K9001']);
  assert.throws(() => P.handoff(O(w.bob)), /no home a successor reads: K9001/);
  mkdirSync(join(w.bob, 'build/rulings-product'), { recursive: true });
  writeFileSync(join(w.bob, 'build/rulings-product/usage.md'), '- Weekly usage is Bob\'s (K9001).\n');
  g(w.bobRoot, 'add', '-A'); g(w.bobRoot, 'commit', '-qm', 'placed'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  assert.match(P.handoff(O(w.bob)).text, /^START BOB #3/);
});

test('a shallow clone fetches the history a merge needs, and only then (lane R8: no full download at session start)', () => {
  const w = world();
  // a job branch forks from the tranche, then the tranche moves 120 commits on
  g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/job/${T}/alpha`);
  for (let i = 0; i < 120; i++) { writeFileSync(join(w.bob, 'build/filler.txt'), `${i}\n`); g(w.bobRoot, 'add', '-A'); g(w.bobRoot, 'commit', '-qm', `filler ${i}`); }
  g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  // a session's clone: its branch's last 5 commits only, as a cloud session starts with its last 50
  const d = join(w.base, 'shallow');
  execFileSync('git', ['clone', '-q', '--depth', '5', '-b', `tranche/${T}`, `file://${w.origin}`, d], { stdio: 'ignore' });
  const R = P.repo(join(d, 'toy'));
  R.fetch(`job/${T}/alpha`);
  assert.equal(g(d, 'rev-parse', '--is-shallow-repository'), 'true');
  assert.throws(() => g(d, 'merge-base', 'HEAD', `origin/job/${T}/alpha`));
  const before = Number(g(d, 'rev-list', '--count', 'HEAD'));
  const base = P.history(R, 'HEAD', `origin/job/${T}/alpha`);
  assert.equal(base, g(d, 'rev-parse', `origin/job/${T}/alpha`));
  assert.ok(Number(g(d, 'rev-list', '--count', 'HEAD')) > before);
  // deepening never moves a ref the session already holds: a pinned origin/job ref stays where it was
  const d2 = join(w.base, 'shallow2');
  execFileSync('git', ['clone', '-q', '--depth', '5', '-b', `tranche/${T}`, `file://${w.origin}`, d2], { stdio: 'ignore' });
  const R2 = P.repo(join(d2, 'toy'));
  R2.fetch(`job/${T}/alpha`);
  const pinned = g(d2, 'rev-parse', `origin/job/${T}/alpha`);
  const other = join(w.base, 'other');
  execFileSync('git', ['clone', '-q', '-b', `job/${T}/alpha`, w.origin, other], { stdio: 'ignore' }); ident(other, 'other');
  g(other, 'commit', '-q', '--allow-empty', '-m', 'the job branch moves on the remote'); g(other, 'push', '-q', 'origin', `HEAD:refs/heads/job/${T}/alpha`);
  assert.throws(() => g(d2, 'merge-base', 'HEAD', `origin/job/${T}/alpha`));
  P.history(R2, 'HEAD', `origin/job/${T}/alpha`);
  assert.notEqual(g(d2, 'rev-list', '--count', 'HEAD'), '5');
  assert.equal(g(d2, 'rev-parse', `origin/job/${T}/alpha`), pinned);
  // a merge base already present costs no fetch
  assert.equal(P.history(R, 'HEAD', 'HEAD~1'), g(d, 'rev-parse', 'HEAD~1'));
});

test('a merge whose artifacts fail to verify is undone whole: no merge state, no commit, a clean tree', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  const src = join(job.dir, 'alpha/src/index.mjs');
  writeFileSync(src, `// R1: add returns a + b.\n${readFileSync(src, 'utf8')}`);
  g(job.root, 'commit', '-qam', 'alpha: N1');
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Met** · none\n');
  P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  // the manifest's first verify now always fails
  const mf = join(w.bob, 'build/manifest.md');
  writeFileSync(mf, readFileSync(mf, 'utf8').replace('`node beta/scripts/bundle.mjs --verify`', '`false`'));
  g(w.bobRoot, 'commit', '-qam', 'manifest: a verify that fails'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  const pre = g(w.bobRoot, 'rev-parse', 'HEAD');
  assert.throws(() => P.merge(O(w.bob, { module: 'alpha' })), /artifacts stale after regenerating: beta\/dist\/bundle\.txt; .*the merge was undone/);
  assert.equal(g(w.bobRoot, 'rev-parse', 'HEAD'), pre);
  assert.equal(existsSync(join(w.bobRoot, '.git/MERGE_HEAD')), false);
  assert.equal(g(w.bobRoot, 'status', '--porcelain', '--untracked-files=no'), '');
});

test('old debt never blocks new work, and new work never adds to it: an inherited red is carried to the merge; a new red is refused', () => {
  const w = world();
  // the tranche already has a red test in alpha before the job starts
  const t = join(w.bob, 'alpha/test/alpha.test.mjs');
  writeFileSync(t, `${readFileSync(t, 'utf8')}\nimport { test as t2 } from 'node:test'; t2('old red', () => { throw new Error('red'); });\n`);
  g(w.bobRoot, 'commit', '-qam', 'alpha: an old red'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  const jt = join(job.dir, 'alpha/test/alpha.test.mjs'), src = join(job.dir, 'alpha/src/index.mjs');
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Met** · none\n');
  // a new red is refused, naming it; the old one is not this job's
  writeFileSync(jt, `${readFileSync(jt, 'utf8')}\nt2('new red', () => { throw new Error('red'); });\n`);
  g(job.root, 'commit', '-qam', 'alpha: a new red');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /new reds: new red; nothing marked complete/);
  writeFileSync(jt, readFileSync(jt, 'utf8').replace(/\nt2\('new red'.*\n/, '\n'));
  writeFileSync(src, `// R1: add returns a + b.\n${readFileSync(src, 'utf8')}`);
  g(job.root, 'commit', '-qam', 'alpha: N1, the new red gone');
  P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  const rec = g(job.root, 'show', `origin/job/${T}/alpha:toy/build/jobs/${T}/alpha.md`);
  assert.match(rec, /^Inherited reds: \["old red"\]$/m);
  // the merge accepts the inherited red, and only it
  const mg = P.merge(O(w.bob, { module: 'alpha' }));
  assert.match(readFileSync(join(w.bob, 'build/rulings.md'), 'utf8'), /inherited reds 1\); checks: no new finding/);
  assert.match(mg.ruling, /^K\d+$/);
});

test('the layer close runs every check once, refusing only findings new since the tranche opened', () => {
  const w = world();
  const req = join(w.bob, 'build/requirements/beta.md');
  // a coverage gap already on main when the tranche opened: old debt (the toy's main is its tranche's start)
  writeFileSync(req, `${readFileSync(req, 'utf8')}\n- **R98** An old requirement no test names.\n`);
  g(w.bobRoot, 'commit', '-qam', 'beta: R98, untested'); g(w.bobRoot, 'push', '-q', 'origin', 'HEAD:refs/heads/main'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  const src = join(job.dir, 'alpha/src/index.mjs');
  writeFileSync(src, `// R1: add returns a + b.\n${readFileSync(src, 'utf8')}`);
  g(job.root, 'commit', '-qam', 'alpha: N1');
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Met** · none\n');
  P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  P.merge(O(w.bob, { module: 'alpha' }));
  // a new gap on the tranche since it opened: the close refuses it, naming it
  writeFileSync(req, `${readFileSync(req, 'utf8')}- **R99** A new requirement no test names.\n`);
  g(w.bobRoot, 'commit', '-qam', 'beta: R99, untested'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  assert.throws(() => P.layerClose(O(w.bob, { layer: 1 })), /new since the tranche opened: .*R99/);
  // without it, the old gap alone does not refuse the close
  writeFileSync(req, readFileSync(req, 'utf8').replace(/- \*\*R99\*\*.*\n/, ''));
  g(w.bobRoot, 'commit', '-qam', 'beta: R99 withdrawn'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  assert.deepEqual(P.layerClose(O(w.bob, { layer: 1 })).archive, [{ module: 'alpha', session: J1 }]);
});

test('a test run never gives "no result" without its cause; a runaway test fails itself (lane R14)', () => {
  const d = mkdtempSync(join(tmpdir(), 'proc-runs-'));
  execFileSync('git', ['init', '-q', d]);
  const f = (n, body) => { writeFileSync(join(d, n), `import test from 'node:test';\n${body}\n`); return join(d, n); };
  const ok = f('ok.test.mjs', "for (const i of [1, 2]) test(`ok ${i}`, () => {});");
  const red = f('red.test.mjs', "test('a red', () => { throw new Error('red'); });");
  const killed = f('killed.test.mjs', "test('killed', () => { process.kill(process.pid, 'SIGKILL'); });");
  const heap = f('heap.test.mjs', "test('runaway', () => { const a = []; for (;;) a.push(new Array(1e5).fill(1)); });");
  const R = P.repo(d);
  // a file whose process dies is no result, named with its cause, never a red; the others' results stand
  const r = P.runSuite(R, [ok, red, killed, heap], { heapMb: 64, label: 't' });
  assert.deepEqual([r.tests, r.pass, r.failed], [5, 2, ['a red']]);
  assert.deepEqual(r.noResult.map((x) => [x.name, x.cause]).sort(), [['heap.test.mjs', 'out of heap (over its 64 MB cap)'], ['killed.test.mjs', 'killed (SIGKILL)']]);
  assert.deepEqual(P.reds(r).sort(), ['NO RESULT heap.test.mjs', 'NO RESULT killed.test.mjs', 'a red']);
  assert.ok(existsSync(r.report) && r.report.includes('.git/civicos-runs/'));
  assert.ok(r.peaks.length && r.peaks.every((p) => / \d+ MB$/.test(p)));
  // a process over its memory cap is killed by proc's watch and named, whatever holds the memory (here, outside the heap)
  const big = f('big.test.mjs', "test('outside the heap', async () => { const k = []; for (;;) { k.push(Buffer.alloc(32 << 20, 1)); await new Promise((r) => setTimeout(r, 20)); } });");
  const b = P.runSuite(R, [ok, big], { capMb: 300, label: 't' });
  assert.deepEqual(b.noResult, [{ name: 'big.test.mjs', cause: "over its 300 MB memory cap (killed by proc's memory watch)" }]);
  assert.equal(b.pass, 2);
  assert.ok(b.heavy.some((h) => h.startsWith('big.test.mjs ')));
  // the runner itself killed: the whole suite is no result, with its cause
  const parent = f('parent.test.mjs', "test('kills its runner', () => { process.kill(process.ppid, 'SIGKILL'); });");
  assert.match(P.runSuite(R, [parent], { label: 't' }).noResult.find((x) => x.name === 'the whole suite').cause, /^the runner was killed \(SIGKILL\)/);
  // a hung suite is stopped at its timeout
  const hang = f('hang.test.mjs', "test('hangs', () => new Promise((r) => setTimeout(r, 20000)));");
  assert.deepEqual(P.runSuite(R, [hang], { timeoutMin: 0.05, label: 't' }).noResult, [{ name: 'the whole suite', cause: 'timed out after 0.05 min' }]);
});

test('proc tests: a pass\'s suites and their users\', each judged against the base; only a new red or NO RESULT counts (lane R14)', () => {
  const w = world();
  const t = join(w.bob, 'alpha/test/alpha.test.mjs');
  writeFileSync(t, `${readFileSync(t, 'utf8')}\nimport { test as t2 } from 'node:test'; t2('old red', () => { throw new Error('red'); });\n`);
  g(w.bobRoot, 'commit', '-qam', 'alpha: an old red'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  // the pass, committed locally: a new red and a test that dies
  writeFileSync(t, `${readFileSync(t, 'utf8')}\nt2('new red', () => { throw new Error('red'); });\n`);
  writeFileSync(join(w.bob, 'alpha/test/dies.test.mjs'), "import test from 'node:test';\ntest('dies', () => { process.kill(process.pid, 'SIGKILL'); });\n");
  g(w.bobRoot, 'add', 'toy/alpha');
  assert.throws(() => P.testsCmd(O(w.bob, { modules: 'alpha', users: true })), /commit the work first/);
  g(w.bobRoot, 'commit', '-qm', 'the pass');
  const r = P.testsCmd(O(w.bob, { modules: 'alpha', users: true }));
  process.exitCode = 0;   // the command marks a new red for its command line; this test judges the result itself
  assert.deepEqual(r.modules.map((x) => x.module), ['alpha', 'beta', 'stats']);
  const a = r.modules[0];
  assert.deepEqual(a.new, ['new red', 'NO RESULT toy/alpha/test/dies.test.mjs: killed (SIGKILL)']);
  assert.deepEqual(a.inherited, ['old red']);
  assert.match(r.verdict, /^new reds or no result in alpha$/);
  assert.equal(g(w.bobRoot, 'status', '--porcelain', '--untracked-files=no'), '');
});

test('proc ruling: BOB\'s own ruling is numbered by the tool from the tranche as it stands, with the files it owes (lane R17)', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  const rulings = () => (existsSync(join(w.bob, 'build/rulings.md')) ? readFileSync(join(w.bob, 'build/rulings.md'), 'utf8') : '');
  const last = Math.max(0, ...[...rulings().matchAll(/^- K(\d+) · /gm)].map((x) => Number(x[1])));
  const lf = join(w.base, 'line.txt');
  writeFileSync(lf, `K${last + 1} · alpha · a ruling · P15`);
  assert.throws(() => P.rulingCmd(O(w.bob, { lineFile: lf })), /without its K number/);
  writeFileSync(lf, 'alpha · a ruling with an owed act · P15, P19\n');
  writeFileSync(join(w.bob, 'build/next.md'), `${existsSync(join(w.bob, 'build/next.md')) ? readFileSync(join(w.bob, 'build/next.md'), 'utf8') : ''}\n- N99 · the act it owes\n`);
  const r = P.rulingCmd(O(w.bob, { lineFile: lf, files: 'build/next.md' }));
  assert.equal(r.ruling, `K${last + 1}`);
  assert.match(rulings(), new RegExp(`^- K${last + 1} · \\d{4}-\\d\\d-\\d\\d · alpha · a ruling with an owed act · P15, P19$`, 'm'));
  assert.deepEqual(g(w.bobRoot, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort(), ['toy/build/next.md', 'toy/build/rulings.md']);
  assert.equal(g(w.bobRoot, 'rev-parse', 'HEAD'), g(w.bobRoot, 'rev-parse', `origin/tranche/${T}`));
});

test('a job runs against its generated artifacts as its merge will make them; it commits none, ownership ignores one, a conflict only in one takes the tranche copy (bio K5583, BOB #327)', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  // alpha's new test reads beta's bundle, which holds alpha's change only once regenerated (as a word key reads the rows)
  const src = join(job.dir, 'alpha/src/index.mjs'), bundle = join(job.dir, 'beta/dist/bundle.txt'), committed = readFileSync(bundle, 'utf8');
  writeFileSync(src, `// R1: add returns a + b.\n${readFileSync(src, 'utf8')}`);
  writeFileSync(join(job.dir, 'alpha/test/bundle.test.mjs'), "import { test } from 'node:test'; import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';\ntest('R1 the bundle carries the change', () => assert.match(readFileSync('beta/dist/bundle.txt', 'utf8'), /R1: add/));\n");
  g(job.root, 'add', '.'); g(job.root, 'commit', '-qm', 'alpha: N1 and a test reading the bundle');
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Met** · none\n');
  const done = P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  assert.equal(done.tests.fail, 0);
  // the run's regeneration is put back: the tree is clean and the bundle is HEAD's
  assert.equal(g(job.root, 'status', '--porcelain'), '');
  assert.equal(readFileSync(bundle, 'utf8'), committed);
  // a job that committed a regenerated copy anyway passes ownership: the merge's regeneration is the copy that counts
  execFileSync('node', ['beta/scripts/bundle.mjs'], { cwd: job.dir });
  g(job.root, 'commit', '-qam', 'alpha: the regenerated bundle'); g(job.root, 'push', '-q', 'origin', `HEAD:refs/heads/job/${T}/alpha`);
  P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  // the tranche moved the same bundle another way: the conflict is only in a generated artifact, so the merge proceeds
  const bsrc = join(w.bob, 'beta/src/index.mjs');
  writeFileSync(bsrc, `// beta moved\n${readFileSync(bsrc, 'utf8')}`);
  execFileSync('node', ['beta/scripts/bundle.mjs'], { cwd: w.bob });
  g(w.bobRoot, 'commit', '-qam', 'beta: moved'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  const mg = P.merge(O(w.bob, { module: 'alpha' }));
  assert.match(mg.ruling, /^K\d+$/);
  const b = readFileSync(join(w.bob, 'beta/dist/bundle.txt'), 'utf8');
  assert.match(b, /R1: add/); assert.match(b, /beta moved/);
  assert.equal(execFileSync('node', ['beta/scripts/bundle.mjs', '--verify'], { cwd: w.bob }).toString().trim(), 'bundle: fresh');
});
