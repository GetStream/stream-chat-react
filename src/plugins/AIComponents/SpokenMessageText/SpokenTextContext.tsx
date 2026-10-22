import type { PropsWithChildren } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

/**
 * How much of a message's text the user has heard so far.
 */
export type HeardTextProgress = {
  /**
   * Number of characters of `message.text` the user has heard, counted in Unicode code
   * points (as `Array.from(text).length` counts them, not UTF-16 code units like
   * `text.length`). May be fractional; it is floored before rendering. A value at or
   * above the text's code point length reveals the whole text.
   */
  chars: number;
  /** `true` once the speech for the message has finished (played out, interrupted or skipped). */
  done: boolean;
};

/**
 * Returns how many characters of the message's text the user has heard by `now`
 * (a `performance.now()` timestamp), counted in Unicode code points (see
 * `HeardTextProgress.chars`). Return `undefined` for messages that are not
 * spoken; those keep the default `StreamedMessageText` behaviour. Return
 * `{ chars: 0, done: false }` for a spoken reply whose audio has not started yet.
 */
export type HeardTextFunction = (
  message: LocalMessage,
  now: number,
) => HeardTextProgress | undefined;

/**
 * Registers a listener that is called whenever the speech progress source changes
 * (playback started, paused, finished...). Returns an unsubscribe function.
 */
export type SpokenTextSubscribe = (listener: () => void) => () => void;

export type SpokenTextContextValue = {
  /** See `HeardTextFunction`. */
  heard: HeardTextFunction;
  /**
   * Messages created longer than this many milliseconds before `SpokenMessageText`
   * mounts are treated as history and rendered in full right away. Defaults to 10000.
   */
  historyThresholdMs?: number;
  /** Optional change notification for the speech progress source. */
  subscribe?: SpokenTextSubscribe;
};

export type SpokenTextProviderProps = PropsWithChildren<SpokenTextContextValue>;

export const SpokenTextContext = createContext<SpokenTextContextValue | undefined>(
  undefined,
);

/**
 * Provides the speech progress used by `SpokenMessageText` to reveal an AI reply
 * at the pace it is spoken. Keep `heard` and `subscribe` referentially stable
 * (e.g. wrap them in `useCallback`), as a new identity restarts the pacing of every
 * rendered `SpokenMessageText`.
 *
 * @example
 * ```tsx
 * import { MessageList, WithComponents } from 'stream-chat-react';
 * import { SpokenMessageText, SpokenTextProvider } from 'stream-chat-react/ai-components';
 *
 * <SpokenTextProvider
 *   heard={(message, now) => session.speech.heard(message, now)}
 *   subscribe={(listener) => session.speech.subscribe(listener)}
 * >
 *   <WithComponents overrides={{ StreamedMessageText: SpokenMessageText }}>
 *     <MessageList />
 *   </WithComponents>
 * </SpokenTextProvider>
 * ```
 */
export const SpokenTextProvider = ({
  children,
  heard,
  historyThresholdMs,
  subscribe,
}: SpokenTextProviderProps) => {
  const value = useMemo<SpokenTextContextValue>(
    () => ({ heard, historyThresholdMs, subscribe }),
    [heard, historyThresholdMs, subscribe],
  );

  return (
    <SpokenTextContext.Provider value={value}>{children}</SpokenTextContext.Provider>
  );
};

/**
 * Returns the nearest `SpokenTextProvider` value, or `undefined` when there is none.
 * Unlike most context hooks in the SDK, a missing provider is a supported state
 * (no pacing), so no warning is logged.
 */
export const useSpokenTextContext = (): SpokenTextContextValue | undefined =>
  useContext(SpokenTextContext);
