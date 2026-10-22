import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// One row per (scenario, build, channel type, list, column) — WEB-SCENARIOS.md §1.7. The CSV is
// also the export format for collecting web and mobile results in one place.

export const resultsDir = resolve(import.meta.dirname, '..', 'results');

export type ResultRow = {
  scenario: string;
  build: string;
  channel_type: string;
  list: string;
  column: string;
  driver: string;
  cap: string;
  browser_version: string;
  sdk_version: string;
  host: string;
  metric: string;
  median: number;
  unit: string;
  iterations: number;
  spread: number;
  unstable: boolean;
  network_ms: number | '';
  client_ms: number | '';
  notes: string;
};

const COLUMNS: Array<keyof ResultRow> = [
  'scenario',
  'build',
  'channel_type',
  'list',
  'column',
  'driver',
  'cap',
  'browser_version',
  'sdk_version',
  'host',
  'metric',
  'median',
  'unit',
  'iterations',
  'spread',
  'unstable',
  'network_ms',
  'client_ms',
  'notes',
];

const csvCell = (value: unknown) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const appendRow = (row: ResultRow) => {
  mkdirSync(resultsDir, { recursive: true });
  const csv = resolve(resultsDir, 'rows.csv');
  if (!existsSync(csv)) writeFileSync(csv, `${COLUMNS.join(',')}\n`);
  appendFileSync(csv, `${COLUMNS.map((c) => csvCell(row[c])).join(',')}\n`);
  return csv;
};

export const writeRun = (name: string, data: unknown) => {
  mkdirSync(resultsDir, { recursive: true });
  const file = resolve(resultsDir, `${name}.json`);
  writeFileSync(file, JSON.stringify(data, null, 1));
  return file;
};
