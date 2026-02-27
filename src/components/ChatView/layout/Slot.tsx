import clsx from 'clsx';
import React from 'react';

import type { ReactNode } from 'react';

export type SlotProps = {
  children?: ReactNode;
  className?: string;
  hidden?: boolean;
  slot: string;
};

export const Slot = ({ children, className, hidden = false, slot }: SlotProps) => (
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
