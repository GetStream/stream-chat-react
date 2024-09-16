import clsx from 'clsx';
import { Placement } from '@popperjs/core';
import React, { ComponentProps, PropsWithChildren, useEffect, useState } from 'react';
import { FocusScope } from '@react-aria/focus';
import { usePopper } from 'react-popper';
import { DialogPortalEntry } from './DialogPortal';
import { useDialog, useDialogIsOpen } from './hooks';

export interface DialogAnchorOptions {
  open: boolean;
  placement: Placement;
  referenceElement: HTMLElement | null;
}

export function useDialogAnchor<T extends HTMLElement>({
  open,
  placement,
  referenceElement,
}: DialogAnchorOptions) {
  const [popperElement, setPopperElement] = useState<T | null>(null);
  const { attributes, styles, update } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: 'eventListeners',
        options: {
          // It's not safe to update popper position on resize and scroll, since popper's
          // reference element might not be visible at the time.
          resize: false,
          scroll: false,
        },
      },
    ],
    placement,
  });

  useEffect(() => {
    if (open && popperElement) {
      // Since the popper's reference element might not be (and usually is not) visible
      // all the time, it's safer to force popper update before showing it.
      // update is non-null only if popperElement is non-null
      update?.();
    }
  }, [open, popperElement, update]);

  if (popperElement && !open) {
    setPopperElement(null);
  }

  return {
    attributes,
    setPopperElement,
    styles,
  };
}

type DialogAnchorProps = PropsWithChildren<Partial<DialogAnchorOptions>> & {
  id: string;
  focus?: boolean;
  trapFocus?: boolean;
} & ComponentProps<'div'>;

export const DialogAnchor = ({
  children,
  className,
  focus = true,
  id,
  placement = 'auto',
  referenceElement = null,
  trapFocus,
  ...restDivProps
}: DialogAnchorProps) => {
  const dialog = useDialog({ id });
  const open = useDialogIsOpen(id);
  const { attributes, setPopperElement, styles } = useDialogAnchor<HTMLDivElement>({
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
    <DialogPortalEntry dialogId={id}>
      <FocusScope autoFocus={focus} contain={trapFocus} restoreFocus>
        <div
          {...restDivProps}
          {...attributes.popper}
          className={clsx('str-chat__dialog-contents', className)}
          data-testid='str-chat__dialog-contents'
          ref={setPopperElement}
          style={styles.popper}
          tabIndex={0}
        >
          {children}
        </div>
      </FocusScope>
    </DialogPortalEntry>
  );
};
