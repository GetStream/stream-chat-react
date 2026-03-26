import clsx from 'clsx';
import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { FocusScope } from '@react-aria/focus';
import { DialogPortalEntry } from './DialogPortal';
import { useDialog, useDialogIsOpen } from '../hooks';
import { type OffsetOpt, usePopoverPosition } from '../hooks/usePopoverPosition';
import type { PopperLikePlacement } from '../hooks';
import type { Placement } from '@floating-ui/react';

export interface DialogAnchorOptions {
  open: boolean;
  placement: PopperLikePlacement;
  referenceElement: HTMLElement | null;
  allowFlip?: boolean;
  updateKey?: unknown;
  updatePositionOnContentResize?: boolean;
  offset?: OffsetOpt;
}

export function useDialogAnchor<T extends HTMLElement>({
  allowFlip,
  offset,
  open,
  placement,
  referenceElement,
  updateKey,
  updatePositionOnContentResize = false,
}: DialogAnchorOptions) {
  const [popperElement, setPopperElement] = useState<T | null>(null);
  // keeps track of the first "chosen" placement (after popperElement is set) to avoid popper "jumping" to a different placement when it updates and finds a better fit; resets when popperElement is unset (!open)
  const [stabilisedChosenPlacement, setStabilisedChosenPlacement] =
    useState<Placement | null>(null);

  const {
    placement: chosenPlacement,
    refs,
    strategy,
    update,
    x,
    y,
  } = usePopoverPosition({
    allowFlip,
    freeze: true,
    offset,
    placement: stabilisedChosenPlacement ?? placement,
  });

  if (!stabilisedChosenPlacement && popperElement && placement !== chosenPlacement) {
    setStabilisedChosenPlacement(chosenPlacement);
  } else if (stabilisedChosenPlacement && !popperElement) {
    setStabilisedChosenPlacement(null);
  }

  // Freeze reference when dialog opens so submenus (e.g. ContextMenu level 2+) stay aligned to the original anchor
  const frozenReferenceRef = useRef<HTMLElement | null>(null);
  if (open && referenceElement && !frozenReferenceRef.current) {
    frozenReferenceRef.current = referenceElement;
  }
  if (!open) {
    frozenReferenceRef.current = null;
  }
  const effectiveReference = open ? frozenReferenceRef.current : referenceElement;

  useEffect(() => {
    refs.setReference(effectiveReference);
  }, [effectiveReference, refs]);

  useEffect(() => {
    refs.setFloating(popperElement);
  }, [popperElement, refs]);

  useEffect(() => {
    if (open && popperElement && effectiveReference) {
      // Re-run when reference becomes available (e.g. after ref is set) or when updateKey changes (e.g. submenu open)
      // Since the popper's reference element might not be (and usually is not) visible
      // all the time, it's safer to force popper update before showing it.
      // update is non-null only if popperElement is non-null
      update?.();
    }
  }, [open, placement, popperElement, update, updateKey, effectiveReference]);

  useEffect(() => {
    if (!popperElement || !updatePositionOnContentResize) return;

    const resizeObserver = new ResizeObserver(update);

    resizeObserver.observe(popperElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [popperElement, update, updatePositionOnContentResize]);

  if (popperElement && !open) {
    setPopperElement(null);
  }

  return {
    placement: stabilisedChosenPlacement ?? chosenPlacement,
    setPopperElement,
    styles: {
      left: x ?? 0,
      position: strategy,
      top: y ?? 0,
    } as React.CSSProperties,
  };
}

export type DialogAnchorProps = PropsWithChildren<Partial<DialogAnchorOptions>> & {
  /**
   * Optional per-dialog override for outside-click dismissal.
   * If undefined, manager-level `DialogManager.closeOnClickOutside` is used.
   */
  closeOnClickOutside?: boolean;
  id: string;
  /**
   * Delay (ms) before unmounting after dialog closes.
   * Use this to keep the dialog in DOM long enough for CSS exit animations.
   * `0` means immediate unmount (no exit-animation window).
   */
  closeTransitionMs?: number;
  dialogManagerId?: string;
  focus?: boolean;
  trapFocus?: boolean;
} & ComponentProps<'div'>;

export const DialogAnchor = ({
  allowFlip = true,
  children,
  className,
  closeOnClickOutside,
  closeTransitionMs = 0,
  dialogManagerId,
  focus = true,
  id,
  offset,
  placement = 'auto',
  referenceElement = null,
  tabIndex,
  trapFocus,
  updateKey,
  updatePositionOnContentResize,
  ...restDivProps
}: DialogAnchorProps) => {
  /**
   * Rendering lifecycle notes:
   * - `open=true` renders dialog contents immediately.
   * - `open=false` can keep contents mounted for `closeTransitionMs` to allow CSS exit
   *   animations before unmount.
   *
   * State exposed to CSS:
   * - `data-str-chat-dialog-state="open"` while actively open.
   * - `data-str-chat-dialog-state="closing"` during delayed unmount window.
   *
   * Consumers like `ContextMenu` combine:
   * - `data-str-chat-dialog-state` from this component, and
   * - `data-str-chat-placement` (e.g. `top-start`, `right-end`)
   * to select the correct closing keyframe in CSS (horizontal vs vertical roll direction).
   * In practice, JS only toggles state and timing (`closeTransitionMs`); CSS owns the
   * visual motion details (transform/easing), so animation behavior stays declarative.
   */
  const dialog = useDialog({ closeOnClickOutside, dialogManagerId, id });
  const open = useDialogIsOpen(id, dialogManagerId);
  const [shouldRender, setShouldRender] = useState(open);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isClosing = !open && shouldRender;

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      return;
    }

    if (!shouldRender) return;
    if (!closeTransitionMs) {
      setShouldRender(false);
      return;
    }

    closeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      closeTimeoutRef.current = null;
    }, closeTransitionMs);
  }, [closeTransitionMs, open, shouldRender]);

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    },
    [],
  );

  const {
    placement: chosenPlacement,
    setPopperElement,
    styles,
  } = useDialogAnchor<HTMLDivElement>({
    allowFlip,
    offset,
    open: shouldRender,
    placement,
    referenceElement,
    updateKey,
    updatePositionOnContentResize,
  });

  useEffect(() => {
    if (!open) return;
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      dialog?.close();
    };

    document.addEventListener('keyup', hideOnEscape);

    return () => {
      document.removeEventListener('keyup', hideOnEscape);
    };
  }, [dialog, open]);

  // prevent rendering the dialog contents if the dialog should not be open / shown
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalEntry dialogId={id} dialogManagerId={dialogManagerId}>
      <FocusScope autoFocus={focus} contain={trapFocus} restoreFocus>
        <div
          {...restDivProps}
          className={clsx('str-chat__dialog-contents', className)}
          data-str-chat-dialog-state={isClosing ? 'closing' : 'open'}
          data-str-chat-placement={chosenPlacement}
          data-testid='str-chat__dialog-contents'
          ref={setPopperElement}
          style={styles}
          tabIndex={typeof tabIndex !== 'undefined' ? tabIndex : 0}
        >
          {children}
        </div>
      </FocusScope>
    </DialogPortalEntry>
  );
};
