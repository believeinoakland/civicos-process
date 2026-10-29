// tools/hooks.mjs against a real remote: the role from the record, and each refusal PROTOCOL §9, JOB-LIFE §11 and
// SESSIONS §1a name, for no role, BOB, a job and a lane; the Stop hook by `proc status`'s gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as N from '../proc.mjs';
import { preReason, stopReason, partialReadReason, allowReason, askingBobReason, contextUsed, contextReason } from '../hooks.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), TOY = join(HERE, '..', '..', 'dryrun');
const B1 = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB', J1 = 'session_01AAAAAAAAAAAAAAAAAAAAAAAA', L1 = 'session_01LLLLLLLLLLLLLLLLLLLLLLLL';
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const ident = (d, n) => { for (const [k, v] of [['user.name', n], ['user.email', `${n}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v); };
const f = (dir, name, text) => { const p = join(dir, name); writeFileSync(p, text); return p; };
function world() {
  const base = mkdtempSync(join(tmpdir(), 'hooks-')), origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const seed = join(base, 'seed');
  execFileSync('git', ['clone', '-q', origin, seed], { stdio: 'ignore' }); ident(seed, 'seed');
  cpSync(TOY, join(seed, 'toy'), { recursive: true });
  writeFileSync(join(seed, 'toy/build/plan/current.md'), '# Plan: test T1\n\n**Status** · OPEN.\n\n## Layer 1\n\n**alpha**\n- N1 · Add a comment.\n');
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/${N.TRANCHE}`);
  const clone = (name) => { const d = join(base, name); execFileSync('git', ['clone', '-q', '-b', N.TRANCHE, origin, d], { stdio: 'ignore' }); ident(d, name); return { dir: join(d, 'toy'), root: d }; };
  return { base, origin, bob: clone('bob'), clone };
}
const ctxOf = (root) => ({ ...(N.readRole(root) || {}), root });
const bash = (command, extra = {}) => ({ tool_name: 'Bash', tool_input: { command, ...extra } });
const tool = (tool_name, tool_input = {}) => ({ tool_name, tool_input });
const REMOTE = 'mcp__claude-code-remote__', GH = 'mcp__github__';

test('the hooks: no role until recorded; BOB, a job and a lane each refused what is never theirs; the Stop hook by the gate', () => {
  const w = world(), o = (x) => ({ product: w.bob.dir, ...x }), root = w.bob.root;
  const pre = (r, input) => preReason(ctxOf(r).role || null, input, ctxOf(r));
  // no role: reads and the start command pass; a write, a remote tool, a git write are refused; the turn cannot end
  assert.equal(pre(root, bash('cat PROCESS-DESIGN.md')), null);
  assert.equal(pre(root, bash('node /x/tools/proc.mjs takeover --name "BOB #1" --session s --product toy')), null);
  assert.match(pre(root, tool('Write', { file_path: 'x' })), /no role is recorded/);
  assert.match(pre(root, bash('git push origin HEAD:tranche')), /no role is recorded/);
  assert.match(pre(root, bash('echo x > y')), /no role is recorded/);
  assert.match(pre(root, tool(`${REMOTE}send_message`, { session_id: B1, message: 'x' })), /no role is recorded/);
  assert.match(stopReason(null, ctxOf(root)), /start command first/);
  // a reading-set document read short is refused for every role
  assert.match(partialReadReason('Read', { file_path: '/p/toy/build/requirements/alpha.md', offset: 10 }), /read whole/);
  assert.match(partialReadReason('Bash', { command: 'head -40 PROCESS-DESIGN.md' }), /read whole/);
  assert.equal(partialReadReason('Bash', { command: 'cat PROCESS-DESIGN.md | head -40' }), 'PROCESS-DESIGN.md is in a reading set and is read whole (P20; a read that stops before the end is a scan): read it with no offset or limit, or `cat` it; a set too large to read whole is BLOCKED: reading (SESSIONS §6)');
  assert.equal(partialReadReason('Bash', { command: 'grep -n R1 build/requirements/alpha.md' }), null);

  N.epochOpen(o()); N.takeover(o({ name: 'BOB #1', session: B1 }));
  assert.equal(ctxOf(root).role, 'bob');
  // BOB: the standing refusals
  assert.match(pre(root, bash('git push --force origin HEAD:tranche')), /force push/);
  assert.match(pre(root, bash('git push origin :refs/heads/job/alpha')), /force push, mirror or remote delete/);
  assert.match(pre(root, bash('git merge origin/state/E1')), /state branch/);
  assert.match(pre(root, bash('git checkout -b x origin/state/E1')), /state branch/);
  assert.match(pre(root, bash('git push origin HEAD:main')), /nothing is pushed to main/);
  assert.match(pre(root, bash('git push origin HEAD:refs/heads/state/E1')), /written only by the tool/);
  assert.equal(pre(root, bash('git push origin HEAD:tranche 2>&1')), null);
  assert.equal(pre(root, bash('git push -u origin tranche')), null);
  assert.match(pre(root, bash('git push origin HEAD:job/alpha')), /BOB pushes only tranche/);
  assert.match(pre(root, bash('gh pr merge 11')), /only as `proc` prints/);
  assert.match(pre(root, bash('git merge --no-ff origin/job/alpha')), /merged only by the queue/);
  assert.match(pre(root, bash('node tools/proc.mjs layer close --layer 1 --product toy')), /run_in_background true/);
  assert.equal(pre(root, bash('node tools/proc.mjs layer close --layer 1 --product toy', { run_in_background: true })), null);
  assert.equal(pre(root, bash('pgrep -f "proc.mjs job complete"')), null);
  assert.match(pre(root, tool('Agent', { prompt: 'x' })), /never waited on in the foreground/);
  assert.equal(pre(root, tool('Agent', { prompt: 'x', run_in_background: true })), null);
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { pullNumber: 11 })), /only as `proc merge` printed it.*once the plan reads CLOSING/);
  assert.match(pre(root, tool(`${REMOTE}fire_trigger`, {})), /never fire a routine/);
  assert.match(pre(root, tool(`${REMOTE}create_trigger`, { persistent_session_id: J1 })), /only its own backstop/);
  assert.equal(pre(root, tool(`${REMOTE}create_trigger`, { persistent_session_id: B1 })), null);
  assert.equal(pre(root, tool(`${REMOTE}send_message`, { session_id: L1, message: 'x' })), null);   // BOB writes to anyone
  assert.match(pre(root, tool(`${REMOTE}create_session`, { title: 'ALPHA #1', prompt: 'x' })), /no start is owed for alpha/);
  assert.match(pre(root, tool(`${REMOTE}create_session`, { title: 'helper', prompt: 'x' })), /titled as `proc` printed/);
  assert.equal(stopReason('bob', ctxOf(root)), null);   // nothing owed yet: the turn may end
  // ...the layer started: the printed create_session passes, any other is refused; the owed start stops the turn
  const ls = N.layerStart(o({ layer: 1 })), spec = ls.jobs[0].session;
  assert.equal(pre(root, tool(`${REMOTE}create_session`, { title: spec.title, prompt: spec.prompt, source_revision: spec.source_revision, model: spec.model })), null);
  assert.match(pre(root, tool(`${REMOTE}create_session`, { title: spec.title, prompt: `${spec.prompt} and hurry`, source_revision: spec.source_revision })), /unchanged/);
  assert.match(pre(root, tool(`${REMOTE}create_session`, { title: spec.title, prompt: spec.prompt, source_revision: 'tranche' })), /unchanged/);
  assert.match(stopReason('bob', ctxOf(root)), /owed: open PR alpha; owed: start alpha/);
  N.jobPr(o({ module: 'alpha', number: 11 })); N.jobStarted(o({ module: 'alpha', name: 'ALPHA #1', session: J1 }));
  assert.equal(stopReason('bob', ctxOf(root)), null);
  // a job's PR is merged only as `proc merge` printed it: its Merge line reads `merging`, the number and method as printed
  N.stateWrite(N.repo(w.bob.dir), { 'jobs/alpha.md': `**Status** · ALPHA #1 · ${J1} · COMPLETE · PR #11\n**Runs** · 1\n**Owed** · none\n**Review** · no review · x · concerns: none\n**Merge** · merging abcdef0 now\n` }, 'alpha merging');
  assert.equal(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 11, merge_method: 'merge' })), null);
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 11, merge_method: 'squash' })), /only as `proc merge` printed it/);
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 12, merge_method: 'merge' })), /only as `proc merge` printed it/);
  N.stateWrite(N.repo(w.bob.dir), { 'jobs/alpha.md': `**Status** · ALPHA #1 · ${J1} · WORKING · PR #11\n**Runs** · 0\n**Owed** · none\n` }, 'alpha working');
  // at CLOSING the close PR's merge passes as `tranche close` printed it: the expected head the tranche's tip (DRYRUN §4.20)
  const planNow = N.stateRead(N.repo(w.bob.dir), 'plan.md');
  N.stateWrite(N.repo(w.bob.dir), { 'plan.md': planNow.replace(/· OPEN ·/, '· CLOSING ·') }, 'closing');
  const rfz = N.refused(o({ act: 'x', kind: 'platform', reason: 'y' }));   // an open refusal: the close merge waits on its route (DRYRUN §4.21)
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 20, merge_method: 'merge', expectedHeadSha: 'deadbeef' })), /route the open refusal\(s\) first.*R-BOB-1-1/);
  N.refusedRouted(o({ id: rfz.refusal, route: 'z' }));
  const tipT = g(root, 'rev-parse', 'origin/tranche');   // the route's metrics row moved the tranche: the expected head is its tip now
  assert.equal(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 20, merge_method: 'merge', expectedHeadSha: tipT })), null);
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 20, merge_method: 'merge' })), /expectedHeadSha the tranche's tip/);
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 20, merge_method: 'merge', expectedHeadSha: 'deadbeef' })), /only as `proc merge` printed it/);
  assert.match(pre(root, tool(`${GH}merge_pull_request`, { owner: 'o', repo: 'r', pullNumber: 20, merge_method: 'squash', expectedHeadSha: tipT })), /only as `proc merge` printed it/);
  N.stateWrite(N.repo(w.bob.dir), { 'plan.md': planNow }, 'open again');
  // a lane opened: the printed create_session passes once its start is owed
  const lo = N.laneOpen(o({ id: 'ARITH', area: 'arithmetic', charterFile: f(w.base, 'c.md', 'Area: arithmetic.\n') }));
  assert.equal(pre(root, tool(`${REMOTE}create_session`, { title: 'ARITH #1', prompt: lo.start.prompt, source_revision: 'tranche' })), null);
  assert.match(pre(root, tool(`${REMOTE}create_session`, { title: 'ARITH #1', prompt: 'go', source_revision: 'tranche' })), /unchanged/);
  N.laneStarted(o({ id: 'ARITH', name: 'ARITH #1', session: L1 }));

  // the job, from its clone: its role from its start command; messages to BOB only, pushed first; its branch only
  const alpha = w.clone('alpha'); g(alpha.root, 'checkout', '-q', 'job/alpha');
  assert.match(pre(alpha.root, tool('Edit', { file_path: 'x' })), /no role is recorded/);
  N.jobStart({ product: alpha.dir, module: 'alpha', session: J1 });
  assert.equal(ctxOf(alpha.root).role, 'job');
  assert.equal(pre(alpha.root, tool(`${REMOTE}send_message`, { session_id: B1, message: 'QUESTION #1: x' })), null);
  assert.match(pre(alpha.root, tool(`${REMOTE}send_message`, { session_id: L1, message: 'x' })), /every message to BOB's address, read from git now \(`proc addr --bob` → session_01BBBBBBBBBBBBBBBBBBBBBBBB\)/);
  assert.match(pre(alpha.root, tool(`${REMOTE}create_session`, { title: 'X #1' })), /starts no session/);
  assert.match(pre(alpha.root, tool(`${REMOTE}send_later`, {})), /arms no timer/);
  assert.match(pre(alpha.root, tool(`${GH}create_pull_request`, {})), /never opens, reviews or merges/);
  assert.match(pre(alpha.root, tool(`${GH}enable_pr_auto_merge`, {})), /never opens, reviews or merges/);
  assert.equal(pre(alpha.root, bash('git push origin HEAD:job/alpha')), null);
  assert.equal(pre(alpha.root, bash('git push -u origin job/alpha')), null);
  assert.match(pre(alpha.root, bash('git push origin HEAD:tranche')), /a job pushes only job\/alpha/);
  assert.match(pre(alpha.root, bash('gh pr ready 11')), /only as `proc` prints/);
  assert.match(pre(alpha.root, tool(`${GH}add_issue_comment`, { issue_number: 11, body: 'hi' })), /only the report `proc job complete` printed, while that comment is owed/);
  assert.match(pre(alpha.root, tool(`${GH}update_pull_request`, { pullNumber: 11, draft: false })), /only as `proc job complete` printed, while that act is owed/);
  assert.match(stopReason('job', ctxOf(alpha.root)), /reads WORKING/);
  // unpushed work: no message; the turn cannot end
  const src = join(alpha.dir, 'alpha/src/index.mjs');
  writeFileSync(src, `${readFileSync(src, 'utf8')}// N1\n`);
  g(alpha.root, 'add', '-A'); g(alpha.root, 'commit', '-q', '-m', 'alpha: N1');
  assert.match(pre(alpha.root, tool(`${REMOTE}send_message`, { session_id: B1, message: 'x' })), /only once your record and work are pushed.*1 commit\(s\) on job\/alpha not pushed/);
  N.jobState({ product: alpha.dir, module: 'alpha', set: 'WAITING: is a comment enough?' });
  assert.match(stopReason('job', ctxOf(alpha.root)), /1 commit\(s\) on job\/alpha not pushed/);
  g(alpha.root, 'push', '-q', 'origin', 'HEAD:job/alpha');
  assert.equal(stopReason('job', ctxOf(alpha.root)), null);   // a wait recorded, everything pushed: the turn ends
  assert.equal(pre(alpha.root, tool(`${REMOTE}send_message`, { session_id: B1, message: 'x' })), null);
  // complete: the two owed acts pass exactly as printed, nothing else; the turn cannot end while they are owed
  const jc = N.jobComplete({ product: alpha.dir, module: 'alpha', reportFile: f(w.base, 'r.md', '**Met** · none\n**Evidence**\n- alpha/src/index.mjs:1\n') });
  assert.match(stopReason('job', ctxOf(alpha.root)), /alpha owes: comment; alpha owes: ready/);
  assert.equal(pre(alpha.root, tool(`${GH}add_issue_comment`, { owner: 'o', repo: 'r', issue_number: 11, body: jc.acts[0].body })), null);
  assert.match(pre(alpha.root, tool(`${GH}add_issue_comment`, { owner: 'o', repo: 'r', issue_number: 12, body: 'x' })), /its own PR \(#11\)/);
  assert.equal(pre(alpha.root, tool(`${GH}update_pull_request`, { owner: 'o', repo: 'r', pullNumber: 11, draft: false })), null);
  assert.match(pre(alpha.root, tool(`${GH}update_pull_request`, { owner: 'o', repo: 'r', pullNumber: 11, draft: false, title: 'better' })), /nothing else on the PR/);
  assert.match(pre(alpha.root, tool(`${GH}update_pull_request`, { owner: 'o', repo: 'r', pullNumber: 11, draft: true })), /nothing else on the PR/);
  N.jobPosted({ product: alpha.dir, module: 'alpha', comment: 5, ready: true });
  assert.equal(stopReason('job', ctxOf(alpha.root)), null);
  assert.match(pre(alpha.root, tool(`${GH}update_pull_request`, { owner: 'o', repo: 'r', pullNumber: 11, draft: false })), /while that act is owed/);

  // the lane, from its clone: messages to BOB only; pushes to the tranche only
  const lane = w.clone('lane');
  N.laneStart({ product: lane.dir, id: 'ARITH', session: L1 });
  assert.equal(ctxOf(lane.root).role, 'lane');
  assert.equal(pre(lane.root, tool(`${REMOTE}send_message`, { session_id: B1, message: 'DECISION: x' })), null);
  assert.match(pre(lane.root, tool(`${REMOTE}send_message`, { session_id: J1, message: 'x' })), /every message to BOB's address/);
  assert.equal(pre(lane.root, bash('git push origin HEAD:tranche')), null);
  assert.match(pre(lane.root, bash('git push origin HEAD:job/alpha')), /a lane pushes only tranche/);
  assert.match(pre(lane.root, tool(`${REMOTE}create_session`, { title: 'X #1' })), /starts no session/);
  assert.equal(stopReason('lane', ctxOf(lane.root)), null);

  // past its threshold a session ends a turn only with its refresh recorded (P13; SES 5; DRYRUN §4.17): the context is the
  // last assistant turn's input in the transcript, a subagent's turns aside
  const tr = f(w.base, 't.jsonl', [{ type: 'user', message: { role: 'user', content: 'x' } }, { type: 'assistant', message: { role: 'assistant', usage: { input_tokens: 2, cache_read_input_tokens: 640000, cache_creation_input_tokens: 9998 } } }, { type: 'assistant', isSidechain: true, message: { role: 'assistant', usage: { input_tokens: 1, cache_read_input_tokens: 5, cache_creation_input_tokens: 0 } } }, { type: 'system' }].map((x) => JSON.stringify(x)).join('\n'));
  assert.equal(contextUsed({ transcript_path: tr }), 650000);
  assert.equal(contextUsed({}), null);
  assert.equal(contextReason('bob', 390000, ctxOf(root)), null);
  assert.match(contextReason('bob', 650000, ctxOf(root)), /at 65 % of your window, past 40 %.*proc handoff/);
  N.handoff(o({ next: 'the layer close' }));   // the refresh recorded for BOB #1's session
  assert.equal(contextReason('bob', 650000, ctxOf(root)), null);
  assert.equal(contextReason('job', 450000, ctxOf(alpha.root)), null);
  assert.match(contextReason('job', 650000, ctxOf(alpha.root)), /past 50 %.*proc job state --set "BLOCKED: context \(65 %\)"/);
  N.jobState({ product: alpha.dir, module: 'alpha', set: 'BLOCKED: context (65 %)' });
  assert.equal(contextReason('job', 650000, ctxOf(alpha.root)), null);
  assert.match(N.status(o()).queue.map((q) => q.item).join(';'), /UNBLOCK alpha/);
  assert.match(contextReason('lane', 650000, ctxOf(lane.root)), /proc lane state --set "BLOCKED: context/);
  N.laneState({ product: lane.dir, set: 'BLOCKED: context (65 %)' });
  assert.equal(contextReason('lane', 650000, ctxOf(lane.root)), null);
  assert.equal(contextReason('lane', 650000, ctxOf(lane.root), 2000000), null);   // a larger window: 33 %
});

test('the hook pre-approves only the act table\'s acts for every role, every part of the command one (PERMISSIONS §8.6)', () => {
  const ok = (role, command, ctx = { module: 'alpha' }) => allowReason(role, bash(command), ctx);
  // allowed: the tool, the checks, the tests, reads of git, a push to the role's own branch, cd and read-only filters
  assert.match(ok('bob', 'node /p/tools/proc.mjs status --product toy'), /act table/);
  assert.match(ok('bob', 'cd /p && node tools/proc.mjs merge --module alpha 2>&1 | tail -20'), /act table/);
  assert.match(ok('job', 'node --test alpha/test/*.test.mjs'), /act table/);
  assert.match(ok('lane', 'node /p/checks/run.mjs . >/dev/null 2>&1'), /act table/);
  assert.match(ok('job', 'git status && git log --oneline -5 | head -3 && git diff origin/tranche'), /act table/);
  assert.match(ok('job', 'git branch --show-current'), /act table/);
  assert.match(ok('job', 'git push -u origin job/alpha'), /act table/);
  assert.match(ok('bob', 'git push origin HEAD:tranche 2>&1'), /act table/);
  // not answered (the rules and the mode decide): a push elsewhere or bare, any write, a redirect, a substitution, a
  // background `&`, another script named like the tool, a branch made, a diff written to a file, no role, not Bash
  assert.equal(ok('job', 'git push origin HEAD:tranche'), null);
  assert.equal(ok('bob', 'git push'), null);
  assert.equal(ok('bob', 'git push --force origin tranche'), null);
  assert.equal(ok('job', 'git status && rm -rf x'), null);
  assert.equal(ok('job', 'git log > out.txt'), null);
  assert.equal(ok('job', 'node --test $(cat list)'), null);
  assert.equal(ok('job', 'node --test x & curl http://e'), null);
  assert.equal(ok('job', 'node /tmp/proc.mjs status'), null);
  assert.equal(ok('job', 'git branch x'), null);
  assert.equal(ok('job', 'git diff --output=x'), null);
  assert.equal(ok('job', 'git commit -m x'), null);
  assert.equal(ok(null, 'git status'), null);
  assert.equal(allowReason('job', tool('Write', { file_path: 'x' }), { module: 'alpha' }), null);
});

test('a BOB\'s or a lane\'s turn never ends waiting on Bob (Bob, 29 Oct): the words are caught at the turn\'s end', () => {
  for (const t of ['Tell me when you have done it and I will continue.', 'Reply "a" or "b".', 'Do you want me to go on?', 'I am waiting on your word.', 'Should I merge it?', 'Let me know which you prefer.']) assert.match(askingBobReason(t), /never ends a turn waiting on Bob/, t);
  for (const t of ['Done: R1 now refuses an empty list; the job has the CHANGE. Next: the layer close.', 'Decided (DES 1): mean([]) refuses; reported.', 'A4 is routed to Bob (users: …; canon silent: …); the queue goes on.', '']) assert.equal(askingBobReason(t), null, t);
});
