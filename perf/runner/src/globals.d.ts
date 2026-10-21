// The perf host's window.__perf, as the runner sees it. Kept loose on purpose: the host owns the
// exact types (perf/host/src/driver), and the runner only passes values through.
declare global {
  interface Window {
    __perf?: {
      ready: () => Promise<number>;
      snapshot: () => Record<string, unknown>;
      renders: {
        available: boolean;
        start: () => void;
        stop: () => Record<string, unknown>;
      };
      events: {
        startRecording: (cid: string | null) => void;
        stopRecording: () => { events: unknown[]; durationMs: number };
        replay: (fixture: unknown, options: { intervalMs: number }) => Promise<number>;
      };
    };
  }
}

export {};
