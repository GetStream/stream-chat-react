// M-FRAMES from a Chrome trace taken exactly around the measured window (WEB-SCENARIOS.md §1.5).
//
// Source, pinned on Chromium 148 in the step 6 spike: the renderer's `PipelineReporter` async events
// (category disabled-by-default-devtools.timeline.frame), whose args.frame_reporter.state is one of
//   STATE_PRESENTED_ALL · STATE_PRESENTED_PARTIAL · STATE_DROPPED · STATE_NO_UPDATE_DESIRED
// — the same data DevTools' Frames track draws. Idle frames (no update desired) don't count.

// Only the frame category: PipelineReporter is tagged `cc,benchmark,…timeline.frame`, and an event
// is recorded when any of its categories is on. Tracing more (cc, viz, benchmark, devtools.timeline)
// made a 2-minute ML-01 scroll exceed Node's 512 MB string limit (step 8, 2026-10-21).
export const TRACE_CATEGORIES = ['disabled-by-default-devtools.timeline.frame'];

import type { Browser, CDPSession } from 'playwright';

type TraceEvent = {
  name: string;
  ph: string;
  pid: number;
  ts: number;
  args?: { name?: string; frame_reporter?: { state?: string } };
};

export type FrameStats = {
  /** The reported number: dropped ÷ (presented + partial + dropped), as a percentage. */
  droppedPct: number;
  /**
   * Partially presented ÷ the same total. Reported beside dropped %, because compositor scrolling
   * keeps scrolling while the main thread is blocked: main-thread jank shows up mostly here (the
   * scroll moved, the content update was late). Step 6 check: a 60 %-busy main thread moved dropped
   * from ~3.2 % to 4.5 %, but partial from ~1.7 % to 3.1 %.
   */
  partialPct: number;
  presented: number;
  partial: number;
  dropped: number;
  /** p95 and worst interval between consecutive frames that drew something, in ms. */
  p95IntervalMs: number;
  worstIntervalMs: number;
};

export const frameStats = (events: TraceEvent[]): FrameStats => {
  const renderers = new Set(
    events
      .filter((e) => e.name === 'process_name' && e.args?.name === 'Renderer')
      .map((e) => e.pid),
  );
  const frames = events
    .filter(
      (e) =>
        e.name === 'PipelineReporter' &&
        e.ph === 'b' &&
        renderers.has(e.pid) &&
        e.args?.frame_reporter?.state,
    )
    .sort((a, b) => a.ts - b.ts);

  const count = (state: string) =>
    frames.filter((f) => f.args!.frame_reporter!.state === state).length;
  const presented = count('STATE_PRESENTED_ALL');
  const partial = count('STATE_PRESENTED_PARTIAL');
  const dropped = count('STATE_DROPPED');
  const considered = presented + partial + dropped;

  // Intervals only between consecutive frames that both drew something: a gap that spans an idle
  // frame (the rest pause between gestures) is a pause, not a slow frame.
  const intervals: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const idle = (f: TraceEvent) =>
      f.args!.frame_reporter!.state === 'STATE_NO_UPDATE_DESIRED';
    if (!idle(frames[i]) && !idle(frames[i - 1])) {
      intervals.push((frames[i].ts - frames[i - 1].ts) / 1000);
    }
  }
  intervals.sort((a, b) => a - b);

  return {
    dropped,
    droppedPct: considered ? (dropped / considered) * 100 : 0,
    p95IntervalMs: intervals.length ? intervals[Math.floor(intervals.length * 0.95)] : 0,
    partial,
    partialPct: considered ? (partial / considered) * 100 : 0,
    presented,
    worstIntervalMs: intervals.at(-1) ?? 0,
  };
};

/**
 * Streams a Chrome trace over CDP instead of Playwright's startTracing/stopTracing, which returns the
 * whole trace as one string: a 2-minute ML-01 scroll exceeded Node's 512 MB string limit (step 8).
 * The stream is read in chunks and scanned event by event; only the events frameStats needs
 * (PipelineReporter, process names) are kept, so memory stays bounded however long the window is.
 */
export const startFrameTrace = async (browser: Browser) => {
  const cdp: CDPSession = await browser.newBrowserCDPSession();
  const complete = new Promise<{ stream: string }>((resolve) => {
    cdp.once('Tracing.tracingComplete', (e) => resolve(e as { stream: string }));
  });
  await cdp.send('Tracing.start', {
    traceConfig: {
      includedCategories: TRACE_CATEGORIES,
      // Never stop recording when the buffer fills: a full buffer would silently drop frames.
      recordMode: 'recordAsMuchAsPossible',
    },
    transferMode: 'ReturnAsStream',
  });

  return async (): Promise<TraceEvent[]> => {
    await cdp.send('Tracing.end');
    const { stream } = await complete;
    const kept: TraceEvent[] = [];
    const scan = eventScanner((text) => {
      if (text.includes('"PipelineReporter"') || text.includes('"process_name"')) {
        kept.push(JSON.parse(text));
      }
    });
    for (;;) {
      const chunk = (await cdp.send('IO.read', { handle: stream, size: 1 << 20 })) as {
        data: string;
        eof: boolean;
        base64Encoded?: boolean;
      };
      scan(
        chunk.base64Encoded ? Buffer.from(chunk.data, 'base64').toString() : chunk.data,
      );
      if (chunk.eof) break;
    }
    await cdp.send('IO.close', { handle: stream });
    await cdp.detach();
    return kept;
  };
};

/**
 * Splits a streamed {"traceEvents":[{…},{…}]} document into its event objects, across chunk
 * boundaries, without ever holding the whole document. Events are the objects that open at depth 3
 * (document object → traceEvents array → event).
 */
const eventScanner = (onEvent: (text: string) => void) => {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let current = '';
  return (chunk: string) => {
    let start = depth >= 3 ? 0 : -1;
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') inString = true;
      else if (c === '{' || c === '[') {
        depth += 1;
        if (depth === 3 && c === '{') start = i;
      } else if (c === '}' || c === ']') {
        if (depth === 3 && c === '}' && start >= 0) {
          onEvent(current + chunk.slice(start, i + 1));
          current = '';
          start = -1;
        }
        depth -= 1;
      }
    }
    if (start >= 0) current += chunk.slice(start);
  };
};
