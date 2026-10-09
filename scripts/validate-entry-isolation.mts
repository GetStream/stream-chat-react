import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const FORBIDDEN_BARE = ['chart.js', 'react-chartjs-2', 'react-syntax-highlighter', 'zod'];
const FORBIDDEN_PATH = '/plugins/AIComponents/';
const IMPORT_RE = /(?:import|export)\s*(?:[^'"]*?from\s*)?['"]([^'"]+)['"]/g;

const entry = resolve(import.meta.dirname, '../dist/es/index.mjs');
const seen = new Set<string>();
const violations: string[] = [];
const queue = [entry];

while (queue.length) {
  const file = queue.pop() as string;
  if (seen.has(file)) continue;
  seen.add(file);
  if (file.includes(FORBIDDEN_PATH)) violations.push(`reaches ${file}`);
  for (const [, spec] of readFileSync(file, 'utf8').matchAll(IMPORT_RE)) {
    if (spec.startsWith('.')) queue.push(resolve(dirname(file), spec));
    else if (FORBIDDEN_BARE.some((b) => spec === b || spec.startsWith(`${b}/`)))
      violations.push(`${file} imports ${spec}`);
  }
}

if (seen.size < 50)
  throw new Error(`walked only ${seen.size} modules — graph walk is broken`);
if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`main entry isolated from ai-components (${seen.size} modules checked)`);
