// A COMPLETE job behind BOB's newest entry reads OPEN (bio K5171, plan item 83): `mail check` must
// not show a job as merely complete while a START or CHANGE of BOB's is unread, or a BOB merges and archives it.
// A scratch product repo with a bare origin: tranche/T1 holds the plan and BOB's mailboxes, each job its own branch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { check } from '../../tools/mail.mjs';

const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const S = (c) => `session_01${c.repeat(24)}`;
const put = (d, path, text) => { mkdirSync(dirname(join(d, path)), { recursive: true }); writeFileSync(join(d, path), text); };
const commit = (d, msg) => { g(d, 'add', '.'); g(d, 'commit', '-q', '-m', msg); };

// BOB wrote B1 START and B2 CHANGE for both modules; `behind` has handled B1, `current` has handled B2; both are COMPLETE.
function world() {
  const base = mkdtempSync(join(tmpdir(), 'mailopen-'));
  const origin = join(base, 'origin.git'), d = join(base, 'product');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  execFileSync('git', ['clone', '-q', origin, d], { stdio: 'ignore' });
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t'], ['commit.gpgsign', 'false']]) g(d, 'config', k, v);
  put(d, 'build/plan/current.md', `**Status** · ${S('B')} · BOB #1\n**Jobs** · behind: BEHIND #1 ${S('1')}, current: CURRENT #1 ${S('2')}\n`);
  const bobBox = (m) => `# BOB to ${m} (T1)\n\n**Read** · handled J1\n\n## B1 · START\n\nGo.\n\n## B2 · CHANGE\n\nMerge the tranche.\n`;
  put(d, 'build/jobs/T1/behind.bob.md', bobBox('behind'));
  put(d, 'build/jobs/T1/current.bob.md', bobBox('current'));
  commit(d, 'seed'); g(d, 'branch', '-M', 'tranche/T1'); g(d, 'push', '-q', 'origin', 'tranche/T1');
  for (const [m, c, handled] of [['behind', '1', 1], ['current', '2', 2]]) {
    g(d, 'checkout', '-q', '-b', `job/T1/${m}`, 'tranche/T1');
    put(d, `build/jobs/T1/${m}.md`, `# ${m} (T1)\n\n**Status** · ${S(c)} · depth 1 · COMPLETE · handled B${handled}\n\n## J1 · COMPLETE\n\nDone.\n`);
    commit(d, `${m} record`); g(d, 'push', '-q', 'origin', `job/T1/${m}`);
  }
  g(d, 'checkout', '-q', 'tranche/T1');
  return d;
}
const needs = (d) => Object.fromEntries(check({ product: d, tranche: 'T1' }).map((r) => [r.module, r.needs]));

test('a COMPLETE job whose cursor is behind BOB\'s newest entry reads OPEN with the unread range, and RING beside it', () => {
  assert.deepEqual(needs(world()).behind, ['OPEN (unread B2..B2)', 'RING']);
});

test('a COMPLETE job whose cursor is current reads as nothing: unchanged', () => {
  assert.deepEqual(needs(world()).current, []);
});

test('a WORKING job behind BOB\'s newest entry still reads only RING', () => {
  const d = world();
  g(d, 'checkout', '-q', 'job/T1/behind');
  writeFileSync(join(d, 'build/jobs/T1/behind.md'), `# behind (T1)\n\n**Status** · ${S('1')} · depth 1 · WORKING · handled B1\n\n## J1 · COMPLETE\n\nDone.\n`);
  commit(d, 'working'); g(d, 'push', '-q', 'origin', 'job/T1/behind'); g(d, 'checkout', '-q', 'tranche/T1');
  assert.deepEqual(needs(d).behind, ['RING']);
});
