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
  const open = useDialogIsOpen(id);
  const { attributes, popperElementRef, styles } = useDialogAnchor<HTMLDivElement>({
    open,
    placement,
    referenceElement,
  });

  // handle focus and focus trap inside the dialog
  useEffect(() => {
    if (!popperElementRef.current || !focus || !open) return;
    const container = popperElementRef.current;
    container.focus();

    if (!trapFocus) return;
    const handleKeyDownWithTabRoundRobin = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      if (firstElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      // Trap focus within the group
      if (event.shiftKey && document.activeElement === firstElement) {
        // If Shift + Tab on the first element, move focus to the last element
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        // If Tab on the last element, move focus to the first element
        event.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDownWithTabRoundRobin);

    return () => container.removeEventListener('keydown', handleKeyDownWithTabRoundRobin);
  }, [focus, popperElementRef, open, trapFocus]);

  return (
    <DialogPortalEntry dialogId={id}>
      <div
        {...restDivProps}
        {...attributes.popper}
        className={clsx('str-chat__dialog-contents', className)}
        data-testid='str-chat__dialog-contents'
        ref={popperElementRef}
        style={styles.popper}
        tabIndex={0}
      >
        {children}
      </div>
    </DialogPortalEntry>
  );
};

function getFocusableElements(container: HTMLElement) {
  return container.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
  );
}
