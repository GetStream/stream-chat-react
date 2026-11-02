import React, { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { useComponentContext } from '../../context/ComponentContext';
import { useFloatingDateSeparatorMessageList } from './hooks/MessageList';
import { useFloatingDateSeparator } from './hooks/VirtualizedMessageList';
import { VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR } from './hooks/floatingDateSlot';
import { useIsScrolling } from './hooks/useIsScrolling';
import type { RenderedMessage } from './utils';

/** How long the floating date stays up after the last `scroll` event, so it never rests over a message. */
const FLOATING_DATE_IDLE_HIDE_MS = 1000;

/**
 * The scroller is an element whose inline separators can be queried and measured against its top
 * edge. A window scroller is not.
 */
const canMeasureFloatingSlot = (
  scrollElement: HTMLElement | Window | null,
): scrollElement is HTMLElement =>
  scrollElement !== null && 'querySelectorAll' in scrollElement;

/** Start of `date`'s local calendar day, the unit a date separator labels. */
const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * In `VirtualizedMessageList` every rendered separator from the first rendered item on falls on the
 * same day as that item or later, so a measured date on an earlier day comes from items Virtuoso
 * had not yet swapped out when the list was measured, e.g. right after a jump down.
 */
const isOnEarlierDayThanFirstRenderedItem = (
  measuredDate: Date,
  firstRenderedItemDate: Date | null,
) =>
  firstRenderedItemDate !== null &&
  getStartOfDay(measuredDate) < getStartOfDay(firstRenderedItemDate);

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

  const isVirtualized = 'itemsRenderedRef' in props;
  // Without date separators nothing floats, so no hook below listens to the list.
  const scrollElement = !withDateSeparator
    ? null
    : 'scrollElement' in props
      ? props.scrollElement
      : props.listElement;
  const measuredElement = canMeasureFloatingSlot(scrollElement) ? scrollElement : null;

  const virtuosoResult = useFloatingDateSeparator({
    processedMessages,
    withDateSeparator,
  });
  const measured = useFloatingDateSeparatorMessageList({
    datedSeparatorSelector: isVirtualized
      ? VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR
      : undefined,
    listElement: measuredElement,
    processedMessages,
    withDateSeparator,
  });
  const measuredDate = measuredElement ? measured.floatingDate : null;

  const { firstRenderedItemDate, isFirstRenderedItemDateSeparator } = virtuosoResult;
  const currentMeasuredDate =
    measuredDate &&
    !isOnEarlierDayThanFirstRenderedItem(measuredDate, firstRenderedItemDate)
      ? measuredDate
      : null;
  // `VirtualizedMessageList` unmounts separators far above the viewport, so when none of the
  // rendered ones has scrolled past the top, the date comes from the first rendered item. A
  // separator as that item gives no date: its label is still on screen.
  const floatingDate = isVirtualized
    ? (currentMeasuredDate ??
      (isFirstRenderedItemDateSeparator ? null : firstRenderedItemDate))
    : measuredDate;
  // A window scroller can't be measured, so an inline separator as the first rendered item stands in
  // for one sitting where the floating separator is drawn. That holds while Virtuoso renders nothing
  // above the viewport (`overscan` and `increaseViewportBy.top` of 0, the list's defaults).
  const isInlineSeparatorInFloatingSlot = measuredElement
    ? measured.isFloatingSlotTaken
    : isFirstRenderedItemDateSeparator;

  const isScrolling = useIsScrolling(scrollElement, FLOATING_DATE_IDLE_HIDE_MS);

  const itemsRenderedRef = isVirtualized ? props.itemsRenderedRef : null;
  useLayoutEffect(() => {
    if (!itemsRenderedRef) return;
    itemsRenderedRef.current = virtuosoResult.onItemsRendered;
    return () => {
      itemsRenderedRef.current = null;
    };
  }, [itemsRenderedRef, virtuosoResult.onItemsRendered]);

  if (
    !isScrolling ||
    !floatingDate ||
    isInlineSeparatorInFloatingSlot ||
    !DateSeparator
  ) {
    return null;
  }

  return <DateSeparator date={floatingDate} floating />;
};
