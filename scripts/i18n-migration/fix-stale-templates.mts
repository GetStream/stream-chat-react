// Updates assertions that still expect an *uninterpolated* translation template
// ("{{ typing }} is typing") to the interpolated copy the component now renders
// ("jessica is typing"). Only pairs whose expected value still contains `{{ … }}` are
// touched, so genuine mismatches are left to fail.
import fs from 'node:fs';

type VitestReport = {
  testResults?: Array<{
    name: string;
    assertionResults?: Array<{ status: string; failureMessages?: string[] }>;
  }>;
};

type StaleTemplate = { file: string; expected: string; received: string };

const reportPath = process.argv[2];
if (!reportPath) {
  console.error('usage: fix-stale-templates.mts <vitest-report.json> [--apply]');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as VitestReport;
const ANSI = /\[[0-9;]*m/g;
const cwd = `${process.cwd()}/`;

const pairs: StaleTemplate[] = [];
for (const file of report.testResults ?? []) {
  for (const assertion of file.assertionResults ?? []) {
    if (assertion.status !== 'failed') continue;
    const msg = (assertion.failureMessages ?? []).join('\n').replace(ANSI, '');
    // `toHaveTextContent` / `toHaveAttribute` / `toBe` all render an Expected/Received block.
    const match = msg.match(
      /Expected(?: element to have text content| the element to have attribute)?:\s*\n\s*(?:[\w-]+=)?"?([\s\S]*?)"?\s*\nReceived:\s*\n\s*(?:[\w-]+=)?"?([\s\S]*?)"?\s*(?:\n|$)/,
    );
    if (!match) continue;
    const [, expected, received] = match;
    if (!expected.includes('{{') || expected === received) continue;
    pairs.push({ expected, file: file.name.replace(cwd, ''), received });
  }
}

// De-duplicate: the same template often appears in several assertions.
const seen = new Set<string>();
const unique = pairs.filter((pair) => {
  const id = `${pair.file}::${pair.expected}`;
  if (seen.has(id)) return false;
  seen.add(id);
  return true;
});

console.log(APPLY ? '(applying)' : '(dry run)', unique.length, 'stale templates');
let applied = 0;
for (const pair of unique) {
  console.log(`  ${pair.file.split('/').pop()}`);
  console.log(`     - ${JSON.stringify(pair.expected)}`);
  console.log(`     + ${JSON.stringify(pair.received)}`);
  if (!APPLY) continue;

  const text = fs.readFileSync(pair.file, 'utf8');
  let out = text;
  for (const quote of ["'", '"', '`'] as const) {
    const from = quote + pair.expected + quote;
    if (out.includes(from)) out = out.split(from).join(quote + pair.received + quote);
  }
  if (out !== text) {
    fs.writeFileSync(pair.file, out);
    applied++;
  } else {
    // Usually means the literal is built by concatenation or spans lines — fix it by hand.
    console.log('     ! literal not found verbatim; needs a manual edit');
  }
}
if (APPLY) console.log('files rewritten:', applied);
