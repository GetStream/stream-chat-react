import { useCallback, useRef } from 'react';

export type ReserveFocusReturnOptions = {
  /**
   * Explicit element focus should return to. Defaults to the current
   * `document.activeElement` (the natural "origin" — e.g. the composer when a
   * transient surface steals focus). Provide this when the desired return target
   * is NOT where focus currently is. A non-focusable value (or `document.body`)
   * reserves nothing.
   */
  target?: HTMLElement | null;
};

export type UseFocusReturnResult = {
  /**
   * Capture the element focus should return to. Called with no argument it
   * captures the current `document.activeElement`; pass `{ target }` to override.
   * Options is an object for forward-compatibility (future flags add fields here
   * without changing the call signature).
   */
  reserve: (options?: ReserveFocusReturnOptions) => void;
  /**
   * Move focus back to the reserved element (if it is still connected) and clear
   * the reservation. No-op when nothing was reserved or the element is gone.
   * Focuses synchronously — defer announcements yourself if you need the focus
   * announcement to be spoken first.
   */
  restore: () => void;
};

const isFocusableElement = (value: Element | null): value is HTMLElement =>
  value instanceof HTMLElement && typeof value.focus === 'function';

/**
 * Generic focus-restoration primitive: capture-before-steal, restore-on-finish —
 * the pattern dialogs/popovers use. A transient surface (e.g. the Giphy preview)
 * `reserve()`s before it moves focus into itself, then `restore()`s when it
 * completes, returning focus to wherever it was — WITHOUT the surface knowing or
 * naming that element (no coupling to "the composer").
 *
 * Single-candidate by design: each consumer holds its own reservation in a ref,
 * so concurrent/nested transient surfaces never clobber each other (each restores
 * its own origin). There is one `document.activeElement` at a time, and these
 * flows are mutually exclusive, so no shared slot/stack/key registry is needed.
 * If a cross-component rendezvous or deep nesting ever appears, a stack (nesting)
 * or coarse typed keys (rendezvous) can be added without changing this API.
 *
 * React 17/18/19 compatible — `useRef`/`useCallback` only.
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
