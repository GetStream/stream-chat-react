import clsx from 'clsx';
import { Placement } from '@popperjs/core';
import React, { ComponentProps, PropsWithChildren, useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';
import { useDialogIsOpen } from './hooks';
import { DialogPortalEntry } from './DialogPortal';

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
  const popperElementRef = useRef<T>(null);
  const { attributes, styles, update } = usePopper(referenceElement, popperElementRef.current, {
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
    if (open) {
      // Since the popper's reference element might not be (and usually is not) visible
      // all the time, it's safer to force popper update before showing it.
      update?.();
    }
  }, [open, update]);

  return {
    attributes,
    popperElementRef,
    styles,
  };
}

type DialogAnchorProps = PropsWithChildren<Partial<DialogAnchorOptions>> & {
  id: string;
} & ComponentProps<'div'>;

export const DialogAnchor = ({
  children,
  className,
  id,
  placement = 'auto',
  referenceElement = null,
  ...restDivProps
}: DialogAnchorProps) => {
  const open = useDialogIsOpen(id);
  const { attributes, popperElementRef, styles } = useDialogAnchor<HTMLDivElement>({
    open,
    placement,
    referenceElement,
  });

  return (
    <DialogPortalEntry dialogId={id}>
      <div
        {...restDivProps}
        {...attributes.popper}
        className={clsx('str-chat__dialog-contents', className)}
        data-testid='str-chat__dialog-contents'
        ref={popperElementRef}
        style={styles.popper}
      >
        {children}
      </div>
    </DialogPortalEntry>
  );
};
