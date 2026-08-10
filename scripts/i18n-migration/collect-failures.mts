// Reads a vitest JSON report and pairs each failing assertion's Expected/Received strings, so
// the "test asserted the uninterpolated template" failures can be reviewed and fixed in bulk.
import fs from 'node:fs';

/** The subset of vitest's JSON reporter output this script relies on. */
type VitestReport = {
  testResults?: Array<{
    name: string;
    assertionResults?: Array<{
      status: string;
      fullName: string;
      failureMessages?: string[];
    }>;
  }>;
};

type FailurePair = {
  file: string;
  title: string;
  expected: string;
  received: string;
};

const [, , reportPath, outPath] = process.argv;
if (!reportPath || !outPath) {
  console.error('usage: collect-failures.mts <vitest-report.json> <out.json>');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as VitestReport;
// The escape character itself has to be part of the pattern; matching only `[32m` leaves it in.
const ANSI = /\[[0-9;]*m/g;
const cwd = `${process.cwd()}/`;

const pairs: FailurePair[] = [];
for (const file of report.testResults ?? []) {
  for (const assertion of file.assertionResults ?? []) {
    if (assertion.status !== 'failed') continue;
    const msg = (assertion.failureMessages ?? []).join('\n').replace(ANSI, '');
    const expected = msg.match(
      /Expected(?: the element to have attribute)?:\s*\n?\s*(?:[\w-]+=)?"([\s\S]*?)"\s*\n/,
    );
    const received = msg.match(/Received:\s*\n?\s*(?:[\w-]+=)?"([\s\S]*?)"\s*\n/);
    if (expected && received && expected[1] !== received[1]) {
      pairs.push({
        expected: expected[1],
        file: file.name.replace(cwd, ''),
        received: received[1],
        title: assertion.fullName,
      });
    }
  }
}

fs.writeFileSync(outPath, `${JSON.stringify(pairs, null, 2)}\n`);
console.log('pairs:', pairs.length);
for (const pair of pairs) {
  console.log(`  ${pair.file.split('/').pop()}`);
  console.log(`     - ${JSON.stringify(pair.expected)}`);
  console.log(`     + ${JSON.stringify(pair.received)}`);
}
