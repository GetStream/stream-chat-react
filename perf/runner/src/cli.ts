import { parseArgs } from 'node:util';

import { check } from './check.ts';
import { compareResults } from './compare.ts';
import { report } from './report.ts';
import { RUN_SCENARIOS } from './scenarios/index.ts';
import { reusesSeed, SETS } from './sets.ts';
import { checkContract, readPin, updatePin } from './contract.ts';
import { BUILDS, CHANNEL_TYPES, COLUMNS, LISTS } from './config.ts';
import { renders } from './renders.ts';
import { run } from './run.ts';

// yarn workspace @stream-io/react-perf-runner perf run <scenario>
//   [--build dev|prod] [--column chrome-desktop|chrome-4x] [--type messaging|livestream]
//   [--list standard|virtualized] [-n N] [--no-seed] [--no-verify] [--headless]
// yarn workspace @stream-io/react-perf-runner perf renders <ml-09|ml-11|cl-07> --record|--replay
//   [--build profiling|dev] [--list standard|virtualized] [--runs N] [--rebuild] [--seed]
//   [--ground-truth]
// yarn workspace @stream-io/react-perf-runner perf check ml-08-oldest [--list …] [--seed] [--headless]

const USAGE = [
  'usage:',
  '  perf run <scenario> [--build dev|prod] [--column chrome-desktop|chrome-4x]',
  '    [--type messaging|livestream] [--list standard|virtualized] [-n N] [--no-seed]',
  '    [--no-verify] [--headless]',
  '  perf run --set nightly|signoff|channel-list|message-list|leaks|desktop [-n N] …',
  '  perf renders <scenario> --record|--replay [--build profiling|dev] [--offline]',
  '    [--baseline write|check]',
  '    [--list standard|virtualized] [--runs N] [--rebuild] [--seed] [--ground-truth]',
  '  perf contract [--update]',
  '  perf compare',
  '  perf report',
  '  perf check ml-08-oldest [--list standard|virtualized] [--seed] [--no-verify] [--headless]',
].join('\n');

/** A repeatable flag, checked against its allowed values; absent = all of them. */
const pick = <T extends string>(
  name: string,
  given: string[] | undefined,
  allowed: readonly T[],
) => {
  if (!given?.length) return null;
  for (const value of given) {
    if (!(allowed as readonly string[]).includes(value)) {
      throw new Error(`--${name} ${value}: expected one of ${allowed.join(', ')}`);
    }
  }
  return given as T[];
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowNegative: true,
    allowPositionals: true,
    options: {
      build: { multiple: true, type: 'string' },
      column: { multiple: true, type: 'string' },
      'ground-truth': { default: false, type: 'boolean' },
      headless: { default: false, type: 'boolean' },
      iterations: { default: '5', short: 'n', type: 'string' },
      list: { multiple: true, type: 'string' },
      rebuild: { default: false, type: 'boolean' },
      record: { default: false, type: 'boolean' },
      replay: { default: false, type: 'boolean' },
      runs: { default: '1', type: 'string' },
      seed: { type: 'boolean' },
      type: { multiple: true, type: 'string' },
      update: { default: false, type: 'boolean' },
      offline: { default: false, type: 'boolean' },
      baseline: { type: 'string' },
      set: { type: 'string' },
      verify: { default: true, type: 'boolean' },
    },
  });
  const [command, id] = positionals;
  const needsId =
    !['contract', 'compare', 'report'].includes(command) &&
    !(command === 'run' && values.set);
  if (!id && needsId) throw new Error(USAGE);
  const lists = pick('list', values.list, LISTS);

  if (command === 'run' && values.set) {
    const set = SETS[values.set];
    if (!set)
      throw new Error(`no set '${values.set}' (have: ${Object.keys(SETS).join(', ')})`);
    const iterations = Number(values.iterations);
    for (const [index, setId] of set.ids.entries()) {
      console.log(`\n### ${values.set} ${index + 1}/${set.ids.length}: ${setId}`);
      await run({
        builds: set.builds ?? pick('build', values.build, BUILDS) ?? ['prod'],
        columns: set.columns ??
          pick(
            'column',
            values.column,
            Object.keys(COLUMNS) as Array<keyof typeof COLUMNS>,
          ) ?? ['chrome-desktop'],
        headless: values.headless,
        id: setId,
        iterations,
        lists,
        seed: (values.seed ?? true) && !reusesSeed(set.ids, index),
        types:
          set.types?.filter((t) => RUN_SCENARIOS[setId].types.includes(t)) ??
          pick('type', values.type, CHANNEL_TYPES),
        verify: values.verify,
      });
    }
    return;
  }

  if (command === 'run') {
    const iterations = Number(values.iterations);
    if (!Number.isInteger(iterations) || iterations < 2) {
      throw new Error('-n must be at least 2 (iteration 1 is always dropped)');
    }
    await run({
      builds: pick('build', values.build, BUILDS) ?? ['prod'],
      columns: pick(
        'column',
        values.column,
        Object.keys(COLUMNS) as Array<keyof typeof COLUMNS>,
      ) ?? ['chrome-desktop'],
      headless: values.headless,
      id,
      iterations,
      lists,
      // `run` seeds by default (the protocol starts from a clean dataset); --no-seed reuses it.
      seed: values.seed ?? true,
      types: pick('type', values.type, CHANNEL_TYPES),
      verify: values.verify,
    });
    return;
  }

  if (command === 'renders') {
    if (values.record === values.replay) throw new Error(USAGE);
    const build = values.build?.[0] ?? 'profiling';
    if (build !== 'profiling' && build !== 'dev') {
      throw new Error(
        `--build must be profiling or dev (render counts never run on prod)`,
      );
    }
    await renders({
      build,
      baseline:
        values.baseline === 'write' || values.baseline === 'check'
          ? values.baseline
          : null,
      groundTruth: values['ground-truth'],
      offline: values.offline,
      id,
      lists,
      mode: values.record ? 'record' : 'replay',
      rebuild: values.rebuild,
      runs: Number(values.runs),
      seed: values.seed ?? false,
    });
    return;
  }

  if (command === 'report') {
    console.log(`  report written: ${report()}`);
    return;
  }

  if (command === 'compare') {
    // The nightly check: rows of the last 12 h against the 7-day median before them.
    const { alerts, compared, latest } = compareResults();
    console.log(`  ${latest} recent rows, ${compared.length} with history`);
    for (const a of alerts) {
      console.log(
        `  ✗ ${a.key}: ${a.value} ${a.unit} vs 7-day median ${a.baseline} (+${Math.round(a.change * 100)}%)`,
      );
    }
    if (alerts.length) process.exit(1);
    return;
  }

  if (command === 'contract') {
    // `perf contract --update`: re-pin chatperf's registry (a deliberate change), then check.
    if (values.update) {
      const pin = updatePin();
      console.log(
        `pinned chatperf ${pin.chatperfCommit}: ${pin.scenarios.length} scenarios`,
      );
    }
    const problems = checkContract(readPin().scenarios);
    for (const p of problems) console.log(`  ✗ ${p}`);
    if (problems.length) process.exit(1);
    console.log('  ✓ the scenario files agree with the pinned chatperf registry');
    return;
  }

  if (command === 'check') {
    await check({
      headless: values.headless,
      id,
      lists,
      seed: values.seed ?? false,
      verify: values.verify,
    });
    return;
  }

  throw new Error(USAGE);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
