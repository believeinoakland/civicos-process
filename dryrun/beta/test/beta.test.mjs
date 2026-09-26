import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from '../src/index.mjs';

test('R1 total returns the sum of a list, and 0 for an empty list', () => {
  assert.equal(total([1, 2, 3]), 6);
  assert.equal(total([]), 0);
});
