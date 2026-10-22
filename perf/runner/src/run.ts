import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { launchBrowser, newIteration, type Iteration } from './browser.ts';
import { chatperf, userToken } from './chatperf.ts';
import {
  type Build,
  capFor,
  type ChannelType,
  type Column,
  type ListImplementation,
} from './config.ts';
import { startHost } from './host.ts';
import { appendRow, writeRun } from './results.ts';
import type { Measurement, RunScenario } from './scenarios/run.ts';
import { RUN_SCENARIOS } from './scenarios/index.ts';
import { dropFirst, isUnstable, median, spread } from './stats.ts';

// `perf run <id>`: one scenario over the grid cells asked for, N iterations each, one result row per
// cell (WEB-SCENARIOS.md §1.7). Seeds once (unless --no-seed), verifies before measuring.

export type RunOptions = {
  id: string;
  builds: Build[];
  columns: Column[];
  types: ChannelType[] | null;
  lists: ListImplementation[] | null;
  iterations: number;
  seed: boolean;
  /** false: a later run of the same batch (a live run already changed the dataset). */
  verify: boolean;
  headless: boolean;
};

const sdkRoot = resolve(import.meta.dirname, '../../..');
const sdkVersion = () => {
  const sha = execSync('git rev-parse --short HEAD', { cwd: sdkRoot }).toString().trim();
  const dirty = execSync('git status --porcelain', { cwd: sdkRoot }).toString().trim();
  return dirty ? `${sha}+dirty` : sha;
};

const round = (n: number) => Math.round(n * 10) / 10;

export const run = async (options: RunOptions) => {
  const scenario: RunScenario | undefined = RUN_SCENARIOS[options.id];
  if (!scenario) {
    throw new Error(
      `no scenario '${options.id}' (have: ${Object.keys(RUN_SCENARIOS).join(', ')})`,
    );
  }
  const apiKey = process.env.STREAM_KEY;
  if (!apiKey) throw new Error('STREAM_KEY is not set (source your chatperf env first)');

  const token = await userToken();
  const version = sdkVersion();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const refused = options.types?.filter((t) => !scenario.types.includes(t)) ?? [];
  if (refused.length) {
    throw new Error(
      `${scenario.id} runs on ${scenario.types.join(', ')} only, not ${refused.join(', ')}`,
    );
  }
  const types = options.types ?? scenario.types;
  const lists: Array<ListImplementation | '-'> = scenario.lists
    ? (options.lists ?? ['standard', 'virtualized'])
    : ['-'];
  // Validation only (e.g. PERF_HOST_PARAMS='leak=messages'): extra host URL parameters for the
  // deliberate-failure checks. Every row says so.
  const validationParams = process.env.PERF_HOST_PARAMS ?? '';
  // The prod bundle is rebuilt once per run, so a run always measures the working tree.
  let prodBuilt = false;

  const seeds = (
    Array.isArray(scenario.dataset.seed[0])
      ? scenario.dataset.seed
      : [scenario.dataset.seed]
  ) as string[][];
  const seedAll = async (typeArgs: string[]) => {
    for (const seed of seeds) await chatperf([...seed, ...typeArgs]);
  };

  // Channel type outermost: seeding one type wipes the other (chatperf isolation).
  for (const type of types) {
    const typeArgs = ['--channel-type', type];
    if (options.seed) {
      console.log(`seeding ${scenario.dataset.verify ?? scenario.id} (${type}) …`);
      await seedAll(typeArgs);
    }
    // Gate: the backend must hold exactly the dataset before anything is measured. Skipped only
    // for a later run of a batch, whose dataset the batch's own live runs have changed.
    if (options.verify && scenario.dataset.verify) {
      await chatperf(['verify', scenario.dataset.verify, ...typeArgs]);
    }
    // 'per-iteration' datasets: the data the next iteration needs is used up by this one.
    let datasetFresh = true;
    const reseed = async () => {
      if (scenario.dataset.reseed !== 'per-iteration' || datasetFresh) return;
      // Validation only: keep the used-up dataset, so the scenario's own check must fail.
      if (process.env.PERF_GATE_CHECK_STALE === '1') return;
      await seedAll(typeArgs);
      if (scenario.dataset.verify) {
        await chatperf(['verify', scenario.dataset.verify, ...typeArgs]);
      }
    };

    for (const build of options.builds) {
      const host = await startHost(build, { rebuild: build === 'prod' && !prodBuilt });
      if (build === 'prod') prodBuilt = true;
      let browser: Awaited<ReturnType<typeof launchBrowser>> | undefined;
      try {
        browser = await launchBrowser(options.headless);
        const browserVersion = browser.version();

        for (const column of options.columns) {
          for (const list of lists) {
            const url =
              `${host.origin}/?api_key=${apiKey}&token=${token}&user_id=qatest1` +
              `&list=${list === '-' ? 'virtualized' : list}&type=${type}` +
              (validationParams ? `&${validationParams}` : '');
            const measurements: Measurement[] = [];
            let reused: Iteration | undefined;

            for (let i = 1; i <= options.iterations; i++) {
              let iteration: Iteration;
              await reseed();
              datasetFresh = false;
              if (scenario.context === 'fresh') {
                iteration = await newIteration(browser, column);
                if (!scenario.selfNavigate) await iteration.page.goto(url);
              } else {
                if (!reused) {
                  // Warm-up load, not measured: fills the HTTP cache this scenario is about.
                  reused = await newIteration(browser, column);
                  await reused.page.goto(url);
                  await reused.page.evaluate(() => window.__perf!.ready());
                }
                iteration = reused;
                await iteration.page.reload();
              }
              measurements.push(
                await scenario.measure({
                  ...iteration,
                  iteration: i,
                  list: list === '-' ? 'virtualized' : list,
                  type,
                  url,
                }),
              );
              if (scenario.context === 'fresh') await iteration.context.close();
            }
            await reused?.context.close();

            // Discard iterations that failed a gate (with their reasons); then drop the first.
            const discarded = measurements
              .map((m, i) => ({ i: i + 1, reasons: m.gates ?? [] }))
              .filter((d) => d.reasons.length);
            for (const d of discarded) {
              console.log(`    iteration ${d.i} DISCARDED: ${d.reasons.join('; ')}`);
            }
            const kept = dropFirst(measurements).filter((m) => !m.gates?.length);
            if (!kept.length) {
              // Still keep the evidence: every measurement, with the gates that discarded it.
              const file = writeRun(
                `run-${scenario.id}-${build}-${type}-${list}-${column}-${stamp}-discarded`,
                { measurements },
              );
              console.log(
                `  ${scenario.id} ${build} ${type} ${list} ${column}: no valid iterations (${file})`,
              );
              continue;
            }
            const values = kept.map((m) => m.value);
            const splits = kept.map((m) => m.split).filter((s) => s != null);
            const clients = splits.map((s) => s.client);
            // Stability is judged on the client share when there is one: the network share is
            // the connection to Stream, not the SDK (WEB-SCENARIOS.md §1.5).
            const judged = clients.length === kept.length ? clients : values;
            const stability = spread(judged);
            const row = {
              browser_version: browserVersion,
              build,
              cap: capFor(type),
              channel_type: type,
              client_ms: clients.length ? round(median(clients)) : ('' as const),
              column,
              driver: scenario.metric === 'M-FRAMES' ? 'cdp-gesture' : '-',
              host: 'perf-host',
              iterations: kept.length,
              list,
              median: round(median(values)),
              metric: scenario.metric,
              network_ms: splits.length
                ? round(median(splits.map((s) => s.network)))
                : ('' as const),
              notes: [
                options.headless ? 'headless' : '',
                validationParams ? `VALIDATION ${validationParams}` : '',
                options.verify ? '' : 'verify skipped (later run of a batch)',
                scenario.dataset.reseed ? `reseed: ${scenario.dataset.reseed}` : '',
                discarded.length ? `discarded ${discarded.length} (gates)` : '',
                // Frame scenarios carry partial % (main-thread lag under compositor scroll) beside
                // the reported dropped %.
                kept.every((m) => typeof m.extra?.partialPct === 'number')
                  ? `partial ${round(median(kept.map((m) => m.extra!.partialPct as number)))}%`
                  : '',
                kept.every((m) => typeof m.extra?.droppedPerS === 'number')
                  ? `dropped ${round(median(kept.map((m) => m.extra!.droppedPerS as number)))}/s`
                  : '',
                kept.every((m) => typeof m.extra?.floorPct === 'number')
                  ? `idle floor ${round(median(kept.map((m) => m.extra!.floorPct as number)))}%`
                  : '',
              ]
                .filter(Boolean)
                .join('; '),
              scenario: scenario.id,
              sdk_version: version,
              spread: round(stability * 100) / 100,
              unit: scenario.unit,
              unstable: isUnstable(judged, scenario.unit),
            };
            const csv = appendRow(row);
            for (const also of scenario.alsoRows ?? []) {
              const alsoValues = kept.map((m) => Number(m.extra?.[also.key]));
              appendRow({
                ...row,
                median: round(median(alsoValues)),
                metric: also.metric,
                scenario: also.id,
                spread: round(spread(alsoValues) * 100) / 100,
                unit: also.unit,
                unstable: isUnstable(alsoValues, also.unit),
              });
              console.log(
                `  ${also.id} (same run): ${round(median(alsoValues))} ${also.unit} — ` +
                  `iterations ${alsoValues.map((v) => round(v)).join(' / ')}`,
              );
            }
            writeRun(`run-${scenario.id}-${build}-${type}-${list}-${column}-${stamp}`, {
              measurements,
              row,
            });
            console.log(
              `  ${scenario.id} ${build} ${type} ${list} ${column}: ${row.median} ${row.unit} ` +
                `(${splits.length ? `before request ${round(median(splits.map((s) => s.beforeRequest)))}, ` : ''}` +
                `network ${row.network_ms}, client ${row.client_ms}; spread ${Math.round(stability * 100)}%` +
                `${row.unstable ? ', UNSTABLE' : ''}) — iterations ${values.map(Math.round).join(' / ')} → ${csv}`,
            );
          }
        }
      } finally {
        await browser?.close();
        host.stop();
      }
    }
  }
};
