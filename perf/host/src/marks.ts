import type { ChannelPaginator } from 'stream-chat';

// User-timing marks are the shared clock between the page and the runner. The names are a contract
// with the runner, so they live in one place and nowhere else spells them out.
export const MARKS = {
  channelListReady: 'perf:channel-list-ready',
  hidden: 'perf:hidden',
  jump: 'perf:jump',
  offline: 'perf:offline',
  online: 'perf:online',
  open: 'perf:open',
  settled: 'perf:settled',
  threadOpen: 'perf:thread-open',
  visible: 'perf:visible',
  windowEnd: 'perf:window-end',
  windowStart: 'perf:window-start',
} as const;

export type MarkName = (typeof MARKS)[keyof typeof MARKS];

export const mark = (name: MarkName, startTime?: number) =>
  performance.mark(name, startTime === undefined ? undefined : { startTime });

export const perfMarks = () =>
  performance
    .getEntriesByType('mark')
    .filter((entry) => entry.name.startsWith('perf:'))
    .map(({ name, startTime }) => ({ name, startTime }));

/** How long the main thread must stay free of long tasks before the list counts as interactive. */
const QUIET_MS = 100;
const CHANNEL_ROW = '.str-chat__channel-list-item';

type Deferred = { promise: Promise<number>; resolve: (startTime: number) => void };
const deferred = (): Deferred => {
  let resolve!: (startTime: number) => void;
  const promise = new Promise<number>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const channelListReady = deferred();

/** Resolves with the mark's startTime once `perf:channel-list-ready` is set. */
export const whenChannelListReady = () => channelListReady.promise;

const firstPageLoaded = (paginator: ChannelPaginator) =>
  new Promise<number>((resolve) => {
    const check = ({
      isLoading,
      items,
    }: {
      isLoading: boolean;
      items: unknown[] | undefined;
    }) => !isLoading && items !== undefined;
    const current = paginator.state.getLatestValue();
    if (check(current)) return resolve(current.items?.length ?? 0);
    const unsubscribe = paginator.state.subscribe((state) => {
      if (!check(state)) return;
      unsubscribe();
      resolve(state.items?.length ?? 0);
    });
  });

/** The time React committed `count` channel rows to the DOM. */
const rowsCommitted = (count: number) =>
  new Promise<number>((resolve) => {
    const committed = () => document.querySelectorAll(CHANNEL_ROW).length >= count;
    if (count === 0) {
      // An empty list renders its empty state in the same commit as the loaded state; two frames
      // later it is on screen.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve(performance.now())),
      );
      return;
    }
    if (committed()) return resolve(performance.now());
    // A MutationObserver fires right after the commit that adds the rows; nothing polls.
    const observer = new MutationObserver(() => {
      if (!committed()) return;
      observer.disconnect();
      resolve(performance.now());
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

/**
 * Sets `perf:channel-list-ready` (WEB-PLAN.md §5.4): the first page of channel rows is committed
 * AND the main thread is idle. The mark sits at the commit, or at the end of the last long task
 * that ran after it, once QUIET_MS pass with no further long task.
 *
 * Returns a cancel function: StrictMode (dev) runs the effect that calls this twice, and only the
 * tracker of the paginator that stays registered may set the mark.
 */
export const trackChannelListReady = (
  paginator: ChannelPaginator,
  flushLongTasks: () => readonly PerformanceEntry[],
) => {
  let cancelled = false;

  void (async () => {
    const count = await firstPageLoaded(paginator);
    if (cancelled) return;
    let candidate = await rowsCommitted(count);

    for (;;) {
      await new Promise((r) => setTimeout(r, QUIET_MS));
      if (cancelled) return;
      const lastEnd = flushLongTasks().reduce(
        (end, task) => Math.max(end, task.startTime + task.duration),
        0,
      );
      if (lastEnd <= candidate) break;
      candidate = lastEnd;
    }

    mark(MARKS.channelListReady, candidate);
    channelListReady.resolve(candidate);
  })();

  return () => {
    cancelled = true;
  };
};
