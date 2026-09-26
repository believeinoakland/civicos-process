import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { total } from '../src/index.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('R1 total returns the sum of the numbers in a list, and 0 for an empty list', () => {
  assert.equal(total([]), 0);
  assert.equal(total([7]), 7);
  assert.equal(total([1, 2, 3]), 6);
  assert.equal(total([-4, 1.5, 2.5]), 0);
  assert.equal(total([0.1, 0.2]), 0.1 + 0.2);
  assert.equal(total([1e308, -1e308, 5]), 5);
  for (let n = 0; n <= 50; n++) {
    const list = Array.from({ length: n }, (_, i) => i - 20);
    assert.equal(total(list), list.reduce((a, b) => a + b, 0), `list of length ${n}`);
  }
});

// A copy of the sources the bundle script reads, so the test never writes the committed bundle.
function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'beta-bundle-'));
  for (const p of ['alpha/src', 'beta/src', 'beta/scripts']) cpSync(join(root, p), join(dir, p), { recursive: true });
  mkdirSync(join(dir, 'beta/dist'), { recursive: true });
  return dir;
}
const run = (dir, ...args) => spawnSync(process.execPath, ['beta/scripts/bundle.mjs', ...args], { cwd: dir, encoding: 'utf8' });

test('R2 bundle writes beta/dist/bundle.txt from alpha and beta source; --verify exits 1 with bundle: STALE unless exact', () => {
  const dir = sandbox();
  try {
    assert.equal(run(dir).status, 0);
    const out = readFileSync(join(dir, 'beta/dist/bundle.txt'), 'utf8');
    for (const p of ['alpha/src/index.mjs', 'beta/src/index.mjs']) {
      assert.ok(out.includes(readFileSync(join(dir, p), 'utf8')), `bundle contains ${p}`);
    }
    // Deterministic: writing again gives the same bytes.
    run(dir);
    assert.equal(readFileSync(join(dir, 'beta/dist/bundle.txt'), 'utf8'), out);

    let v = run(dir, '--verify');
    assert.equal(v.status, 0);
    assert.doesNotMatch(v.stdout, /bundle: STALE/);

    // Any difference in the committed file is stale, even one trailing byte.
    writeFileSync(join(dir, 'beta/dist/bundle.txt'), out + '\n');
    v = run(dir, '--verify');
    assert.equal(v.status, 1);
    assert.match(v.stdout, /bundle: STALE/);

    // A source change makes the committed file stale, for each source.
    for (const p of ['alpha/src/index.mjs', 'beta/src/index.mjs']) {
      writeFileSync(join(dir, 'beta/dist/bundle.txt'), out);
      const src = readFileSync(join(dir, p), 'utf8');
      writeFileSync(join(dir, p), src + '// changed\n');
      v = run(dir, '--verify');
      assert.equal(v.status, 1, `stale after ${p} changes`);
      assert.match(v.stdout, /bundle: STALE/);
      writeFileSync(join(dir, p), src);
    }

    // A missing committed file is stale, not a crash.
    rmSync(join(dir, 'beta/dist/bundle.txt'));
    v = run(dir, '--verify');
    assert.equal(v.status, 1);
    assert.match(v.stdout, /bundle: STALE/);
    // --verify writes nothing.
    assert.throws(() => readFileSync(join(dir, 'beta/dist/bundle.txt')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('R3 total is pure: it leaves its input unchanged and gives the same result each call', () => {
  const list = [3, -1, 4, 1, 5];
  const copy = [...list];
  const first = total(list);
  assert.deepEqual(list, copy);
  assert.equal(total(list), first);
  assert.equal(total(Object.freeze([...copy])), first);
});
