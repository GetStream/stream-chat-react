import { useCallback, useEffect, useRef, useState } from 'react';

import { prefersReducedMotion, useIsomorphicLayoutEffect } from '../../utils';

// How far from the end still counts as at the end, in pixels.
const END_SLACK = 32;

type HeldTurn = { id: string; top: number };

const scrollScroller = (scroller: HTMLElement, top: number, smooth: boolean) => {
  if (typeof scroller.scrollTo !== 'function') {
    scroller.scrollTop = top;
    return;
  }
  scroller.scrollTo({
    behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    top,
  });
};

export type UseTurnScrollerParams = {
  /** The room a floating composer takes at the bottom of the scroller. */
  bottomInset: number;
  firstTurnId: string | undefined;
  hasTurns: boolean;
  lastTurnId: string | undefined;
  /** Whether a spinner above the turns loads older messages. */
  loadsOlder: boolean;
};

/**
 * How a conversation scrolls: it opens at its end, a new question pins to the top, older
 * messages arriving above leave the turns in view where they were, and whether the end is in
 * view, for the scroll-to-latest button. The turns register their elements in `turnElements`.
 */
export const useTurnScroller = ({
  bottomInset,
  firstTurnId,
  hasTurns,
  lastTurnId,
  loadsOlder,
}: UseTurnScrollerParams) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const turnElements = useRef(new Map<string, HTMLDivElement>());
  const [height, setHeight] = useState(0);
  const [isEndInView, setIsEndInView] = useState(true);
  const lastTurnIdRef = useRef<string | undefined>(undefined);
  lastTurnIdRef.current = lastTurnId;
  const bottomInsetRef = useRef(bottomInset);
  bottomInsetRef.current = bottomInset;

  // The end is where the latest turn's content ends, above the floating composer: not the
  // room the latest turn's minimum height leaves under a short reply.
  const checkEnd = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const turn =
      lastTurnIdRef.current === undefined
        ? undefined
        : turnElements.current.get(lastTurnIdRef.current);
    const last = turn?.lastElementChild as HTMLElement | null | undefined;
    const end = last
      ? last.offsetTop + last.offsetHeight
      : scroller.scrollHeight - bottomInsetRef.current;
    const visibleEnd =
      scroller.scrollTop + scroller.clientHeight - bottomInsetRef.current;
    setIsEndInView(end <= visibleEnd + END_SLACK);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setHeight(scroller.clientHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setHeight(scroller.clientHeight);
      checkEnd();
    });
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [checkEnd]);

  // Content that grows without the conversation rendering, such as an answer typing out or an
  // image loading, moves the end too.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => checkEnd());
    observer.observe(content);
    return () => observer.disconnect();
  }, [checkEnd, hasTurns]);

  // Where the turns in view were, the one at the top first, so older messages arriving above
  // them leave them in place.
  const held = useRef<HeldTurn[]>([]);
  const noteHeld = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const top = scroller.scrollTop;
    const bottom = top + scroller.clientHeight;
    held.current = [...turnElements.current]
      .map(([id, element]) => ({ element, id }))
      .filter(
        ({ element }) =>
          element.offsetTop + element.offsetHeight > top && element.offsetTop < bottom,
      )
      .sort((a, b) => a.element.offsetTop - b.element.offsetTop)
      .map(({ element, id }) => ({ id, top: element.offsetTop - top }));
  }, []);

  // Noting where the turns are reads the layout of each, so scrolling does it once a frame.
  const scrollFrame = useRef<number | undefined>(undefined);
  const onScroll = () => {
    if (scrollFrame.current !== undefined) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = undefined;
      noteHeld();
      checkEnd();
    });
  };
  useEffect(() => () => cancelAnimationFrame(scrollFrame.current ?? 0), []);

  const scrollToEnd = useCallback((smooth: boolean) => {
    const scroller = scrollerRef.current;
    if (scroller) scrollScroller(scroller, scroller.scrollHeight, smooth);
  }, []);

  const shown = useRef<{
    firstTurnId?: string;
    height: number;
    lastTurnId?: string;
    loadsOlder: boolean;
    mounted: boolean;
  }>({ height: 0, loadsOlder, mounted: false });

  // Runs when the turns around what is in view change, not on every render: a reply streaming in
  // grows only the latest turn, which the observers above follow.
  useIsomorphicLayoutEffect(() => {
    const previous = shown.current;
    shown.current = { firstTurnId, height, lastTurnId, loadsOlder, mounted: true };
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Opens at its end, and again once its height is known, which sets the latest turn's
    // minimum height and so where the end is.
    if (!previous.mounted || (previous.height === 0 && height > 0)) {
      scroller.scrollTop = scroller.scrollHeight;
    } else if (
      previous.firstTurnId !== undefined &&
      (previous.firstTurnId !== firstTurnId || previous.loadsOlder !== loadsOlder) &&
      previous.lastTurnId === lastTurnId
    ) {
      // Older messages arrived above what is in view, or the spinner came or went: the turn at
      // the top goes back to where it was, rather than being pushed. The top one can be gone: a
      // turn that starts with a reply joins the turn of its question when older messages bring it.
      const anchor = held.current.find(({ id }) => turnElements.current.has(id));
      const element = anchor && turnElements.current.get(anchor.id);
      if (anchor && element) scroller.scrollTop = element.offsetTop - anchor.top;
    } else if (lastTurnId !== previous.lastTurnId && lastTurnId !== undefined) {
      // A new question pins to the top, once laid out at least as tall as the conversation. A
      // conversation replaced as a whole opens at its end.
      const continues =
        previous.lastTurnId !== undefined &&
        turnElements.current.has(previous.lastTurnId);
      const element = turnElements.current.get(lastTurnId);
      if (continues && element) scrollScroller(scroller, element.offsetTop, true);
      else scroller.scrollTop = scroller.scrollHeight;
    }
    noteHeld();
    checkEnd();
  }, [checkEnd, firstTurnId, height, lastTurnId, loadsOlder, noteHeld]);

  return {
    contentRef,
    height,
    isEndInView,
    onScroll,
    scrollerRef,
    scrollToEnd,
    turnElements,
  };
};
