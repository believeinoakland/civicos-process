import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add } from '../src/index.mjs';

test('R1 add returns the sum of two numbers', () => {
  assert.equal(add(2, 3), 5);
  assert.equal(add(-1, 1), 0);
});
