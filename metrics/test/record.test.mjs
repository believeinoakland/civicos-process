import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sumTranscript, row, record, recordInJob, rowsInJobRecord, cloudSessionId, HEADER } from '../record.mjs';
import { writeFileSync } from 'node:fs';

const usage = (r, w, i, o) => ({ cache_read_input_tokens: r, cache_creation_input_tokens: w, input_tokens: i, output_tokens: o });
const entry = (id, u) => JSON.stringify({ type: 'assistant', sessionId: 's-1', message: { id, usage: u } });

test('sums each model request once, however many entries carry it', () => {
  const text = [
    JSON.stringify({ type: 'user', sessionId: 's-1', message: { content: 'hi' } }),
    entry('m1', usage(100, 50, 2, 10)), entry('m1', usage(100, 50, 2, 10)),
    entry('m2', usage(150, 5, 1, 20)),
    'not json',
    JSON.stringify({ type: 'assistant', message: { id: 'm3' } }),
  ].join('\n');
  assert.deepEqual(sumTranscript(text), { cache_read: 250, cache_write: 55, input: 3, output: 30, turns: 2, session: 's-1' });
});

test('a row has the columns of mechanics §10, and commas in a field cannot shift them', () => {
  const t = { cache_read: 1, cache_write: 2, input: 3, output: 4, turns: 5, session: 's' };
  assert.equal(row(t, { role: 'job', module: 'id-spaces', testRuns: 7, moduleLines: 300 }), 's,job,id-spaces,1,2,3,4,5,7,300');
  assert.equal(row(t, { role: 'BOB,x' }).split(',').length, HEADER.split(',').length);
});

test('record writes the header once, then appends rows, and refuses a malformed tranche', () => {
  const root = mkdtempSync(join(tmpdir(), 'product-'));
  record(root, 'T0', 'a'); record(root, 'T0', 'b');
  assert.equal(readFileSync(join(root, 'build/metrics/T0.csv'), 'utf8'), `${HEADER}\na\nb\n`);
  assert.throws(() => record(root, '1', 'c'), /tranche must be T<n>/);
});

test('a job writes its row into its own record, and BOB reads every row back out', () => {
  const root = mkdtempSync(join(tmpdir(), 'product-'));
  const f = join(root, 'job.md');
  writeFileSync(f, '# job record\n\nCOMPLETE\n');
  recordInJob(f, 's1,job,m,1,2,3,4,5,6,7');
  recordInJob(f, 's2,job,m,8,9,10,11,12,13,14');
  assert.deepEqual(rowsInJobRecord(readFileSync(f, 'utf8')), ['s1,job,m,1,2,3,4,5,6,7', 's2,job,m,8,9,10,11,12,13,14']);
});

test('the row names the cloud session, as BOB addresses and archives it', () => {
  assert.equal(cloudSessionId({ CLAUDE_CODE_REMOTE_SESSION_ID: 'cse_01ABC' }), 'session_01ABC');
  assert.equal(cloudSessionId({}), null);
});
