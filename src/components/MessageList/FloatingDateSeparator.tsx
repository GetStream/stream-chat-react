import React, { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { useComponentContext } from '../../context/ComponentContext';
import { useFloatingDateSeparatorMessageList } from './hooks/MessageList';
import { useFloatingDateSeparator } from './hooks/VirtualizedMessageList';
import type { RenderedMessage } from './utils';

type BaseProps = {
  disableDateSeparator: boolean;
  processedMessages: RenderedMessage[];
};

export type FloatingDateSeparatorProps = BaseProps &
  (
    | {
        /** For VirtualizedMessageList: ref the parent calls with visible items */
        itemsRenderedRef: RefObject<((rendered: RenderedMessage[]) => void) | null>;
      }
    | {
        /** For MessageList: scroll container to query DOM for date separators */
        listElement: HTMLDivElement | null;
      }
  );

/**
 * Renders a floating date separator when the user has scrolled past the in-flow date.
 * State is internal so MessageList/VirtualizedMessageList do not re-render when it changes.
 * Use itemsRenderedRef for Virtuoso, listElement for non-virtualized MessageList.
 */
export const FloatingDateSeparator = (props: FloatingDateSeparatorProps) => {
  const { DateSeparator = DefaultDateSeparator } = useComponentContext(
    'FloatingDateSeparator',
  );
  const { disableDateSeparator, processedMessages } = props;

  const listElement = 'listElement' in props ? props.listElement : null;
  const useDomMode = listElement != null;

  const virtuosoResult = useFloatingDateSeparator({
    disableDateSeparator,
    processedMessages,
  });
  const domResult = useFloatingDateSeparatorMessageList({
    disableDateSeparator,
    listElement,
    processedMessages,
  });

  const floatingDate = useDomMode ? domResult.floatingDate : virtuosoResult.floatingDate;
  const showFloatingDate = useDomMode
    ? domResult.showFloatingDate
    : virtuosoResult.showFloatingDate;

  const itemsRenderedRef = 'itemsRenderedRef' in props ? props.itemsRenderedRef : null;
  useLayoutEffect(() => {
    if (!itemsRenderedRef) return;
    itemsRenderedRef.current = virtuosoResult.onItemsRendered;
    return () => {
      itemsRenderedRef.current = null;
    };
  }, [itemsRenderedRef, virtuosoResult.onItemsRendered]);

  if (!showFloatingDate || !floatingDate || !DateSeparator) return null;

  return <DateSeparator date={floatingDate} floating />;
};
