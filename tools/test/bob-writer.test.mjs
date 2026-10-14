// `mail bob` writes BOB's address in both places a successor must (bio K3361): the plan's Status line on the tranche
// branch, and, when the product has a registry, the Writer line of BOB's outbox on `mail/BOB` (§13.1 (1)). `xcheck --as
// BOB` warns when the two disagree. A bare origin holds `main` (with or without `build/channels.md`) and `tranche/T1`
// (with the plan); one clone plays BOB on the tranche branch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bob, xwriter, xcheckWarnings, parseOutbox } from '../mail.mjs';

const MAIL = join(dirname(fileURLToPath(import.meta.url)), '..', 'mail.mjs');
const T = 'T1';
const g = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const SB = 'session_01BBBBBBBBBBBBBBBBBBBBBBBB', SB2 = 'session_01CCCCCCCCCCCCCCCCCCCCCCCC';
const REGISTRY = `# Channels

| name | account | mail branch | outbox | letter |
| --- | --- | --- | --- | --- |
| \`BOB\` | secondary | \`mail/BOB\` | \`mail/BOB.md\` | B |
| \`UX-DESIGN\` | primary | \`mail/UX-DESIGN\` | \`mail/UX-DESIGN.md\` | U |
`;

function world({ registry = REGISTRY } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'bobwriter-'));
  const origin = join(base, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', origin]);
  const clone = (name, branch) => {
    const d = join(base, name);
    execFileSync('git', ['clone', '-q', ...(branch ? ['-b', branch] : []), origin, d], { stdio: 'ignore' });
    for (const [k, v] of [['user.name', name], ['user.email', `${name}@t`], ['commit.gpgsign', 'false']]) g(d, 'config', k, v);
    return d;
  };
  const seed = clone('seed');
  mkdirSync(join(seed, 'build/plan'), { recursive: true });
  if (registry) writeFileSync(join(seed, 'build/channels.md'), registry);
  writeFileSync(join(seed, 'build/plan/current.md'), `# Plan ${T}\n\n**Status** · OPEN · no BOB yet\n`);
  g(seed, 'add', '.'); g(seed, 'commit', '-q', '-m', 'seed'); g(seed, 'branch', '-M', 'main'); g(seed, 'push', '-q', 'origin', 'main');
  g(seed, 'push', '-q', 'origin', `main:refs/heads/tranche/${T}`);
  return { origin, bob: clone('bob', `tranche/${T}`) };
}
const remote = (w, ref, path) => { try { return execFileSync('git', ['--git-dir', w.origin, 'show', `${ref}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
const tip = (w, ref) => { try { return execFileSync('git', ['--git-dir', w.origin, 'rev-parse', ref], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const B = (w, session, extra = {}) => bob({ product: w.bob, tranche: T, name: 'BOB #7', session, depth: 1, date: '2026-10-14', ...extra });
const cli = (w, ...a) => execFileSync('node', [MAIL, ...a, '--product', w.bob], { encoding: 'utf8' });

test('bob: writes the plan\'s Status line and BOB\'s Writer line, with the registry\'s account', () => {
  const w = world();
  const r = B(w, SB);
  assert.equal(r.channel.status, 'written');
  assert.match(remote(w, `tranche/${T}`, 'build/plan/current.md'), /^\*\*Status\*\* · OPEN · BOB #7 · session_01B+ · depth 1$/m);
  assert.deepEqual(parseOutbox(remote(w, 'mail/BOB', 'mail/BOB.md')).writer, { name: 'BOB', session: SB, account: 'secondary', since: '2026-10-14' });
  // A successor replaces both.
  assert.equal(B(w, SB2).channel.status, 'written');
  assert.equal(parseOutbox(remote(w, 'mail/BOB', 'mail/BOB.md')).writer.session, SB2);
});

test('bob: run again with the same session, it is idempotent (no new commit on either branch)', () => {
  const w = world();
  B(w, SB);
  const plan = tip(w, `tranche/${T}`), mail = tip(w, 'mail/BOB');
  const r = B(w, SB);
  assert.equal(r.channel.status, 'current');
  assert.equal(tip(w, `tranche/${T}`), plan);
  assert.equal(tip(w, 'mail/BOB'), mail);
  // The command line says so in one line each.
  const out = cli(w, 'bob', '--tranche', T, '--name', 'BOB #7', '--session', SB, '--depth', '1').trim().split('\n');
  assert.equal(out.length, 2);
  assert.match(out[1], /^BOB's Writer line already names session_01B+: nothing to do$/);
});

test('bob: a product without a registry gets the Status line only, and no error', () => {
  const w = world({ registry: null });
  const r = B(w, SB);
  assert.equal(r.channel.status, 'skipped');
  assert.match(remote(w, `tranche/${T}`, 'build/plan/current.md'), /· session_01B+ · depth 1$/m);
  assert.equal(tip(w, 'mail/BOB'), null);
  const out = cli(w, 'bob', '--tranche', T, '--name', 'BOB #7', '--session', SB2, '--depth', '1').trim().split('\n');
  assert.deepEqual(out.length, 1);
  assert.match(out[0], /^plan Status written/);
});

test('bob: a failed channel step keeps the Status line and warns with the xwriter command', () => {
  const w = world({ registry: REGISTRY.replace(/^\| `BOB`.*\n/m, '') });   // a registry with no BOB row
  const r = B(w, SB);
  assert.equal(r.channel.status, 'failed');
  assert.match(remote(w, `tranche/${T}`, 'build/plan/current.md'), /· session_01B+ · depth 1$/m);
  const out = cli(w, 'bob', '--tranche', T, '--name', 'BOB #7', '--session', SB2, '--depth', '1');
  assert.match(out, /^plan Status written/);
  assert.match(out, /^WARNING: BOB's Writer line not written \(.*\); run by hand: node tools\/mail\.mjs xwriter --product \S+ --as BOB --session session_01C+$/m);
});

test('xcheck --as BOB: warns when the Writer is not the plan\'s BOB, and not when they match', () => {
  const w = world();
  B(w, SB);
  assert.deepEqual(xcheckWarnings({ product: w.bob, as: 'BOB', tranche: T }), []);
  assert.deepEqual(xcheckWarnings({ product: w.bob, as: 'BOB' }), []);            // the working tree's plan
  assert.doesNotMatch(cli(w, 'xcheck', '--as', 'BOB', '--tranche', T), /WARNING/);
  xwriter({ product: w.bob, as: 'BOB', session: SB2 });                              // the outbox moves on, the plan does not
  const [warn] = xcheckWarnings({ product: w.bob, as: 'BOB', tranche: T });
  assert.match(warn, /^WARNING: BOB's Writer line names session_01C+ but the plan's Status line names session_01B+/);
  const out = cli(w, 'xcheck', '--as', 'BOB', '--tranche', T).trim().split('\n');
  assert.match(out[0], /^UX-DESIGN \(primary\) · no outbox yet · /);                // the rows are unchanged
  assert.match(out.at(-1), /^WARNING: /);
  assert.deepEqual(xcheckWarnings({ product: w.bob, as: 'UX-DESIGN', tranche: T }), []);   // BOB's only
  B(w, SB);                                                                          // `mail bob` mends it
  assert.deepEqual(xcheckWarnings({ product: w.bob, as: 'BOB', tranche: T }), []);
});
