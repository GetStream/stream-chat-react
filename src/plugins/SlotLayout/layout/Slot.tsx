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
  const { hiddenSlots, slotBindings, slotLayers } = useLayoutViewState();
  const registry = useSlotRegistry();
  const hidden = !!hiddenSlots?.[slot];
  const layers = slotLayers?.[slot] ?? [];

  // Explicit children win (legacy claim-and-render wrappers); otherwise dispatch
  // on the slot's current binding via the registry.
  const baseContent =
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
      {layers.length === 0 ? (
        // Fast path: no layers — render the base content directly (unchanged structure).
        baseContent
      ) : (
        // Layered: base + each layer kept mounted; only the topmost is shown. Non-top layers get
        // the `hidden` attribute (display:none) so their subtree state is preserved; the visible
        // layer uses `display: contents` so it lays out exactly as a direct child would. Each entry
        // is keyed by its binding identity (`LayoutSlotBinding.key`, the same key the controller
        // dedupes on) — not the array index — so a layer keeps its subtree as the stack changes.
        <>
          {[
            { key: 'base', node: baseContent },
            ...layers.map((layer) => {
              const entity = getChatViewEntityBinding(layer);
              return {
                key: layer.key ?? `layer:${entity?.kind ?? 'unknown'}`,
                node: renderSlotFromRegistry(entity, slot, registry),
              };
            }),
          ].map(({ key, node }, index, all) => {
            const isTop = index === all.length - 1;
            return (
              <div
                aria-hidden={!isTop || undefined}
                className='str-chat__chat-view__slot-layer'
                hidden={!isTop}
                key={key}
                style={isTop ? { display: 'contents' } : undefined}
              >
                {node}
              </div>
            );
          })}
        </>
      )}
    </section>
  );
};
