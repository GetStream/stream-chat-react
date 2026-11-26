import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import clsx from 'clsx';
import { Button, IconArrowDown, IconArrowUp } from 'stream-chat-react';

type ScrollDirection = 'up' | 'down';

// The scroll container the SDK's `ChannelList` renders, and the marker the active (selected) item
// carries (`ChannelListItemUI` sets `aria-selected` on its button). Both are resolved from the DOM
// so this keeps working across list switches and pagination without threading refs through the SDK.
const SCROLL_CONTAINER_SELECTOR = '.str-chat__infinite-scroll-paginator';
const ACTIVE_ITEM_SELECTOR = '[aria-selected="true"]';

/**
 * Floating "Active Channel" button for the example channel list. When the selected channel scrolls
 * out of the list's viewport, this surfaces a secondary/outline button on the list's centre line;
 * clicking it scrolls the active channel back into view. The arrow points the way the list will
 * scroll — up when the active channel sits above the viewport, down when below.
 *
 * `regionRef` wraps the `<ChannelList>`, whose `.str-chat__infinite-scroll-paginator` is the scroll
 * container. The button is a sibling of the list (not a child of the scroll container), so it floats
 * over the list without scrolling with it or being clipped.
 */
export const ScrollToActiveChannelButton = ({
  regionRef,
}: {
  regionRef: RefObject<HTMLDivElement | null>;
}) => {
  const [direction, setDirection] = useState<ScrollDirection | null>(null);
  const activeItemRef = useRef<Element | null>(null);

  const evaluate = useCallback(() => {
    const region = regionRef.current;
    const container = region?.querySelector(SCROLL_CONTAINER_SELECTOR);
    // Scope the active-item lookup to the scroll container: sideloaded items above the list also
    // carry `aria-selected`, but they are not what this button scrolls to.
    const activeItem = container?.querySelector(ACTIVE_ITEM_SELECTOR) ?? null;
    activeItemRef.current = activeItem;

    if (!container || !activeItem) {
      setDirection(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const fullyVisible =
      itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

    if (fullyVisible) {
      setDirection(null);
    } else {
      // Above the viewport → scroll up to reach it; otherwise it is below → scroll down.
      setDirection(itemRect.top < containerRect.top ? 'up' : 'down');
    }
  }, [regionRef]);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(evaluate);
    };

    // Scroll is captured on the wrapper (scroll events don't bubble), so no ref to the SDK-owned
    // scroll container is needed. Resize + mutations cover list switches, pagination appending
    // items, and selection changes (the active item's `aria-selected` toggling).
    region.addEventListener('scroll', schedule, true);
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(region);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(region, {
      attributeFilter: ['aria-selected'],
      attributes: true,
      childList: true,
      subtree: true,
    });

    schedule();

    return () => {
      cancelAnimationFrame(frame);
      region.removeEventListener('scroll', schedule, true);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [evaluate, regionRef]);

  if (!direction) return null;

  return (
    <div
      className={clsx('app-scroll-to-active-channel', {
        [`app-scroll-to-active-channel--${direction}`]: direction,
      })}
    >
      <Button
        appearance='outline'
        onClick={() =>
          activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        size='sm'
        variant='secondary'
      >
        {direction === 'up' ? <IconArrowUp /> : <IconArrowDown />}
        Active Channel
      </Button>
    </div>
  );
};
