import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chatperfDir } from './chatperf.ts';
import { LIVE, type LiveSpec } from './scenarios/live-specs.ts';
import { RUN_SCENARIOS } from './scenarios/index.ts';

// The contract between the runner's scenario files and chatperf's registry (WEB-PLAN.md §4.5),
// checked against a PINNED copy of `chatperf scenarios --json` (contract/chatperf-scenarios.json),
// so a change in chatperf never breaks this repo silently: re-pinning is a deliberate change
// (`perf contract --update`), and the test then reruns against the new registry.
//
// What it checks, naming the file at fault:
//   - every `chatperf live` command (scenarios/live-specs.ts) names a live scenario and, unless it
//     says why it differs, uses the registry's canonical rate, duration, count and channels;
//   - every dataset seed names a seedable scenario, and every verify an existing one;
//   - every mobile id (and its variants) records the registry's metric, and none that the registry
//     marks not applicable on web is run.

type RegistryEntry = {
  id: string;
  kind: string;
  metric: string | null;
  web: 'same' | 'adapted' | 'na';
  seedable: boolean;
  canonical_command: string;
  live: {
    rate?: number;
    duration?: number | null;
    count?: number;
    channels?: number;
  } | null;
};

const runnerDir = resolve(import.meta.dirname, '..');
const PIN = resolve(runnerDir, 'contract', 'chatperf-scenarios.json');
const scenariosDir = resolve(import.meta.dirname, 'scenarios');

export type Pinned = {
  chatperfCommit: string;
  pinnedAt: string;
  scenarios: RegistryEntry[];
};

export const readPin = (): Pinned => JSON.parse(readFileSync(PIN, 'utf8')) as Pinned;

/** Re-pins from the chatperf checkout (CHATPERF_DIR): a deliberate, reviewed change. */
export const updatePin = () => {
  const cmd = (process.env.CHATPERF_CMD ?? 'bundle exec bin/chatperf').split(' ');
  const json = execFileSync(cmd[0], [...cmd.slice(1), 'scenarios', '--json'], {
    cwd: chatperfDir,
    encoding: 'utf8',
  });
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: chatperfDir,
    encoding: 'utf8',
  }).trim();
  const dirty = execFileSync('git', ['status', '--porcelain', 'lib'], {
    cwd: chatperfDir,
    encoding: 'utf8',
  }).trim();
  const pin: Pinned = {
    chatperfCommit: dirty ? `${commit}+uncommitted` : commit,
    pinnedAt: new Date().toISOString().slice(0, 10),
    scenarios: JSON.parse(json),
  };
  writeFileSync(PIN, `${JSON.stringify(pin, null, 1)}\n`);
  return pin;
};

/** The scenario file that defines `id` (for the error message). */
const fileOf = (id: string) =>
  readdirSync(scenariosDir)
    .filter((f) => f.endsWith('.ts'))
    .find((f) => readFileSync(resolve(scenariosDir, f), 'utf8').includes(`'${id}'`)) ??
  '?';

const MOBILE_ID = /^(cl|ml|th|of|sk)-\d{2}/;

export const checkContract = (registry: RegistryEntry[]) => {
  const byId = new Map(registry.map((s) => [s.id, s]));
  const problems: string[] = [];

  for (const [name, spec] of Object.entries(LIVE) as Array<[string, LiveSpec]>) {
    const where = `src/scenarios/live-specs.ts (${name})`;
    const entry = byId.get(spec.scenario);
    if (!entry) {
      problems.push(`${where}: chatperf has no scenario ${spec.scenario}`);
      continue;
    }
    if (!entry.live) {
      problems.push(`${where}: ${spec.scenario} has no live profile in chatperf`);
      continue;
    }
    if (spec.reason) continue;
    for (const key of ['rate', 'duration', 'count', 'channels'] as const) {
      const canonical = entry.live[key];
      if (canonical == null) continue;
      if (spec[key] !== undefined && spec[key] !== canonical) {
        problems.push(
          `${where}: --${key} ${spec[key]}, but chatperf's canonical ${spec.scenario} uses ${canonical}`,
        );
      }
    }
  }

  for (const scenario of Object.values(RUN_SCENARIOS)) {
    const where = `src/scenarios/${fileOf(scenario.id)} (${scenario.id})`;
    const seeds = (
      Array.isArray(scenario.dataset.seed[0])
        ? scenario.dataset.seed
        : [scenario.dataset.seed]
    ) as string[][];
    for (const [command, target] of seeds) {
      if (command !== 'seed') continue;
      if (!byId.get(target)?.seedable)
        problems.push(`${where}: \`chatperf seed ${target}\` is not seedable`);
    }
    const verify = scenario.dataset.verify;
    if (verify && !byId.has(verify))
      problems.push(`${where}: verifies unknown scenario ${verify}`);

    const base = scenario.id.match(MOBILE_ID)?.[0];
    if (!base) continue;
    const entry = byId.get(base);
    if (!entry) {
      problems.push(`${where}: chatperf has no scenario ${base}`);
      continue;
    }
    if (entry.web === 'na') problems.push(`${where}: ${base} is not applicable on web`);
    if (scenario.id === base && entry.metric !== scenario.metric) {
      problems.push(
        `${where}: records ${scenario.metric}, chatperf's ${base} records ${entry.metric}`,
      );
    }
    for (const also of scenario.alsoRows ?? []) {
      const alsoEntry = byId.get(also.id);
      if (alsoEntry && alsoEntry.metric !== also.metric) {
        problems.push(
          `${where}: its ${also.id} row records ${also.metric}, chatperf says ${alsoEntry.metric}`,
        );
      }
    }
  }
  return problems;
};
