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
