import type { Page } from 'playwright';

import { frameStats, startFrameTrace } from '../frames.ts';
import { REST_MS, scrollEdge, scrollerRect, scrollUntil } from '../input.ts';
import { cl01 } from './cl-01.ts';
import { QUERY_CHANNELS } from './cl-10.ts';
import type { MeasureContext, RunScenario } from './run.ts';

// Channel-list variants (WEB-PLAN.md CL-02 … CL-05, CL-13), each on its own dataset. The frame
// scenarios share one shape: gestures down to the end of the list (all rows loaded), then back up,
// with the trace around exactly that. Compare each with CL-11 (CL-05 with CL-01).
//
//   CL-02  500 channels: G-FAST to the bottom, then to the top (~17 page requests on the way)
//   CL-03  60 channels with unread badges: G-SLOW to the end, open the biggest badge, back
//   CL-04  40 channels with rich last-message previews: G-SLOW down, G-SLOW up
//   CL-05  20 channels of 100 members: reload → M-LAUNCH (like CL-01)
//   CL-13  CL-05's data: G-SLOW down, G-FAST up (like CL-11)

const CHANNEL_ROW = '.str-chat__channel-list-item';

const rowsOf = (page: Page) =>
  page.evaluate((s) => document.querySelectorAll(s).length, CHANNEL_ROW);

export type Pass = { down: 'G-FAST' | 'G-SLOW'; up: 'G-FAST' | 'G-SLOW'; rows: number };

/** Down to the end of the list (all `rows` loaded), then back to the top; returns the trace stats. */
export const listPass = async (
  { cdp, page }: MeasureContext,
  pass: Pass,
  between?: () => Promise<Record<string, unknown>>,
) => {
  await page.evaluate(() => window.__perf!.ready());
  const rect = await scrollerRect(page, CHANNEL_ROW);
  const startedAt = await page.evaluate(() => performance.now());
  const stopTrace = await startFrameTrace(page.context().browser()!);
  const down = await scrollUntil(
    page,
    cdp,
    rect,
    pass.down,
    'down',
    async () => (await rowsOf(page)) >= pass.rows && (await scrollEdge(page)).atBottom,
    400,
  );
  const middle = between ? await between() : {};
  const up = await scrollUntil(
    page,
    cdp,
    rect,
    pass.up,
    'up',
    async () => (await scrollEdge(page)).atTop,
    400,
  );
  const trace = await stopTrace();
  const rowsLoaded = await rowsOf(page);
  // Channel-list pages requested during the window (the first page loaded before it).
  const pageRequests = await page.evaluate(
    ([since, pattern]) =>
      performance
        .getEntriesByType('resource')
        .filter(
          (e) =>
            e.startTime >= (since as number) &&
            new RegExp(pattern as string).test(e.name),
        ).length,
    [startedAt, QUERY_CHANNELS.source] as const,
  );
  const frames = frameStats(trace);
  const gates: string[] = [];
  if (rowsLoaded < pass.rows)
    gates.push(`rows-loaded: ${rowsLoaded} of ${pass.rows} channels`);
  return {
    extra: {
      ...frames,
      ...middle,
      downGestures: down,
      pageRequests,
      rowsLoaded,
      upGestures: up,
    },
    gates,
    value: frames.droppedPct,
  };
};

const framesScenario = (
  id: string,
  dataset: RunScenario['dataset'],
  pass: Pass,
  between?: (ctx: MeasureContext) => () => Promise<Record<string, unknown>>,
): RunScenario => ({
  context: 'fresh',
  dataset,
  id,
  lists: false,
  measure: (ctx) => listPass(ctx, pass, between?.(ctx)),
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
});

export const seedC4 = (id: string) => ({
  seed: ['seed', id, '--concurrency', '4', '--yes'],
  verify: id,
});

export const cl02 = framesScenario('cl-02', seedC4('cl-02'), {
  down: 'G-FAST',
  rows: 500,
  up: 'G-FAST',
});

/**
 * CL-03's middle: open the channel with the biggest unread badge (from SDK state), settle, go back,
 * and check its badge cleared. All inside the window, as the protocol defines it.
 */
const openBiggestBadge = (ctx: MeasureContext) => async () => {
  const unread = await ctx.page.evaluate(() => window.__perf!.channels.unreadCounts());
  const [cid, count] = Object.entries(unread).sort((a, b) => b[1] - a[1])[0];
  // Any message row: CL-03's messages are not what's measured here.
  const open = await ctx.page.evaluate((c) => window.__perf!.openChannel(c, ''), cid);
  await ctx.page.evaluate((c) => window.__perf!.back(c), cid);
  await ctx.page.waitForTimeout(REST_MS);
  const after = (await ctx.page.evaluate(() => window.__perf!.channels.unreadCounts()))[
    cid
  ];
  if (after !== 0)
    throw new Error(`CL-03: ${cid}'s badge did not clear (${count} → ${after})`);
  return {
    badgeBefore: count,
    openSettleMs: Math.round(open.durationMs),
    openedCid: cid,
  };
};

export const cl03 = framesScenario(
  'cl-03',
  seedC4('cl-03'),
  { down: 'G-SLOW', rows: 60, up: 'G-SLOW' },
  openBiggestBadge,
);

export const cl04 = framesScenario('cl-04', seedC4('cl-04'), {
  down: 'G-SLOW',
  rows: 40,
  up: 'G-SLOW',
});

export const cl13 = framesScenario('cl-13', seedC4('cl-05'), {
  down: 'G-SLOW',
  rows: 20,
  up: 'G-FAST',
});

/** CL-05: CL-01's reload on 100-member channels → M-LAUNCH. Compare with CL-01. */
export const cl05: RunScenario = { ...cl01, dataset: seedC4('cl-05'), id: 'cl-05' };
