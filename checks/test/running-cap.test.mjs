// The RUNNING window's cap and the QUIET rule (mechanics §5.4, §6; bio K4976): a dropped container is caught within
// RUNNING_MAX_MIN of the job's last push, whatever window its record states.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state, quietOf, RUNNING_MAX_MIN } from '../../tools/mail.mjs';

const MIN = 60e3, now = Date.parse('2026-10-24T17:00:00Z');
const running = (aheadMin) => `RUNNING until ${new Date(now + aheadMin * MIN).toISOString().replace(/\.\d+Z$/, 'Z')} (suite)`;

test('the cap is 30 minutes', () => assert.equal(RUNNING_MAX_MIN, 30));

test('state refuses a RUNNING window over the cap, a zero or bad one, and RUNNING by --set, before touching git', () => {
  for (const running of [31, 90, 0, -5, 'x']) assert.throws(() => state({ tranche: 'T1', module: 'm', running, what: 'suite' }), /--running takes 1 to 30 minutes/);
  assert.throws(() => state({ tranche: 'T1', module: 'm', set: 'RUNNING until 2099-01-01T00:00:00Z (suite)' }), /only by --running/);
});

test('QUIET: WORKING with no push for 20 minutes', () => {
  assert.equal(quietOf('WORKING', 19 * MIN, now), false);
  assert.equal(quietOf('WORKING', 20 * MIN, now), true);
});

test('QUIET: RUNNING past its window with no push for 20 minutes; not before', () => {
  assert.equal(quietOf(running(-1), 25 * MIN, now), true);
  assert.equal(quietOf(running(5), 25 * MIN, now), false);
  assert.equal(quietOf(running(-1), 10 * MIN, now), false);
});

test('QUIET: a window set longer by an older tool is capped at 30 minutes from the last push (the dropped-container case)', () => {
  assert.equal(quietOf(running(60), 31 * MIN, now), true);
  assert.equal(quietOf(running(60), 29 * MIN, now), false);
});

test('control: COMPLETE, WAITING ON BOB and NEEDS BOB are never QUIET', () => {
  for (const s of ['COMPLETE', 'WAITING ON BOB (J3)', 'NEEDS BOB']) assert.equal(quietOf(s, 120 * MIN, now), false);
});
