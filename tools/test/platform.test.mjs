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
// A repository with a bare remote and two commits; `first` is the older.
function world() {
  const d = mkdtempSync(join(tmpdir(), 'platform-')), remote = join(d, 'remote.git'), dir = join(d, 'work');
  execFileSync('git', ['init', '-q', '--bare', remote]);
  execFileSync('git', ['init', '-q', '-b', 'main', dir]);
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t']]) git(dir, 'config', k, v);
  git(dir, 'remote', 'add', 'origin', remote);
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'one'); const first = git(dir, 'rev-parse', 'HEAD');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'two');
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
  for (const a of ['create_session', 'send_message', 'get_session', 'list_events', 'send_later', 'create_pull_request', 'update_pull_request', 'add_issue_comment', 'merge_pull_request', 'actions_run_trigger', 'git']) assert.ok(names.includes(a), a);
  assert.ok(P.acts().some((r) => r.id === 'git push(own branch)'));
  for (const r of P.acts()) { assert.ok(Number.isInteger(r.passes) && r.passes > 0, r.id); assert.ok(r.role, r.id); }
  assert.deepEqual(P.acts({ id: 'send_message' }).map((r) => r.id), ['send_message']);
  assert.throws(() => P.acts({ id: 'no_such_act' }), /not an act the process depends on/);
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
  const other = world();
  assert.equal(P.versionCheck(other.head, w.dir), `PROCESS STALE ${w.head.slice(0, 12)}`);
  assert.throws(() => P.versionCheck('main', w.dir), /not a commit/);
  // the prompt's form: one shell line, run once at the start, the same answer
  const d = join(w.d, 'clone'); execFileSync('git', ['clone', '-q', join(w.d, 'remote.git'), d]);
  assert.equal(execFileSync('sh', ['-c', P.versionCommand(w.head, d)], { encoding: 'utf8' }).trim(), 'PROCESS OK');
  assert.equal(execFileSync('sh', ['-c', `${P.versionCommand(other.head, d)} 2>/dev/null`], { encoding: 'utf8' }).trim(), 'PROCESS STALE');
});

test('R7: grantsCheck proves the standing list, the push, the GitHub identity and the product\'s services, variables and addresses, and records the result with its time', async () => {
  const w = world(), at = '2026-10-30T12:00:00Z';
  const res = (status, body, headers = {}) => ({ status, text: async () => JSON.stringify(body), headers: { get: (k) => headers[k.toLowerCase()] ?? null } });
  const net = (gh) => async (url) => (url.includes('api.github.com') ? gh : url.includes('svc.example') ? res(200, { r: { s: 'active' } }) : res(503, {}));
  const app = res(200, { login: 'owner' }, { 'x-oauth-client-id': 'Iv1' });
  let r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(app), now: at });
  assert.equal(r.ok, false);
  assert.match(r.rows[0].detail, /missing from \.claude\/settings\.json/);
  assert.match(P.grantsHeld(w.dir, new Date(at)), /a grant is not held: standing list/);
  const standing = JSON.parse(readFileSync(join(ROOT, 'permissions.json'), 'utf8'));
  mkdirSync(join(w.dir, '.claude')); mkdirSync(join(w.dir, 'build'));
  writeFileSync(join(w.dir, '.claude/settings.json'), JSON.stringify({ permissions: standing }));
  writeFileSync(join(w.dir, 'build/grants.json'), JSON.stringify({ services: [{ name: 'Svc', url: 'https://svc.example/v', active: 'r.s=active' }], variables: ['PLATFORM_TEST_VAR'], urls: ['https://down.example/'] }));
  r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(app), now: at, env: { PLATFORM_TEST_VAR: 'x' } });
  assert.deepEqual(r.rows.map((x) => [x.grant, x.ok]), [['standing list', true], ['push to main', true], ['GitHub API', true], ['Svc', true], ['variable PLATFORM_TEST_VAR', true], ['reach https://down.example/', false]]);
  const kept = JSON.parse(readFileSync(join(w.dir, '.git', P.GRANTS_FILE), 'utf8'));
  assert.equal(kept.at, new Date(at).toISOString());
  assert.match(P.grantsHeld({ root: w.dir }, new Date(at)), /reach https:\/\/down\.example\/: answered 503/);
  writeFileSync(join(w.dir, 'build/grants.json'), JSON.stringify({ variables: ['PLATFORM_TEST_VAR'] }));
  r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(app), now: at, env: {} });
  assert.deepEqual(r.rows.map((x) => x.ok), [true, true, true, false]);
  r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(app), now: at, env: { PLATFORM_TEST_VAR: 'x' } });
  assert.equal(r.ok, true);
  assert.equal(P.grantsHeld(w.dir, new Date(at)), null);
  assert.match(P.grantsHeld(w.dir, new Date('2026-11-01T12:00:00Z')), /over 24 hours ago/);   // older than a day: refused
  // a token of its own expiring within 14 days, or no credential at all, is not held
  const pat = res(200, { login: 'owner' }, { 'github-authentication-token-expiration': '2026-11-02 00:00:00 UTC' });
  r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(pat), now: at, env: { PLATFORM_TEST_VAR: 'x' } });
  assert.match(r.rows[2].detail, /renew before 14 days remain/); assert.equal(r.rows[2].ok, false);
  r = await P.grantsCheck({ root: w.dir, branch: 'main', fetch: net(res(401, {})), now: at, env: { PLATFORM_TEST_VAR: 'x' } });
  assert.match(r.rows[2].detail, /no credential reaches/);
  assert.match(P.grantsHeld(join(w.d, 'none')), /not proven held/);   // no record: not held
});

test('R8: dispatch prints the actions_run_trigger call for each runner workflow, on main, with the secret of the target\'s owner', () => {
  const proc = { owner: 'neobobkrause', repo: 'neoprocess' };
  assert.deepEqual(P.dispatch('setup', { process: proc, repo: 'civicsmith/x', private: true }), { tool: 'actions_run_trigger', owner: 'neobobkrause', repo: 'neoprocess', workflow_id: 'repo-setup.yml', ref: 'main', inputs: { repo: 'civicsmith/x', private: 'true' }, secret: 'NEOPROCESS_GITHUB_TOKEN_CIVICSMITH' });
  assert.deepEqual(P.dispatch('rename', { process: proc, repo: 'neobobkrause/a', name: 'b' }).inputs, { repo: 'neobobkrause/a', name: 'b' });
  assert.deepEqual(P.dispatch('transfer', { process: proc, repo: 'my-org/a', to: 'z' }), { tool: 'actions_run_trigger', owner: 'neobobkrause', repo: 'neoprocess', workflow_id: 'repo-transfer.yml', ref: 'main', inputs: { repo: 'my-org/a', to: 'z' }, secret: 'NEOPROCESS_GITHUB_TOKEN_MY_ORG' });
  assert.equal(P.dispatch('shims', { process: proc, repo: 'neobobkrause/p' }).secret, 'NEOPROCESS_GITHUB_TOKEN');
  assert.throws(() => P.dispatch('delete', { repo: 'a/b' }), /no runner workflow/);
  assert.throws(() => P.dispatch('setup', { repo: 'nope' }), /owner\/name/);
  // each workflow exists, is dispatchable, and picks the secret by the same rule
  for (const [kind, wf] of Object.entries(P.WORKFLOWS)) {
    const text = readFileSync(join(ROOT, '.github', 'workflows', wf), 'utf8');
    assert.match(text, /^on:\n {2}workflow_dispatch:/m, wf);
    const step = text.match(/run: \|\n((?: {10}.*\n)+)/)[1];
    for (const owner of ['neobobkrause', 'civicsmith', 'my-org']) {
      const out = execFileSync('sh', ['-c', `${step.replace(/^ {10}/gm, '')}`], { encoding: 'utf8', env: { REPO: `${owner}/r`, GITHUB_REPOSITORY_OWNER: 'neobobkrause', GITHUB_OUTPUT: '/dev/null', PATH: process.env.PATH } });
      assert.match(out, new RegExp(`: ${P.dispatch(kind, { process: proc, repo: `${owner}/r`, name: 'n', to: 't' }).secret}\\n`), `${wf} ${owner}`);
    }
  }
});

test('R9: a product role never takes the process repository as a write target; the route to the process is a recorded value', () => {
  const proc = { owner: 'neobobkrause', repo: 'neoprocess' };
  for (const role of ['job', 'bob', 'lane', 'root', 'onboard']) assert.throws(() => P.dispatch('rename', { process: proc, repo: 'NeoBobKrause/neoprocess', name: 'x', role }), /never takes the process repository as a write target/, role);
  assert.equal(P.dispatch('rename', { process: proc, repo: 'neobobkrause/neoprocess', name: 'x', role: 'process' }).inputs.repo, 'neobobkrause/neoprocess');
  assert.equal(P.dispatch('setup', { process: proc, repo: 'civicsmith/civicsmith', role: 'bob' }).inputs.repo, 'civicsmith/civicsmith');
  for (const v of P.ROUTES) assert.equal(P.processRoute(v), v);
  assert.deepEqual(P.ROUTES, ['public', 'read grant', 'carried']);
  assert.throws(() => P.processRoute('collaborator'), /one of public, read grant, carried/);
});

test('R10: the measured limits: 30 minutes in the background, depth 8 of which the process allows 2', () => {
  assert.deepEqual(P.limits(), { backgroundMinutes: 30, depth: { limit: 8, allowed: 2 } });
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

// The platform's tool vocabulary: the session tools and the GitHub tools a session can call. A name of it that another
// module prints as a call (`tool: '<name>'`, or `<name>: {` as a call's key) must be a row (R12).
const VOCABULARY = ['create_session', 'send_message', 'get_session', 'list_events', 'list_sessions', 'archive_session', 'unarchive_session', 'interrupt_session', 'send_later', 'create_trigger', 'update_trigger', 'delete_trigger', 'fire_trigger', 'list_triggers', 'subscribe_pr_activity', 'unsubscribe_pr_activity', 'add_repo', 'create_pull_request', 'update_pull_request', 'update_pull_request_branch', 'merge_pull_request', 'pull_request_read', 'pull_request_review_write', 'add_issue_comment', 'issue_write', 'issue_read', 'actions_run_trigger', 'actions_list', 'create_branch', 'push_files', 'create_or_update_file', 'delete_file', 'create_repository'];
test('R12: every platform call any module prints is a row of the constraints or the acts', () => {
  const files = [...['tools', 'checks'].flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.mjs')).map((f) => join(ROOT, d, f)))].filter((f) => !f.endsWith('platform.mjs'));
  const printed = new Set();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/tool: '(?:mcp__[a-z0-9-]+__)?([a-z_]+)'/g)) printed.add(m[1]);
    for (const m of src.matchAll(/\b([a-z]+(?:_[a-z]+)+): \{/g)) if (VOCABULARY.includes(m[1])) printed.add(m[1]);
  }
  assert.ok(printed.has('create_session') && printed.has('actions_run_trigger'), [...printed].join());
  for (const call of printed) { assert.ok(VOCABULARY.includes(call), `${call}: printed, and not of the platform's vocabulary`); assert.ok(P.rowFor(call), `${call}: printed, and no row`); }
  // and the dispatch this module prints is one
  assert.ok(P.rowFor(P.dispatch('shims', { repo: 'a/b' }).tool));
});

test('R1: tools/platform.md is the rendering of the tables, and the retired act table names it', () => {
  assert.equal(readFileSync(join(ROOT, 'tools', 'platform.md'), 'utf8'), P.render());
  for (const r of [...P.constraints(), ...P.acts()]) assert.ok(P.render().includes(`\`${r.id.replace(/\|/g, '\\|')}\``), r.id);
  if (existsSync(join(ROOT, 'tools', 'acts.md'))) assert.match(readFileSync(join(ROOT, 'tools', 'acts.md'), 'utf8'), /retired[^]*tools\/platform\.mjs/);
});
