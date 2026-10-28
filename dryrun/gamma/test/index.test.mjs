import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gamma } from '../src/index.mjs';

test('N2 gamma(1) is 2', () => {
  assert.equal(gamma(1), 2);
});
