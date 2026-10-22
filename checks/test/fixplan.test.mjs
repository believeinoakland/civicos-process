// Tests of the fixplan check (checks/fixplan.mjs; bio K4426, K4597) against fake products in a temporary directory:
// a compliant plan passes, each missing field fails, and each deferral rule has its failing and passing case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { checkFixplan, fixPlans } from '../fixplan.mjs';

function product(files) {
  const root = mkdtempSync(join(tmpdir(), 'fixplan-'));
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  }
  return root;
}
const PLAN = 'build/plan/fix-round-9-T1.md';
const plan = (body, status = 'IN FORCE, reviewed') => `# Fix round 9\n\n**Status** · ${status}\n\n${body}\n`;
const GOOD = `### G1 · The door times out
(1) **Cause, certain.** \`control/index.mjs:120\` waits for the body.
(2) **Missed:** the fixture serves at once.
(3) **Failing-first:** a slow upstream; seen red.
(4) **L** workerd.
`;
const DIAG = '# Diagnosis\n\nReproduction attempt at the real shape: 128 MB, the object died.\n';
const run = (body, extra = {}, status) => checkFixplan(product({ [PLAN]: plan(body, status), ...extra })).failures;

test('fixplan: a compliant plan passes', () => {
  assert.deepEqual(run(GOOD), []);
});

test('fixplan: a plan neither IN FORCE nor DRAFT, or none, is not read', () => {
  const root = product({ [PLAN]: plan('### G1 · bare\nnothing', 'Closed 2026-10-01'), 'build/plan/archive/fix-round-1.md': plan('### G1 · x', 'IN FORCE') });
  assert.deepEqual(fixPlans(root), []);
  assert.deepEqual(checkFixplan(root).failures, []);
  assert.deepEqual(fixPlans(product({ [PLAN]: plan(GOOD, 'DRAFT') })), [PLAN]);
});

test('fixplan: each missing field fails, with file:line and the G id', () => {
  const lacks = (drop, expect) => {
    const f = run(GOOD.split('\n').filter((l) => !l.startsWith(drop)).join('\n'));
    assert.equal(f.length, 1, f.join('\n'));
    assert.match(f[0], new RegExp(`^${PLAN}:5 G1: .*${expect}`));
  };
  lacks('(1)', 'no cause stated');
  lacks('(2)', 'missed');
  lacks('(3)', 'failing-first');
  lacks('(4)', 'platform check marker');
});

test('fixplan: an "unknown" cause needs a diagnosis file that exists and records a reproduction', () => {
  const unknown = (ref) => `### G2 · Dena\n(1) **Cause: unknown**${ref}.\n(2) **Missed:** stubs never fail.\n(3) **Failing-first** red.\n(4) **P** at the copy.\n`;
  assert.match(run(unknown(''))[0], /G2: .*names no diagnosis/);
  assert.match(run(unknown(', see diagnosis-x.md'))[0], /diagnosis-x\.md does not exist/);
  assert.match(run(unknown(', see diagnosis-x.md'), { 'build/plan/diagnosis-x.md': '# no attempt\n' })[0], /records no reproduction/);
  assert.deepEqual(run(unknown(', see diagnosis-x.md'), { 'build/plan/diagnosis-x.md': DIAG }), []);
});

test('fixplan: bulleted causes are read, and a group introduction covers its bullets', () => {
  const group = (intro) => `### G5-G6 · The audit\n${intro}\n\n- **G5 · One.** (1) \`a/b.mjs:3\` cuts. (3) A 250-row list.\n- **G6 · Two.** (1) \`c/d.mjs:9\` cuts. (3) Red now.\n`;
  assert.deepEqual(run(group('For every cause: (2) missed, no requirement said so. (4) **N** unless named.')), []);
  const f = run(group('Words later.'));
  assert.equal(f.length, 4);
  assert.match(f[0], new RegExp(`${PLAN}:\\d+ G5: no "missed"`));
  assert.ok(f.some((x) => / G6: no platform check marker/.test(x)));
});

test('fixplan: an "after the deploy" table row without a cause and diagnosis fails', () => {
  const table = (row) => `## 2a. Live-only\n\n| rows | check after the deploy |\n|---|---|\n${row}\n`;
  const f = run(`${GOOD}\n${table('| A E1 uploads stall | read within the ticks |')}`);
  assert.equal(f.length, 1);
  assert.match(f[0], /^build\/plan\/fix-round-9-T1\.md:\d+ 2a: .*without a named cause and a diagnosis/);
  const named = table('| A E1 stall: cause `plane/index.mjs:4`, diagnosis-w.md | read within the ticks |');
  assert.deepEqual(run(`${GOOD}\n${named}`, { 'build/plan/diagnosis-w.md': DIAG }), []);
  assert.equal(run(`${GOOD}\n${named}`, { 'build/plan/diagnosis-w.md': '# nothing\n' }).length, 1);
});

test('fixplan: "explained by" and "check at the re-walk" lines fail unless researched; a platform marker line does not', () => {
  assert.equal(run(`${GOOD}\nThe 504 rows are explained by the dead alarm.\n`).length, 1);
  assert.equal(run(`${GOOD}\nA check at the re-walk will tell.\n`).length, 1);
  assert.deepEqual(run(`${GOOD}\n(4) **P** at the re-walk: a fresh file.\n`), []);
  const researched = `${GOOD}\nExplained by the alarm: cause \`plane/index.mjs:4\`, diagnosis-w.md.\n`;
  assert.deepEqual(run(researched, { 'build/plan/diagnosis-w.md': DIAG }), []);
});

test('fixplan: "for BOB to bring to Bob ... not planned" fails unless a G-entry measures it now', () => {
  const line = '**For BOB to bring to Bob separately, not planned here:** a combined read.';
  const f = run(`${GOOD}\n${line}\n`);
  assert.equal(f.length, 1);
  assert.match(f[0], /not planned" with no G-entry that measures it now/);
  const g28 = `- **G28 · Speed beyond 2 s.** PERFORMANCE measures the combined read on the copy now. (1) \`perf/run.mjs:5\` (2) missed (3) red (4) **P**\n`;
  assert.deepEqual(run(`${GOOD}\n${g28}\n${line}\n`), []);
});
