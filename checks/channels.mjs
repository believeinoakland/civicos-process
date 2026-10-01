// The channels check (PROCESS-MECHANICS §8.5, §13.1; P15; bio K954): over each mail branch's history, an entry once
// pushed is never rewritten or removed, entry numbers rise by one, and a cursor never moves backwards.
// It reads the registry `build/channels.md` in the product's working tree; with none, there is nothing to check.
// For each row it fetches the mail branch from origin (when there is one), and fails if the branch's new tip does not
// descend from the tip read before (a forced rewrite), then walks every commit that touched the outbox, oldest first,
// comparing the outbox with its text in the commit before.
// Usage: node checks/channels.mjs <product-root>
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRegistry, parseOutbox, REGISTRY } from '../tools/mail.mjs';
import { report } from './lib.mjs';

function gitq(root, args) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); } catch { return null; }
}
const rev = (root, ref) => gitq(root, ['rev-parse', '-q', '--verify', `${ref}^{commit}`])?.trim() || null;

// The first break in an outbox's numbering, or null: each entry carries the writer's letter and numbers rise by one.
function sequenceFault(entries, letter) {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.letter !== letter) return `entry ${e.id} does not carry the writer's letter ${letter}`;
    if (e.n !== i + 1) return `entry numbers do not rise by one: ${i ? entries[i - 1].id : 'the start'} then ${e.id}`;
  }
  return null;
}

// What one commit did to the outbox that the channel forbids.
export function compareOutbox(before, after, letter) {
  const out = [];
  const P = parseOutbox(before), N = parseOutbox(after);
  if (after === null && P.entries.length) return [`removes the outbox and its entries ${P.entries.map((e) => e.id).join(', ')}`];
  const now = new Map();
  for (const e of N.entries) if (!now.has(e.id)) now.set(e.id, e);
  for (const e of P.entries) {
    const f = now.get(e.id);
    if (!f) out.push(`removes entry ${e.id}`);
    else if (f.text !== e.text) out.push(`changes entry ${e.id}`);
  }
  const was = sequenceFault(P.entries, letter), is = sequenceFault(N.entries, letter);
  if (is && is !== was) out.push(is);
  for (const [name, c] of Object.entries(P.cursors)) {
    const d = N.cursors[name];
    if (!d) out.push(`removes the cursor over ${name} (was ${c.letter}${c.n})`);
    else if (d.n < c.n) out.push(`moves the cursor over ${name} back from ${c.letter}${c.n} to ${d.letter}${d.n}`);
  }
  return out;
}

export function checkChannels(root, { fetch = true } = {}) {
  const file = join(root, REGISTRY);
  if (!existsSync(file)) return { failures: [], summary: `no ${REGISTRY}: nothing to check` };
  let rows;
  try { rows = parseRegistry(readFileSync(file, 'utf8')); } catch (e) { return { failures: [e.message], summary: 'registry unreadable' }; }
  const failures = [], absent = [];
  const hasOrigin = gitq(root, ['remote'])?.split('\n').includes('origin');
  let commits = 0;
  for (const p of rows) {
    const remote = `refs/remotes/origin/${p.branch}`;
    const before = rev(root, remote);
    if (fetch && hasOrigin) gitq(root, ['fetch', '-q', 'origin', `+refs/heads/${p.branch}:${remote}`]);
    const tip = rev(root, remote) || rev(root, `refs/heads/${p.branch}`);
    if (!tip) { absent.push(p.name); continue; }
    if (before && before !== tip && gitq(root, ['merge-base', '--is-ancestor', before, tip]) === null) {
      failures.push(`${p.name} ${p.branch}: history rewritten: ${before.slice(0, 7)}, read before, is not in ${tip.slice(0, 7)}`);
    }
    const list = (gitq(root, ['rev-list', '--reverse', '--parents', tip, '--', p.outbox]) || '').trim().split('\n').filter(Boolean);
    for (const line of list) {
      const [c, ...parents] = line.split(' ');
      commits++;
      const after = gitq(root, ['show', `${c}:./${p.outbox}`]);
      for (const par of parents.length ? parents : [null]) {
        const before = par ? gitq(root, ['show', `${par}:./${p.outbox}`]) : null;
        for (const f of compareOutbox(before, after, p.letter)) failures.push(`${p.name} ${p.branch} ${c.slice(0, 7)}: ${f}`);
      }
    }
  }
  const summary = `${rows.length} participant${rows.length === 1 ? '' : 's'}, ${commits} outbox commit${commits === 1 ? '' : 's'} read${absent.length ? `; no mail branch yet: ${absent.join(', ')}` : ''}`;
  return { failures, summary };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failures, summary } = checkChannels(process.argv[2] || '.');
  process.exitCode = report('channels', failures, summary);
}
