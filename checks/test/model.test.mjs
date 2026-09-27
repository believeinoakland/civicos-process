// Tests of the protocol model (checks/cert/model.mjs; bio K164, dryrun/cert/SUITE.md §4.3).
// On the current rules, each finding the model must reproduce has a counterexample, within a minute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explore, certify, RULES } from '../cert/model.mjs';

const run = certify(RULES.current);
const FINDINGS = {
  'F1 duplicate start': 'startOnce',
  'F2 relay to Bob without NEEDS BOB': 'relayNeedsBob',
  'F3 a message handled twice': 'handledOnce',
  'F4 message to an archived session': 'noMessageToArchived',
  'F5 answer applied to a stale question version': 'answerAppliedToItsVersion',
  'X4 two BOBs from one START BOB': 'oneBobPerStartBob',
};

for (const [finding, inv] of Object.entries(FINDINGS)) {
  test(`model, current rules: a counterexample exists for ${finding} (${inv})`, () => {
    const t = run.results[inv]?.trace;
    assert.ok(Array.isArray(t) && t.length > 0, `${inv} passed on the current rules`);
  });
}

test('model: the explorer terminates under 60 s and reports its state count', () => {
  assert.ok(run.ms < 60000, `took ${run.ms} ms`);
  assert.ok(run.states > 1000, `only ${run.states} states`);
  assert.ok(run.transitions >= run.states - 1);
  console.log(`model --rules current: ${run.states} states, ${run.transitions} transitions, ${run.ms} ms`);
});

test('model: every property is reported, and a counterexample ends with the violating action or state', () => {
  const r = RULES.current;
  assert.deepEqual(Object.keys(run.results).sort(), [...Object.keys(r.invariants), ...r.TRANSITION, ...r.LIVENESS].sort());
  assert.ok(run.results.oneBobPerStartBob.trace.at(-1).startsWith('ROOT startsBob'));
  assert.ok(run.results.startOnce.trace.at(-1).startsWith('handle START'));
});

test('model: a small bound with no faults and no spurious restart has no duplicate start', () => {
  const r = explore(RULES.current, { jobs: 1, faults: 0 });
  assert.equal(r.results.startOnce, null);
  assert.equal(r.results.oneBobPerStartBob, null);
});

test('model: the revised rule set is a stub with the same interface', () => {
  for (const k of ['defaults', 'init', 'actions', 'key', 'invariants', 'done', 'terminalOk', 'TRANSITION', 'LIVENESS'])
    assert.ok(k in RULES.revised, k);
  assert.match(RULES.revised.name, /stub/);
});
