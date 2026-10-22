import { LIVE, liveArgs } from './live-specs.ts';
import { live } from '../chatperf.ts';
import { DEVICE_SCALE_FACTOR, VIEWPORT } from '../config.ts';
import {
  frameStats,
  startFrameTrace,
  startTrace,
  startTraceOn,
  type TraceEvent,
} from '../frames.ts';
import { gesture, REST_MS, scrollEdge, scrollerRect } from '../input.ts';
import { evaluate, launchRaw } from '../rawcdp.ts';
import { mlCid } from './ml-15.ts';
import type { RunScenario } from './run.ts';

// Browser-specific scenarios (WEB-PLAN.md WB-01 … WB-03).
//
//   WB-01  hidden tab catching up → M-SETTLE. The flood runs for 7 minutes (past Chromium's 5-minute
//          intensive throttling) with the tab covered by another tab, in a Chrome driven over raw
//          CDP (Playwright keeps attached pages visible). Then the tab comes back: perf:visible →
//          settled with the newest live marker on screen. Beside it: the catch-up's dropped frames,
//          its script / style / layout / paint split, and DOM changes made while hidden (did React
//          keep committing?). `wb-01-visible`: the same run with the tab never hidden, as the
//          control. Gate was-hidden: the page really was hidden for the whole flood.
//   WB-02  resize 1440 → 900 → 1440 px in 40-px steps, one per frame, over ML-02's history →
//          M-FRAMES. The viewport is emulated (Playwright's), so the steps go through
//          Emulation.setDeviceMetricsOverride: a browser-side resize that reflows like a window
//          drag (Browser.setWindowBounds would not change an emulated viewport). Gate bottom-kept.
//   WB-03  SDK startup cost on an empty app, prod + chrome-4x → M-LAUNCH, with JS bytes, parse /
//          compile / evaluate time and the chunks loaded before perf:channel-list-ready.

const marker = (n: number) => `[${String(n).padStart(4, '0')}]`;

// --- WB-01 ---------------------------------------------------------------------------------------

const RENDER_SPLIT: Record<string, string> = {
  EvaluateScript: 'script',
  EventDispatch: 'script',
  FireAnimationFrame: 'script',
  FunctionCall: 'script',
  Layout: 'layout',
  Paint: 'paint',
  PrePaint: 'paint',
  RunMicrotasks: 'script',
  TimerFire: 'script',
  UpdateLayoutTree: 'style',
};

/** Main-thread time per kind of work between two trace timestamps (µs), from complete events. */
const splitBetween = (events: TraceEvent[], from: number, to: number) => {
  const main = new Set(
    events
      .filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
      .map((e) => `${e.pid}:${(e as TraceEvent & { tid: number }).tid}`),
  );
  const split: Record<string, number> = { layout: 0, paint: 0, script: 0, style: 0 };
  for (const e of events as Array<TraceEvent & { tid: number; dur?: number }>) {
    const kind = RENDER_SPLIT[e.name];
    if (
      !kind ||
      e.ph !== 'X' ||
      !main.has(`${e.pid}:${e.tid}`) ||
      e.ts < from ||
      e.ts > to
    )
      continue;
    split[kind] += (e.dur ?? 0) / 1000;
  }
  return Object.fromEntries(Object.entries(split).map(([k, v]) => [k, Math.round(v)]));
};

const markTs = (events: TraceEvent[], name: string) =>
  events.filter((e) => e.name === name).at(-1)?.ts ?? null;

const hiddenTab = (hide: boolean, durationS: number): RunScenario => ({
  context: 'fresh',
  dataset: { reseed: 'per-batch', seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' },
  id: hide ? 'wb-01' : 'wb-01-visible',
  lists: true,
  measure: async ({ list, type, url }) => {
    const cid = mlCid(type);
    const chrome = await launchRaw();
    try {
      const { page } = chrome;
      await page.send('Page.enable');
      await page.send('Page.navigate', {
        url: url.replace(/&list=\w+/, `&list=${list}`),
      });
      for (let i = 0; i < 100; i++) {
        if (await evaluate<boolean>(page, '!!window.__perf').catch(() => false)) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      await evaluate(page, 'window.__perf.ready()');
      await evaluate(
        page,
        `window.__perf.openChannel(${JSON.stringify(cid)}, window.__perf.messages.newestMarker(${JSON.stringify(cid)}))`,
      );
      await evaluate(page, 'window.__perf.hidden.countChanges()');

      const run = live([
        ...liveArgs({ ...LIVE['wb-01'], duration: durationS }),
        '--countdown',
        '3',
        '--no-isolate',
        '--channel-type',
        type,
      ]);
      if ((await run.go) === null) throw new Error((await run.done).output);
      const cover = hide ? await chrome.cover() : null;
      await new Promise((r) => setTimeout(r, 1000));
      const hiddenAtGo = await evaluate<string>(page, 'document.visibilityState');
      const result = await run.done;
      if (result.code !== 0 || !result.finished) throw new Error(result.output);
      const newest = marker(9000 + result.finished.sent);
      const stillHidden = await evaluate<string>(page, 'document.visibilityState');

      // Arm the settle while hidden, trace the catch-up, then bring the tab back.
      const trace = await startTraceOn(
        chrome.browser,
        [
          'devtools.timeline',
          'disabled-by-default-devtools.timeline.frame',
          'blink.user_timing',
          '__metadata',
        ],
        (text) =>
          /"name":"(PipelineReporter|process_name|thread_name|perf:visible|perf:settled|FunctionCall|EvaluateScript|EventDispatch|FireAnimationFrame|RunMicrotasks|TimerFire|Layout|Paint|PrePaint|UpdateLayoutTree)"/.test(
            text,
          ),
      );
      const settling = evaluate<{ durationMs: number }>(
        page,
        `window.__perf.hidden.settleAfterVisible(${JSON.stringify(newest)})`,
      );
      if (cover) {
        await chrome.activate(chrome.pageId);
        await chrome.closeTab(cover);
      }
      const settled = await settling;
      await new Promise((r) => setTimeout(r, 300));
      const events = await trace();
      const changesWhileHidden = await evaluate<number>(
        page,
        'window.__perf.hidden.changeCount()',
      );

      const gates: string[] = [];
      if (hide && (hiddenAtGo !== 'hidden' || stillHidden !== 'hidden')) {
        gates.push(
          `was-hidden: the page was ${hiddenAtGo} at GO and ${stillHidden} at the end`,
        );
      }
      if (result.finished.discard) gates.push('live-achieved: chatperf missed its rate');
      const from = markTs(events, 'perf:visible') ?? events[0]?.ts ?? 0;
      const to = markTs(events, 'perf:settled') ?? Number.MAX_SAFE_INTEGER;
      const catchUpFrames = frameStats(events.filter((e) => e.ts >= from && e.ts <= to));
      return {
        extra: {
          catchUpDroppedPct: catchUpFrames.droppedPct,
          catchUpFrames,
          changesWhileHidden,
          sent: result.finished.sent,
          split: splitBetween(events, from, to),
        },
        gates,
        value: settled.durationMs,
      };
    } finally {
      await chrome.close();
    }
  },
  metric: 'M-SETTLE',
  selfNavigate: true,
  types: ['messaging', 'livestream'],
  unit: 'ms',
});

export const wb01 = hiddenTab(true, 420);
export const wb01Visible = hiddenTab(false, 420);

// --- WB-02 ---------------------------------------------------------------------------------------

const STEP_PX = 40;
const NARROW = 900;

export const wb02: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-02', '--yes'], verify: 'ml-02' },
  id: 'wb-02',
  lists: true,
  measure: async ({ cdp, page, type }) => {
    const cid = `${type}:perf-ml-02`;
    await page.evaluate(() => window.__perf!.ready());
    await page.evaluate((c) => window.__perf!.openChannel(c, '[0800]'), cid);
    const rect = await scrollerRect(page, '.str-chat__li');
    // Load all 800 messages (so every row re-measures), then return to the bottom.
    for (let g = 0, idleAtTop = 0, loaded = 0; g < 300; g++) {
      await gesture(cdp, rect, 'G-FAST', 'up');
      await page.waitForTimeout(REST_MS);
      const oldest = await page.evaluate(
        (c) => window.__perf!.messages.oldestLoaded(c),
        cid,
      );
      const count = await page.evaluate(
        (c) => window.__perf!.messages.loadedCount(c),
        cid,
      );
      const { atTop } = await scrollEdge(page);
      if (oldest && atTop) break;
      idleAtTop = atTop && count === loaded ? idleAtTop + 1 : 0;
      loaded = count;
      if (idleAtTop >= 3) {
        idleAtTop = 0;
        await gesture(cdp, rect, 'G-SLOW', 'down');
        await page.waitForTimeout(REST_MS);
      }
    }
    for (let g = 0; g < 300 && !(await scrollEdge(page)).atBottom; g++) {
      await gesture(cdp, rect, 'G-FAST', 'down');
      await page.waitForTimeout(REST_MS);
    }
    const loaded = await page.evaluate(
      (c) => window.__perf!.messages.loadedCount(c),
      cid,
    );
    const before = await page.evaluate(() =>
      window.__perf!.messages.bottomVisibleMarker(),
    );

    const widths: number[] = [];
    for (let w = VIEWPORT.width - STEP_PX; w >= NARROW; w -= STEP_PX) widths.push(w);
    widths.push(...[...widths].reverse().slice(1), VIEWPORT.width);
    const stopTrace = await startFrameTrace(page.context().browser()!);
    for (const width of widths) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        height: VIEWPORT.height,
        mobile: false,
        width,
      });
      await page.waitForTimeout(17);
    }
    await page.waitForTimeout(1000);
    const frames = frameStats(await stopTrace());
    const after = await page.evaluate(() =>
      window.__perf!.messages.bottomVisibleMarker(),
    );
    const gates =
      before !== null && before === after
        ? []
        : [
            `bottom-kept: the bottom row was ${before} before the resize and ${after} after`,
          ];
    if (loaded < 800) gates.push(`history-loaded: ${loaded} of 800 messages`);
    return {
      extra: {
        ...frames,
        bottomAfter: after,
        bottomBefore: before,
        loaded,
        steps: widths.length,
      },
      gates,
      value: frames.droppedPct,
    };
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
};

// --- WB-03 ---------------------------------------------------------------------------------------

/** Chunks that should never load before the empty channel list (WEB-PLAN.md §13, F13–F14). */
const LAZY =
  /react-player|ReactPlayer|emoji-mart|EmojiPicker|chart|syntax-highlighter|AIMarkdown/i;

export const wb03: RunScenario = {
  context: 'fresh',
  // An empty app: no channels, so the list renders its empty state.
  dataset: { seed: ['reset', '--all', '--yes'] },
  id: 'wb-03',
  lists: false,
  measure: async ({ page, url }) => {
    const trace = await startTrace(
      page.context().browser()!,
      [
        'devtools.timeline',
        'v8',
        'disabled-by-default-v8.compile',
        'blink.user_timing',
        '__metadata',
      ],
      (text) =>
        /"name":"(v8\.compile|v8\.compileModule|v8\.parseOnBackground|v8\.evaluateModule|EvaluateScript|process_name|thread_name|perf:channel-list-ready)"/.test(
          text,
        ),
    );
    await page.goto(url);
    const readyAt = await page.evaluate(() => window.__perf!.ready());
    const events = await trace();
    const scripts = await page.evaluate(
      (until) =>
        performance
          .getEntriesByType('resource')
          .map((e) => e as PerformanceResourceTiming)
          .filter((e) => e.initiatorType === 'script' && e.startTime <= until)
          .map((e) => ({
            decodedKB: Math.round(e.decodedBodySize / 102.4) / 10,
            name: new URL(e.name).pathname.split('/').pop()!,
            transferKB: Math.round(e.encodedBodySize / 102.4) / 10,
          })),
      readyAt,
    );
    const until = markTs(events, 'perf:channel-list-ready') ?? Number.MAX_SAFE_INTEGER;
    const sum = (names: RegExp) =>
      Math.round(
        (events as Array<TraceEvent & { dur?: number }>)
          .filter((e) => names.test(e.name) && e.ts <= until)
          .reduce((ms, e) => ms + (e.dur ?? 0) / 1000, 0),
      );
    const lazyLoaded = scripts.filter((s) => LAZY.test(s.name)).map((s) => s.name);
    return {
      extra: {
        chunks: scripts,
        compileMs: sum(/^v8\.(compile|compileModule|parseOnBackground)$/),
        evaluateMs: sum(/^(EvaluateScript|v8\.evaluateModule)$/),
        jsDecodedKB: Math.round(scripts.reduce((kb, s) => kb + s.decodedKB, 0)),
        jsTransferKB: Math.round(scripts.reduce((kb, s) => kb + s.transferKB, 0)),
        lazyLoadedEarly: lazyLoaded,
      },
      value: readyAt,
    };
  },
  metric: 'M-LAUNCH',
  selfNavigate: true,
  types: ['messaging'],
  unit: 'ms',
};
