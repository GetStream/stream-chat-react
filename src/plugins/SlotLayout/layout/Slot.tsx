import clsx from 'clsx';
import React, { forwardRef } from 'react';

import { WorkspacePanelProvider } from '../../../context/WorkspaceNavigationContext';
import { useLayoutViewState } from '../hooks/useLayoutViewState';
import { getChatViewEntityBinding } from '../slotBinding';
import {
  hasSlotContent,
  renderSlotFromRegistry,
  resolveSlotBaseContent,
  useSlotRegistry,
} from '../slotRegistry';

import type { CSSProperties, ReactNode } from 'react';

export type SlotProps = {
  children?: ReactNode;
  className?: string;
  slot: string;
  /** Inline style of the slot's `<section>`. */
  style?: CSSProperties;
};

/**
 * One entry of a slot's stack: its base or a layer. Only the topmost entry is shown; the rest stay
 * mounted, so each keeps its state while covered. `display` is set inline so that no stylesheet
 * can show a covered entry or give the shown one a box of its own.
 */
const renderSlotStackEntry = (key: string, content: ReactNode, isTop: boolean) => (
  <div
    aria-hidden={!isTop || undefined}
    className='str-chat__chat-view__slot-layer'
    hidden={!isTop}
    key={key}
    style={{ display: isTop ? 'contents' : 'none' }}
  >
    {content}
  </div>
);

/**
 * Renders what is bound to `slot`, through the renderer registered for the bound kind, with the
 * slot's layers over it. `children` replace the bound content as the slot's base.
 *
 * The slot is `:empty` while it has no `children`, no bound content and no layers. An element
 * passed as `children` keeps it from being `:empty` even if its component renders nothing; the
 * stylesheet hides such a slot all the same.
 *
 * The `ref` is the slot's `<section>`.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, className, slot, style },
  ref,
) {
  const { hiddenSlots, slotBindings, slotLayers } = useLayoutViewState();
  const registry = useSlotRegistry();
  const hidden = !!hiddenSlots?.[slot];
  const layers = slotLayers?.[slot] ?? [];

  // Explicit children win over the renderer the registry picks for the slot's binding.
  const baseContent = resolveSlotBaseContent(
    children,
    getChatViewEntityBinding(slotBindings[slot]),
    slot,
    registry,
  );

  return (
    <section
      aria-hidden={hidden || undefined}
      className={clsx(
        'str-chat__chat-view__slot',
        { 'str-chat__chat-view__slot--hidden': hidden },
        className,
      )}
      data-slot={slot}
      ref={ref}
      style={style}
    >
      {/* Whatever the slot shows is in this panel, so its controls act on this slot. */}
      <WorkspacePanelProvider panel={slot}>
        {/* The base keeps the same key with or without layers, so the first layer opening and the
            last one closing leave it mounted. Layers are keyed by binding key, not index, and
            prefixed so no binding key can collide with the base's. */}
        {[
          hasSlotContent(baseContent)
            ? renderSlotStackEntry('base', baseContent, layers.length === 0)
            : null,
          ...layers.map((layer, index) => {
            const entity = getChatViewEntityBinding(layer);
            return renderSlotStackEntry(
              `layer:${layer.key ?? entity?.kind ?? 'unknown'}`,
              renderSlotFromRegistry(entity, slot, registry),
              index === layers.length - 1,
            );
          }),
        ]}
      </WorkspacePanelProvider>
    </section>
  );
});
