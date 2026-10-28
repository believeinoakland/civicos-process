// tools/proc.mjs and tools/hooks.mjs against a real remote: a bare origin seeded with the dry run's toy product, one
// clone as BOB (on the tranche branch) and one as a job (on its job branch). One round, one job, end to end, and each
// refusal the design names (lane-process-redesign/DESIGN.md §2.4, §2.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../proc.mjs';
import * as H from '../hooks.mjs';
import { preReason, stopReason, stepsReason, lastAssistantText } from '../hooks.mjs';

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
  const ls = P.layerStart(O(w.bob, { layer: 1, usage: 'allowed_warning' }));   // a weekly warning starts jobs (bio K5722)
  assert.equal(ls.specs.length, 1);
  const spec = ls.specs[0];
  assert.deepEqual([spec.action, spec.title, spec.source_revision], ['create_session', 'ALPHA #1', `job/${T}/alpha`]);
  assert.deepEqual(P.status(O(w.bob)).owed, ['start alpha']);
  assert.throws(() => P.layerStart(O(w.bob, { layer: 1, usage: 'rejected' })), /usage status is "rejected"/);

  // BOB's hooks: the printed call passes; any other is refused; a hand merge, a push to main, a doorbell, an early PR merge refused
  const ctx = () => ({ ...P.readRole(w.bobRoot), root: w.bobRoot, plan: readFileSync(join(w.bob, P.PLAN), 'utf8') });
  const cs = (ti) => preReason('bob', { tool_name: 'mcp__claude-code-remote__create_session', tool_input: { clone_depth: spec.clone_depth, blob_limit_kb: spec.blob_limit_kb, ...ti } }, ctx());
  assert.equal(cs({ title: spec.title, source_revision: spec.source_revision, prompt: spec.prompt }), null);
  // the printed call starts the job on its branch's whole history, large files left out (lane-process-repair item c)
  assert.deepEqual([spec.clone_depth, spec.blob_limit_kb], [P.CLONE.clone_depth, P.CLONE.blob_limit_kb]);
  assert.match(cs({ title: spec.title, source_revision: spec.source_revision, prompt: spec.prompt, clone_depth: 50 }), /clone_depth 1000000, blob_limit_kb 100/);
  assert.match(cs({ title: spec.title, source_revision: spec.source_revision, prompt: spec.prompt, blob_limit_kb: undefined }), /use the clone/);
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
  // P20: a report with no Evidence section, or one listing nothing of an accepted form, is refused, naming what is missing
  writeFileSync(rep, 'Applied N1.\n**Met** · none\n');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /no `\*\*Evidence\*\*` section.*command you ran|no `\*\*Evidence\*\*` section[\s\S]*a command run with its result line[\s\S]*file:line[\s\S]*totals/);
  writeFileSync(rep, 'Applied N1.\n**Evidence**\n- it works, trust me\n**Met** · none\n');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /lists no item of an accepted form/);
  writeFileSync(rep, 'Applied N1.\n**Evidence**\n\n**Met** · none\n');
  assert.throws(() => P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep })), /lists no item of an accepted form \(P20; 0 line/);
  // control: with an Evidence item the next refusal is the one that follows it
  writeFileSync(rep, 'Applied N1.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
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
  const rep = join(w.base, 'report.md'); writeFileSync(rep, '**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
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
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
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
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
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
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
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
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
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

test('layer start --modules starts only the named modules of a started layer; the other live jobs get no START again (BOB #327)', () => {
  const w = world();
  writeFileSync(w.plan, '## Layer 1\n\n**alpha**\n- N1 · Add a comment naming R1 at the top of `alpha/src/index.mjs`.\n\n**beta**\n- N2 · Add a comment naming R1 at the top of `beta/src/index.mjs`.\n');
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  assert.deepEqual(P.layerStart(O(w.bob, { layer: 1, modules: 'alpha' })).specs.map((s) => s.module), ['alpha']);
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  assert.throws(() => P.layerStart(O(w.bob, { layer: 1, modules: 'catalog' })), /catalog: no entries in layer 1/);
  const ls = P.layerStart(O(w.bob, { layer: 1, modules: 'beta' }));
  assert.deepEqual(ls.specs.map((s) => [s.module, s.action]), [['beta', 'create_session']]);
  assert.deepEqual(P.status(O(w.bob)).owed, ['start beta']);
});

test('merge --with: two jobs each red alone are merged as one commit, gated each as if alone (BOB #328, RD37)', () => {
  const w = world();
  writeFileSync(w.plan, '## Layer 1\n\n**alpha**\n- N1 · Add `alpha/src/pair.txt`.\n\n**beta**\n- N2 · Add `beta/src/pair.txt`.\n');
  // a generated artifact whose verify passes only when both modules' halves are present, or neither (a fleet member and
  // the test listing the fleet)
  const mf = join(w.bob, 'build/manifest.md');
  const check = "node -e \"const f=require('fs').existsSync;process.exit(f('alpha/src/pair.txt')===f('beta/src/pair.txt')?0:1)\"";
  writeFileSync(mf, readFileSync(mf, 'utf8').replace(/(\| `legacy\/dist\/legacy\.bundle\.txt` .*\|)\n/, `$1\n| \`beta/dist/pair.txt\` | beta | \`true\` | \`${check}\` |\n`));
  g(w.bobRoot, 'commit', '-qam', 'manifest: the pair check'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  const J2 = 'session_01CCCCCCCCCCCCCCCCCCCCCCCC';
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  P.jobStarted(O(w.bob, { module: 'beta', name: 'BETA #1', session: J2 }));
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
  for (const [m, s] of [['alpha', J1], ['beta', J2]]) {
    const d = join(w.base, `job-${m}`);
    execFileSync('git', ['clone', '-q', '-b', `job/${T}/${m}`, w.origin, d], { stdio: 'ignore' }); ident(d, m);
    const dir = join(d, 'toy');
    P.jobStart(O(dir, { module: m, session: s, depth: 2 }));
    writeFileSync(join(dir, `${m}/src/pair.txt`), 'half\n');
    g(d, 'add', '.'); g(d, 'commit', '-qm', `${m}: its half`);
    P.jobComplete(O(dir, { module: m, reportFile: rep }));
  }
  assert.deepEqual(P.status(O(w.bob)).jobs.map((j) => j.needs), [['MERGE'], ['MERGE']]);
  // alone, each is refused and undone
  const pre = g(w.bobRoot, 'rev-parse', 'HEAD');
  assert.throws(() => P.merge(O(w.bob, { module: 'alpha' })), /artifacts stale after regenerating: beta\/dist\/pair\.txt; .*the merge was undone/);
  assert.equal(g(w.bobRoot, 'rev-parse', 'HEAD'), pre);
  assert.throws(() => P.merge(O(w.bob, { module: 'alpha', with: 'alpha' })), /twice/);
  // together: one merge commit with both jobs as parents, one ruling naming both, both jobs merged
  const mg = P.merge(O(w.bob, { module: 'alpha', with: 'beta', context: 9 }));
  assert.equal(g(w.bobRoot, 'rev-list', '--count', '--first-parent', `${pre}..HEAD`), '1');
  assert.equal(g(w.bobRoot, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length, 4);
  assert.deepEqual(mg.jobs.map((j) => j.module), ['alpha', 'beta']);
  const line = readFileSync(join(w.bob, 'build/rulings.md'), 'utf8').trim().split('\n').pop();
  assert.match(line, new RegExp(`^- ${mg.ruling} · .* · alpha, beta · Merged jointly alpha \\(job/${T}/alpha\\): COMPLETE; .*; and beta \\(job/${T}/beta\\): COMPLETE; .*; BOB's context 9 % · `));
  assert.deepEqual(P.status(O(w.bob)).jobs.map((j) => [j.module, j.merged, j.needs]), [['alpha', true, []], ['beta', true, []]]);
  assert.equal(g(w.bobRoot, 'rev-parse', 'HEAD'), g(w.bobRoot, 'rev-parse', `origin/tranche/${T}`));
  // a job not COMPLETE refuses the joint merge before anything changes
  P.jobState(O(join(w.base, 'job-beta', 'toy'), { module: 'beta', set: 'WORKING' }));
  assert.throws(() => P.merge(O(w.bob, { module: 'alpha', with: 'beta' })), /beta: its record reads WORKING/);
});

test('job complete --with: a job red alone is tested on its branch merged with its partner, which completes first; the run leaves no trace (BOB #328, RD37)', () => {
  const w = world();
  writeFileSync(w.plan, '## Layer 1\n\n**alpha**\n- N1 · Add `alpha/src/pair.txt`.\n\n**beta**\n- N2 · A test that alpha holds its pair.\n');
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  const J2 = 'session_01CCCCCCCCCCCCCCCCCCCCCCCC';
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  P.jobStarted(O(w.bob, { module: 'beta', name: 'BETA #1', session: J2 }));
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied.\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · none\n');
  const clone = (m, s) => {
    const d = join(w.base, `job-${m}`);
    execFileSync('git', ['clone', '-q', '-b', `job/${T}/${m}`, w.origin, d], { stdio: 'ignore' }); ident(d, m);
    P.jobStart(O(join(d, 'toy'), { module: m, session: s, depth: 2 }));
    return { root: d, dir: join(d, 'toy') };
  };
  const b = clone('beta', J2);
  writeFileSync(join(b.dir, 'beta/test/pair.test.mjs'), "import { test } from 'node:test'; import { existsSync } from 'node:fs';\ntest('alpha holds its pair', () => { if (!existsSync(new URL('../../alpha/src/pair.txt', import.meta.url))) throw new Error('no pair'); });\n");
  g(b.root, 'add', '.'); g(b.root, 'commit', '-qm', 'beta: the pair test');
  // its partner not yet COMPLETE: refused; alone: its new red refuses
  assert.throws(() => P.jobComplete(O(b.dir, { module: 'beta', reportFile: rep, with: 'alpha' })), /alpha: its record reads .*, not COMPLETE: it completes first/);
  assert.throws(() => P.jobComplete(O(b.dir, { module: 'beta', reportFile: rep })), /new reds: .*alpha holds its pair/);
  const a = clone('alpha', J1);
  writeFileSync(join(a.dir, 'alpha/src/pair.txt'), 'half\n'); g(a.root, 'add', '.'); g(a.root, 'commit', '-qm', 'alpha: its half');
  P.jobComplete(O(a.dir, { module: 'alpha', reportFile: rep }));
  const head = g(b.root, 'rev-parse', 'HEAD');
  const done = P.jobComplete(O(b.dir, { module: 'beta', reportFile: rep, with: 'alpha' }));
  assert.match(done.message, /COMPLETE at/);
  assert.equal(g(b.root, 'rev-parse', 'HEAD~1'), head);   // only the record commit was added: alpha's work is not in beta's branch
  assert.equal(existsSync(join(b.dir, 'alpha/src/pair.txt')), false);
  assert.equal(g(b.root, 'status', '--porcelain'), '');
  assert.match(g(b.root, 'show', `HEAD:toy/build/jobs/${T}/beta.md`), /^Tested with: alpha @ \w{10} \(it merges with them: proc merge --with\)$/m);
  // and the two merge as one
  assert.match(P.merge(O(w.bob, { module: 'alpha', with: 'beta' })).ruling, /^K\d+$/);
});

test('T53 PUSH rule: a shell redirection after the push is not a ref; a forbidden ref is still refused with one', () => {
  const ctx = { role: 'job', tranche: T, module: 'alpha' };
  const jb = `job/${T}/alpha`, bash = (role, command) => preReason(role, { tool_name: 'Bash', tool_input: { command } }, ctx);
  for (const r of ['2>&1 | tail', '2>&1', '> out.txt', '>> out.txt', '2> err.txt', '2>/dev/null', '&> all.txt', '< in.txt', '>out.txt 2>&1'])
    assert.equal(bash('job', `git push origin ${jb} ${r}`), null, r);
  assert.equal(bash('job', `git push origin ${jb}/x 2>&1 | tail`), null);
  for (const r of ['2>&1', '> out.txt', '2>/dev/null', '&> all.txt']) {
    assert.match(bash('job', `git push origin tranche/${T} ${r}`), /only its own branch/, r);
    assert.match(bash('job', `git push origin job/${T}/beta ${r}`), /only its own branch/, r);
    assert.match(bash('job', `git push origin HEAD:main ${r}`), /main/, r);
    assert.match(bash('bob', `git push origin main ${r}`), /main/, r);
    assert.match(bash('job', `git push --force origin ${jb} ${r}`), /force/, r);
  }
});

test('T53 Stop hook: a turn may end with the record COMPLETE (never replaced by WAITING)', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  const src = join(job.dir, 'alpha/src/index.mjs');
  writeFileSync(src, `// R1: add returns a + b.\n${readFileSync(src, 'utf8')}`);
  g(job.root, 'commit', '-qam', 'alpha: change');
  const rep = join(w.base, 'report.md'); writeFileSync(rep, 'Applied N1.\n\n**Evidence**\n- `node --test` → tests 3, pass 3\n**Met** · R1\n');
  P.jobComplete(O(job.dir, { module: 'alpha', reportFile: rep }));
  const jctx = { ...P.readRole(job.root), root: job.root };
  assert.equal(P.parseRecord(readFileSync(join(job.dir, `build/jobs/${T}/alpha.md`), 'utf8')).state, 'COMPLETE');
  assert.equal(stopReason('job', jctx), null);
});

test('T53 proc ruling --files: a path removed with git rm is committed as a deletion', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  writeFileSync(join(w.bob, 'build/gone.md'), 'x\n');
  g(w.bobRoot, 'add', '.'); g(w.bobRoot, 'commit', '-qm', 'add gone'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  g(w.bobRoot, 'rm', '-q', 'toy/build/gone.md');
  writeFileSync(join(w.base, 'line.txt'), 'alpha · a ruling that removes a file · P15\n');
  P.rulingCmd(O(w.bob, { lineFile: join(w.base, 'line.txt'), files: 'build/gone.md' }));
  assert.deepEqual(g(w.bobRoot, 'show', '--name-status', '--format=', 'HEAD').split('\n').map((l) => l.replace(/^[AM]/, '*')).sort(), ['*\ttoy/build/rulings.md', 'D\ttoy/build/gone.md']);
  // a file deleted in the working tree only (not staged) is committed the same way
  writeFileSync(join(w.bob, 'build/gone2.md'), 'x\n');
  g(w.bobRoot, 'add', '.'); g(w.bobRoot, 'commit', '-qm', 'add gone2'); g(w.bobRoot, 'push', '-q', 'origin', `HEAD:refs/heads/tranche/${T}`);
  rmSync(join(w.bob, 'build/gone2.md'));
  P.rulingCmd(O(w.bob, { lineFile: join(w.base, 'line.txt'), files: 'build/gone2.md' }));
  assert.match(g(w.bobRoot, 'show', '--name-status', '--format=', 'HEAD'), /D\ttoy\/build\/gone2\.md/);
});

test('T53 job route after job archived: the successor is numbered one past the highest used', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1 }));
  P.jobStarted(O(w.bob, { module: 'alpha', name: 'ALPHA #1', session: J1 }));
  const job = jobClone(w);
  P.jobStart(O(job.dir, { module: 'alpha', session: J1, depth: 2 }));
  P.jobArchived(O(w.bob, { module: 'alpha', usage: '{}' }));
  assert.equal(P.jobRoute(O(w.bob, { module: 'alpha' })).title, 'ALPHA #2');
});

// ---- P20: evidence in reports, and steps for Bob ----

test('evidenceItems: a command with its result, a file:line and a test total each count; a bare claim or a missing section does not', () => {
  const ok = (r) => (P.evidenceItems(r) || []).some((i) => P.EVIDENCE_ITEM.some((re) => re.test(i)));
  assert.equal(P.evidenceItems('Applied.\n**Met** · none\n'), null);
  assert.equal(ok('**Evidence**\n- `git status` → clean\n**Met** · none'), true);
  assert.equal(ok('**Evidence**\n- src/a/index.mjs:12 adds the comment\n'), true);
  assert.equal(ok('**Evidence** · pass 14 of 14 in tests/a.test.mjs\n'), true);
  assert.equal(ok('**Evidence**\n* it works\n**Met** · none'), false);
  assert.deepEqual(P.evidenceItems('**Evidence**\n1. `a` → b c d\n- x:1\n**Met** · none\nnot an item'), ['`a` → b c d', 'x:1']);
});

test('stepLabels and decodeEntities: bold and code labels are found, <<placeholders>> are exempt, entities decode', () => {
  const t = 'Press **Save &amp; close** then `Settings`.\nName it **<<your name>>** and `<<x>>`; run `a **b** c`.\n';
  assert.deepEqual(P.stepLabels(t).map((l) => [l.label, l.line, l.exempt]), [['Settings', 1, false], ['Save &amp; close', 1, false], ['<<x>>', 2, true], ['a **b** c', 2, false], ['<<your name>>', 2, true]]);
  assert.equal(P.decodeEntities('Save &amp; close &#8212; &#x2014; &mdash; &bogus;'), 'Save & close — — — &bogus;');
});

function stepsWorld() {
  const d = mkdtempSync(join(tmpdir(), 'steps-'));
  execFileSync('git', ['init', '-q', d]);
  writeFileSync(join(d, 'page.html'), '<button>Save &amp; close</button> <a id="x">Settings</a>');
  writeFileSync(join(d, 'screen.js'), "const t = 'Invite a member';\n");
  return d;
}
test('proc steps: a label not in the sources is refused, naming it and its line; found labels print the text, verified count, and the ok file', () => {
  const d = stepsWorld(), f = join(d, 'steps.md'), src = `${join(d, 'page.html')},${join(d, 'screen.js')}`;
  writeFileSync(f, '1. Click **Save & close** in `Settings`.\n2. Press **Invite a member**, then **Send invite** and `Retry`.\n3. Type **<<the member\'s name>>**.\n');
  assert.throws(() => P.stepsCmd({ file: f, source: src, product: d }), (e) => /2 label\(s\)/.test(e.message) && /line 2: "Send invite"/.test(e.message) && /line 2: "Retry"/.test(e.message) && !/Settings/.test(e.message.split('\n').slice(1).join('')) && !/<<the/.test(e.message));
  assert.equal(existsSync(join(d, '.git', P.STEPS_OK)), false, 'nothing recorded on a refusal');
  writeFileSync(f, '1. Click **Save &amp; close** in `Settings`.\n2. Press **Invite a member**.\n3. Type **<<the member\'s name>>**.\n');
  const out = P.stepsCmd({ file: f, source: src, product: d });
  assert.match(out, /^1\. Click \*\*Save &amp; close\*\*/);
  assert.match(out, /verified: 3 labels in .*page\.html.*screen\.js$/);
  const ok = JSON.parse(readFileSync(join(d, '.git', P.STEPS_OK), 'utf8'));
  assert.equal(ok.sha256, P.stepsHash(out), 'the printed text carries the same list hash');
  assert.deepEqual(ok.sources, src.split(','));
  assert.throws(() => P.stepsCmd({ file: f, source: join(d, 'nope.html'), product: d }), /no such source file/);
  assert.throws(() => P.stepsCmd({ file: f, product: d }), /--source/);
});

test('numberedList and isStepsList: only numbered items and their indented lines, whitespace-normalised; bold needed', () => {
  const m = 'Intro\n\n1.  Click   **Save**.\n   then wait\nprose\n2. Press `OK`.\n\nverified: 1 labels in x\n';
  assert.equal(P.numberedList(m), '1. Click **Save**.\nthen wait\n2. Press `OK`.');
  assert.equal(P.isStepsList(m), true);
  assert.equal(P.isStepsList('1. one\n2. two **b**'), true);
  assert.equal(P.isStepsList('1. one\n2. two'), false, 'no bold label');
  assert.equal(P.isStepsList('1. only **one**'), false, 'one item');
  assert.equal(P.isStepsList('2. a **b**\n3. c'), false, 'does not start at 1');
});

test('BOB stop hook: a numbered list with bold labels ends the turn only with fresh, matching proc steps proof (P20)', () => {
  const d = stepsWorld(), f = join(d, 'steps.md'), src = join(d, 'page.html');
  const msg = '1. Click **Save & close**.\n2. Open `Settings`.\n';
  assert.equal(stepsReason('Nothing for Bob to do.', d), null, 'no list, no check');
  assert.equal(stepsReason('1. one\n2. two', d), null, 'no bold label, no check');
  // red on the old code (no steps check at all), green now
  assert.match(stepsReason(msg, d), /no verified steps on record/);
  writeFileSync(f, '1. Click **Save &amp; close**.\n2. Open `Settings`.\n');
  const out = P.stepsCmd({ file: f, source: src, product: d });
  assert.equal(stepsReason(out, d), null, 'the printed steps pass, with the verified line after them');
  assert.equal(stepsReason(`Here you go.\n\n${out}\nNothing for Bob to do.`, d), null, 'prose around the list is not judged');
  assert.match(stepsReason(out.replace('Open', 'Close'), d), /not the list `proc steps` verified/);
  assert.match(stepsReason(out, d, Date.now() + 31 * 60e3), /over 30 minutes old/);
  assert.equal(stepsReason(out, d, Date.now() + 29 * 60e3), null);
});

test('lastAssistantText: last_assistant_message first, else the transcript\'s assistant text after the last user entry', () => {
  const d = mkdtempSync(join(tmpdir(), 'tr-')), tp = join(d, 't.jsonl');
  const row = (o) => JSON.stringify(o);
  writeFileSync(tp, [row({ type: 'user', message: { role: 'user', content: 'hi' } }), row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'old' }] } }),
    row({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result' }] } }), row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'thinking', thinking: '' }] } }),
    row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '1. a **b**' }] } }), row({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '2. c' }] } }), 'not json'].join('\n'));
  assert.equal(lastAssistantText({ transcript_path: tp }), '1. a **b**\n2. c');
  assert.equal(lastAssistantText({ transcript_path: tp, last_assistant_message: 'direct' }), 'direct');
  assert.equal(lastAssistantText({}), null);
  assert.equal(lastAssistantText({ transcript_path: join(d, 'missing') }), null);
});

// ---- P20: a reading-set document is read whole ----

test('partial-read hook: a Read with offset or limit, or a shell cut in the same pipeline, of a reading-set document is refused (P20)', () => {
  const r = (tool, ti) => preReason('bob', { tool_name: tool, tool_input: ti }, {});
  assert.match(r('Read', { file_path: '/home/user/bio/build/requirements/money.md', limit: 40 }), /build\/requirements\/money\.md is in a reading set.*P20/);
  assert.match(r('Read', { file_path: '/home/user/civicos-process/roles/BOB.md', offset: 10 }), /roles\/BOB\.md/);
  assert.match(preReason('job', { tool_name: 'Read', tool_input: { file_path: 'build/plan/starts-T53/money.txt', offset: 1, limit: 5 } }, {}), /starts-T53\/money\.txt/);
  assert.match(r('Bash', { command: 'grep -n R30 build/requirements/local-facts.md | cut -c1-600' }), /local-facts\.md/);
  assert.match(r('Bash', { command: 'head -5 /home/user/civicos-process/PROCESS-DESIGN.md' }), /PROCESS-DESIGN\.md/);
  assert.match(r('Bash', { command: "sed -n '1,40p' build/handoff.md" }), /build\/handoff\.md/);
  assert.match(r('Bash', { command: 'cat build/rulings-active.md | tail -20' }), /rulings-active\.md/);
  // controls: whole reads, other files, a cut of another command in another pipeline, an in-place edit, a search
  assert.equal(r('Read', { file_path: '/home/user/bio/build/requirements/money.md' }), null);
  assert.equal(r('Read', { file_path: '/home/user/bio/build/plan/current.md', offset: 3, limit: 9 }), null);
  assert.equal(r('Bash', { command: 'cat /home/user/civicos-process/roles/BOB.md' }), null);
  assert.equal(r('Bash', { command: 'git log --oneline -3 | head; cat build/handoff.md' }), null);
  assert.equal(r('Bash', { command: 'sed -i s/a/b/ build/requirements/money.md' }), null);
  assert.equal(r('Bash', { command: 'grep -n R30 build/requirements/money.md' }), null);
  assert.equal(r('Bash', { command: 'head -3 build/jobs/T53/money.md' }), null);
});

// ---- P13, bio K4207: a long procedure runs as a background task ----

test('background hook: proc merge, layer close, job complete and tests are refused in the foreground; controls pass (P13; bio K4207)', () => {
  const bash = (role, command, ti = {}) => preReason(role, { tool_name: 'Bash', tool_input: { command, ...ti } }, { tranche: T, module: 'alpha' });
  for (const role of ['bob', 'job'])
    for (const c of ['merge --module alpha', 'layer close --layer 1', 'job complete --report-file r.md', 'tests --module alpha']) {
      const cmd = `node /home/user/civicos-process/tools/proc.mjs ${c} --product bio --tranche ${T}`;
      assert.match(bash(role, cmd), /P13; bio K4207.*run_in_background true/, `${role} ${c}`);
      assert.match(bash(role, cmd, { run_in_background: false }), /run_in_background true/);
      assert.match(bash(role, `cd x && ${cmd} 2>&1 | tail -5`), /run_in_background true/);
      assert.equal(bash(role, cmd, { run_in_background: true }), null, `${role} ${c} in the background`);
    }
  // controls: other commands, and a name that is only a part of another command
  for (const c of ['status --gate', 'job state --set "WAITING: x"', 'layer start --layer 1', 'job started --module a', 'steps --file s.md', 'shims'])
    assert.equal(bash('bob', `node tools/proc.mjs ${c} --tranche ${T}`), null, c);
  assert.equal(bash('bob', 'cat roles/BOB.md'), null);
  assert.equal(bash('job', 'node --test tools/test/proc.test.mjs'), null);
  // a mention of the command is not a run of it; a search for its process is a hand-written wait (lane-process-repair item a)
  assert.match(bash('bob', 'pgrep -f "proc.mjs merge" || echo none'), /hand-written wait/);
  assert.equal(bash('bob', 'grep -n "proc.mjs merge" roles/BOB.md'), null);
});

test('background marker: written while a long command runs, removed after it ends, also after a refusal; not written for other commands', () => {
  const w = world(), f = join(w.bobRoot, '.git', P.RUNNING);
  assert.deepEqual(P.BACKGROUND, ['merge', 'layer close', 'job complete', 'tests']);
  let seen = null;
  const r = P.withRunning('tests', { product: w.bob }, () => { seen = JSON.parse(readFileSync(f, 'utf8')); return 'done'; });
  assert.equal(r, 'done');
  assert.equal(seen.pid, process.pid); assert.equal(seen.cmd, 'tests'); assert.ok(!Number.isNaN(Date.parse(seen.at)));
  assert.equal(existsSync(f), false);
  assert.throws(() => P.withRunning('merge', { product: w.bob }, () => { assert.ok(existsSync(f)); P.merge({ product: w.bob, tranche: T, module: 'nope' }); }), /refused|nope|module|job/i);
  assert.equal(existsSync(f), false);
  P.withRunning('status', { product: w.bob }, () => { assert.equal(existsSync(f), false); });
  // the command line: a refusal ends the command and leaves no marker
  const cli = spawnSync('node', [join(HERE, '..', 'proc.mjs'), 'job', 'complete', '--product', w.bob, '--tranche', T], { encoding: 'utf8' });
  assert.notEqual(cli.status, 0);
  assert.equal(existsSync(f), false);
});

test('background stop: a live pid in .git/civicos-running.json lets the turn end; a dead pid is ignored', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  P.roundOpen(O(w.bob, { round: 'R1', plan: w.plan }));
  P.layerStart(O(w.bob, { layer: 1, usage: 'allowed_warning' }));
  const ctx = () => ({ ...P.readRole(w.bobRoot), root: w.bobRoot, plan: readFileSync(join(w.bob, P.PLAN), 'utf8') });
  const f = join(w.bobRoot, '.git', P.RUNNING);
  assert.match(stopReason('bob', ctx()), /owed: start alpha/);
  writeFileSync(f, JSON.stringify({ pid: process.pid, cmd: 'merge', at: new Date().toISOString() }));
  assert.equal(stopReason('bob', ctx()), null);
  const dead = spawnSync('node', ['-e', '0']).pid;   // a process that has exited
  writeFileSync(f, JSON.stringify({ pid: dead, cmd: 'merge', at: new Date().toISOString() }));
  assert.match(stopReason('bob', ctx()), /owed: start alpha/);
  writeFileSync(f, 'not json');
  assert.match(stopReason('bob', ctx()), /owed: start alpha/);
  rmSync(f);
  assert.match(stopReason('bob', ctx()), /owed: start alpha/);
});

// ---- P13: exclusion, both Stop cases, the loop breaker ----

test('background exclusion: a live marker refuses every other writing command and a second long one; a stale marker is cleared; reads pass', () => {
  const w = world(), f = P.runningPath(w.bobRoot);
  const cli = (...a) => spawnSync('node', [join(HERE, '..', 'proc.mjs'), ...a, '--product', w.bob, '--tranche', T], { encoding: 'utf8' });
  const line = join(w.base, 'line.txt'); writeFileSync(line, 'x · ruling · why\n');
  writeFileSync(f, JSON.stringify({ pid: process.pid, cmd: 'merge', at: new Date().toISOString() }));
  for (const c of [['ruling', '--line-file', line], ['merge', '--module', 'alpha'], ['tests', '--modules', 'alpha'], ['round', 'close']]) {
    const r = cli(...c);
    assert.notEqual(r.status, 0, c.join(' '));
    assert.match(r.stderr, new RegExp(`a procedure is running \\(merge, pid ${process.pid}\\): wait for its completion notice`), c.join(' '));
  }
  assert.throws(() => P.withRunning('layer close', { product: w.bob }, () => 'x'), /a procedure is running \(merge/);
  for (const c of [['status'], ['sizes'], ['addr', '--bob']]) assert.doesNotMatch(cli(...c).stderr, /procedure is running/, c.join(' '));
  assert.ok(existsSync(f), 'the live marker is untouched by a refusal');
  rmSync(f);
  assert.doesNotMatch(cli('ruling', '--line-file', line).stderr, /procedure is running/);   // allowed after
  const dead = spawnSync('node', ['-e', '0']).pid;
  writeFileSync(f, JSON.stringify({ pid: dead, cmd: 'merge', at: 'x' }));
  assert.equal(P.withRunning('tests', { product: w.bob }, () => { assert.equal(JSON.parse(readFileSync(f, 'utf8')).pid, process.pid); return 1; }), 1);
  assert.equal(existsSync(f), false);
  writeFileSync(f, 'garbage');
  assert.equal(P.withRunning('ruling', { product: w.bob }, () => 2), 2);   // an unreadable marker is stale
  assert.equal(existsSync(f), false);
});

test("background marker create is exclusive: a second create fails and leaves the first whole", () => {
  const w = world();
  assert.equal(P.createRunning(w.bobRoot, { pid: process.pid, cmd: 'merge', at: 'a' }), true);
  assert.equal(P.createRunning(w.bobRoot, { pid: 1, cmd: 'tests', at: 'b' }), false);
  assert.equal(JSON.parse(readFileSync(P.runningPath(w.bobRoot), 'utf8')).cmd, 'merge');
  assert.deepEqual(P.readRunning(w.bobRoot).alive, true);
});

test('background stop: a live marker ends the turn with uncommitted changes; a dead one with uncommitted changes is refused naming the stale run', () => {
  const w = world();
  P.takeover(O(w.bob, { name: 'BOB #2', session: B1, depth: 1 }));
  const ctx = () => ({ ...P.readRole(w.bobRoot), root: w.bobRoot, plan: readFileSync(join(w.bob, P.PLAN), 'utf8') });
  writeFileSync(join(w.bob, P.PLAN), readFileSync(join(w.bob, P.PLAN), 'utf8') + '\nedit\n');
  assert.match(stopReason('bob', ctx()), /uncommitted/);
  const f = P.runningPath(w.bobRoot);
  writeFileSync(f, JSON.stringify({ pid: process.pid, cmd: 'merge', at: 'now' }));
  assert.equal(stopReason('bob', ctx()), null);
  const dead = spawnSync('node', ['-e', '0']).pid;
  writeFileSync(f, JSON.stringify({ pid: dead, cmd: 'merge', at: '2026-10-28T10:00:00Z' }));
  const why = stopReason('bob', ctx());
  assert.match(why, /uncommitted/);
  assert.match(why, new RegExp(`a stale run is on record \\(merge, pid ${dead}, started 2026-10-28T10:00:00Z\\).*inspect`));
  g(w.bobRoot, 'checkout', '-q', '--', '.');
  assert.doesNotMatch(String(stopReason('bob', ctx())), /stale run/);   // nothing else wrong: the stale file is ignored
});

test('stop loop breaker counts consecutive refusals whatever their text', () => {
  let last = {};
  const seq = ['uncommitted changes', '2 commit(s) not pushed', 'owed: merge x', 'owed: merge y'];
  const ns = seq.map((why) => { const n = H.refusalCount(last, why); last = { why, n }; return n; });
  assert.deepEqual(ns, [1, 2, 3, 4]);
  assert.equal(H.refusalCount(last, null), 0);
  assert.equal(H.refusalCount({ why: null, n: 0 }, 'a'), 1);
});
