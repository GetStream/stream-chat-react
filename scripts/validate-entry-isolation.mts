import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// The generated UI renderers' packages are optional peers: only `stream-chat-react/a2ui` and
// `stream-chat-react/openui` may reach them, and only those entries may reach the renderers.
const RENDERER_BARE = ['@a2ui/', '@openuidev/'];
const RENDERER_PATHS = ['/plugins/A2UI/', '/plugins/OpenUI/'];

const CHECKS = [
  {
    entry: 'index.mjs',
    forbiddenBare: [
      'chart.js',
      'react-chartjs-2',
      'react-syntax-highlighter',
      'zod',
      ...RENDERER_BARE,
    ],
    forbiddenPaths: ['/plugins/AIComponents/', ...RENDERER_PATHS],
    name: 'main entry isolated from ai-components and the generated UI renderers',
  },
  {
    entry: 'ai-components.mjs',
    forbiddenBare: RENDERER_BARE,
    forbiddenPaths: RENDERER_PATHS,
    name: 'ai-components isolated from the generated UI renderers',
  },
];

const IMPORT_RE = /(?:import|export)\s*(?:[^'"]*?from\s*)?['"]([^'"]+)['"]/g;
// lazy chunks: `import('./x.mjs')` must be walked too
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// `@scope/` matches the whole scope; a package name matches it and its subpaths.
const matchesBare = (spec: string, bare: string) =>
  bare.endsWith('/')
    ? spec.startsWith(bare)
    : spec === bare || spec.startsWith(`${bare}/`);

let failed = false;

for (const { entry, forbiddenBare, forbiddenPaths, name } of CHECKS) {
  const seen = new Set<string>();
  const violations: string[] = [];
  const queue = [resolve(import.meta.dirname, '../dist/es', entry)];

  while (queue.length) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    if (forbiddenPaths.some((path) => file.includes(path)))
      violations.push(`reaches ${file}`);
    const source = readFileSync(file, 'utf8');
    const specs = [...source.matchAll(IMPORT_RE), ...source.matchAll(DYNAMIC_IMPORT_RE)];
    for (const [, spec] of specs) {
      if (spec.startsWith('.')) queue.push(resolve(dirname(file), spec));
      else if (forbiddenBare.some((bare) => matchesBare(spec, bare)))
        violations.push(`${file} imports ${spec}`);
    }
  }

  if (seen.size < 50)
    throw new Error(`${entry}: walked only ${seen.size} modules — graph walk is broken`);
  if (violations.length) {
    console.error(`${entry}:\n${violations.join('\n')}`);
    failed = true;
  } else {
    console.log(`${name} (${seen.size} modules checked)`);
  }
}

if (failed) process.exit(1);
