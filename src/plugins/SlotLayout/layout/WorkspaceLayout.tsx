import React, { forwardRef, Fragment } from 'react';
import clsx from 'clsx';
import { Slot } from './Slot';
import { ChatViewEmptyPlaceholder } from '../ChatViewEmptyPlaceholder';
import { useLayoutViewState } from '../hooks/useLayoutViewState';
import { getChatViewEntityBinding } from '../slotBinding';
import { hasSlotContent, resolveSlotBaseContent, useSlotRegistry } from '../slotRegistry';

import type { CSSProperties, ReactNode, Ref } from 'react';

export type WorkspaceLayoutSlot = {
  /** Added to the slot's `<section>`, e.g. to size its column. */
  className?: string;
  /**
   * What the slot shows. Without it (`null` or `undefined`), the slot shows its binding through
   * the renderer registered for the bound kind, as {@link Slot} does. `false` shows nothing and
   * hides the binding.
   */
  content?: ReactNode;
  /** A ref to the slot's `<section>`, e.g. to measure it. */
  elementRef?: Ref<HTMLElement>;
  /** Shown while the slot's content (`content`, else its binding's renderer) renders nothing. */
  fallback?: ReactNode;
  slot: string;
  /** Inline style of the slot's `<section>`, e.g. a column width. */
  style?: CSSProperties;
};

export type WorkspaceLayoutProps = {
  /** Added to the layout's root element. */
  className?: string;
  /** The first column, e.g. a view selector. */
  navRail?: ReactNode;
  /**
   * Rendered between each two neighbouring slots, e.g. a resize handle. It is called for every
   * pair, whether or not either slot shows anything, and not while the placeholder replaces the
   * slots.
   */
  renderBetweenSlots?: (previousSlot: string, nextSlot: string) => ReactNode;
  /**
   * Rendered as given between the nav rail and the slots, e.g. a channel list. It stays while the
   * placeholder replaces the slots.
   */
  sidebar?: ReactNode;
  /**
   * The slots to render. {@link ChatViewEmptyPlaceholder} replaces them while none of them shows
   * anything: no slot has `content`, a binding whose renderer renders something, a `fallback` or a
   * layer (a layer counts whatever it renders). Hidden slots count too. `null`, `undefined` and
   * booleans count as nothing.
   */
  slots: WorkspaceLayoutSlot[];
};

/**
 * Lays out a nav rail, a sidebar and a row of slots, each showing what is bound to it with its
 * layers over it. The `ref` is the root element's. Renders inside `ChatView`, whose layout state it
 * reads.
 */
export const WorkspaceLayout = forwardRef<HTMLDivElement, WorkspaceLayoutProps>(
  function WorkspaceLayout(
    { className, navRail, renderBetweenSlots, sidebar, slots },
    ref,
  ) {
    const { slotBindings, slotLayers } = useLayoutViewState();
    const registry = useSlotRegistry();

    // Each slot resolves once, to what it shows, so the empty check and the slots agree and each
    // renderer runs once. `false`, not `null`, keeps `Slot` from resolving the binding again.
    const resolvedSlots = slots.map(({ content, fallback, slot, ...sectionProps }) => ({
      ...sectionProps,
      shown:
        [
          resolveSlotBaseContent(
            content,
            getChatViewEntityBinding(slotBindings[slot]),
            slot,
            registry,
          ),
          fallback,
        ].find(hasSlotContent) ?? false,
      slot,
    }));
    const isSlotShowingAnything = ({ shown, slot }: (typeof resolvedSlots)[number]) =>
      shown !== false || !!slotLayers?.[slot]?.length;
    const isEmpty = !resolvedSlots.some(isSlotShowingAnything);

    return (
      <div className={clsx('str-chat__chat-view__workspace-layout', className)} ref={ref}>
        {navRail ? (
          <div className='str-chat__chat-view__workspace-layout-nav-rail'>{navRail}</div>
        ) : null}
        {sidebar}
        <div
          className={clsx('str-chat__chat-view__workspace-layout-slots', {
            'str-chat__chat-view__workspace-layout-slots--empty': isEmpty,
          })}
        >
          {isEmpty ? (
            <ChatViewEmptyPlaceholder />
          ) : (
            resolvedSlots.flatMap(
              ({ className, elementRef, shown, slot, style }, index) => [
                index > 0 && renderBetweenSlots ? (
                  <Fragment key={`between:${resolvedSlots[index - 1].slot}:${slot}`}>
                    {renderBetweenSlots(resolvedSlots[index - 1].slot, slot)}
                  </Fragment>
                ) : null,
                <Slot
                  className={clsx(
                    'str-chat__chat-view__workspace-layout-slot',
                    className,
                  )}
                  key={`slot:${slot}`}
                  ref={elementRef}
                  slot={slot}
                  style={style}
                >
                  {shown}
                </Slot>,
              ],
            )
          )}
        </div>
      </div>
    );
  },
);
