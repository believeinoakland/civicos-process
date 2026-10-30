// The platform module's tests (build/requirements/platform.md), at its interface: tools/platform.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../platform.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
// A repository with a bare remote and two commits; `first` is the older. `label` makes its history its own.
function world(label = '') {
  const d = mkdtempSync(join(tmpdir(), 'platform-')), remote = join(d, 'remote.git'), dir = join(d, 'work');
  execFileSync('git', ['init', '-q', '--bare', remote]);
  execFileSync('git', ['init', '-q', '-b', 'main', dir]);
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t']]) git(dir, 'config', k, v);
  git(dir, 'remote', 'add', 'origin', remote);
  git(dir, 'commit', '-q', '--allow-empty', '-m', `one ${label}`); const first = git(dir, 'rev-parse', 'HEAD');
  git(dir, 'commit', '-q', '--allow-empty', '-m', `two ${label}`);
  git(dir, 'push', '-q', 'origin', 'HEAD:main');
  return { d, dir, first, head: git(dir, 'rev-parse', 'HEAD') };
}

test('R1 R2 R12: every constraint row is a measured fact with its day, count, evidence and workaround; a row without a date fails the format', () => {
  const rows = P.constraints();
  assert.ok(rows.length > 0);
  for (const r of rows) assert.deepEqual(P.rowProblems(r), [], r.id);
  for (const r of P.acts()) assert.deepEqual(P.rowProblems(r), [], r.id);
  const { date, ...undated } = rows[0];
  assert.match(P.rowProblems(undated).join(), /no date/);
  assert.match(P.rowProblems({ ...rows[0], date: '30 Oct' }).join(), /is not a day/);
  assert.match(P.rowProblems({ ...rows[0], count: 'many' }).join(), /is not a count/);
  // ids are unique, so a refusal names one row
  const ids = P.knownIds();
  assert.equal(new Set(ids).size, ids.length);
});

test('R2: constraints({ olderThan }) lists exactly the rows last confirmed before that day; a bad day is refused', () => {
  const all = P.constraints();
  const stale = P.constraints({ olderThan: '2026-10-30' });
  assert.deepEqual(stale.map((r) => r.id), all.filter((r) => r.date < '2026-10-30').map((r) => r.id));
  assert.ok(stale.length > 0 && stale.length < all.length);
  assert.deepEqual(P.constraints({ olderThan: '2000-01-01' }), []);
  assert.equal(P.constraints({ olderThan: '2999-01-01' }).length, all.length);
  assert.throws(() => P.constraints({ olderThan: 'yesterday' }), /a day/);
});

test('R3: the acts the process depends on, each with its pass count and its role', () => {
  const names = P.acts().map((r) => P.callName(r.id));
  for (const a of ['create_session', 'send_message', 'get_session', 'list_events', 'send_later', 'create_pull_request', 'update_pull_request', 'add_issue_comment', 'merge_pull_request', 'actions_run_trigger', 'git push']) assert.ok(names.includes(a), a);
  assert.ok(P.acts().some((r) => r.id === 'git push(own branch)'));
  for (const r of P.acts()) { assert.ok(Number.isInteger(r.passes) && r.passes > 0, r.id); assert.ok(r.role, r.id); }
  assert.deepEqual(P.acts({ id: 'send_message' }).map((r) => r.id), ['send_message']);
  assert.throws(() => P.acts({ id: 'no_such_act' }), /not an act the process depends on/);
});

test('R3: each act carries the fields its result has when it has run, with where they were seen', () => {
  const by = Object.fromEntries(P.acts().map((r) => [r.id, r]));
  for (const r of P.acts()) {
    assert.ok(r.result && typeof r.result === 'object' && !Array.isArray(r.result), `${r.id}: result`);
    assert.ok(r.resultFrom, `${r.id}: resultFrom`);
  }
  assert.deepEqual(by.send_message.result, { status: 'delivered' });
  assert.deepEqual(by.merge_pull_request.result, { merged: true });
  assert.deepEqual(by.create_pull_request.result, { number: null });
  assert.deepEqual(by.create_session.result, { id: null });
  assert.deepEqual(by.add_issue_comment.result, { id: null, url: null });
  assert.deepEqual(by.actions_run_trigger.result, {});
  assert.match(by.actions_run_trigger.resultFrom, /no run id/);
  // the archive is no act (R4), and its row carries the four usage counts the record is written from
  const archive = P.constraints().find((r) => r.id === 'archive_session(child)');
  assert.deepEqual(Object.keys(archive.result), ['cache_read_tokens', 'cache_write_tokens', 'input_tokens', 'output_tokens']);
  // a row whose result is not a set of fields fails the format; the rendering shows each act's fields
  assert.match(P.rowProblems({ ...by.send_message, result: ['status'] }).join(), /result is not a set of fields/);
  assert.match(P.rowProblems({ ...by.send_message, result: undefined }).join(), /no result/);
  assert.match(P.render(), /`status: delivered`/);
  assert.match(P.render(), /`merged: true`/);
});

test('R4: an act the classifier decides case by case is refused, never listed as an act', () => {
  for (const id of ['archive_session', 'update_trigger', 'delete_trigger', 'interrupt_session']) {
    assert.ok(!P.acts().some((r) => P.callName(r.id) === id), id);
    const row = P.constraints().find((r) => P.callName(r.id) === id);
    assert.ok(row?.classifier, id);
    assert.throws(() => P.acts({ id: row.id }), /classifier case by case/);
  }
  assert.ok(P.constraints().some((r) => r.classifier && /settings/.test(r.id)), 'an edit of a settings file');
  assert.ok(!P.acts().some((r) => /settings/.test(r.id)));
});

test('R5: no row names a hook as the thing that enforces anything', () => {
  for (const r of [...P.constraints(), ...P.acts()]) {
    for (const f of ['route', 'workaround']) if (r[f]) assert.doesNotMatch(r[f], /hook/i, `${r.id}: ${f}`);
    assert.doesNotMatch(r.role || '', /hook/i, r.id);
  }
});

test('R6: versionCheck answers PROCESS OK when the pin is in the checkout, PROCESS STALE with the head when it is not', () => {
  const w = world();
  assert.equal(P.processHead(w.dir), w.head);
  assert.equal(P.versionCheck(w.head, w.dir), 'PROCESS OK');
  assert.equal(P.versionCheck(w.first, w.dir), 'PROCESS OK');
  const other = world('other');   // its own history: two worlds made in one second would share commits
  assert.equal(P.versionCheck(other.head, w.dir), `PROCESS STALE ${w.head.slice(0, 12)}`);
  assert.throws(() => P.versionCheck('main', w.dir), /not a commit/);
  // the prompt's form: one shell line, the same answer, the checkout's head compared as found and never moved
  const d = join(w.d, 'clone'); execFileSync('git', ['clone', '-q', '-b', 'main', join(w.d, 'remote.git'), d]);
  const sh = (sha) => execFileSync('sh', ['-c', P.versionCommand(sha, d)], { encoding: 'utf8' }).trim();
  assert.equal(sh(w.head), 'PROCESS OK');
  assert.equal(sh(other.head), `PROCESS STALE ${w.head.slice(0, 12)}`);
  git(d, 'checkout', '-q', '--detach', w.first);   // a copy behind the pin: stale, and left where it was
  assert.equal(sh(w.head), `PROCESS STALE ${w.first.slice(0, 12)}`);
  assert.equal(git(d, 'rev-parse', 'HEAD'), w.first);
  assert.equal(P.versionCheck(w.head, d), `PROCESS STALE ${w.first.slice(0, 12)}`);
});

test('R7: grantsCheck proves the standing list, the push, the GitHub identity and the product\'s services, variables and addresses, and records the result with its time', async () => {
  const w = world(), at = '2026-10-30T12:00:00Z';
  const res = (status, body, headers = {}) => ({ status, text: async () => JSON.stringify(body), headers: { get: (k) => headers[k.toLowerCase()] ?? null } });
  const net = (gh, svc = res(200, { r: { s: 'active' } })) => async (url) => (url.includes('api.github.com') ? gh : url.includes('svc.example') ? svc : url.includes('gone.example') ? Promise.reject(Object.assign(new Error('x'), { cause: { code: 'ENOTFOUND' } })) : res(503, {}));
  const app = res(200, { login: 'owner' }, { 'x-oauth-client-id': 'Iv1' });
  const grants = (x) => writeFileSync(join(w.dir, 'build/grants.json'), JSON.stringify({ identity: 'owner', ...x }));
  const check = (x = {}) => P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(app), now: at, env: { PLATFORM_TEST_VAR: 'x' }, ...x });
  let r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(app), now: at });
  assert.equal(r.ok, false);
  assert.match(r.rows[0].detail, /missing from \.claude\/settings\.json/);
  assert.match(P.grantsHeld(w.dir, new Date(at)), /a grant is not held: standing list/);
  const standing = JSON.parse(readFileSync(join(ROOT, 'permissions.json'), 'utf8'));
  mkdirSync(join(w.dir, '.claude')); mkdirSync(join(w.dir, 'build'));
  writeFileSync(join(w.dir, '.claude/settings.json'), JSON.stringify({ permissions: standing }));
  grants({ services: [{ name: 'Svc', url: 'https://svc.example/v', active: 'r.s=active', expires: 'r.e' }], variables: ['PLATFORM_TEST_VAR'], urls: ['https://down.example/'] });
  r = await check({ urls: 'https://gone.example/' });
  assert.deepEqual(r.rows.map((x) => [x.grant, x.ok]), [['standing list', true], ['push to main', true], ['GitHub API', true], ['Svc', true], ['variable PLATFORM_TEST_VAR', true], ['reach https://down.example/', false], ['reach https://gone.example/', false]]);
  assert.match(r.rows[2].detail, /^owner by the Claude app's token/);
  assert.equal(r.rows[6].detail, 'ENOTFOUND');
  const kept = JSON.parse(readFileSync(join(w.dir, '.git', P.GRANTS_FILE), 'utf8'));
  assert.equal(kept.at, new Date(at).toISOString());
  assert.match(P.grantsHeld({ root: w.dir }, new Date(at)), /reach https:\/\/down\.example\/: answered 503/);
  // a service inactive, or expiring within 14 days, is not held
  r = await check({ fetch: net(app, res(200, { r: { s: 'disabled' } })) });
  assert.deepEqual([r.rows[3].ok, r.rows[3].detail], [false, 'r.s disabled']);
  r = await check({ fetch: net(app, res(200, { r: { s: 'active', e: '2026-11-01T00:00:00Z' } })) });
  assert.match(r.rows[3].detail, /expiring 2026-11-01T00:00:00Z: renew/); assert.equal(r.rows[3].ok, false);
  // variables by name only
  grants({ variables: ['PLATFORM_TEST_VAR'] });
  r = await check({ env: {} });
  assert.deepEqual(r.rows.map((x) => x.ok), [true, true, true, false]);
  assert.equal(r.rows[3].detail, 'not set in this environment');
  r = await check();
  assert.equal(r.ok, true);
  assert.equal(P.grantsHeld(w.dir, new Date(at)), null);
  assert.match(P.grantsHeld(w.dir, new Date('2026-11-01T12:00:00Z')), /over 24 hours ago/);   // older than a day: refused
  // the identity: another login fails the row; none named fails it, saying what it saw and where to name it; the role
  // record, else the manifest, names it when build/grants.json does not
  r = await check({ fetch: net(res(200, { login: 'someone' }, { 'x-oauth-client-id': 'Iv1' })) });
  assert.deepEqual([r.rows[2].ok, r.rows[2].detail], [false, 'someone by the Claude app\'s token (client Iv1), not the expected owner']);
  writeFileSync(join(w.dir, 'build/grants.json'), JSON.stringify({ variables: ['PLATFORM_TEST_VAR'] }));
  r = await check();
  assert.equal(r.rows[2].ok, false); assert.match(r.rows[2].detail, /^owner by .*: no expected identity is named \(`identity` in build\/grants\.json, or "GitHub identity `<login>`" in build\/manifest\.md\)$/);
  writeFileSync(join(w.dir, 'build/manifest.md'), '| accounts | the second account (GitHub identity `Owner`), then (GitHub identity `other`) |\n');
  r = await check(); assert.equal(r.rows[2].ok, true);
  writeFileSync(join(w.dir, '.git', P.ROLE_FILE), JSON.stringify({ role: 'bob', identity: 'third' }));
  r = await check(); assert.deepEqual([r.rows[2].ok, r.rows[2].detail], [false, 'owner by the Claude app\'s token (client Iv1), not the expected third']);
  grants({ variables: ['PLATFORM_TEST_VAR'] });   // build/grants.json names it: owner
  r = await check(); assert.equal(r.rows[2].ok, true);
  // a precedence, not a union: build/grants.json names owner, so the role record's third is not accepted
  r = await check({ fetch: net(res(200, { login: 'third' }, { 'x-oauth-client-id': 'Iv1' })) });
  assert.deepEqual([r.rows[2].ok, r.rows[2].detail], [false, 'third by the Claude app\'s token (client Iv1), not the expected owner']);
  // a token of its own expiring within 14 days, or no credential at all, is not held
  const pat = res(200, { login: 'owner' }, { 'github-authentication-token-expiration': '2026-11-02 00:00:00 UTC' });
  r = await check({ fetch: net(pat) });
  assert.match(r.rows[2].detail, /^owner by a token of its own, expiring 2026-11-02 00:00:00 UTC \(2 days\): renew before 14 days remain/); assert.equal(r.rows[2].ok, false);
  r = await check({ fetch: net(res(403, {})) });
  assert.match(r.rows[2].detail, /GET \/user answered 403: no credential reaches api\.github\.com/); assert.equal(r.ok, false);
  writeFileSync(join(w.dir, 'build/grants.json'), '{ not json');
  r = await check(); assert.match(r.rows.find((x) => x.grant === 'build/grants.json').detail, /^unreadable/);
  assert.match(P.grantsHeld(join(w.d, 'none')), /not proven held/);   // no record: not held
});

test('R8: dispatch prints the actions_run_trigger call for each runner workflow, on main, with the secret of the target\'s owner', () => {
  const proc = { owner: 'neobobkrause', repo: 'neoprocess' };
  assert.deepEqual(P.dispatch('setup', { process: proc, repo: 'civicsmith/x', private: true }), { tool: 'actions_run_trigger', owner: 'neobobkrause', repo: 'neoprocess', workflow_id: 'repo-setup.yml', ref: 'main', inputs: { repo: 'civicsmith/x', private: 'true' }, secret: 'NEOPROCESS_GITHUB_TOKEN_CIVICSMITH' });
  assert.deepEqual(P.dispatch('rename', { process: proc, repo: 'neobobkrause/a', name: 'b' }).inputs, { repo: 'neobobkrause/a', name: 'b' });
  assert.deepEqual(P.dispatch('transfer', { process: proc, repo: 'my-org/a', to: 'z' }), { tool: 'actions_run_trigger', owner: 'neobobkrause', repo: 'neoprocess', workflow_id: 'repo-transfer.yml', ref: 'main', inputs: { repo: 'my-org/a', to: 'z' }, secret: 'NEOPROCESS_GITHUB_TOKEN_MY_ORG' });
  assert.equal(P.dispatch('shims', { process: proc, repo: 'neobobkrause/p' }).secret, 'NEOPROCESS_GITHUB_TOKEN');
  assert.throws(() => P.dispatch('delete', { repo: 'a/b' }), /no runner workflow/);
  assert.throws(() => P.dispatch('prune', { repo: 'a/b' }), /no runner workflow for prune: one of setup, rename, transfer, shims/);
  assert.throws(() => P.dispatch('setup', { repo: 'nope' }), /owner\/name/);
  // each workflow exists, is dispatchable, and picks the secret by the same rule
  for (const [kind, wf] of Object.entries(P.WORKFLOWS).filter(([k]) => k !== 'prune')) {
    const text = readFileSync(join(ROOT, '.github', 'workflows', wf), 'utf8');
    assert.match(text, /^on:\n {2}workflow_dispatch:/m, wf);
    const step = text.match(/run: \|\n((?: {10}.*\n)+)/)[1];
    for (const owner of ['neobobkrause', 'civicsmith', 'my-org']) {
      const out = execFileSync('sh', ['-c', `${step.replace(/^ {10}/gm, '')}`], { encoding: 'utf8', env: { REPO: `${owner}/r`, GITHUB_REPOSITORY_OWNER: 'neobobkrause', GITHUB_OUTPUT: '/dev/null', PATH: process.env.PATH } });
      assert.match(out, new RegExp(`: ${P.dispatch(kind, { process: proc, repo: `${owner}/r`, name: 'n', to: 't' }).secret}\\n`), `${wf} ${owner}`);
    }
  }
});

test('R9: a product role never takes the process repository as a write target, the role read from the record when the caller names none; the route to the process is a recorded value', () => {
  const proc = { owner: 'neobobkrause', repo: 'neoprocess' };
  for (const role of ['job', 'bob', 'lane', 'root', 'onboard']) assert.throws(() => P.dispatch('rename', { process: proc, repo: 'NeoBobKrause/neoprocess', name: 'x', role }), /never takes the process repository as a write target/, role);
  assert.equal(P.dispatch('rename', { process: proc, repo: 'neobobkrause/neoprocess', name: 'x', role: 'process' }).inputs.repo, 'neobobkrause/neoprocess');
  assert.equal(P.dispatch('setup', { process: proc, repo: 'civicsmith/civicsmith', role: 'bob' }).inputs.repo, 'civicsmith/civicsmith');
  // no role named: the checkout's record decides; with no record the call is refused
  const w = world();
  assert.equal(P.recordedRole(w.dir), null);
  assert.throws(() => P.dispatch('shims', { process: proc, repo: 'neobobkrause/neoprocess', root: w.dir }), /a session with no recorded role never takes/);
  writeFileSync(join(w.dir, '.git', P.ROLE_FILE), JSON.stringify({ role: 'job', module: 'alpha' }));
  assert.deepEqual(P.recordedRole(w.dir), { role: 'job', module: 'alpha' });
  assert.throws(() => P.dispatch('rename', { process: proc, repo: 'neobobkrause/neoprocess', name: 'x', root: w.dir }), /a job never takes the process repository/);
  assert.equal(P.dispatch('setup', { process: proc, repo: 'civicsmith/x', root: w.dir }).inputs.repo, 'civicsmith/x');
  writeFileSync(join(w.dir, '.git', P.ROLE_FILE), JSON.stringify({ role: 'process' }));
  assert.equal(P.dispatch('rename', { process: proc, repo: 'neobobkrause/neoprocess', name: 'x', root: w.dir }).inputs.name, 'x');
  // the default checkout is the one holding the current directory
  const here = process.cwd(); process.chdir(w.dir);
  try { assert.equal(P.dispatch('rename', { process: proc, repo: 'neobobkrause/neoprocess', name: 'x' }).inputs.name, 'x'); } finally { process.chdir(here); }
  for (const v of P.ROUTES) assert.equal(P.processRoute(v), v);
  assert.deepEqual(P.ROUTES, ['public', 'read grant', 'carried']);
  assert.throws(() => P.processRoute('collaborator'), /one of public, read grant, carried/);
});

test('R10: the measured limits: 30 minutes in the background, depth 8 of which the process allows 2, and the delete route as data', () => {
  assert.deepEqual(P.limits(), { backgroundMinutes: 30, depth: { limit: 8, allowed: 2 }, deleteRoute: { direct: 'refused', workflow: 'prune.yml', act: 'actions_run_trigger', ref: 'main' } });
  assert.equal(P.limits().deleteRoute.workflow, P.WORKFLOWS.prune);
  // the route is real: the workflow is dispatchable, its act a row the process depends on, and the refusal a constraint
  assert.match(readFileSync(join(ROOT, '.github', 'workflows', P.WORKFLOWS.prune), 'utf8'), /^on:\n(?: .*\n)*? {2}workflow_dispatch:/m);
  assert.ok(P.acts().some((r) => r.id === P.limits().deleteRoute.act));
  assert.ok(P.constraints().some((r) => /ref delete/.test(r.fact) && /prune\.yml/.test(r.workaround)));
  for (const [id, n] of [['background limit', '30 minutes'], ['session depth', 'depth 8']]) assert.ok(P.constraints().find((r) => r.id === id).fact.includes(n), id);
});

test('R11: the module holds and prints no credential: every secret is named, never shown, and the grants record holds none', async () => {
  const text = JSON.stringify([P.constraints(), P.acts(), P.dispatch('setup', { process: { owner: 'a', repo: 'b' }, repo: 'c/d' }), P.render()]);
  assert.doesNotMatch(text, /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/);
  const w = world();
  mkdirSync(join(w.dir, 'build'));
  writeFileSync(join(w.dir, 'build/grants.json'), JSON.stringify({ variables: ['SECRET_X'] }));
  const res = { status: 200, text: async () => '{"login":"o"}', headers: { get: () => null } };
  const r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: async () => res, env: { SECRET_X: 'value-never-shown' } });
  assert.doesNotMatch(JSON.stringify(r) + readFileSync(join(w.dir, '.git', P.GRANTS_FILE), 'utf8'), /value-never-shown/);
});

// Until the completion round (N2-46): the classifier-judged calls another module still prints, inherited and named (R4).
const INHERITED = ['archive_session', 'update_trigger', 'add_repo'];
test('R4 R12: every platform call any module prints, however printed, is a row of the constraints or the acts; one whose row is classifier-judged is only an inherited one', () => {
  // the vocabulary is the platform's whole tool list, held as data: every GitHub and session tool, and the git and headless acts
  const names = P.toolNames();
  for (const n of ['list_issues', 'enable_pr_auto_merge', 'fork_repository', 'create_session', 'watch_url', 'git push', 'claude -p']) assert.ok(names.includes(n), n);
  assert.equal(new Set(names).size, names.length);
  const files = [...['tools', 'checks'].flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.mjs')).map((f) => join(ROOT, d, f)))].filter((f) => !f.endsWith('platform.mjs'));
  const seen = new Set();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const c of P.callsIn(src)) seen.add(c);
    assert.deepEqual(P.callProblems(src, INHERITED), [], f);
  }
  for (const c of ['create_session', 'actions_run_trigger', 'create_trigger', 'fire_trigger', 'list_triggers', 'update_trigger', 'list_issues', 'enable_pr_auto_merge', 'git push', 'claude -p']) assert.ok(seen.has(c), `${c} not seen: ${[...seen].join()}`);
  assert.ok(INHERITED.every((c) => P.rowFor(c)?.classifier), 'each inherited call is a classifier-judged row');
  // a made-up call, a platform call with no row, and a classifier-judged call not inherited each fail, however printed
  assert.deepEqual(P.callProblems("{ tool: 'mcp__github__made_up_tool', x: 1 }"), ['made_up_tool: printed as a call, and not a platform tool']);
  assert.equal(P.rowFor('fork_repository'), null);
  assert.deepEqual(P.callProblems('then fork it with fork_repository, by hand'), ['fork_repository: printed, and no row']);
  assert.deepEqual(P.callProblems('`update_trigger enabled false`'), ['update_trigger: printed, and decided by the classifier case by case (R4)']);
  assert.deepEqual(P.callProblems('`update_trigger enabled false`', ['update_trigger']), []);
  assert.deepEqual(P.callProblems('send_message to BOB; git push to the own branch'), []);
  // and the dispatch this module prints is one
  assert.ok(P.rowFor(P.dispatch('shims', { repo: 'a/b' }).tool));
});

test('R1: tools/platform.md is the rendering of the tables, and the retired act table names it', () => {
  assert.equal(readFileSync(join(ROOT, 'tools', 'platform.md'), 'utf8'), P.render());
  for (const r of [...P.constraints(), ...P.acts()]) assert.ok(P.render().includes(`\`${r.id.replace(/\|/g, '\\|')}\``), r.id);
  if (existsSync(join(ROOT, 'tools', 'acts.md'))) assert.match(readFileSync(join(ROOT, 'tools', 'acts.md'), 'utf8'), /retired[^]*tools\/platform\.mjs/);
});
