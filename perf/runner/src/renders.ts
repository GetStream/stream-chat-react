import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium, type Page } from 'playwright';

import { chatperf, live, userToken } from './chatperf.ts';
import { type Build, startHost } from './host.ts';
import { RENDER_SCENARIOS, type RenderScenario } from './scenarios/renders.ts';

// `perf renders <id>`: M-RENDERS for one scenario (WEB-SCENARIOS.md §1.5).
//   --record   run the scenario's chatperf live storm, count renders, save the events as a fixture
//   --replay   feed the saved fixture into the client at a fixed cadence, count renders
// Never times anything: render counting runs only on the dev and profiling builds.

const runnerDir = resolve(import.meta.dirname, '..');
const fixturePath = (id: string) => resolve(runnerDir, 'fixtures', `${id}.json`);
const resultsDir = resolve(runnerDir, 'results');

const SETTLE_MS = 1500;

export type RendersOptions = {
  id: string;
  mode: 'record' | 'replay';
  build: Extract<Build, 'dev' | 'profiling'>;
  lists: Array<'standard' | 'virtualized'> | null;
  runs: number;
  rebuild: boolean;
  seed: boolean;
  /** Validation only: also count message UI slot renders directly (?ground_truth=1). */
  groundTruth: boolean;
};

const openScenario = async (page: Page, scenario: RenderScenario) => {
  await page.evaluate(() => window.__perf!.ready());
  if (scenario.openChannel) {
    // Preparation, not measured: a click is fine here.
    const row = page
      .locator('.str-chat__channel-list-item', { hasText: scenario.openChannel.title })
      .first();
    if ((await row.count()) === 0) {
      throw new Error(
        `${scenario.openChannel.cid} is not in the channel list: seed it first ` +
          `(--seed, or chatperf ${scenario.dataset.seedArgs.join(' ')})`,
      );
    }
    await row.click();
    await page.waitForSelector('.str-chat__li', { timeout: 30_000 });
  }
  await page.waitForTimeout(SETTLE_MS);
};

const summarise = (label: string, s: Record<string, unknown>) => {
  const r = s as {
    commits: number;
    commitsWithEvents: number;
    events: number;
    messageRowsPerCommit: { median: number; max: number };
    untargetedMessageRowsPerCommit: { median: number; max: number };
    channelRowsPerCommit: { median: number; max: number };
    untargetedChannelRowsPerCommit: { median: number; max: number };
    slotRowsPerCommit?: { median: number; max: number };
    untargetedSlotRowsPerCommit?: { median: number; max: number };
  };
  console.log(
    `  ${label.padEnd(28)} events ${String(r.events).padStart(4)}  commits ${String(r.commits).padStart(4)} ` +
      `(${r.commitsWithEvents} with events)  message rows/commit ${r.messageRowsPerCommit.median} ` +
      `(max ${r.messageRowsPerCommit.max}), untargeted ${r.untargetedMessageRowsPerCommit.median} ` +
      `(max ${r.untargetedMessageRowsPerCommit.max})  channel rows ${r.channelRowsPerCommit.median}, ` +
      `untargeted ${r.untargetedChannelRowsPerCommit.median}` +
      (r.slotRowsPerCommit
        ? `  | GROUND TRUTH slot rows/commit ${r.slotRowsPerCommit.median} (max ${r.slotRowsPerCommit.max}), untargeted ${r.untargetedSlotRowsPerCommit!.median} (max ${r.untargetedSlotRowsPerCommit!.max})`
        : ''),
  );
};

export const renders = async (options: RendersOptions) => {
  const scenario = RENDER_SCENARIOS[options.id];
  if (!scenario) {
    throw new Error(
      `no render scenario '${options.id}' (have: ${Object.keys(RENDER_SCENARIOS).join(', ')})`,
    );
  }
  const apiKey = process.env.STREAM_KEY;
  if (!apiKey) throw new Error('STREAM_KEY is not set (source your chatperf env first)');

  const seedFirst =
    options.seed || (options.mode === 'replay' && scenario.replayStart === 'fresh-seed');
  if (seedFirst) {
    console.log(`seeding ${scenario.dataset.scenario} …`);
    await chatperf(scenario.dataset.seedArgs);
  }

  const token = await userToken();
  const host = await startHost(options.build, { rebuild: options.rebuild });
  mkdirSync(resultsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  // From here on the host is running: anything that fails, including the browser launch, must
  // still stop it, or the next run finds its port taken.
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    browser = await chromium.launch();
    for (const list of options.lists ?? scenario.lists) {
      for (let run = 1; run <= options.runs; run++) {
        const context = await browser.newContext({
          deviceScaleFactor: 2,
          viewport: { height: 900, width: 1440 },
        });
        const page = await context.newPage();
        await page.goto(
          `${host.origin}/?api_key=${apiKey}&token=${token}&user_id=qatest1&list=${list}&type=messaging${options.groundTruth ? '&ground_truth=1' : ''}`,
        );
        await openScenario(page, scenario);
        if (!(await page.evaluate(() => window.__perf!.renders.available))) {
          throw new Error(
            `render counting is not available in the ${options.build} build`,
          );
        }

        let summary: Record<string, unknown>;
        let extra: Record<string, unknown> = {};
        const cid = scenario.openChannel?.cid ?? null;

        if (options.mode === 'record') {
          const storm = live(scenario.live);
          await storm.go;
          await page.evaluate((c) => {
            window.__perf!.renders.start();
            window.__perf!.events.startRecording(c);
          }, cid);
          const result = await storm.done;
          await page.waitForTimeout(SETTLE_MS);
          const fixture = await page.evaluate(() =>
            window.__perf!.events.stopRecording(),
          );
          summary = await page.evaluate(() => window.__perf!.renders.stop());
          if (result.code !== 0)
            throw new Error(`chatperf live failed:\n${result.output}`);
          extra = { achievedPct: result.achievedPct, discard: result.discard };
          // One fixture per scenario: the last recording wins, so a re-record replaces it.
          mkdirSync(resolve(runnerDir, 'fixtures'), { recursive: true });
          writeFileSync(fixturePath(scenario.id), JSON.stringify(fixture, null, 1));
          extra.fixtureEvents = fixture.events.length;
        } else {
          const fixture = JSON.parse(readFileSync(fixturePath(scenario.id), 'utf8'));
          // Fixed cadence: the fixture's own mean spacing, the same on every replay.
          const intervalMs = fixture.durationMs / Math.max(1, fixture.events.length);
          await page.evaluate(() => window.__perf!.renders.start());
          await page.evaluate(
            ({ f, intervalMs: i }) => window.__perf!.events.replay(f, { intervalMs: i }),
            { f: fixture, intervalMs },
          );
          await page.waitForTimeout(SETTLE_MS);
          summary = await page.evaluate(() => window.__perf!.renders.stop());
          extra = {
            intervalMs: +intervalMs.toFixed(2),
            replayedEvents: fixture.events.length,
          };
        }

        const label = `${scenario.id} ${list} ${options.mode} #${run}`;
        summarise(label, summary);
        writeFileSync(
          resolve(
            resultsDir,
            `renders-${scenario.id}-${list}-${options.build}-${options.mode}-${run}-${stamp}.json`,
          ),
          JSON.stringify(
            {
              build: options.build,
              list,
              mode: options.mode,
              run,
              scenario: scenario.id,
              ...extra,
              summary,
            },
            null,
            1,
          ),
        );
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    host.stop();
  }
};
