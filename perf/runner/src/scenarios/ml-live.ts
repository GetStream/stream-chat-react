import type { Page } from 'playwright';

import { live } from '../chatperf.ts';
import type { ChannelType } from '../config.ts';
import { storm, stormMeasurement } from '../storm.ts';
import { mlCid } from './ml-15.ts';
import type { RunScenario } from './run.ts';

// The message-list live runs that need nothing beyond the shared storm window (WEB-PLAN.md ML-09 …
// ML-12). Each opens its channel at the newest message, then the reader touches nothing.
//
//   ML-09  reaction storm, 16/s for 30 s on the 10 newest      → M-CPU (render count: `perf renders`)
//   ML-10  edit/delete churn, 4/s for 60 s on the 25 newest    → M-FRAMES
//   ML-11  typing storm, 4 cycles/s for 60 s, messaging only   → M-CPU
//   ML-12  read-receipt churn, 2/s for 60 s on a fresh seed of
//          200 own messages, messaging only                    → M-FRAMES, + receipts-changed

/** Opens `cid` from the channel list and settles on its newest loaded message. */
export const openNewest = async (page: Page, cid: string) => {
  await page.evaluate(() => window.__perf!.ready());
  // Live runs earlier in the batch added messages, so the newest isn't always [2000]. After an
  // ML-10 run, the newest page can be all "message deleted" placeholders, with no marker to wait
  // for: then settle on any message row (the quiet and no-loading rules still apply).
  const newest = await page.evaluate((c) => {
    const markers = window.__perf!.messages.loadedMarkers(c);
    return markers.length ? window.__perf!.messages.newestMarker(c) : '';
  }, cid);
  await page.evaluate(([c, m]) => window.__perf!.openChannel(c, m), [cid, newest]);
};

const ML01 = { seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' };

/**
 * ML-10 drains its own targets: 30 % of 4 events/s is ~72 deletes a minute against a 25-message
 * window, so after one run the newest page is all "message deleted" placeholders and the next run's
 * edits land on messages behind them, off screen (nothing draws). Each iteration therefore starts by
 * posting 30 fresh messages with the channel open: chatperf's window (the newest 25 live messages)
 * is then exactly what's on screen.
 */
const TOP_UP = 30;
const topUp = async (page: Page, cid: string, type: ChannelType) => {
  await page.evaluate((c) => window.__perf!.live.startDelivery(c), cid);
  const run = live([
    'ml-08',
    '--count',
    String(TOP_UP),
    '--rate',
    '10',
    '--countdown',
    '0',
    '--no-isolate',
    '--channel-type',
    type,
  ]);
  const { code, output } = await run.done;
  if (code !== 0) throw new Error(`top-up failed:\n${output.trim()}`);
  for (
    let i = 0;
    i < 20 && (await page.evaluate(() => window.__perf!.live.delivered())) < TOP_UP;
    i++
  ) {
    await page.waitForTimeout(250);
  }
  const { count } = await page.evaluate(() => window.__perf!.live.stopDelivery());
  if (count < TOP_UP) throw new Error(`top-up: ${count} of ${TOP_UP} messages arrived`);
  // Let the list finish appending (the paginator publishes at most every 500 ms).
  await page.waitForTimeout(1500);
};

export const ml09: RunScenario = {
  context: 'fresh',
  dataset: { ...ML01, reseed: 'per-batch' },
  id: 'ml-09',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    await openNewest(page, mlCid(type));
    const result = await storm({
      args: ['ml-09', '--rate', '16'],
      cdp,
      durationS: 30,
      metric: 'M-CPU',
      page,
      type,
    });
    return stormMeasurement(result);
  },
  metric: 'M-CPU',
  types: ['messaging', 'livestream'],
  unit: '%',
};

export const ml10: RunScenario = {
  context: 'fresh',
  // Deletes use up the 25-message window; chatperf refills it, but re-seed every ~5 runs.
  dataset: { ...ML01, reseed: 'per-batch' },
  id: 'ml-10',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    await openNewest(page, mlCid(type));
    await topUp(page, mlCid(type), type);
    const result = await storm({
      args: ['ml-10', '--rate', '4'],
      cdp,
      durationS: 60,
      metric: 'M-FRAMES',
      page,
      type,
    });
    return stormMeasurement(result);
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
};

export const ml11: RunScenario = {
  context: 'fresh',
  dataset: { ...ML01, reseed: 'per-batch' },
  id: 'ml-11',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    await openNewest(page, mlCid(type));
    const result = await storm({
      args: ['ml-11', '--rate', '4'],
      cdp,
      durationS: 60,
      metric: 'M-CPU',
      page,
      type,
    });
    return stormMeasurement(result);
  },
  metric: 'M-CPU',
  // Typing events are off on livestream.
  types: ['messaging'],
  unit: '%',
};

const ML12_CID = 'messaging:perf-ml-12';

export const ml12: RunScenario = {
  context: 'fresh',
  // Already-read data shows no change, so every iteration starts from a fresh seed.
  dataset: { reseed: 'per-iteration', seed: ['seed', 'ml-12', '--yes'], verify: 'ml-12' },
  id: 'ml-12',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    await openNewest(page, ML12_CID);
    const readers = () => page.evaluate((c) => window.__perf!.readers(c), ML12_CID);
    const before = await readers();
    const result = await storm({
      args: ['ml-12', '--rate', '2'],
      cdp,
      durationS: 60,
      metric: 'M-FRAMES',
      page,
      type,
    });
    const after = await readers();
    // Validation only (PERF_GATE_CHECK_STALE=1): the runner skips the per-iteration re-seed, so the
    // buddies have already read everything and the receipts can't change.
    if (after.readers <= before.readers) {
      result.gates.push(
        `receipts-changed: ${before.readers} → ${after.readers} readers of the newest own message`,
      );
    }
    return stormMeasurement(result, {
      readersAfter: after.readers,
      readersBefore: before.readers,
    });
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
};
