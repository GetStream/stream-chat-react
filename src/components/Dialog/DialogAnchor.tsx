import clsx from 'clsx';
import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';
import { FocusScope } from '@react-aria/focus';
import { DialogPortalEntry } from './DialogPortal';
import { useDialog, useDialogIsOpen } from './hooks';
import { usePopoverPosition } from './hooks/usePopoverPosition';
import type { PopperLikePlacement } from './hooks';

export interface DialogAnchorOptions {
  open: boolean;
  placement: PopperLikePlacement;
  referenceElement: HTMLElement | null;
  allowFlip?: boolean;
}

export function useDialogAnchor<T extends HTMLElement>({
  allowFlip,
  open,
  placement,
  referenceElement,
}: DialogAnchorOptions) {
  const [popperElement, setPopperElement] = useState<T | null>(null);
  const { refs, strategy, update, x, y } = usePopoverPosition({
    allowFlip,
    freeze: true,
    placement,
  });

  useEffect(() => {
    refs.setReference(referenceElement);
  }, [referenceElement, refs]);

  useEffect(() => {
    refs.setFloating(popperElement);
  }, [popperElement, refs]);

  useEffect(() => {
    if (open && popperElement) {
      // Since the popper's reference element might not be (and usually is not) visible
      // all the time, it's safer to force popper update before showing it.
      // update is non-null only if popperElement is non-null
      update?.();
    }
  }, [open, placement, popperElement, update]);

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
  placement = 'auto',
  referenceElement = null,
  tabIndex,
  trapFocus,
  ...restDivProps
}: DialogAnchorProps) => {
  const dialog = useDialog({ dialogManagerId, id });
  const open = useDialogIsOpen(id, dialogManagerId);
  const { setPopperElement, styles } = useDialogAnchor<HTMLDivElement>({
    allowFlip,
    open,
    placement,
    referenceElement,
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
