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
    setPopperElement,
    styles: {
      left: x ?? 0,
      position: strategy,
      top: y ?? 0,
    } as React.CSSProperties,
  };
}

export type DialogAnchorProps = PropsWithChildren<Partial<DialogAnchorOptions>> & {
  id: string;
  dialogManagerId?: string;
  focus?: boolean;
  trapFocus?: boolean;
} & ComponentProps<'div'>;

export const DialogAnchor = ({
  allowFlip = true,
  children,
  className,
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
  const dialog = useDialog({ dialogManagerId, id });
  const open = useDialogIsOpen(id, dialogManagerId);

  const { setPopperElement, styles } = useDialogAnchor<HTMLDivElement>({
    allowFlip,
    offset,
    open,
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
  if (!open) {
    return null;
  }

  return (
    <DialogPortalEntry dialogId={id} dialogManagerId={dialogManagerId}>
      <FocusScope autoFocus={focus} contain={trapFocus} restoreFocus>
        <div
          {...restDivProps}
          className={clsx('str-chat__dialog-contents', className)}
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
