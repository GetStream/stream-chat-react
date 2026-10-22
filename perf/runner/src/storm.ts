import type { CDPSession, Page } from 'playwright';

import { live, type LiveFinished } from './chatperf.ts';
import { metrics } from './collect.ts';
import type { ChannelType } from './config.ts';
import { frameStats, startFrameTrace, type FrameStats } from './frames.ts';

// The window every live scenario shares (WEB-PLAN.md §6.6): start `chatperf live`, open the window on
// its `go`, idle for the run's duration with nothing running in the page, then read chatperf's
// verdict. Scenarios add their own preparation before and checks after.
//
//   M-FRAMES  a frame trace around the window (dropped-frame %)
//   M-CPU     main-thread busy % over the window, after a 30 s idle floor taken the same way
//             (WEB-SCENARIOS.md §1.5b)
//
// Gates: live-achieved (chatperf held ≥ 90 % of the requested rate, its own verdict), and for
// M-FRAMES nothing-drew (something on screen changed at all).

const COUNTDOWN_S = 3;
export const IDLE_FLOOR_MS = 30_000;

export type Cpu = {
  /** TaskDuration delta ÷ wall time: how busy the main thread was. */
  busyPct: number;
  scriptPct: number;
  layoutPct: number;
  stylePct: number;
  wallMs: number;
};

const pct = (seconds: number, wallMs: number) =>
  Math.round(((seconds * 1000) / wallMs) * 1000) / 10;

/** M-CPU over an idle window of `ms`: the runner's only page call is `__perf.idle`. */
const cpuOver = async (page: Page, cdp: CDPSession, ms: number): Promise<Cpu> => {
  const before = await metrics(cdp);
  const wallMs = await page.evaluate((m) => window.__perf!.idle(m), ms);
  const after = await metrics(cdp);
  const d = (k: string) => after[k] - before[k];
  return {
    busyPct: pct(d('TaskDuration'), wallMs),
    layoutPct: pct(d('LayoutDuration'), wallMs),
    scriptPct: pct(d('ScriptDuration'), wallMs),
    stylePct: pct(d('RecalcStyleDuration'), wallMs),
    wallMs: Math.round(wallMs),
  };
};

export type StormOptions = {
  page: Page;
  cdp: CDPSession;
  type: ChannelType;
  metric: 'M-FRAMES' | 'M-CPU';
  /** `chatperf live` arguments: the scenario id and its canonical rate. */
  args: string[];
  durationS: number;
  /** `--no-isolate` (default): storm the dataset the batch seeded. false: chatperf isolates. */
  isolate?: boolean;
  /** Runs on `go`, beside the window (the offline gate check). */
  duringWindow?: () => Promise<void>;
};

export type StormResult = {
  finished: LiveFinished;
  frames?: FrameStats;
  cpu?: Cpu;
  floor?: Cpu;
  gates: string[];
  /** ms from chatperf's `go` to the window opening. */
  windowLagMs: number;
  windowS: number;
};

export const storm = async (options: StormOptions): Promise<StormResult> => {
  const { cdp, metric, page, type } = options;
  // The floor comes first, with the starting screen open and nothing being sent.
  const floor = metric === 'M-CPU' ? await cpuOver(page, cdp, IDLE_FLOOR_MS) : undefined;

  const run = live([
    ...options.args,
    '--duration',
    String(options.durationS),
    '--countdown',
    String(COUNTDOWN_S),
    ...(options.isolate ? [] : ['--no-isolate']),
    '--channel-type',
    type,
  ]);
  const goAt = await run.go;
  if (goAt === null) {
    const { output } = await run.done;
    throw new Error(`chatperf live ended before GO:\n${output.trim()}`);
  }

  let frames: FrameStats | undefined;
  let cpu: Cpu | undefined;
  let windowLagMs: number;
  const ms = options.durationS * 1000;
  const side = options.duringWindow?.() ?? Promise.resolve();
  if (metric === 'M-FRAMES') {
    const stopTrace = await startFrameTrace(page.context().browser()!);
    windowLagMs = Date.now() - goAt;
    await page.evaluate((m) => window.__perf!.idle(m), ms);
    frames = frameStats(await stopTrace());
  } else {
    windowLagMs = Date.now() - goAt;
    cpu = await cpuOver(page, cdp, ms);
  }
  await side;

  const result = await run.done;
  if (result.code !== 0 || !result.finished) {
    throw new Error(`chatperf live failed:\n${result.output.trim()}`);
  }
  const gates: string[] = [];
  // An idle window in which no frame drew: the events changed nothing on screen (e.g. ML-10 edits
  // aimed at messages scrolled out of view), so there is nothing to measure. Never a 0 % row.
  if (frames && frames.presented + frames.partial + frames.dropped === 0) {
    gates.push(
      'nothing-drew: no frame drew in the window (the events changed nothing on screen)',
    );
  }
  if (result.finished.discard) {
    gates.push(
      `live-achieved: chatperf reached ${Math.round((result.finished.achieved_ratio ?? 0) * 100)}% ` +
        'of the requested rate',
    );
  }
  return {
    cpu,
    finished: result.finished,
    floor,
    frames,
    gates,
    windowLagMs,
    windowS: options.durationS,
  };
};

/** The row's number and extras for a storm. M-CPU rows carry the floor and the split beside it. */
export const stormMeasurement = (
  s: StormResult,
  extra: Record<string, unknown> = {},
) => ({
  extra: {
    ...(s.frames ?? {}),
    // Dropped % depends on how many frames the list wants to draw: a smooth-scrolling list adds
    // many easy frames to the denominator (ML-08: standard ~900 frames, virtualized ~4 300). The
    // rate of dropped frames compares lists fairly in an idle window.
    ...(s.frames
      ? { droppedPerS: Math.round((s.frames.dropped / s.windowS) * 100) / 100 }
      : {}),
    ...(s.cpu ? { cpu: s.cpu, floor: s.floor, floorPct: s.floor?.busyPct } : {}),
    achievedPct: Math.round((s.finished.achieved_ratio ?? 0) * 100),
    sent: s.finished.sent,
    windowLagMs: s.windowLagMs,
    ...extra,
  },
  gates: s.gates,
  value: s.frames ? s.frames.droppedPct : s.cpu!.busyPct,
});
