// The perf host's window.__perf, as the runner sees it. Kept loose on purpose: the host owns the
// exact types (perf/host/src/driver), and the runner only passes values through.
declare global {
  interface Window {
    __perf?: {
      ready: () => Promise<number>;
      openChannel: (
        cid: string,
        expectText: string,
      ) => Promise<{ trigger: number; settled: number; durationMs: number }>;
      back: (cid: string) => Promise<void>;
      messages: {
        oldestLoaded: (cid: string) => boolean;
        loadedMarkers: (cid: string) => number[];
        newestMarker: (cid: string) => string;
        viewPosition: (cid: string) => {
          fromBottomPx: number | null;
          loaded: number;
          markerCopies: number;
          newerThanTop: number | null;
          top: number | null;
        };
        markerState: (
          cid: string,
          marker: number,
        ) => { loaded: boolean; onScreen: boolean };
        watchAnchors: (cid: string) => void;
        stopAnchors: () => Array<{
          before: number | null;
          after: number | null;
          loaded: number;
        }>;
      };
      channels: {
        watchRows: () => void;
        stopWatchingRows: () => {
          added: number;
          removed: number;
          addedCids: string[];
          removedCids: string[];
        };
      };
      readers: (cid: string) => { readers: number; sentAt: number | null };
      idle: (ms: number) => Promise<number>;
      live: {
        startDelivery: (cid: string) => void;
        delivered: () => number;
        stopDelivery: () => { count: number; first: number | null; last: number | null };
      };
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
