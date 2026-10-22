import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

// One row per (scenario, build, channel type, list, column) — WEB-SCENARIOS.md §1.7. The CSV is
// also the export format for collecting web and mobile results in one place.

// PERF_RESULTS_DIR keeps history outside the checkout (the nightly machine's CI starts each run fresh).
export const resultsDir =
  process.env.PERF_RESULTS_DIR ?? resolve(import.meta.dirname, '..', 'results');

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
  /** When the row was written (ISO 8601): the nightly comparison's time axis. Set by appendRow. */
  recorded_at?: string;
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
  'recorded_at',
];

const csvCell = (value: unknown) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const appendRow = (row: ResultRow) => {
  mkdirSync(resultsDir, { recursive: true });
  const csv = resolve(resultsDir, 'rows.csv');
  const header = COLUMNS.join(',');
  // A file from before a column was added keeps its rows under their own header, beside the new one.
  if (existsSync(csv) && readFileSync(csv, 'utf8').split('\n', 1)[0] !== header) {
    renameSync(
      csv,
      resolve(resultsDir, `rows-before-${new Date().toISOString().slice(0, 10)}.csv`),
    );
  }
  if (!existsSync(csv)) writeFileSync(csv, `${header}\n`);
  const stamped = { ...row, recorded_at: row.recorded_at ?? new Date().toISOString() };
  appendFileSync(csv, `${COLUMNS.map((c) => csvCell(stamped[c])).join(',')}\n`);
  return csv;
};

export const writeRun = (name: string, data: unknown) => {
  mkdirSync(resultsDir, { recursive: true });
  const file = resolve(resultsDir, `${name}.json`);
  writeFileSync(file, JSON.stringify(data, null, 1));
  return file;
};
