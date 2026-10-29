import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseCsv, type Row } from './compare.ts';
import { resultsDir } from './results.ts';

// `perf report`: the sweep report (WEB-PLAN.md §11, roadmap step 25) from results/rows.csv. The
// latest row of each configuration; the §11.1 deltas, standard ÷ virtualized and dev ÷ prod; the
// §11.2 thresholds flagged; and proposed M-FRAMES thresholds from the observed distribution, which
// the plan deliberately leaves to the first sweep. Markdown, written beside the rows.

const latestRows = (rows: Row[]) => {
  const byKey = new Map<string, Row>();
  // Deliberate-failure runs (PERF_HOST_PARAMS, the gate checks) prove a check works; they are
  // never a configuration's number.
  for (const row of rows.filter((r) => !r.notes.includes('VALIDATION'))) {
    const key = ['scenario', 'build', 'channel_type', 'list', 'column', 'metric']
      .map((k) => row[k])
      .join(' ');
    byKey.set(key, row); // rows.csv is append-only: the last one wins
  }
  return [...byKey.values()];
};

const find = (rows: Row[], scenario: string, where: Partial<Row>) =>
  rows.find(
    (r) => r.scenario === scenario && Object.entries(where).every(([k, v]) => r[k] === v),
  );

const num = (r: Row | undefined) => (r && r.median !== '' ? Number(r.median) : null);
const fmt = (n: number | null, digits = 1) => (n === null ? '—' : n.toFixed(digits));

/** §11.2 starting thresholds; M-FRAMES has none until a sweep sets them. */
const flag = (row: Row, framesBands: { good: number; bad: number } | null) => {
  const v = Number(row.median);
  switch (row.metric) {
    case 'M-INP':
      return v < 100 ? 'good' : v <= 200 ? 'investigate' : 'bad';
    case 'M-SETTLE':
      return v < 300 ? 'good' : v <= 1000 ? 'investigate' : 'bad';
    case 'M-CPU': {
      const floor = Number(row.notes.match(/idle floor ([\d.]+)%/)?.[1] ?? 0);
      const above = v - floor;
      return above < 10 ? 'good' : above <= 30 ? 'investigate' : 'bad';
    }
    case 'M-FRAMES':
      if (!framesBands) return '';
      return v <= framesBands.good
        ? 'good'
        : v >= framesBands.bad
          ? 'bad'
          : 'investigate';
    default:
      return '';
  }
};

const percentile = (values: number[], p: number) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))];
};

const DELTAS: Array<[string, string, string]> = [
  ['cl-03', 'cl-11', 'badge cost'],
  ['cl-04', 'cl-11', 'preview cost'],
  ['cl-13', 'cl-11', 'avatar/member cost'],
  ['cl-10', 'cl-01', 'JavaScript download + parse cost'],
  ['ml-02', 'ml-01', 'text layout and markdown cost'],
  ['ml-05', 'ml-01', 'thread indicator cost'],
  ['ml-06', 'ml-01', 'quote cost'],
  ['ml-16', 'ml-15', 'reaction payload cost at open'],
  ['th-03', 'ml-15', 'thread open overhead'],
];

export const report = () => {
  // rows.csv, plus any file moved aside when a column was added (oldest first, so the latest wins).
  const files = readdirSync(resultsDir)
    .filter((f) => /^rows(-before-.*)?\.csv$/.test(f))
    .sort((a, b) => (a === 'rows.csv' ? 1 : b === 'rows.csv' ? -1 : a.localeCompare(b)));
  const rows = latestRows(
    files.flatMap((f) => parseCsv(readFileSync(resolve(resultsDir, f), 'utf8'))),
  );
  const prodDesktop = rows.filter(
    (r) => r.build === 'prod' && r.column === 'chrome-desktop',
  );
  const frames = prodDesktop
    .filter((r) => r.metric === 'M-FRAMES')
    .map((r) => Number(r.median));
  const framesBands =
    frames.length >= 5
      ? { bad: percentile(frames, 0.9), good: percentile(frames, 0.5) }
      : null;

  const out: string[] = [];
  out.push(`# Web performance sweep — ${new Date().toISOString().slice(0, 10)}`, '');
  out.push(
    `${rows.length} configurations. Thresholds are WEB-PLAN.md §11.2's; M-FRAMES bands are ` +
      'proposed from this sweep (prod, chrome-desktop): good ≤ the median, bad ≥ the 90th percentile' +
      (framesBands
        ? ` (good ≤ ${fmt(framesBands.good)} %, bad ≥ ${fmt(framesBands.bad)} %).`
        : ' (too few rows yet).'),
    '',
  );

  out.push('## Every row (latest per configuration)', '');
  out.push(
    '| scenario | build | type | list | column | metric | median | unit | spread | flag | notes |',
  );
  out.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of [...rows].sort((a, b) => a.scenario.localeCompare(b.scenario))) {
    out.push(
      `| ${r.scenario} | ${r.build} | ${r.channel_type} | ${r.list} | ${r.column} | ${r.metric} | ` +
        `${r.median} | ${r.unit} | ${fmt(Number(r.spread) * 100, 0)} %${r.unstable === 'true' ? ' ⚠' : ''} | ` +
        `${r.build === 'prod' && r.column === 'chrome-desktop' ? flag(r, framesBands) : ''} | ${r.notes} |`,
    );
  }

  out.push('', '## Deltas against the baselines (prod, chrome-desktop)', '');
  out.push('| delta | means | messaging standard | messaging virtualized |');
  out.push('|---|---|---|---|');
  for (const [a, b, means] of DELTAS) {
    const cells = (['standard', 'virtualized'] as const).map((list) => {
      const where = {
        build: 'prod',
        column: 'chrome-desktop',
        channel_type: 'messaging',
      };
      const ra =
        find(rows, a, { ...where, list }) ?? find(rows, a, { ...where, list: '-' });
      const rb =
        find(rows, b, { ...where, list }) ?? find(rows, b, { ...where, list: '-' });
      const va = num(ra);
      const vb = num(rb);
      return va === null || vb === null ? '—' : `${fmt(va - vb)} ${ra!.unit}`;
    });
    out.push(
      `| ${a.toUpperCase()} − ${b.toUpperCase()} | ${means} | ${cells.join(' | ')} |`,
    );
  }

  out.push('', '## standard ÷ virtualized (prod, chrome-desktop)', '');
  out.push('| scenario | type | standard | virtualized | ratio |');
  out.push('|---|---|---|---|---|');
  for (const r of prodDesktop.filter((x) => x.list === 'standard')) {
    const v = find(prodDesktop, r.scenario, {
      channel_type: r.channel_type,
      list: 'virtualized',
      metric: r.metric,
    });
    if (!v || !Number(v.median)) continue;
    out.push(
      `| ${r.scenario} | ${r.channel_type} | ${r.median} ${r.unit} | ${v.median} ${v.unit} | ` +
        `${fmt(Number(r.median) / Number(v.median), 2)} |`,
    );
  }

  out.push('', '## dev ÷ prod (chrome-desktop)', '');
  out.push('| scenario | type | list | prod | dev | ratio |');
  out.push('|---|---|---|---|---|---|');
  for (const r of rows.filter(
    (x) => x.build === 'dev' && x.column === 'chrome-desktop',
  )) {
    const p = find(rows, r.scenario, {
      build: 'prod',
      channel_type: r.channel_type,
      column: 'chrome-desktop',
      list: r.list,
      metric: r.metric,
    });
    if (!p || !Number(p.median)) continue;
    out.push(
      `| ${r.scenario} | ${r.channel_type} | ${r.list} | ${p.median} | ${r.median} | ` +
        `${fmt(Number(r.median) / Number(p.median), 2)} |`,
    );
  }

  const file = resolve(resultsDir, `report-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(file, `${out.join('\n')}\n`);
  return file;
};
