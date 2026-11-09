import { createContext, useContext } from 'react';

export type AriaLivePriority = 'assertive' | 'polite';

export type AriaLiveAnnounceOptions = {
  priority?: AriaLivePriority;
  /**
   * Delay (ms) before the message is placed in the live region, to let a competing screen-reader
   * utterance settle first (e.g. a dialog announcement made while a field is auto-focused is
   * otherwise superseded by the field's focus announcement). Defaults to `0` (immediately).
   */
  delayMs?: number;
  /**
   * When set, an identical `message` is announced at most once per this window (ms), and repeats
   * within it are suppressed. The window starts when the message is actually announced. Guards
   * against duplicates such as an effect double-invoked by React StrictMode.
   */
  dedupeMs?: number;
};

/**
 * Announces `message` to assistive technology; `priority` defaults to `'polite'`. Returns a
 * `cancel` function that stops a still-pending delayed announcement (call it from effect cleanup
 * so a closing surface does not announce after unmount) and is a no-op for an immediate one.
 */
export type AriaLiveAnnounce = (
  message: string,
  options?: AriaLiveAnnounceOptions,
) => () => void;

export type AriaLiveAnnouncerContextValue = {
  announce: AriaLiveAnnounce;
};

const noopAnnounce: AriaLiveAnnounce = () => () => undefined;

export const AriaLiveAnnouncerContext = createContext<
  AriaLiveAnnouncerContextValue | undefined
>(undefined);

/**
 * Returns the `announce` function of the nearest `AriaLiveAnnouncerProvider`, or a no-op outside
 * one: announcements are a progressive enhancement, not a requirement.
 */
export const useAriaLiveAnnouncer = () =>
  useContext(AriaLiveAnnouncerContext)?.announce ?? noopAnnounce;
