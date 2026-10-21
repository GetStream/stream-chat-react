import type { Channel } from 'stream-chat';

import { describeWindows, readWindows } from './paginatorWindows';

/**
 * Logs every change of a channel's windows — which one is read, which are marked head, their
 * ranges — with the calls that made it, so a run that ends somewhere unexpected says how it got
 * there. A stored window changes no published state, so this watches the paginator's window map
 * and its read-window id themselves (protected fields of `BasePaginator`, as in
 * `paginatorWindows.ts`). One change usually takes several writes; they are logged once, with the
 * calls of the first.
 */

type Intervals = Map<string, unknown>;

const ACTIVE_ID = '_activeIntervalId';
const INTERVALS = '_itemIntervals';
type Watched = { [ACTIVE_ID]?: string; [INTERVALS]?: Intervals };

const MAX_CALLERS = 8;
/** Frames that say nothing about who changed the windows. */
const NOISE =
  /^(Map\.|Object\.|Array\.|Set\.|Promise|new |StateStore|watchWindowChanges)/;

/** e.g. "MessagePaginator.placePage ← MessagePaginator.placeExternalQueryPage ← Channel.reload" */
const callersOf = (stack = '') =>
  [
    ...new Set(
      stack
        .split('\n')
        .slice(1)
        .map((line) => line.match(/at (?:async )?([\w$.]+(?: \[as \w+\])?) \(/)?.[1])
        .filter(
          (name): name is string => !!name && name.includes('.') && !NOISE.test(name),
        ),
    ),
  ]
    .slice(0, MAX_CALLERS)
    .join(' ← ');

/** Starts logging; the returned function stops it and restores the paginator. */
export const watchWindowChanges = (channel: Channel, log: (line: string) => void) => {
  const paginator = channel.messagePaginator;
  const watched = paginator as unknown as Watched;
  const describe = () => describeWindows(readWindows(paginator));
  let last = describe();
  let pendingStack: string | undefined;

  const noteWrite = () => {
    if (pendingStack !== undefined) return;
    pendingStack = new Error().stack ?? '';
    queueMicrotask(() => {
      const stack = pendingStack;
      pendingStack = undefined;
      const now = describe();
      if (now === last) return;
      last = now;
      log(`  windows changed: ${now}`);
      log(`    by ${callersOf(stack) || 'unknown'}`);
    });
  };

  const watchMap = (map: Intervals | undefined) => {
    if (!map) return;
    for (const method of ['set', 'delete', 'clear'] as const) {
      const original = map[method] as (...args: unknown[]) => unknown;
      map[method] = ((...args: unknown[]) => {
        const result = original.apply(map, args);
        noteWrite();
        return result;
      }) as never;
    }
  };

  let activeId = watched[ACTIVE_ID];
  let intervals = watched[INTERVALS];
  watchMap(intervals);
  Object.defineProperty(watched, ACTIVE_ID, {
    configurable: true,
    get: () => activeId,
    set: (id: string | undefined) => {
      activeId = id;
      noteWrite();
    },
  });
  Object.defineProperty(watched, INTERVALS, {
    configurable: true,
    get: () => intervals,
    set: (map: Intervals | undefined) => {
      intervals = map;
      watchMap(map);
      noteWrite();
    },
  });

  return () => {
    for (const map of [intervals]) {
      for (const method of ['set', 'delete', 'clear'] as const) delete map?.[method];
    }
    delete watched[ACTIVE_ID];
    delete watched[INTERVALS];
    watched[ACTIVE_ID] = activeId;
    watched[INTERVALS] = intervals;
  };
};
