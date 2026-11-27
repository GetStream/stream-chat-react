// Holds the AI components', A2UI's and OpenUI's stylesheets to the SDK's design tokens: counts
// the values each writes out instead of reading a token (colours, sizes, radii, type, shadows,
// motion, `z-index`, and any `--str-chat__ai-*` read) and fails when a count rises above
// `ai-styles-baseline.json`, or falls below it without the baseline being lowered, so the
// counts only ever go down. `--update` rewrites the baseline from the stylesheets.
//
// A declaration that has to stay literal says why with a trailing `// ai-styles: allow <reason>`.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import {
  countStyleLiterals,
  findStyleLiterals,
  regressionsAgainst,
  STYLE_LITERAL_KINDS,
  type StyleLiteralCounts,
} from './ai-styles-audit.mts';

const root = resolve(import.meta.dirname, '..');
const baselinePath = resolve(root, 'scripts/ai-styles-baseline.json');
const scanned = ['src/plugins/AIComponents', 'src/plugins/A2UI', 'src/plugins/OpenUI'];

const scssFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) return entry === '__tests__' ? [] : scssFiles(path);
    return entry.endsWith('.scss') ? [path] : [];
  });

const current: Record<string, StyleLiteralCounts> = {};
const details: Record<string, ReturnType<typeof findStyleLiterals>> = {};
for (const directory of scanned) {
  for (const path of scssFiles(resolve(root, directory))) {
    const findings = findStyleLiterals(readFileSync(path, 'utf8'));
    if (!findings.length) continue;
    const file = relative(root, path);
    current[file] = countStyleLiterals(findings);
    details[file] = findings;
  }
}

const sorted = (counts: Record<string, StyleLiteralCounts>) =>
  Object.fromEntries(
    Object.keys(counts)
      .sort()
      .map((file) => [
        file,
        Object.fromEntries(
          STYLE_LITERAL_KINDS.filter((kind) => counts[file][kind]).map((kind) => [
            kind,
            counts[file][kind],
          ]),
        ),
      ]),
  );

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, `${JSON.stringify(sorted(current), null, 2)}\n`);
  console.log(`Wrote ${relative(root, baselinePath)}`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<
  string,
  StyleLiteralCounts
>;

const regressions = regressionsAgainst(baseline, current);
for (const { baseline: allowed, count, file, kind } of regressions) {
  console.error(`${file}: ${count} ${kind} literal(s), the baseline allows ${allowed}`);
  for (const finding of details[file].filter((item) => item.kind === kind)) {
    console.error(`  ${file}:${finding.line}  ${finding.text}`);
  }
}

// A lower count must lower the baseline too, so the next change can't spend the difference.
const stale = regressionsAgainst(current, baseline);
for (const { baseline: count, count: allowed, file, kind } of stale) {
  console.error(
    `${file}: the baseline allows ${allowed} ${kind} literal(s) but there are ${count}; run \`yarn validate-ai-styles --update\``,
  );
}

if (regressions.length || stale.length) {
  if (regressions.length) {
    console.error(
      '\nRead the SDK token instead (src/styling/light.scss, variables/fonts.scss, variables/shadows.scss), or mark a value that must stay literal with `// ai-styles: allow <reason>`.',
    );
  }
  process.exit(1);
}

const total = Object.values(current).reduce(
  (sum, counts) => sum + Object.values(counts).reduce((a, b) => a + (b ?? 0), 0),
  0,
);
console.log(
  `AI stylesheets match the baseline (${total} literal(s) left in ${Object.keys(current).length} file(s))`,
);
