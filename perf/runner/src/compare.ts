import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { resultsDir } from './results.ts';

// `perf compare`: the nightly regression check (WEB-PLAN.md §8.4). Every row written in the latest
// window (default: the last 12 hours) is compared with the median of the same configuration's rows
// from the 7 days before it. Higher is worse for every metric (ms, %, MB), so a row more than 15 %
// above that median is an alert. No history yet for a configuration = no comparison, not an alert.

export type Row = Record<string, string>;

/** RFC 4180-ish: quoted cells with doubled quotes, as results.ts writes them. */
export const parseCsv = (text: string): Row[] => {
  const lines: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      lines.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) lines.push([...row, cell]);
  const [header, ...body] = lines;
  return body.map((cells) =>
    Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])),
  );
};

const KEY = [
  'scenario',
  'build',
  'channel_type',
  'list',
  'column',
  'driver',
  'metric',
] as const;
const keyOf = (row: Row) => KEY.map((k) => row[k]).join(' ');
const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export type Alert = {
  key: string;
  value: number;
  baseline: number;
  change: number;
  unit: string;
};

export const compare = (
  rows: Row[],
  { now = Date.now(), windowHours = 12, historyDays = 7, threshold = 0.15 } = {},
) => {
  const windowStart = now - windowHours * 3_600_000;
  const historyStart = windowStart - historyDays * 86_400_000;
  const dated = rows.filter(
    (r) => r.recorded_at && r.median !== '' && !r.notes?.includes('VALIDATION'),
  );
  const latest = dated.filter((r) => Date.parse(r.recorded_at) >= windowStart);
  const alerts: Alert[] = [];
  const compared: string[] = [];
  for (const row of latest) {
    const history = dated
      .filter((r) => {
        const t = Date.parse(r.recorded_at);
        return keyOf(r) === keyOf(row) && t >= historyStart && t < windowStart;
      })
      .map((r) => Number(r.median));
    if (!history.length) continue;
    const baseline = median(history);
    const value = Number(row.median);
    compared.push(keyOf(row));
    const change =
      baseline === 0 ? (value > 0 ? Infinity : 0) : (value - baseline) / baseline;
    if (change > threshold)
      alerts.push({ baseline, change, key: keyOf(row), unit: row.unit, value });
  }
  return { alerts, compared, latest: latest.length };
};

export const compareResults = (options?: Parameters<typeof compare>[1]) =>
  compare(parseCsv(readFileSync(resolve(resultsDir, 'rows.csv'), 'utf8')), options);
