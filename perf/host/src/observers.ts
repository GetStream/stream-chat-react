import type { StreamChat } from 'stream-chat';

import { mark, MARKS } from './marks';

// Passive recorders, installed before React mounts so nothing early is missed. They only append to
// arrays, which is cheap enough to leave on in every window and identical across configurations.
// The runner reads them after a window closes, through window.__perf.snapshot().

export type HostLogEntry = { t: number; kind: string; value?: unknown };

const loaf: PerformanceEntry[] = [];
const events: PerformanceEntry[] = [];
const longTasks: PerformanceEntry[] = [];
const log: HostLogEntry[] = [];

const observe = (
  type: string,
  sink: PerformanceEntry[],
  options: Record<string, unknown> = {},
) => {
  // Chromium-only entry types (long-animation-frame, longtask) throw or no-op elsewhere; the host
  // keeps working, it just records less.
  if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return undefined;
  const observer = new PerformanceObserver((list) => {
    sink.push(...list.getEntries());
  });
  observer.observe({ buffered: true, type, ...options });
  return observer;
};

// The default Resource Timing buffer holds 250 entries. The dev build loads hundreds of modules as
// separate requests, which fills it before the channel query runs, and the network/client split then
// has nothing to read (measured 2026-10-21: no split at all on dev). Plenty of room instead.
performance.setResourceTimingBufferSize(10_000);

observe('long-animation-frame', loaf);
// 16 ms is the API's minimum; key events are what M-INP reads.
observe('event', events, { durationThreshold: 16 });
const longTaskObserver = observe('longtask', longTasks);

export const hostLog = (kind: string, value?: unknown) => {
  log.push({ kind, t: performance.now(), value });
};

hostLog('visibility', document.visibilityState);
document.addEventListener('visibilitychange', () => {
  hostLog('visibility', document.visibilityState);
  mark(document.visibilityState === 'hidden' ? MARKS.hidden : MARKS.visible);
});

/** Long tasks recorded so far, including any the observer hasn't delivered yet. */
export const flushLongTasks = (): readonly PerformanceEntry[] => {
  if (longTaskObserver) longTasks.push(...longTaskObserver.takeRecords());
  return longTasks;
};

/**
 * Connection state, from the v10 stores (there is no `connection.changed` event in v10). Marks the
 * transitions the OF-02/OF-03 gates and windows key off; the first value is logged, not marked.
 */
export const observeClient = (client: StreamChat) => {
  let wasHealthy: boolean | undefined;
  const unsubscribeWs = client.wsConnection.state.subscribe(({ isHealthy }) => {
    hostLog('ws', isHealthy);
    if (wasHealthy !== undefined && isHealthy !== wasHealthy) {
      mark(isHealthy ? MARKS.online : MARKS.offline);
    }
    wasHealthy = isHealthy;
  });
  const unsubscribeNetwork = client.networkConnection.state.subscribe(({ isOnline }) => {
    hostLog('network', isOnline);
  });
  const recovered = client.on('connection.recovered', () => hostLog('recovered'));

  return () => {
    unsubscribeWs();
    unsubscribeNetwork();
    recovered.unsubscribe();
  };
};

const toJSON = (entry: PerformanceEntry) => entry.toJSON() as Record<string, unknown>;

export const recordings = () => ({
  events: events.map(toJSON),
  loaf: loaf.map(toJSON),
  log: [...log],
  longTasks: flushLongTasks().map(toJSON),
});
