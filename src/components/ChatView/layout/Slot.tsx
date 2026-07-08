import clsx from 'clsx';
import React from 'react';

import { useLayoutViewState } from '../hooks/useLayoutViewState';
import { getChatViewEntityBinding } from '../slotBinding';
import { renderSlotFromRegistry, useSlotRegistry } from '../slotRegistry';

import type { ReactNode } from 'react';

export type SlotProps = {
  children?: ReactNode;
  className?: string;
  slot: string;
};

export const Slot = ({ children, className, slot }: SlotProps) => {
  const { hiddenSlots, slotBindings } = useLayoutViewState();
  const registry = useSlotRegistry();
  const hidden = !!hiddenSlots?.[slot];

  // Explicit children win (legacy claim-and-render wrappers); otherwise dispatch
  // on the slot's current binding via the registry.
  const content =
    children ??
    renderSlotFromRegistry(getChatViewEntityBinding(slotBindings[slot]), slot, registry);

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
      {content}
    </section>
  );
};
