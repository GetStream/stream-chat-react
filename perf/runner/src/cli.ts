import { parseArgs } from 'node:util';

import { renders } from './renders.ts';

// yarn workspace @stream-io/react-perf-runner perf renders <ml-09|ml-11|cl-07> --record|--replay
//   [--build profiling|dev] [--list standard|virtualized] [--runs N] [--rebuild] [--seed]

const USAGE =
  'usage: perf renders <scenario> --record|--replay [--build profiling|dev] ' +
  '[--list standard|virtualized] [--runs N] [--rebuild] [--seed] [--ground-truth]';

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      build: { default: 'profiling', type: 'string' },
      'ground-truth': { default: false, type: 'boolean' },
      list: { type: 'string' },
      rebuild: { default: false, type: 'boolean' },
      record: { default: false, type: 'boolean' },
      replay: { default: false, type: 'boolean' },
      runs: { default: '1', type: 'string' },
      seed: { default: false, type: 'boolean' },
    },
  });
  const [command, id] = positionals;
  if (command !== 'renders' || !id || values.record === values.replay)
    throw new Error(USAGE);
  if (values.build !== 'profiling' && values.build !== 'dev') {
    throw new Error(`--build must be profiling or dev (render counts never run on prod)`);
  }
  if (values.list && values.list !== 'standard' && values.list !== 'virtualized') {
    throw new Error('--list must be standard or virtualized');
  }

  await renders({
    build: values.build,
    groundTruth: values['ground-truth'],
    id,
    lists: values.list ? [values.list as 'standard' | 'virtualized'] : null,
    mode: values.record ? 'record' : 'replay',
    rebuild: values.rebuild,
    runs: Number(values.runs),
    seed: values.seed,
  });
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
