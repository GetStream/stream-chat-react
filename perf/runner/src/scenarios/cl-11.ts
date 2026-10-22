import { frameStats, startFrameTrace } from '../frames.ts';
import { scrollEdge, scrollerRect, scrollUntil } from '../input.ts';
import type { RunScenario } from './run.ts';

// CL-11: channel list scroll, the frame baseline → M-FRAMES (SCENARIOS.md CL-11). G-SLOW from the top
// to the end of the 100 CL-01 channels (pagination fires on the way), then G-FAST back to the top.
// The trace covers exactly that window; the number is dropped-frame %.

const CHANNEL_ROW = '.str-chat__channel-list-item';

export const cl11: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'cl-01', '--concurrency', '4', '--yes'], verify: 'cl-01' },
  id: 'cl-11',
  lists: false,
  measure: async ({ cdp, page }) => {
    await page.evaluate(() => window.__perf!.ready());
    const rect = await scrollerRect(page, CHANNEL_ROW);
    const rows = () =>
      page.evaluate((s) => document.querySelectorAll(s).length, CHANNEL_ROW);
    const browser = page.context().browser()!;

    const stopTrace = await startFrameTrace(browser);
    // Validation only (PERF_AUTOMATION_CHECK=1): poll the page every 50 ms during the window, exactly
    // what the protocol forbids. M-FRAMES must get worse, which proves it can see automation overhead.
    let polling = process.env.PERF_AUTOMATION_CHECK === '1';
    const poller = (async () => {
      while (polling) {
        await page
          .evaluate(
            (busyMs) => {
              const end = performance.now() + busyMs;
              while (performance.now() < end) document.querySelectorAll('*').length;
            },
            Number(process.env.PERF_AUTOMATION_BUSY_MS ?? 0),
          )
          .catch(() => {});
        await new Promise((r) => setTimeout(r, 50));
      }
    })();
    const slowGestures = await scrollUntil(
      page,
      cdp,
      rect,
      'G-SLOW',
      'down',
      async () => (await rows()) >= 100 && (await scrollEdge(page)).atBottom,
    );
    const fastGestures = await scrollUntil(
      page,
      cdp,
      rect,
      'G-FAST',
      'up',
      async () => (await scrollEdge(page)).atTop,
    );
    polling = false;
    await poller;
    const trace = await stopTrace();

    const frames = frameStats(trace);
    return {
      extra: { ...frames, fastGestures, rowsLoaded: await rows(), slowGestures },
      value: frames.droppedPct,
    };
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
};
