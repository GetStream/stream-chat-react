import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compare, parseCsv } from './compare.ts';

const HEADER =
  'scenario,build,channel_type,list,column,driver,metric,median,unit,notes,recorded_at';
const day = 86_400_000;
const now = Date.parse('2026-10-22T06:00:00Z');
const at = (msAgo: number) => new Date(now - msAgo).toISOString();
const row = (median: number, msAgo: number, list = 'virtualized') =>
  `ml-01,prod,messaging,${list},chrome-desktop,cdp-gesture,M-FRAMES,${median},%,"partial 1%, x",${at(msAgo)}`;

test('parses quoted cells with commas', () => {
  const [r] = parseCsv(`${HEADER}\n${row(1, 0)}\n`);
  assert.equal(r.notes, 'partial 1%, x');
  assert.equal(r.median, '1');
});

test('alerts when a row is more than 15 % above its 7-day median', () => {
  const csv = [
    HEADER,
    row(2, 3 * day),
    row(2.1, 2 * day),
    row(1.9, day),
    row(2.5, 3_600_000),
  ];
  const { alerts, compared } = compare(parseCsv(`${csv.join('\n')}\n`), { now });
  assert.equal(compared.length, 1);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].baseline, 2);
});

test('two unchanged nights raise nothing, and no history means no comparison', () => {
  const csv = [
    HEADER,
    row(2, 2 * day),
    row(2.05, day),
    row(2.1, 3_600_000),
    row(9, 3_600_000, 'standard'),
  ];
  const { alerts, compared } = compare(parseCsv(`${csv.join('\n')}\n`), { now });
  assert.deepEqual(alerts, []);
  assert.equal(compared.length, 1);
});

test('history older than 7 days does not count', () => {
  const csv = [HEADER, row(1, 9 * day), row(5, 3_600_000)];
  assert.equal(compare(parseCsv(`${csv.join('\n')}\n`), { now }).compared.length, 0);
});
