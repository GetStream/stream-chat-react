import { createContext, useContext } from 'react';

export type AriaLivePriority = 'assertive' | 'polite';

export type AriaLiveAnnounceOptions = {
  priority?: AriaLivePriority;
  /**
   * Delay (ms) before the message is placed in the live region. Use to let a competing
   * screen-reader utterance settle first — e.g. a dialog-identity announcement made while a
   * field is being auto-focused is otherwise superseded by the field's focus announcement.
   * Omitted/0 announces immediately.
   */
  delayMs?: number;
  /**
   * When set, an identical `message` is announced at most once per this window (ms); a repeat
   * within the window is suppressed (returns a no-op cancel). The window starts when the message
   * is actually announced. Guards against duplicate announcements — e.g. an effect double-invoked
   * by React StrictMode, or rapid re-renders firing the same message.
   */
  dedupeMs?: number;
};

/**
 * Announce `message` to assistive technology. Delivery is controlled by an options object
 * (`priority` defaults to `'polite'`). Returns a `cancel` function: for a delayed announcement it
 * prevents a still-pending message from being announced (call it from effect cleanup so a closing
 * surface does not announce after unmount); for an immediate announcement it is a no-op.
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

export const useAriaLiveAnnouncer = () => {
  const contextValue = useContext(AriaLiveAnnouncerContext);

  if (!contextValue) {
    console.warn(
      'The useAriaLiveAnnouncer hook was called outside of an AriaLiveAnnouncerProvider.',
    );

    return noopAnnounce;
  }

  return contextValue.announce;
};
