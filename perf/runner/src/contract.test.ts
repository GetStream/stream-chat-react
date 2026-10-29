import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkContract, readPin } from './contract.ts';

// `yarn workspace @stream-io/react-perf-runner test`: the runner's scenario files against the pinned
// chatperf registry (contract/chatperf-scenarios.json). No backend, no Ruby, no secrets.

test('every scenario file agrees with the pinned chatperf registry', () => {
  const pin = readPin();
  assert.deepEqual(checkContract(pin.scenarios), []);
});

test('a scenario that drifts from its canonical command is named', () => {
  const pin = readPin();
  const changed = pin.scenarios.map((s) =>
    s.id === 'ml-08' && s.live ? { ...s, live: { ...s.live, rate: 6 } } : s,
  );
  const problems = checkContract(changed);
  assert.ok(
    problems.some((p) => p.startsWith('src/scenarios/live-specs.ts (ml-08): --rate 5')),
    problems.join('\n'),
  );
});
