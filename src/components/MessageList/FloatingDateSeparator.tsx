import React, { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { useComponentContext } from '../../context/ComponentContext';
import { useFloatingDateSeparatorMessageList } from './hooks/MessageList';
import { useFloatingDateSeparator } from './hooks/VirtualizedMessageList';
import { useIsFloatingDateSlotTaken } from './hooks/useIsFloatingDateSlotTaken';
import { useIsScrolling } from './hooks/useIsScrolling';
import type { RenderedMessage } from './utils';

/** How long the floating date stays up after the last `scroll` event, so it never rests over a message. */
const FLOATING_DATE_IDLE_HIDE_MS = 1000;

type BaseProps = {
  processedMessages: RenderedMessage[];
  withDateSeparator: boolean;
};

export type FloatingDateSeparatorProps = BaseProps &
  (
    | {
        /** For `VirtualizedMessageList`: ref the parent calls with the rendered items. */
        itemsRenderedRef: RefObject<((rendered: RenderedMessage[]) => void) | null>;
        /** For `VirtualizedMessageList`: the element (or window) Virtuoso scrolls. */
        scrollElement: HTMLElement | Window | null;
      }
    | {
        /** For `MessageList`: scroll container queried for the in-flow date separators. */
        listElement: HTMLDivElement | null;
      }
  );

/**
 * Renders a floating date separator while the list is being scrolled and the in-flow date has
 * scrolled out of view. Its state is internal so the parent list does not re-render when it changes.
 * Pass `itemsRenderedRef` and `scrollElement` for `VirtualizedMessageList` and `listElement` for
 * `MessageList`.
 */
export const FloatingDateSeparator = (props: FloatingDateSeparatorProps) => {
  const { DateSeparator = DefaultDateSeparator } = useComponentContext();
  const { processedMessages, withDateSeparator } = props;

  const listElement = 'listElement' in props ? props.listElement : null;
  const useDomMode = listElement != null;

  const virtuosoResult = useFloatingDateSeparator({
    processedMessages,
    withDateSeparator,
  });
  const domResult = useFloatingDateSeparatorMessageList({
    listElement,
    processedMessages,
    withDateSeparator,
  });

  // Without date separators nothing floats, so neither hook below listens to the list.
  const scrollElement = !withDateSeparator
    ? null
    : 'scrollElement' in props
      ? props.scrollElement
      : listElement;
  // The rendered-items callback carries no geometry, so the virtualized list checks the DOM for an
  // inline separator below the first item that already sits where the floating one would be drawn.
  const isSlotTakenInVirtualizedList = useIsFloatingDateSlotTaken(
    useDomMode ? null : scrollElement,
  );

  const floatingDate = useDomMode ? domResult.floatingDate : virtuosoResult.floatingDate;
  const showFloatingDate = useDomMode
    ? domResult.showFloatingDate
    : virtuosoResult.showFloatingDate && !isSlotTakenInVirtualizedList;

  const isScrolling = useIsScrolling(scrollElement, FLOATING_DATE_IDLE_HIDE_MS);

  const itemsRenderedRef = 'itemsRenderedRef' in props ? props.itemsRenderedRef : null;
  useLayoutEffect(() => {
    if (!itemsRenderedRef) return;
    itemsRenderedRef.current = virtuosoResult.onItemsRendered;
    return () => {
      itemsRenderedRef.current = null;
    };
  }, [itemsRenderedRef, virtuosoResult.onItemsRendered]);

  if (!isScrolling || !showFloatingDate || !floatingDate || !DateSeparator) return null;

  return <DateSeparator date={floatingDate} floating />;
};
