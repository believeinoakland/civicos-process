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

// ---- the revised rules (bio K164, K167): every property holds over every bound set ----

const rev = certify(RULES.revised);
for (const prop of [...Object.keys(RULES.revised.invariants), ...RULES.revised.TRANSITION, ...RULES.revised.LIVENESS]) {
  test(`model, revised rules: ${prop} holds over every bound set`, () => {
    assert.equal(rev.results[prop], null, `${prop}: ${rev.results[prop]?.set}: ${rev.results[prop]?.trace.join(' | ')}`);
  });
}

test('model, revised rules: same interface, every bound set explored under 60 s, the same properties as current', () => {
  for (const k of ['name', 'defaults', 'init', 'actions', 'key', 'invariants', 'done', 'terminalOk', 'TRANSITION', 'LIVENESS', 'BOUND_SETS'])
    assert.ok(k in RULES.revised, k);
  assert.doesNotMatch(RULES.revised.name, /stub/);
  assert.deepEqual(Object.keys(rev.results).sort(), Object.keys(run.results).sort());
  assert.deepEqual(rev.runs.map((r) => r.set), RULES.revised.BOUND_SETS.map((b) => b.set));
  assert.ok(rev.ms < 60000, `took ${rev.ms} ms`);
  console.log(`model --rules revised: ${rev.states} states, ${rev.transitions} transitions, ${rev.ms} ms`);
});

// Negative controls: each K164 rule switched off breaks the property it carries, so the model exercises it.
const set = (name) => RULES.revised.BOUND_SETS.find((b) => b.set === name);
const CONTROLS = [
  ['markIgnore', 'handledOnce', { jobs: 1, faults: 1 }],                 // §13 receipt idempotent (F3)
  ['newestVersion', 'answerAppliedToItsVersion', { jobs: 1, faults: 1 }], // §6.3 (F5)
  ['confirmStart', 'startOnce', { jobs: 1, faults: 1 }],                  // §5 start confirmed by the record (F1)
  ['recordQuiet', 'noRestartOfLiveJob', { jobs: 1, faults: 1 }],          // §5 quiet by record state (X6)
  ['relayByRecord', 'relayNeedsBob', { jobs: 1, faults: 1 }],             // §5 waits classified by record (F2)
  ['archiveFirst', 'oneLiveSessionPerModule', set('job-pair')],           // §5 restart archives first (X12)
  ['rootDedupe', 'oneBobPerStartBob', set('takeover-pair')],              // §2 ROOT starts each BOB once (X4)
  ['ackClose', 'closeClean', set('job-pair')],                            // §5 complete = handled BOB's newest (X16)
  ['resend', 'layersClose', { jobs: 1, faults: 1 }],                      // §5 a lost message sent again (lost ANSWER)
  ['watch', 'layersClose', set('takeover-pair')],                         // §2, §5 the WATCH (X5)
  ['watchAtOpen', 'layersClose', set('takeover-pair')],                   // §5 WATCH armed from the tranche's open
  ['wakeMovesWatch', 'layersClose', set('backstop-triple')],              // §2 ROOT moves the WATCH on WAKE
  ['restartReads', 'layersClose', set('job-pair')],                       // §6.1 a restart reads above its mark
];
for (const [rule, prop, bounds] of CONTROLS) {
  test(`model, revised rules with ${rule} off: ${prop} fails (negative control)`, () => {
    const until = RULES.revised.LIVENESS.includes(prop) ? undefined : prop;
    const r = explore(RULES.revised, { ...bounds, off: [rule] }, { until, maxStates: 2e6 });
    assert.ok(r.results[prop]?.length > 0, `${prop} still holds with ${rule} off`);
  });
}
test('model: every rule switch of the revised rules has a negative control', () => {
  assert.deepEqual(CONTROLS.map((c) => c[0]).sort(), [...RULES.revised.RULES].sort());
});
