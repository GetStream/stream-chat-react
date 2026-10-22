import type { Page } from 'playwright';

import { historyScroll } from '../history.ts';
import { LIVE } from './live-specs.ts';
import { storm, stormMeasurement } from '../storm.ts';
import type { RunScenario } from './run.ts';

// Threads (WEB-PLAN.md TH-01 … TH-03), on TH-01's data: 200 channel messages, the newest of which
// ("[deep-thread] open me — 500 replies [0200]") has 500 replies "Deep reply [0001]…[0500]".
//
//   TH-01  open the deep thread beside the channel, G-FAST to its oldest reply → M-FRAMES
//          (history.ts on the thread's paginator: markers-contiguous over the 500 replies)
//   TH-02  3 live replies/s for 60 s into the open thread → M-FRAMES; `th-02-mainlist`: the thread
//          closed, the channel showing the parent's "N replies" → M-FRAMES. Gate thread-updated:
//          the replies arrived, and the parent's reply count rose.
//   TH-03  open the deep thread → M-SETTLE (compare with ML-15)
//
// Batch order: TH-01 and TH-03 before TH-02, whose live replies become the thread's newest.

const CID = 'messaging:perf-th-01';
const PARENT = '[deep-thread]';
const REPLIES = 500;
const TH01 = { seed: ['seed', 'th-01', '--yes'], verify: 'th-01' };

const openChannelAndThread = async (page: Page, expectReply = '[0500]') => {
  await page.evaluate(() => window.__perf!.ready());
  await page.evaluate((c) => window.__perf!.openChannel(c, '[0200]'), CID);
  return page.evaluate(([c, p, e]) => window.__perf!.openThread(c, p, e), [
    CID,
    PARENT,
    expectReply,
  ] as const);
};

export const th01: RunScenario = {
  context: 'fresh',
  dataset: TH01,
  id: 'th-01',
  lists: true,
  measure: async (ctx) => {
    const { rect: _rect, ...measurement } = await historyScroll(ctx, {
      cid: CID,
      expected: REPLIES,
      markers: 'contiguous',
      view: {
        open: () => openChannelAndThread(ctx.page),
        rowSelector: '.str-chat__thread .str-chat__li',
        target: 'thread',
      },
    });
    return measurement;
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
};

export const th03: RunScenario = {
  context: 'fresh',
  dataset: TH01,
  id: 'th-03',
  lists: true,
  measure: async ({ page }) => {
    const result = await openChannelAndThread(page);
    return { value: result.durationMs };
  },
  metric: 'M-SETTLE',
  types: ['messaging'],
  unit: 'ms',
};

const liveReplies = (variant: 'thread' | 'mainlist'): RunScenario => ({
  context: 'fresh',
  dataset: { ...TH01, reseed: 'per-batch' },
  id: variant === 'thread' ? 'th-02' : 'th-02-mainlist',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    if (variant === 'thread') {
      // Earlier runs of the batch added replies, so settle on the newest one, whatever it is.
      await page.evaluate((c) => window.__perf!.openChannel(c, '[0200]'), CID);
      await page.evaluate(([c, p]) => window.__perf!.openThread(c, p, ''), [
        CID,
        PARENT,
      ] as const);
    } else {
      await page.evaluate((c) => window.__perf!.openChannel(c, '[0200]'), CID);
    }
    const countBefore = await page.evaluate(
      ([c, p]) => window.__perf!.messages.replyCount(c, p),
      [CID, PARENT] as const,
    );
    const threadBefore =
      variant === 'thread'
        ? await page.evaluate(() => window.__perf!.messages.loadedCount('thread'))
        : 0;
    const result = await storm({
      cdp,
      live: LIVE['th-02'],
      metric: 'M-FRAMES',
      page,
      type,
    });
    await page.waitForTimeout(2000);
    const countAfter = await page.evaluate(
      ([c, p]) => window.__perf!.messages.replyCount(c, p),
      [CID, PARENT] as const,
    );
    const threadAfter =
      variant === 'thread'
        ? await page.evaluate(() => window.__perf!.messages.loadedCount('thread'))
        : 0;
    const sent = result.finished.sent;
    if ((countAfter ?? 0) <= (countBefore ?? 0)) {
      result.gates.push(`thread-updated: the parent's reply count stayed ${countBefore}`);
    }
    if (variant === 'thread' && threadAfter - threadBefore < sent) {
      result.gates.push(
        `thread-updated: ${threadAfter - threadBefore} of ${sent} replies reached the open thread`,
      );
    }
    return stormMeasurement(result, {
      replyCountAfter: countAfter,
      replyCountBefore: countBefore,
      threadLoadedAfter: threadAfter,
      threadLoadedBefore: threadBefore,
    });
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
});

export const th02 = liveReplies('thread');
export const th02Mainlist = liveReplies('mainlist');
