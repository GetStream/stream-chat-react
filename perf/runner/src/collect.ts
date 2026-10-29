import type { Page } from 'playwright';

// What the runner reads from the page AFTER a window closes (never during one).

export type Split = {
  total: number;
  /** Navigation start → the request starts: loading the JavaScript, connecting, querying. */
  beforeRequest: number;
  network: number;
  client: number;
  request: string;
} | null;

/**
 * Network vs. client share of a launch or settle (WEB-SCENARIOS.md §1.5). The reported number stays
 * the total; the split goes beside it, and stability gates use the client share.
 *
 * `requestPattern` picks the request the screen waits for (e.g. queryChannels). Of the matching XHR or
 * fetch entries that ended before the mark, the last one is the one the mark waited on.
 */
export const splitAt = async (
  page: Page,
  markName: string,
  requestPattern: RegExp,
  /** For M-SETTLE: the trigger mark (e.g. perf:open). Omitted = navigation start (M-LAUNCH). */
  startMarkName?: string,
): Promise<Split> => {
  const data = await page.evaluate(
    ({ end, start }) => {
      const at = (name: string) =>
        performance.getEntriesByName(name, 'mark').at(-1)?.startTime;
      const resources = performance
        .getEntriesByType('resource')
        .map((e) => e as PerformanceResourceTiming)
        .filter(
          (e) => e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch',
        )
        .map(({ name: url, responseEnd, startTime }) => ({
          responseEnd,
          startTime,
          url,
        }));
      return { endTime: at(end), resources, startTime: start ? at(start) : 0 };
    },
    { end: markName, start: startMarkName },
  );
  if (data.endTime === undefined || data.startTime === undefined) return null;
  const { endTime, startTime } = data;

  // The request the view waited on: started after the trigger, finished before the mark.
  const request = data.resources
    .filter(
      (r) =>
        requestPattern.test(new URL(r.url).pathname) &&
        r.startTime >= startTime &&
        r.responseEnd <= endTime,
    )
    .sort((a, b) => a.responseEnd - b.responseEnd)
    .at(-1);
  if (!request) return null;

  return {
    beforeRequest: request.startTime - startTime,
    client: endTime - request.responseEnd,
    network: request.responseEnd - request.startTime,
    request: new URL(request.url).pathname,
    total: endTime - startTime,
  };
};

/** Every XHR/fetch path between two marks (diagnostics: what an open actually requested). */
export const requestsBetween = (page: Page, startMark: string, endMark: string) =>
  page.evaluate(
    ({ end, start }) => {
      const at = (name: string) =>
        performance.getEntriesByName(name, 'mark').at(-1)?.startTime ?? 0;
      const [from, to] = [at(start), at(end)];
      return performance
        .getEntriesByType('resource')
        .map((e) => e as PerformanceResourceTiming)
        .filter(
          (e) =>
            (e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch') &&
            e.startTime >= from &&
            e.startTime <= to,
        )
        .map((e) => new URL(e.name).pathname);
    },
    { end: endMark, start: startMark },
  );

/** CDP performance metrics (heap, DOM nodes, listeners, task time…), read from the browser. */
export const metrics = async (cdp: import('playwright').CDPSession) => {
  const { metrics: list } = (await cdp.send('Performance.getMetrics')) as {
    metrics: Array<{ name: string; value: number }>;
  };
  return Object.fromEntries(list.map(({ name, value }) => [name, value]));
};
