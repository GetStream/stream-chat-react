import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chatperfDir } from './chatperf.ts';

// What chatperf recorded about the dataset it seeded (`.chatperf/manifests/<scenario>.json` in its
// checkout): counts, the kinds actually created, the channels. Read-only; chatperf owns the file.

export type Manifest = {
  scenario: string;
  channel_type: string;
  params: Record<string, number | string | boolean>;
  channels: string[];
  counts: Record<string, number>;
  extras: Record<string, unknown>;
};

export const readManifest = (scenario: string): Manifest =>
  JSON.parse(
    readFileSync(
      resolve(chatperfDir, '.chatperf', 'manifests', `${scenario}.json`),
      'utf8',
    ),
  ) as Manifest;
