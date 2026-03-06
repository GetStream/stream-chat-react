import clsx from 'clsx';
import React from 'react';

import { useLayoutViewState } from '../hooks/useLayoutViewState';

import type { ReactNode } from 'react';

export type SlotProps = {
  children?: ReactNode;
  className?: string;
  slot: string;
};

export const Slot = ({ children, className, slot }: SlotProps) => {
  const { hiddenSlots } = useLayoutViewState();
  const hidden = !!hiddenSlots?.[slot];

  return (
    <section
      aria-hidden={hidden || undefined}
      className={clsx(
        'str-chat__chat-view__slot',
        {
          'str-chat__chat-view__slot--hidden': hidden,
        },
        className,
      )}
      data-slot={slot}
    >
      {children}
    </section>
  );
};
