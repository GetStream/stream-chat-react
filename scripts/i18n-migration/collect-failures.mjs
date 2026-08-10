// Reads a vitest JSON report and pairs each failing assertion's Expected/Received strings, so
// the "test asserted the uninterpolated template" failures can be reviewed and fixed in bulk.
import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ANSI = /\[[0-9;]*m/g;
const cwd = process.cwd() + '/';

const pairs = [];
for (const file of report.testResults ?? []) {
  for (const assertion of file.assertionResults ?? []) {
    if (assertion.status !== 'failed') continue;
    const msg = (assertion.failureMessages ?? []).join('\n').replace(ANSI, '');
    const exp = msg.match(
      /Expected(?: the element to have attribute)?:\s*\n?\s*(?:[\w-]+=)?"([\s\S]*?)"\s*\n/,
    );
    const rec = msg.match(/Received:\s*\n?\s*(?:[\w-]+=)?"([\s\S]*?)"\s*\n/);
    if (exp && rec && exp[1] !== rec[1]) {
      pairs.push({
        file: file.name.replace(cwd, ''),
        title: assertion.fullName,
        expected: exp[1],
        received: rec[1],
      });
    }
  }
}

fs.writeFileSync(process.argv[3], JSON.stringify(pairs, null, 2) + '\n');
console.log('pairs:', pairs.length);
for (const p of pairs) {
  console.log(`  ${p.file.split('/').pop()}`);
  console.log(`     - ${JSON.stringify(p.expected)}`);
  console.log(`     + ${JSON.stringify(p.received)}`);
}
