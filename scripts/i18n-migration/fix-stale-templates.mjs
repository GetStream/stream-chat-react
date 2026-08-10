// Updates assertions that still expect an *uninterpolated* translation template
// ("{{ typing }} is typing") to the interpolated copy the component now renders
// ("jessica is typing"). Only pairs whose expected value still contains `{{ … }}` are
// touched, so genuine mismatches are left to fail.
import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const APPLY = process.argv.includes('--apply');
const ANSI = /\u001b\[[0-9;]*m/g;
const cwd = process.cwd() + '/';

const pairs = [];
for (const file of report.testResults ?? []) {
  for (const assertion of file.assertionResults ?? []) {
    if (assertion.status !== 'failed') continue;
    const msg = (assertion.failureMessages ?? []).join('\n').replace(ANSI, '');
    // `toHaveTextContent` / `toHaveAttribute` / `toBe` all render an Expected/Received block.
    const m = msg.match(
      /Expected(?: element to have text content| the element to have attribute)?:\s*\n\s*(?:[\w-]+=)?"?([\s\S]*?)"?\s*\nReceived:\s*\n\s*(?:[\w-]+=)?"?([\s\S]*?)"?\s*(?:\n|$)/,
    );
    if (!m) continue;
    const [, expected, received] = m;
    if (!expected.includes('{{') || expected === received) continue;
    pairs.push({ file: file.name.replace(cwd, ''), expected, received });
  }
}

// De-duplicate: the same template often appears in several assertions.
const seen = new Set();
const unique = pairs.filter((p) => {
  const k = `${p.file}::${p.expected}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log(APPLY ? '(applying)' : '(dry run)', unique.length, 'stale templates');
let applied = 0;
for (const p of unique) {
  console.log(`  ${p.file.split('/').pop()}`);
  console.log(`     - ${JSON.stringify(p.expected)}`);
  console.log(`     + ${JSON.stringify(p.received)}`);
  if (!APPLY) continue;
  const text = fs.readFileSync(p.file, 'utf8');
  const needle = JSON.stringify(p.expected).slice(1, -1); // escaped body, quote-agnostic
  let out = text;
  for (const q of ["'", '"', '`']) {
    const from = q + p.expected + q;
    if (out.includes(from)) {
      out = out.split(from).join(q + p.received + q);
    }
  }
  if (out !== text) {
    fs.writeFileSync(p.file, out);
    applied++;
  } else {
    console.log(`     ! literal not found verbatim (needle: ${needle.slice(0, 40)})`);
  }
}
if (APPLY) console.log('files rewritten:', applied);
