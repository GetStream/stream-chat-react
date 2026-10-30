import clsx from 'clsx';
import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { FocusScope } from '@react-aria/focus';
import { DialogPortalEntry } from './DialogPortal';
import { useDialog, useDialogIsOpen } from '../hooks';
import { type OffsetOpt, usePopoverPosition } from '../hooks/usePopoverPosition';
import type { PopperLikePlacement } from '../hooks';
import type { Placement } from '@floating-ui/react';
import { AriaLiveOutlet } from '../../Accessibility';

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
  // The first placement chosen once `popperElement` is set, so the popover does not jump to a
  // better-fitting placement on update. Reset when `popperElement` is unset (!open).
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

  // The reference is frozen while open so nested popovers (e.g. submenus) stay aligned to the
  // original anchor.
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
      // Re-runs when the reference becomes available or `updateKey` changes (e.g. a submenu opens).
      // The reference is often not visible, so the position is forced to update before showing.
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
   * Per-dialog override for outside-click dismissal. Defaults to the manager's
   * `closeOnClickOutside`.
   */
  closeOnClickOutside?: boolean;
  /**
   * Whether pressing Escape closes the dialog. Set to `false` for a dialog that only its own close
   * control should dismiss.
   * @default true
   */
  closeOnEscape?: boolean;
  id: string;
  /** Delay (ms) before unmounting a closed dialog, for CSS exit animations. Defaults to 0. */
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
  closeOnEscape = true,
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
  // During the `closeTransitionMs` delay the contents stay mounted with
  // `data-str-chat-dialog-state="closing"` (otherwise `"open"`). CSS combines it with
  // `data-str-chat-placement` to pick the closing keyframe; JS only owns the timing.
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
    if (!open || !closeOnEscape) return;
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      dialog?.close();
    };

    document.addEventListener('keyup', hideOnEscape);

    return () => {
      document.removeEventListener('keyup', hideOnEscape);
    };
  }, [closeOnEscape, dialog, open]);

  if (!shouldRender) {
    return null;
  }

  const {
    ['aria-describedby']: ariaDescribedBy,
    ['aria-label']: ariaLabel,
    ['aria-labelledby']: ariaLabelledBy,
    ['aria-modal']: ariaModal,
    role,
    ...anchorDivProps
  } = restDivProps;
  const resolvedRole = trapFocus ? (role ?? 'dialog') : role;
  const resolvedAriaModal = trapFocus ? true : ariaModal;
  const resolvedAriaLabel = ariaLabelledBy ? undefined : ariaLabel;

  return (
    <DialogPortalEntry dialogId={id} dialogManagerId={dialogManagerId}>
      {/* A closing dialog releases the trap, so an action that moves focus elsewhere as it closes the
      dialog (e.g. "Edit Message" focusing the composer) keeps it there. */}
      <FocusScope autoFocus={focus} contain={trapFocus && !isClosing} restoreFocus>
        <div
          {...anchorDivProps}
          aria-describedby={ariaDescribedBy}
          aria-label={resolvedAriaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-modal={resolvedAriaModal}
          className={clsx('str-chat__dialog-contents', className)}
          data-str-chat-dialog-state={isClosing ? 'closing' : 'open'}
          data-str-chat-placement={chosenPlacement}
          data-testid='str-chat__dialog-contents'
          ref={setPopperElement}
          role={resolvedRole}
          style={styles}
          tabIndex={typeof tabIndex !== 'undefined' ? tabIndex : 0}
        >
          {children}
          {/* Only an `aria-modal` dialog gets its own live-region outlet, because assistive
              technologies can suppress live regions outside a modal. */}
          {resolvedAriaModal && <AriaLiveOutlet layer={1} />}
        </div>
      </FocusScope>
    </DialogPortalEntry>
  );
};
