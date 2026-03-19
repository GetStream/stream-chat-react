// Kept as a reusable manual-profiling helper for future scroll investigations.
// The scroll hooks intentionally do not call this by default; temporarily wrap
// the target code path with `measureScrollWork(...)` when profiling is needed.
//
// Re-enable procedure:
// 1. Import `measureScrollWork` into the hook or helper you want to profile.
// 2. Wrap the target expression or callback, for example:
//    `measureScrollWork('message-list-scroll:capture-anchor', () => capture())`, e.g.:
// const messagesAddedToTop = measureScrollWork('message-list-scroll:classify-prepend', () =>
//   messageIdsMatchAsSuffix(prevMessages, newMessages),
// );
// const messagesAddedToBottom = measureScrollWork(
//   'message-list-scroll:classify-append',
//   () => messageIdsMatchAsPrefix(prevMessages, newMessages),
// );
// 3. In the browser console, enable collection with:
//    `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__ = { enabled: true, entries: [] }`
// 4. Reproduce the interaction, then inspect
//    `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__.entries`.
// 5. Remove the temporary call sites again after the profiling pass.
type ScrollPerfEntry = {
  duration: number;
  name: string;
};

type ScrollPerfWindow = typeof window & {
  __STREAM_MESSAGE_LIST_SCROLL_PERF__?: {
    enabled?: boolean;
    entries?: ScrollPerfEntry[];
  };
};

const getPerfState = () => {
  if (typeof window === 'undefined') return null;

  const perfWindow = window as ScrollPerfWindow;
  // eslint-disable-next-line no-underscore-dangle
  const state = perfWindow.__STREAM_MESSAGE_LIST_SCROLL_PERF__;

  if (!state?.enabled) return null;

  if (!state.entries) {
    state.entries = [];
  }

  return state;
};

export const measureScrollWork = <T>(name: string, work: () => T): T => {
  const state = getPerfState();

  if (!state || typeof performance === 'undefined') {
    return work();
  }

  const startMark = `${name}:start:${performance.now()}`;
  const endMark = `${name}:end:${performance.now()}`;

  performance.mark(startMark);
  try {
    return work();
  } finally {
    performance.mark(endMark);
    const measure = performance.measure(name, startMark, endMark);
    state.entries?.push({
      duration: measure.duration,
      name,
    });
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  }
};
