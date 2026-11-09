import { useCallback, useRef } from 'react';

export type ReserveFocusReturnOptions = {
  /**
   * Element focus returns to. Defaults to the current `document.activeElement`. A non-focusable
   * value or `document.body` reserves nothing.
   */
  target?: HTMLElement | null;
};

export type UseFocusReturnResult = {
  /** Captures the element focus should return to: `options.target`, or the active element. */
  reserve: (options?: ReserveFocusReturnOptions) => void;
  /**
   * Clears the reservation and moves focus back to the reserved element if it is still connected.
   * Focuses synchronously; defer any announcement that must be spoken after the focus announcement.
   */
  restore: () => void;
};

const isFocusableElement = (value: Element | null): value is HTMLElement =>
  value instanceof HTMLElement && typeof value.focus === 'function';

/**
 * Focus restoration for transient surfaces: `reserve()` before moving focus into the surface,
 * `restore()` when it completes, without the surface knowing which element had focus.
 *
 * Each hook instance holds its own reservation, so concurrent or nested surfaces restore their own
 * origin.
 */
export const useFocusReturn = (): UseFocusReturnResult => {
  const reservedTargetRef = useRef<HTMLElement | null>(null);

  const reserve = useCallback((options?: ReserveFocusReturnOptions) => {
    const candidate = options?.target ?? (document.activeElement as Element | null);
    reservedTargetRef.current =
      isFocusableElement(candidate) && candidate !== document.body ? candidate : null;
  }, []);

  const restore = useCallback(() => {
    const target = reservedTargetRef.current;
    reservedTargetRef.current = null;
    if (target?.isConnected) target.focus();
  }, []);

  return { reserve, restore };
};
