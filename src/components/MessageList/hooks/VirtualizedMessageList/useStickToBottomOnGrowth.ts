import { useCallback, useEffect, useRef } from 'react';

type ScrollSnapshot = { atBottom: boolean; scrollHeight: number; scrollTop: number };

/** Frames after a height change in which the list is kept at its bottom. */
const PIN_CHECK_FRAMES = 3;

/** Input with which a reader scrolls a list (or starts to). */
const READER_INPUT_EVENTS = [
  'wheel',
  'touchstart',
  'touchmove',
  'keydown',
  'pointerdown',
] as const;

/** How long after reader input a scroll counts as the reader's. */
const READER_INPUT_SCROLL_WINDOW_MS = 1000;

// Whether a scroll moved the list in the direction its height changed, by no more than that: the
// list compensating for content that grew (or shrank) above the viewport, not a reader.
const isCompensatingScroll = (previous: ScrollSnapshot, next: ScrollSnapshot) => {
  const moved = next.scrollTop - previous.scrollTop;
  const grew = next.scrollHeight - previous.scrollHeight;
  return (
    grew !== 0 &&
    Math.sign(moved) === Math.sign(grew) &&
    Math.abs(moved) <= Math.abs(grew) + 1
  );
};

// The list's own scroll element; a window has no `scrollTop` and is left alone. Duck-typed, as a
// scroller from another window (a popout) is no instance of this window's `HTMLElement`, and a
// server render has no `HTMLElement` at all.
const asScrollElement = (scroller: HTMLElement | Window | null) =>
  scroller && 'scrollTop' in scroller ? scroller : null;

export type UseStickToBottomOnGrowthParams = {
  /**
   * False while new items must not scroll the list: an older window (a page of newer messages
   * loads at its bottom, below the reader), `suppressAutoscroll`. Growth that comes with a change
   * of `itemCount` is then left alone, as it is when this turns true with that change (the last
   * newer page of an older window). Growth of the items already shown (one measuring taller, an
   * image loading) still keeps the reader at the bottom.
   */
  followNewItems: boolean;
  /** Number of items in the list, to tell new items from items that grew. */
  itemCount: number;
  /** The element Virtuoso scrolls; a window scroller is left alone, and so is `null`. */
  scroller: HTMLElement | Window | null;
  /** Distance from the bottom, in pixels, that still counts as being at the bottom. */
  threshold: number;
};

/**
 * Keeps a list that sits at its bottom there while its content changes height: a message rendered
 * for the first time measures taller (or shorter) than estimated, an image loads, a reply streams
 * in. Virtuoso keeps the scroll offset in those cases (or over-compensates it), which leaves the
 * reader short of the latest message.
 *
 * Whether the list sits at its bottom is taken from the last scroll, so a growth, which fires no
 * scroll event, does not change it. Returns the handler for Virtuoso's `totalListHeightChanged`.
 * Only the list's own scroller is moved; a window or custom scroll parent scrolls the page, which
 * the list does not own.
 */
export const useStickToBottomOnGrowth = ({
  followNewItems,
  itemCount,
  scroller,
  threshold,
}: UseStickToBottomOnGrowthParams) => {
  const element = asScrollElement(scroller);
  const atBottomRef = useRef(false);
  // The geometry at the last two scroll events, to tell the list's own compensation from a reader.
  const lastScrollRef = useRef<ScrollSnapshot | null>(null);
  const previousScrollRef = useRef<ScrollSnapshot | null>(null);
  const lastHeightRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  // New items arrived while they are not to be followed: the growth that follows (those items
  // measuring in) is theirs, so the list keeps still until the reader scrolls again. Input alone (a
  // click on a message action) is no scroll, and a scroll the list makes to compensate for that
  // growth is not the reader's. Noted while
  // rendering, as Virtuoso (a child) reports the new height from its layout effects, before any of
  // this component's effects run; repeating it in a StrictMode double render changes nothing.
  const holdUntilScrollRef = useRef(false);
  const itemCountRef = useRef(itemCount);
  const followNewItemsRef = useRef(followNewItems);
  // When the reader last gave input that may scroll the list.
  const readerInputAtRef = useRef(Number.NEGATIVE_INFINITY);
  if (itemCount > itemCountRef.current && !(followNewItems && followNewItemsRef.current))
    holdUntilScrollRef.current = true;
  itemCountRef.current = itemCount;
  followNewItemsRef.current = followNewItems;

  useEffect(() => {
    if (!element) return;
    const onScroll = () => {
      atBottomRef.current =
        element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
      const next = {
        atBottom: atBottomRef.current,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
      const last = lastScrollRef.current;
      const byReader =
        performance.now() - readerInputAtRef.current <= READER_INPUT_SCROLL_WINDOW_MS;
      if (byReader || !last || !isCompensatingScroll(last, next)) {
        holdUntilScrollRef.current = false;
      }
      previousScrollRef.current = last;
      lastScrollRef.current = next;
    };
    // A reader scrolling takes over: a pin scheduled for an earlier growth must not pull them back,
    // even when their first scroll is still within what that growth could explain. The hold on new
    // items is released only by the scroll that follows (see onScroll).
    const onReaderInput = () => {
      readerInputAtRef.current = performance.now();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    onScroll();
    // Capture: runs before Virtuoso's own scroll listener, which renders the newly revealed items at
    // once and so changes the height this reads. What counts is where the reader scrolled to.
    element.addEventListener('scroll', onScroll, { capture: true, passive: true });
    READER_INPUT_EVENTS.forEach((type) =>
      element.addEventListener(type, onReaderInput, { capture: true, passive: true }),
    );
    return () => {
      element.removeEventListener('scroll', onScroll, { capture: true });
      READER_INPUT_EVENTS.forEach((type) =>
        element.removeEventListener(type, onReaderInput, { capture: true }),
      );
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [element, threshold]);

  // Whether the last scroll moved the list in the direction its height changed, by no more than
  // that, from a position at the bottom: the list compensating for content growing (or shrinking)
  // above the viewport, which fires a scroll event before the new height is reported. A reader
  // scrolling up moves against the growth, or further than it.
  const isLayoutCompensation = () => {
    const previous = previousScrollRef.current;
    const last = lastScrollRef.current;
    if (!previous?.atBottom || !last) return false;
    return isCompensatingScroll(previous, last);
  };

  return useCallback(
    (height: number) => {
      const previousHeight = lastHeightRef.current;
      lastHeightRef.current = height;
      // The first report is the list's own initial layout, which Virtuoso positions itself.
      if (previousHeight === 0) return;
      const change = height - previousHeight;
      if (change === 0 || !element) return;
      if (!atBottomRef.current && !isLayoutCompensation()) return;
      if (holdUntilScrollRef.current) return;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // Virtuoso reports the new height before the DOM has it, and may compensate the scroll offset
      // for it a frame later: when content at the bottom measures shorter than estimated, the browser
      // clamps the offset and Virtuoso then subtracts the difference again, which leaves a gap. So
      // the list is checked over the next few frames and pinned whenever it is short of the bottom,
      // as long as it did not move up by more than the change could explain: more than that is the
      // reader scrolling away (its scroll event has not necessarily fired yet).
      const scrollTopAtReport = element.scrollTop;
      const explainedMove = Math.abs(change) + threshold;
      let framesLeft = PIN_CHECK_FRAMES;
      const check = () => {
        frameRef.current = null;
        // New items that are not to be followed may have arrived since this was scheduled.
        if (holdUntilScrollRef.current) return;
        if (scrollTopAtReport - element.scrollTop > explainedMove) return;
        if (element.scrollHeight - element.scrollTop - element.clientHeight > 1) {
          element.scrollTop = element.scrollHeight;
        }
        framesLeft -= 1;
        if (framesLeft > 0) frameRef.current = requestAnimationFrame(check);
      };
      frameRef.current = requestAnimationFrame(check);
    },
    [element, threshold],
  );
};
