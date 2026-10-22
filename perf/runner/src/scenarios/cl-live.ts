import type { Page } from 'playwright';

import { gesture, REST_MS, scrollerRect } from '../input.ts';
import { LIVE } from './live-specs.ts';
import { storm, stormMeasurement, type StormResult } from '../storm.ts';
import type { RunScenario } from './run.ts';

// The channel-list live runs (WEB-PLAN.md CL-06 … CL-09). The channel list alone is on screen.
//
//   CL-06  messages across channels at 3/s + a new channel every 10 s, with the view mid-list
//          → M-FRAMES
//   CL-07  channel.updated (names, images) at 2/s, top of the list → M-CPU (render count: `perf
//          renders`)
//   CL-08  qatest1 removed from / re-added to the 10 newest channels at 1/s, on a fresh CL-06
//          seed → M-FRAMES, + rows-changed
//   CL-09  truncate / hide / delete (5:3:2) at 1/s on 20 disposable channels, freshly seeded
//          → M-FRAMES, + rows-changed
//
// rows-changed (WEB-PLAN.md §6.6): rows really left and joined the list during the window, from SDK
// state. If they didn't, the SDK ignored the events, and a smooth number means nothing.

const CHANNEL_ROW = '.str-chat__channel-list-item';
/** CL-06's reader sits about here: rows above the top of the view (60 channels seeded). */
const MIDDLE_ROW = 25;
/** After chatperf finishes, how long the last membership events get to arrive. */
const ROWS_GRACE_MS = 2000;

const CL06 = {
  seed: ['seed', 'cl-06', '--concurrency', '4', '--yes'],
  verify: 'cl-06',
};

/** Index of the first channel row whose bottom is below the scroller's top edge. */
const topRowIndex = (page: Page) =>
  page.evaluate((selector) => {
    const scroller = document.querySelector('[data-perf-scroller]')!;
    const top = scroller.getBoundingClientRect().top;
    return [...document.querySelectorAll(selector)].findIndex(
      (row) => row.getBoundingClientRect().bottom > top + 1,
    );
  }, CHANNEL_ROW);

const rowsChanged = async (
  page: Page,
  result: StormResult,
  expect: { removed: boolean; added: boolean },
) => {
  await page.waitForTimeout(ROWS_GRACE_MS);
  const rows = await page.evaluate(() => window.__perf!.channels.stopWatchingRows());
  // A row that left and is back at the end must still exist: a deleted channel never returns (CL-09).
  const listed = new Set(await page.evaluate(() => window.__perf!.channels.listCids()));
  const returned = [...new Set(rows.removedCids)].filter((cid) => listed.has(cid));
  const existing = new Set(
    await page.evaluate((c) => window.__perf!.channels.existingCids(c), returned),
  );
  const ghosts = returned.filter((cid) => !existing.has(cid));
  if (ghosts.length) {
    result.gates.push(
      `deleted-stayed-gone: ${ghosts.length} deleted channel(s) are back: ${ghosts[0]}`,
    );
  }
  if ((expect.removed && !rows.removed) || (expect.added && !rows.added)) {
    result.gates.push(
      `rows-changed: ${rows.removed} rows left and ${rows.added} joined the list during the window`,
    );
  }
  return {
    rowsAdded: rows.added,
    rowsRemoved: rows.removed,
    rowsReturned: returned.length,
  };
};

export const cl06: RunScenario = {
  context: 'fresh',
  dataset: { ...CL06, reseed: 'per-batch' },
  id: 'cl-06',
  lists: false,
  measure: async ({ cdp, page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    const rect = await scrollerRect(page, CHANNEL_ROW);
    let top = await topRowIndex(page);
    for (let g = 0; g < 30 && top < MIDDLE_ROW; g++) {
      await gesture(cdp, rect, 'G-SLOW', 'down');
      await page.waitForTimeout(REST_MS);
      top = await topRowIndex(page);
    }
    if (top < MIDDLE_ROW)
      throw new Error(`could not scroll to the middle (top row ${top})`);
    const result = await storm({
      cdp,
      live: LIVE['cl-06'],
      metric: 'M-FRAMES',
      page,
      type,
    });
    return stormMeasurement(result, {
      topRowEnd: await topRowIndex(page),
      topRowStart: top,
    });
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
};

export const cl07: RunScenario = {
  context: 'fresh',
  dataset: { ...CL06, reseed: 'per-batch' },
  id: 'cl-07',
  lists: false,
  measure: async ({ cdp, page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    const result = await storm({
      cdp,
      live: LIVE['cl-07'],
      metric: 'M-CPU',
      page,
      type,
    });
    return stormMeasurement(result);
  },
  metric: 'M-CPU',
  types: ['messaging'],
  unit: '%',
};

export const cl08: RunScenario = {
  context: 'fresh',
  // A CL-06 storm re-orders the list, so "the 10 newest" would be other channels: fresh each time.
  dataset: { ...CL06, reseed: 'per-iteration' },
  id: 'cl-08',
  lists: false,
  measure: async ({ cdp, page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    await page.evaluate(() => window.__perf!.channels.watchRows());
    const result = await storm({
      cdp,
      live: LIVE['cl-08'],
      metric: 'M-FRAMES',
      page,
      type,
    });
    return stormMeasurement(
      result,
      await rowsChanged(page, result, { added: true, removed: true }),
    );
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
};

export const cl09: RunScenario = {
  context: 'fresh',
  // Deletes are permanent: 20 fresh disposable channels every iteration.
  dataset: {
    reseed: 'per-iteration',
    seed: ['seed', 'cl-09', '--concurrency', '4', '--yes'],
    verify: 'cl-09',
  },
  id: 'cl-09',
  lists: false,
  measure: async ({ cdp, page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    await page.evaluate(() => window.__perf!.channels.watchRows());
    const result = await storm({
      cdp,
      live: LIVE['cl-09'],
      metric: 'M-FRAMES',
      page,
      type,
    });
    return stormMeasurement(
      result,
      await rowsChanged(page, result, { added: false, removed: true }),
    );
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
};
