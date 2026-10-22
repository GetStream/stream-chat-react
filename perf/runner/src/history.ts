import { metrics } from './collect.ts';
import { frameStats, startFrameTrace } from './frames.ts';
import { gesture, REST_MS, scrollEdge, scrollerRect } from './input.ts';
import type { MeasureContext, Measurement } from './scenarios/run.ts';

// The history-scroll window ML-01 … ML-07 share (WEB-PLAN.md §6.6): open the channel settled on its
// newest message, then G-FAST up until the SDK says the oldest page is loaded and the list is at
// its top. The trace covers exactly that window; the number is dropped-frame %.
//
// Gates — an iteration that fails one is discarded, never averaged in:
//   markers-contiguous  'contiguous': the loaded messages are exactly [0001]…[N], no page skipped or
//                       doubled. 'ascending' (datasets with marker-less rows, e.g. ML-07's deleted
//                       message): N rows loaded, markers strictly ascending from [0001].
//                       Paging history is never capped, livestream included (WEB-PLAN.md §13 F27).
//   no-anchor-jump      prepending an older page kept the reader's place (±5 rows: what the fling
//                       itself moves between the two readings; a real jump is a page, 25+ rows)
//   pagination-stalled  the list sat at its top with older pages left and nothing loading for 3
//                       gestures (the standard list's prepend-at-scrollTop-0 bug, §13 F24). The
//                       run recovers like a user (a short scroll down, then up) and is discarded.

const MAX_GESTURES = 400;
const ANCHOR_TOLERANCE = 5;

export type HistoryOptions = {
  cid: string;
  /**
   * Instead of opening `cid` (a thread, TH-01): open the view, settled, and name the paginator the
   * gates read ('thread') and the rows to scroll.
   */
  view?: { open: () => Promise<unknown>; target: string; rowSelector: string };
  /** The newest message's marker, e.g. "[2000]": what the open settles on. Default: from SDK state. */
  newest?: string;
  /** Messages the dataset holds in the main list. */
  expected: number;
  markers: 'contiguous' | 'ascending';
};

export type HistoryResult = Measurement & {
  rect: Awaited<ReturnType<typeof scrollerRect>>;
};

export const historyScroll = async (
  { cdp, page }: MeasureContext,
  options: HistoryOptions,
): Promise<HistoryResult> => {
  const { cid } = options;
  const target = options.view?.target ?? cid;
  await page.evaluate(() => window.__perf!.ready());
  if (options.view) {
    await options.view.open();
  } else {
    const newest =
      options.newest ??
      (await page.evaluate((c) => window.__perf!.messages.newestMarker(c), cid));
    await page.evaluate(([c, m]) => window.__perf!.openChannel(c, m), [cid, newest]);
  }
  const rect = await scrollerRect(page, options.view?.rowSelector ?? '.str-chat__li');
  await page.evaluate((c) => window.__perf!.messages.watchAnchors(c), target);

  const stopTrace = await startFrameTrace(page.context().browser()!);
  let gestures = 0;
  let stalls = 0;
  let idleAtTop = 0;
  let loaded = 0;
  let reachedWithoutFlag = false;
  for (; gestures < MAX_GESTURES; gestures++) {
    await gesture(cdp, rect, 'G-FAST', 'up');
    await page.waitForTimeout(REST_MS);
    const state = await page.evaluate((c) => {
      const markers = window.__perf!.messages.loadedMarkers(c);
      return {
        count: markers.length,
        first: markers[0],
        oldest: window.__perf!.messages.oldestLoaded(c),
      };
    }, target);
    const { atTop } = await scrollEdge(page);
    if (state.oldest && atTop) break;
    // Everything the dataset holds is loaded, from [0001], and the list is at its top: the oldest is
    // reached even when the SDK's flag says otherwise (a thread's paginator keeps hasMoreTail true
    // with every reply loaded, WEB-PLAN.md §13 F28). The row records which signal ended the scroll.
    if (atTop && state.first === 1 && state.count >= options.expected) {
      reachedWithoutFlag = true;
      break;
    }
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
    target,
  );
  const rows = await page.evaluate((c) => window.__perf!.messages.loadedCount(c), target);
  // The state at the oldest message, after a forced GC.
  await cdp.send('HeapProfiler.collectGarbage');
  const after = await metrics(cdp);

  const gates: string[] = [];
  if (stalls) {
    gates.push(
      `pagination-stalled: ${stalls}× at the top with older pages left and none loading ` +
        '(the prepended page did not keep the scroll position)',
    );
  }
  if (gestures > MAX_GESTURES)
    gates.push(`oldest message not reached in ${MAX_GESTURES} gestures`);
  const ok =
    options.markers === 'contiguous'
      ? markers.length === options.expected && markers.every((m, i) => m === i + 1)
      : rows === options.expected &&
        markers[0] === 1 &&
        markers.every((m, i) => i === 0 || m > markers[i - 1]);
  if (!ok) {
    gates.push(
      `markers-contiguous: ${rows} rows / ${markers.length} markers loaded (expected ` +
        `${options.expected}), first ${markers[0]}, last ${markers.at(-1)}`,
    );
  }
  const jumps = anchors.filter(
    (a) =>
      a.before !== null &&
      a.after !== null &&
      Math.abs(a.after - a.before) > ANCHOR_TOLERANCE,
  );
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
      anchorsUnverified: anchors.filter((a) => a.before === null || a.after === null)
        .length,
      domNodes: after.Nodes,
      gestures,
      heapMB: Math.round(after.JSHeapUsedSize / 1e5) / 10,
      listeners: after.JSEventListeners,
      loaded: rows,
      // false: the SDK never reported the oldest page as loaded (see above).
      oldestFlag: !reachedWithoutFlag,
      stalls,
    },
    gates,
    rect,
    value: frames.droppedPct,
  };
};
