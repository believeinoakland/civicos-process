// platform (layer 1; build/requirements/platform.md, REQUIREMENTS.md §2): what the hosting platform (Claude Code cloud
// sessions, GitHub through the agent proxy, GitHub's runner) does and refuses, measured and dated; the acts the process
// depends on; the version check at a session's start; the runner workflows' dispatch; the grants check. Uses no module.
// The tables are data here; `tools/platform.md` is their rendering (`render()`), checked equal by the module's test.
// It holds no credential and prints none (R11): a credential is named, never read but by the runner's own step.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROCESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// A refusal: exit 1, naming what is missing, nothing changed. Every module refuses with this one class.
export class Refused extends Error {}
const refuse = (msg) => { throw new Refused(msg); };

// ---- R1, R2, R4, R5, R12: the constraints, each a measured fact with its last confirmed date, its count, its evidence
// and the workaround the process uses. The act table `tools/acts.md` (retired) is folded in here: its refusals and limits
// are rows; the acts that pass are `ACTS` below. `id` keeps the act table's id where it had one, so a refusal recorded
// against it (`proc refused --act`) still reads as predicted. `classifier: true` marks an act the auto-mode classifier
// decides case by case: the process depends on none of them (PLT-2), so none is an act and none is printed as owed.
const C = (id, fact, date, count, evidence, workaround, extra = {}) => ({ id, fact, date, count, evidence, workaround, ...extra });
export const CONSTRAINTS = [
  C('git push(delete state branch)', 'The agent proxy refuses every remote ref delete from a session (`unexpected disconnect`; the branch kept).', '2026-10-29', 3, 'the toy #5; BOB #1 R-BOB-1-2 (a job branch); the dry run N1, row X3 (acts.md)', 'the product\'s `prune.yml` deletes on the dispatch `proc merged` or `proc epoch close` prints (REP 4)'),
  C('git push(delete job branch)', 'A merged job branch cannot be deleted from a session: the same proxy refusal of a ref delete.', '2026-10-29', 2, 'BOB #1 R-BOB-1-2; N1 row X1, refused at every `merged` (acts.md)', 'the printed `prune.yml` dispatch; a branch left behind is built over by the next opening commit'),
  C('settings writes', 'The agent proxy refuses repository-settings writes (rulesets, rename, transfer): `403 Repository settings writes are not permitted through this proxy`.', '2026-10-29', 1, '#5 (PERMISSIONS §9)', 'the runner workflows (`dispatch`), with the owner\'s token as an Actions secret'),
  C('POST /user/repos', 'The agent proxy binds every GitHub API call to the session\'s configured repositories: `POST /user/repos` 403, whatever token.', '2026-10-29', 1, '#8, inside `proc repo setup` (PERMISSIONS §9)', '`repo-setup.yml` on the runner'),
  C('create_repository(GitHub MCP)', 'The Claude app cannot create a repository: the organization endpoint 404, the personal account GitHub\'s 403 `Resource not accessible by integration`.', '2026-10-29', 2, '#4, #8 (acts.md)', '`repo-setup.yml` on the runner'),
  C('transfer(process token)', 'GitHub refuses a repository transfer to a fine-grained token: `403 Resource not accessible by personal access token`.', '2026-10-29', 1, 'run 40946437108 (#10)', 'the owner\'s hand act in GitHub\'s page (SETUP-STEPS, the move); `proc repo transfer` reads the result back'),
  C('token per owner', 'A fine-grained token reaches only its owner\'s repositories: `Permission to … denied`.', '2026-10-29', 1, 'run 40958955811 (#12)', 'one secret per owner account, picked by the target\'s owner (`ownerSecret`; PERMISSIONS §9.9)'),
  C('dispatch from a branch', 'GitHub dispatches only a workflow on the default branch: 404 while the file was on a branch alone.', '2026-10-29', 1, '#8 (404 from the lane\'s branch; 204 from `main` after PR #39)', 'every runner workflow is merged to `main` before its first dispatch; `dispatch` names `ref: main`'),
  C('required check on tranche', 'A ruleset\'s required check refuses every direct push to the branch, its creation included: `Required status check "gate" is expected`.', '2026-10-29', 1, '#5 on the toy (SETUP-STEPS)', 'no required check and no pull-request rule on `tranche`'),
  C('empty pull request', 'GitHub refuses a pull request with no commit between base and head.', '2026-10-29', 1, 'BOB #1 R-BOB-1-1 (JOB-LIFE §1)', 'each job branch opens one empty commit past the tranche tip'),
  C('review of one\'s own pull request', 'GitHub refuses REQUEST_CHANGES and APPROVE on one\'s own pull request, and every session is the owner\'s one user.', '2026-10-29', 1, 'BOB #1 R-BOB-1-3', 'a COMMENT review carries the verdict; the approval `proc merge` reads is on the state branch'),
  C('second repository', 'With a second repository attached, a session does not load the repository\'s `.claude/settings.json`, and the classifier judges every act alone.', '2026-10-29', 2, '#7 (the allow rule for `proc` not applied); #11 (PERMISSIONS §10.7)', 'one repository per session; the process is a read-only clone (PLT-8)'),
  C('add_repo(a product, push access)', 'The classifier refused the attach of a product repository ("Access Added As A Means").', '2026-10-29', 2, '#11; #12, as the session\'s first attach', 'a product\'s shims are regenerated on the runner (`dispatch(\'shims\')`)', { classifier: true }),
  C('same-named repositories', 'Two repositories of one name cannot share a session (`add_repo` of the new name refused in the session holding the old).', '2026-10-29', 1, '#10, after the move to `neobobkrause`', 'the successor session is started on the new name'),
  C('moved API path', 'After a move, the old API path answers a 301 that the proxy refuses; git follows both names.', '2026-10-29', 1, '#10', 'every client sets its remote to the new name'),
  C('archive_session(child)', '`archive_session` passes or fails for the same kind of session minutes apart ("Interfere With Workloads", "External System Writes").', '2026-10-30', 9, 'passed: #4 (own child), BOB #2 (STATS #1), #16 by #17, #18 and #17 by #19 at 16:4xZ; refused: #3, #4 (parent), #6, #18 at 14:35Z, #19 at 16:15Z (two), BOB #339 (issues 95, 107, 117; acts.md)', 'no step requires it: an idle session costs nothing (GRANTS §1); a retired session is recorded `--unmeasured` or `--refused`', { classifier: true }),
  C('update_trigger(predecessor backstop off)', '`update_trigger` passes or fails case by case.', '2026-10-30', 3, 'passed 14:35Z (#18); refused 16:15Z (#19) and 17:1xZ (REQUIREMENTS PLT-2)', 'no step requires it: a scheduled task is a convenience, the record is read at every wake (PLT-7)', { classifier: true }),
  C('delete_trigger', 'Deleting a scheduled task deletes every session it started; whether the classifier passes it is undecided.', '2026-10-30', 1, 'the tool\'s own description, read 30 Oct; never taken', 'never taken', { classifier: true }),
  C('interrupt_session', '`interrupt_session` refused ("Interfere With Workloads").', '2026-10-29', 1, '#6, 14:23Z (acts.md)', 'never taken', { classifier: true }),
  C('write(.claude/settings.json)', 'An edit of a settings file by the session it governs is refused as Self-Modification; at a seeding it passed.', '2026-10-29', 2, 'refused #7; passed N1 row X4 (406851a)', '`proc shims` writes it at a seeding or on the runner; no step requires a session to edit its own', { classifier: true }),
  C('git reset --hard', 'The classifier refused `git reset --hard` on a clean checkout while `git merge --ff-only` to the same result passed.', '2026-10-29', 1, '#4 (PERMISSIONS §1)', '`merge --ff-only` or `checkout -B`; never a destructive verb'),
  C('credential in a hand command', 'A hand command naming a credential is refused as "Credential Materialization".', '2026-10-29', 1, '#7 (PERMISSIONS §10.4)', 'credentials are read only inside the tool\'s own commands on the runner, by name'),
  C('GitHub API credential', 'A session\'s GitHub API credential is the Claude app\'s token, injected by the proxy; a token set on the environment never reaches the API.', '2026-10-30', 3, '#7, #8 (`GET /user` with the app\'s client id); #16 (`civicsmith`)', 'the process\'s own token acts only on the runner'),
  C('Node fetch and the proxy', 'Node\'s fetch uses HTTPS_PROXY only when NODE_USE_ENV_PROXY is set at its start; without it `GET /user` answered 403.', '2026-10-29', 1, '#7', '`proc` restarts a network command with NODE_USE_ENV_PROXY=1'),
  C('background limit', 'A command running in a session is killed at 30 minutes.', '2026-10-30', 1, 'a job\'s gate killed at 30 minutes in-session and repeated (issue 113)', 'no step runs longer in a session; anything that can is a CI workflow (PLT-5)'),
  C('session depth', 'A session\'s lineage is limited to depth 8 (`get_session` lineage).', '2026-10-30', 2, 'the lane reached depth 4 by its fourth self-spawn (issue 96); PLATFORM #1 read `{"depth":1,"limit":8}`, 30 Oct', 'sessions are started only at depth 0 or 1, so depth never passes 2 (PLT-6)'),
  C('hooks after a resume', 'A skill\'s registered hooks are gone after a session resumes; hooks did not run when the project directory was not the repository.', '2026-10-30', 2, 'issue 111 (#18, `worker_epoch` 2); issue 63', 'the process depends on none for correctness (PLT-4)'),
  C('scheduled task into an archived session', 'A scheduled task fired into an archived session and failed.', '2026-10-30', 1, '`list_triggers`, 16:39Z (REQUIREMENTS PLT-7)', 'no step depends on a scheduled task (PLT-7)'),
  C('auto mode pauses', 'Auto mode pauses after 3 consecutive or 20 total blocks.', '2026-10-29', 1, 'Claude Code documentation, permission-modes, read 29 Oct (PERMISSIONS §8.4)', 'no act the classifier judges is on any step\'s route'),
];

// ---- R3: the acts the process depends on, each with its measured pass count and the role that takes it. `passes`
// counts uses seen to pass, from the evidence named; PLT-3 asks for twenty, and a count below is shown as such. ----
const A = (id, role, route, passes, date, evidence) => ({ id, role, route, passes, date, evidence });
export const ACTS = [
  A('create_session', 'a parent at depth 0 or 1: ROOT starts BOB, BOB starts jobs and lanes', 'the call `proc layer start`, `job route`, `lane open` or `root bob` printed, unchanged', 24, '2026-10-30', '16 job and 7 architecture sessions created on 30 Oct without a refusal (REQUIREMENTS PLT-3); PLATFORM #1 created by BOB at depth 1 (`get_session`)'),
  A('send_message', 'a job or lane to BOB; BOB to a job, lane or ROOT', 'the address `proc addr --bob` prints, or the call `proc` printed, with the record pushed', 1, '2026-10-30', 'every send of 30 Oct answered `delivered`, not counted (REQUIREMENTS PLT-3); counted: PLATFORM #1\'s question to BOB, `delivered`'),
  A('get_session', 'every role, of itself or a session it started', 'by hand, read only', 1, '2026-10-30', 'PLATFORM #1, 30 Oct; read at every lane refresh (lane-neoprocess/HANDOFF.md), not counted'),
  A('list_events', 'every role, of a session it started or itself', 'by hand, read only', 1, '2026-10-30', 'PLATFORM #1, of itself, 30 Oct'),
  A('send_later(own backstop)', 'BOB and the neoProcess lane, to themselves', 'the call `proc process status` printed, or by hand to itself', 2, '2026-10-30', '#4, 29 Oct; the lane\'s backstop, 30 Oct #13 (acts.md)'),
  A('create_pull_request', 'BOB (a job\'s draft), the lane', 'the call `proc layer start` or `job reopen` printed', 89, '2026-10-30', '89 pull requests merged on neobobkrause/neoprocess, read by PLATFORM #1 (GitHub search `is:merged`, 30 Oct)'),
  A('update_pull_request', 'a job (ready), BOB', 'the call `proc job complete` or `proc merged` printed', 4, '2026-10-29', 'N1 row X1 (PRs #7, #8, #9, #11)'),
  A('update_pull_request_branch', 'BOB', 'the call `proc merge` printed', 1, '2026-10-29', 'N1 row X1 (PR #7 b5a4d66 → 27005e7)'),
  A('add_issue_comment', 'a job (its report), the lane (an issue\'s mark)', 'the call `proc job complete`, `proc issue ack` or `issue close` printed', 6, '2026-10-30', 'N1 row X1; issues 61, 62 (#13) and 84 (#16) acknowledged and closed (acts.md)'),
  A('pull_request_review_write(COMMENT)', 'BOB', 'the call `proc review result` printed', 1, '2026-10-29', 'N1 (acts.md)'),
  A('merge_pull_request', 'BOB (a job\'s PR, the close PR), the lane', 'the call `proc merge` printed, or the close once the plan reads CLOSING', 89, '2026-10-30', '89 pull requests merged on neobobkrause/neoprocess (as above); Civicsmith\'s 55, 57, 58, 59 by the printed calls (REQUIREMENTS PLT-3)'),
  A('subscribe_pr_activity', 'BOB, of a job\'s PR', 'the call `proc layer start` printed', 1, '2026-10-29', 'N1 (JOB-LIFE §1)'),
  A('issue_write', 'every role (a process issue), the lane (a close)', 'the call `proc issue` or `proc issue close` printed, unchanged', 4, '2026-10-30', 'issues 61, 62 (#13), 84 (#16) filed; 84 closed (acts.md)'),
  A('actions_run_trigger', 'BOB, the lane', 'the dispatch `dispatch` (or `proc merged`, `epoch close`) printed, of a workflow on `main`', 44, '2026-10-30', '44 workflow_dispatch runs on neobobkrause/neoprocess, read by PLATFORM #1 (`list_workflow_runs`, 30 Oct), each one a dispatch accepted'),
  A('git push(own branch)', 'every role, to its own branch only', 'the session\'s `git push` and `proc` commands', 149, '2026-10-30', '149 branches on neobobkrause/neoprocess\'s remote, each made by a push (`git ls-remote --heads`, PLATFORM #1, 30 Oct)'),
  A('git push(state branch)', 'every role', '`proc` by plumbing, never by hand', 1, '2026-10-30', 'N1 row X1; PLATFORM #1\'s state line (7cbc06c)'),
  A('git fetch(process)', 'every role of a product', 'anonymous read of the public process repository; `proc status` hourly', 1, '2026-10-30', '#15 (acts.md); PLATFORM #1\'s pull at its start'),
];

const FIELDS_C = ['id', 'fact', 'date', 'count', 'evidence', 'workaround'];
const FIELDS_A = ['id', 'role', 'route', 'passes', 'date', 'evidence'];
// A row is well formed when each field is present, its date a day and its count a whole number (R2: no row without a date).
export function rowProblems(row, fields = row.passes === undefined ? FIELDS_C : FIELDS_A) {
  const p = fields.filter((f) => row[f] === undefined || row[f] === null || row[f] === '').map((f) => `${row.id ?? '?'}: no ${f}`);
  if (row.date && (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || Number.isNaN(Date.parse(row.date)))) p.push(`${row.id}: date ${row.date} is not a day`);
  for (const k of ['count', 'passes']) if (row[k] !== undefined && !(Number.isInteger(row[k]) && row[k] >= 0)) p.push(`${row.id}: ${k} ${row[k]} is not a count`);
  return p;
}

// R1, R2: the constraints; `olderThan` (a day) lists the rows not confirmed since, so a stale row is seen at each layer run.
export function constraints({ olderThan } = {}) {
  const rows = CONSTRAINTS.map((r) => ({ ...r }));
  if (olderThan == null) return rows;
  const t = Date.parse(olderThan); if (Number.isNaN(t)) refuse(`--older-than ${olderThan}: a day, YYYY-MM-DD`);
  return rows.filter((r) => Date.parse(r.date) < t);
}
// R3, R4: the acts the process depends on; an act the classifier decides case by case is refused, never listed.
export function acts({ id } = {}) {
  if (id != null) {
    const c = CONSTRAINTS.find((r) => r.id === id && r.classifier);
    if (c) refuse(`${id} is decided by the auto-mode classifier case by case (${c.evidence}): no step may depend on it (PLT-2); ${c.workaround}`);
    const a = ACTS.find((r) => r.id === id) ?? refuse(`${id} is not an act the process depends on`);
    return [{ ...a }];
  }
  return ACTS.map((r) => ({ ...r }));
}
// Every id a refusal may name and be read as predicted (`proc refused --act`): an act, or a constraint row.
export const knownIds = () => [...ACTS, ...CONSTRAINTS].map((r) => r.id);
// R12: the platform's call names, the first word of each row's id; a printed call of another module is matched by these.
export const callName = (id) => String(id).split(/[\s(]/)[0];
export const rowFor = (call) => [...ACTS, ...CONSTRAINTS].find((r) => callName(r.id) === call) ?? null;

// ---- R10: the measured limits other modules design around ----
export const limits = () => ({ backgroundMinutes: 30, depth: { limit: 8, allowed: 2 } });

// ---- R6: the version check, once at a session's start against the pin (issue 101; MNT-3) ----
export function processHead(dir = PROCESS) { try { return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } }
// The answer in one line: OK when the pinned commit is in the checkout's history (the head, or behind it).
export function versionCheck(pin, dir = PROCESS) {
  if (!/^[0-9a-f]{7,40}$/.test(String(pin || ''))) refuse(`--pin <commit>: ${pin} is not a commit`);
  const head = processHead(dir) ?? refuse(`${dir} is not a git checkout`);
  const r = spawnSync('git', ['-C', dir, 'merge-base', '--is-ancestor', pin, 'HEAD'], { stdio: 'ignore' });
  return r.status === 0 ? 'PROCESS OK' : `PROCESS STALE ${head.slice(0, 12)}`;
}
// The same check as the one command a new session's prompt carries, which the pre-role hooks of any copy pass (a read and a
// fast-forward, no write they name): it brings the copy to `main` first, then answers.
export const versionCommand = (sha, d = '/home/user/neoprocess') => `git -C ${d} pull -q --ff-only origin main; git -C ${d} rev-list HEAD | grep -q ^${sha.slice(0, 12)} && echo PROCESS OK || echo PROCESS STALE`;

// ---- R8, R9: the runner workflows' dispatch (PERMISSIONS §9) ----
export const WORKFLOWS = { setup: 'repo-setup.yml', rename: 'repo-rename.yml', transfer: 'repo-transfer.yml', shims: 'repo-shims.yml' };
const INPUTS = { setup: (a) => ({ private: String(!!a.private) }), rename: (a) => ({ name: a.name }), transfer: (a) => ({ to: a.to }), shims: () => ({}) };
// The secret a runner workflow uses (PERMISSIONS §9.9; Bob, 29 Oct: one secret per owner): the process repository's own
// owner keeps NEOPROCESS_GITHUB_TOKEN; any other owner's is NEOPROCESS_GITHUB_TOKEN_<its login, upper case, hyphens as
// underscores>. The workflows' first step computes the same name.
export function ownerSecret(owner, processOwner) {
  if (!/^[\w-]+$/.test(String(owner || ''))) refuse(`not an account login: ${owner}`);
  return owner.toLowerCase() === String(processOwner || '').toLowerCase() ? 'NEOPROCESS_GITHUB_TOKEN' : `NEOPROCESS_GITHUB_TOKEN_${owner.toUpperCase().replace(/-/g, '_')}`;
}
// The routes a product may have to the process (PLT-13, PLT-14): onboarding records one, this module reads it. None of
// them writes the process repository.
export const ROUTES = ['public', 'read grant', 'carried'];
export function processRoute(value) { return ROUTES.includes(value) ? value : refuse(`a product's route to the process is one of ${ROUTES.join(', ')}, not ${value}`); }
// The `actions_run_trigger` call for a workflow of the process repository `process` ({ owner, repo }), acting on the
// repository `args.repo` with the secret of that repository's owner. A product role (any but the neoProcess lane, `process`)
// is refused a call whose target is the process repository itself (R9).
export function dispatch(kind, args = {}) {
  const wf = WORKFLOWS[kind] ?? refuse(`no runner workflow for ${kind}: one of ${Object.keys(WORKFLOWS).join(', ')}`);
  const m = String(args.repo || '').match(/^([\w.-]+)\/([\w.-]+)$/) ?? refuse(`${kind}: --repo <owner/name>`);
  const P = args.process || {};
  if (args.role && args.role !== 'process' && P.owner && `${P.owner}/${P.repo}`.toLowerCase() === m[0].toLowerCase()) refuse(`a ${args.role} never takes the process repository as a write target (PLT-13): only the neoProcess lane dispatches ${wf} on it`);
  return { tool: 'actions_run_trigger', ...(P.owner ? { owner: P.owner, repo: P.repo } : {}), workflow_id: wf, ref: 'main', inputs: { repo: m[0], ...INPUTS[kind](args) }, secret: ownerSecret(m[1], P.owner) };
}

// ---- R7: the grants (PERMISSIONS §10; GRANTS.md), proven held before a tranche opens ----
// The HTTP goes through the session's agent proxy, which injects each host's credential (`proc` restarts a network
// command with NODE_USE_ENV_PROXY=1). No credential is named or read here.
export const GRANTS_FILE = 'proc-grants.json', GRANTS_PRODUCT = 'build/grants.json', GRANTS_FRESH_H = 24, EXPIRY_WARN_D = 14;
const readAt = (root, p) => { try { return readFileSync(join(root, p), 'utf8'); } catch { return null; } };
// `o.root` the product's git checkout, `o.dir` its directory in it (the root by default); `o.branch` the role's own branch; `o.fetch`, `o.env`, `o.now` the fixture's.
export async function grantsCheck(o) {
  const root = o.root ?? refuse('grants check: the product\'s checkout'), branch = o.branch ?? refuse('grants check: the role\'s own branch');
  const dir = o.dir ?? root, f = o.fetch || globalThis.fetch, rows = [], now_ = o.now ? new Date(o.now) : new Date();
  const row = (grant, ok, detail) => rows.push({ grant, ok, detail });
  const get = async (url) => { try { const r = await f(url, { headers: { Accept: 'application/json' } }); let json = null; try { json = JSON.parse(await r.text()); } catch { /* not json */ } return { status: r.status, headers: r.headers, json }; } catch (e) { return { status: 0, error: e.cause?.code || e.message }; } };
  // the standing list in the repository's settings (PERMISSIONS §2.4, §6): every allow and deny rule present
  const standing = JSON.parse(readFileSync(join(PROCESS, 'permissions.json'), 'utf8'));
  let s = null; try { s = JSON.parse(readAt(dir, '.claude/settings.json') || 'null'); } catch { /* unreadable */ }
  const allow = new Set(s?.permissions?.allow || []), deny = new Set(s?.permissions?.deny || []);
  const missing = [...standing.allow.filter((x) => !allow.has(x)), ...(standing.deny || []).filter((x) => !deny.has(x))];
  row('standing list', !missing.length, missing.length ? `${missing.length} rule(s) of permissions.json missing from .claude/settings.json (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', …' : ''}): \`proc shims\` writes them` : 'every allow and deny rule of permissions.json present');
  // the push to the role's own branch, dry (PERMISSIONS §2.6)
  const p = spawnSync('git', ['-C', root, 'push', '-q', '--dry-run', 'origin', `HEAD:refs/heads/${branch}`], { encoding: 'utf8' });
  row(`push to ${branch}`, p.status === 0, p.status === 0 ? 'git push --dry-run passes' : (p.stderr || p.stdout || '').trim().split('\n').pop());
  // GitHub through the proxy: the identity, and the token's kind and expiry (the app's token renews itself; a token of the process's does not)
  const gh = await get('https://api.github.com/user');
  if (gh.status !== 200) row('GitHub API', false, `GET /user answered ${gh.status || gh.error}: no credential reaches api.github.com`);
  else {
    const app = gh.headers.get('x-oauth-client-id'), exp = gh.headers.get('github-authentication-token-expiration');
    const days = exp && !app ? (new Date(exp.replace(' UTC', 'Z').replace(' ', 'T')) - now_) / 864e5 : null;
    row('GitHub API', days == null || days > EXPIRY_WARN_D, `${gh.json?.login} by ${app ? `the Claude app's token (client ${app})` : 'a token of its own'}${days == null ? '' : `, expiring ${exp} (${Math.floor(days)} days): renew before ${EXPIRY_WARN_D} days remain`}`);
  }
  // the product's own services, variables and addresses (PRODUCT-SUPPLIES: `build/grants.json`; the process names none)
  let pg = {}; try { pg = JSON.parse(readAt(dir, GRANTS_PRODUCT) || '{}'); } catch (e) { row(GRANTS_PRODUCT, false, `unreadable: ${e.message}`); }
  const at = (obj, path) => String(path || '').split('.').filter(Boolean).reduce((v, k) => v?.[k], obj);
  for (const sv of pg.services || []) {
    const r = await get(sv.url), [k, want] = String(sv.active || '').split('='), got = k ? at(r.json, k) : undefined;
    const exp = sv.expires ? at(r.json, sv.expires) : null, days = exp ? (new Date(exp) - now_) / 864e5 : null;
    const ok = r.status === 200 && (!k || String(got) === want) && (days == null || days > EXPIRY_WARN_D);
    row(sv.name, ok, r.status === 200 ? `${k ? `${k} ${got}` : 'answers'}${days == null ? '' : `, expiring ${exp}${days > EXPIRY_WARN_D ? '' : `: renew before ${EXPIRY_WARN_D} days remain`}`}` : `answered ${r.status || r.error}`);
  }
  // each variable judged by name only: no value is read or shown (R11)
  const env = o.env || process.env;
  for (const v of pg.variables || []) row(`variable ${v}`, Object.prototype.hasOwnProperty.call(env, v) && env[v] !== '', Object.prototype.hasOwnProperty.call(env, v) ? 'present' : 'not set in this environment');
  for (const u of [...(pg.urls || []), ...String(o.urls || '').split(',').filter(Boolean)]) { const r = await get(u); row(`reach ${u}`, r.status > 0 && r.status < 500, r.status ? `answered ${r.status}` : r.error); }
  const ok = rows.every((r) => r.ok);
  writeFileSync(join(root, '.git', GRANTS_FILE), JSON.stringify({ at: now_.toISOString(), ok, rows }));
  return { ok, rows };
}
// Why a tranche may not open, or null: the grants proven held in the last day (PERMISSIONS §10.3). `R` a checkout's root,
// or a record with one.
export function grantsHeld(R, now_ = new Date()) {
  const fl = join(typeof R === 'string' ? R : R.root, '.git', GRANTS_FILE);
  if (!existsSync(fl)) return 'the grants are not proven held: run `proc grants check` (PERMISSIONS §10.3)';
  const g = JSON.parse(readFileSync(fl, 'utf8'));
  if (!g.ok) return `a grant is not held: ${g.rows.filter((r) => !r.ok).map((r) => `${r.grant}: ${r.detail}`).join('; ')} (PERMISSIONS §10.3; GRANTS.md says who gives it)`;
  if (now_ - new Date(g.at) > GRANTS_FRESH_H * 36e5) return `the grants were proven at ${g.at}, over ${GRANTS_FRESH_H} hours ago: run \`proc grants check\` again`;
  return null;
}

// ---- the rendering, `tools/platform.md` ----
const cell = (x) => String(x).replace(/\|/g, '\\|').replace(/\n/g, ' ');
export function render() {
  const L = limits();
  return [
    '# The platform: what it does and refuses (rendered from `tools/platform.mjs`; edit there)',
    '',
    `The hosting platform is Claude Code cloud sessions, GitHub through the agent proxy, and GitHub's runner. Each row is a measured fact with the day it was last confirmed, how often it was measured, its evidence and the workaround the process uses (PLT-1, PLT-12). A row not confirmed since a given day is listed by \`constraints({ olderThan })\`. This table replaces the act table \`tools/acts.md\`, which tried to predict the auto-mode classifier: an act it decides case by case is marked here and no step depends on it (PLT-2). Limits: a command in a session is killed at ${L.backgroundMinutes} minutes; session depth is limited to ${L.depth.limit}, and the process allows ${L.depth.allowed}.`,
    '',
    '## Constraints',
    '',
    '| id | fact | confirmed | count | evidence | workaround | classifier |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...CONSTRAINTS.map((r) => `| \`${cell(r.id)}\` | ${cell(r.fact)} | ${r.date} | ${r.count} | ${cell(r.evidence)} | ${cell(r.workaround)} | ${r.classifier ? 'case by case: never on a route' : ''} |`),
    '',
    '## Acts the process depends on',
    '',
    'PLT-3 asks for twenty passes; a row below twenty is counted from the evidence named and raised by each layer run.',
    '',
    '| id | role | route | passes | confirmed | evidence |',
    '| --- | --- | --- | --- | --- | --- |',
    ...ACTS.map((r) => `| \`${cell(r.id)}\` | ${cell(r.role)} | ${cell(r.route)} | ${r.passes}${r.passes < 20 ? ' (below 20)' : ''} | ${r.date} | ${cell(r.evidence)} |`),
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'render') writeFileSync(join(PROCESS, 'tools', 'platform.md'), render());
    else if (cmd === 'version') console.log(versionCheck(arg));
    else if (cmd === 'stale') console.log(JSON.stringify(constraints({ olderThan: arg }), null, 2));
    else { console.error('usage: node tools/platform.mjs render | version <pin> | stale <YYYY-MM-DD>'); process.exitCode = 2; }
  } catch (e) { if (e instanceof Refused) { console.error(`REFUSED: ${e.message}`); process.exitCode = 1; } else throw e; }
}
