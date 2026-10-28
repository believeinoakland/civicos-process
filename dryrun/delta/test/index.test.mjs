import { test } from 'node:test';
import assert from 'node:assert/strict';
import { delta } from '../src/index.mjs';

// N3: delta() returns the string `delta`.
test('N3 delta() is delta', () => {
  assert.equal(delta(), 'delta');
});
