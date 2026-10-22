import { metrics } from '../collect.ts';
import { frameStats, startFrameTrace } from '../frames.ts';
import { gesture, REST_MS, scrollEdge, scrollerRect } from '../input.ts';
import { mlCid } from './ml-15.ts';
import type { RunScenario } from './run.ts';

// ML-01: plain history scroll, the message-list frame baseline → M-FRAMES (SCENARIOS.md ML-01).
// Open perf-ml-01 (prep, settled on [2000]), then G-FAST up until the SDK says the oldest page is
// loaded and the list is at its top. The trace covers exactly that window.
//
// Gates (WEB-PLAN.md §6.6) — an iteration that fails one is discarded, never averaged in:
//   markers-contiguous  the loaded messages are exactly [0001]…[2000]: no page skipped or doubled.
//                       On livestream too: the cap (230) trims only when a live message arrives
//                       (pruneTailToLimit runs from ingestItem), so paging history is never capped
//                       (step 8, WEB-PLAN.md §13 F27)
//   no-anchor-jump      prepending an older page kept the reader's place (±5 rows: what the fling
//                       itself moves between the two readings; a real jump is a page, 25+ rows)

const SEEDED = 2000;
const MAX_GESTURES = 400;
const ANCHOR_TOLERANCE = 5;

export const ml01: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' },
  id: 'ml-01',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    const cid = mlCid(type);
    await page.evaluate(() => window.__perf!.ready());
    await page.evaluate((c) => window.__perf!.openChannel(c, '[2000]'), cid);
    const rect = await scrollerRect(page, '.str-chat__li');
    await page.evaluate((c) => window.__perf!.messages.watchAnchors(c), cid);
    const browser = page.context().browser()!;

    const stopTrace = await startFrameTrace(browser);
    // G-FAST up until the oldest page is loaded and the list is at its top. If the list sits at
    // its top with older pages left and nothing loads for 3 gestures, pagination has stalled: that
    // is recorded as a gate failure, and the run recovers the way a user would (a short scroll
    // down, then up again) so the iteration still completes.
    let gestures = 0;
    let stalls = 0;
    let idleAtTop = 0;
    let loaded = 0;
    for (; gestures < MAX_GESTURES; gestures++) {
      await gesture(cdp, rect, 'G-FAST', 'up');
      await page.waitForTimeout(REST_MS);
      const state = await page.evaluate(
        (c) => ({
          count: window.__perf!.messages.loadedMarkers(c).length,
          oldest: window.__perf!.messages.oldestLoaded(c),
        }),
        cid,
      );
      const { atTop } = await scrollEdge(page);
      if (state.oldest && atTop) break;
      idleAtTop = atTop && state.count === loaded ? idleAtTop + 1 : 0;
      loaded = state.count;
      if (idleAtTop >= 3) {
        stalls += 1;
        idleAtTop = 0;
        await gesture(cdp, rect, 'G-SLOW', 'down');
        await page.waitForTimeout(REST_MS);
      }
    }
    gestures += 1;
    const trace = await stopTrace();

    const anchors = await page.evaluate(() => window.__perf!.messages.stopAnchors());
    const markers = await page.evaluate(
      (c) => window.__perf!.messages.loadedMarkers(c),
      cid,
    );
    // The state at [0001], after a forced GC: step 4's open check of step 0's dev-build 1 GB heap.
    await cdp.send('HeapProfiler.collectGarbage');
    const after = await metrics(cdp);
    const domNodes = after.Nodes;
    const heapMB = Math.round(after.JSHeapUsedSize / 1e5) / 10;

    const gates: string[] = [];
    if (stalls) {
      gates.push(
        `pagination-stalled: ${stalls}× at the top with older pages left and none loading ` +
          '(the prepended page did not keep the scroll position)',
      );
    }
    if (gestures > MAX_GESTURES) {
      gates.push(`oldest message not reached in ${MAX_GESTURES} gestures`);
    }
    const contiguous = markers.length === SEEDED && markers.every((m, i) => m === i + 1);
    if (!contiguous) {
      gates.push(
        `markers-contiguous: ${markers.length} loaded, first ${markers[0]}, last ${markers.at(-1)}`,
      );
    }
    const jumps = anchors.filter(
      (a) =>
        a.before !== null &&
        a.after !== null &&
        Math.abs(a.after - a.before) > ANCHOR_TOLERANCE,
    );
    const unverified = anchors.filter(
      (a) => a.before === null || a.after === null,
    ).length;
    if (jumps.length) {
      gates.push(
        `no-anchor-jump: ${jumps.length} of ${anchors.length} prepends moved the view ` +
          `(e.g. ${jumps[0].before} → ${jumps[0].after})`,
      );
    }

    const frames = frameStats(trace);
    return {
      extra: {
        ...frames,
        anchorsChecked: anchors.length,
        anchorsUnverified: unverified,
        domNodes,
        gestures,
        stalls,
        heapMB,
        listeners: after.JSEventListeners,
        loaded: markers.length,
      },
      gates,
      value: frames.droppedPct,
    };
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
};
