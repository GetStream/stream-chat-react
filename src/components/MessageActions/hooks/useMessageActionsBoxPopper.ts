import type { Placement } from '@popperjs/core';
import { useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';

export interface MessageActionsBoxPopperOptions {
  open: boolean;
  placement: Placement;
  referenceElement: HTMLElement | null;
}

export function useMessageActionsBoxPopper<T extends HTMLElement>({
  open,
  placement,
  referenceElement,
}: MessageActionsBoxPopperOptions) {
  const popperElementRef = useRef<T>(null);
  const { attributes, styles, update } = usePopper(
    referenceElement,
    popperElementRef.current,
    {
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
    },
  );

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
