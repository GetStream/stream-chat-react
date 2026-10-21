import clsx from 'clsx';
import React from 'react';

import { WorkspacePanelProvider } from '../../../context/WorkspaceNavigationContext';
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

  // Explicit children win over the renderer the registry picks for the slot's binding.
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
      {/* Whatever the slot shows is in this panel, so its controls act on this slot. */}
      <WorkspacePanelProvider panel={slot}>
        {layers.length === 0 ? (
          // No layers: render the base content directly.
          baseContent
        ) : (
          // Base and layers stay mounted and only the topmost is shown (`display: contents`, the
          // rest `hidden`), so a layer keeps its state. Keyed by binding key, not index. The base
          // remounts when the first layer is pushed and when the last is popped.
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
      </WorkspacePanelProvider>
    </section>
  );
};
