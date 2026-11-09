import type { PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { useGalleryContext } from 'stream-chat-react';

/** How far, in pixels, a pointer has to travel sideways to count as a swipe. */
const SWIPE_DISTANCE = 50;

/** Whether a key press belongs to a video's own controls, where the arrows seek. */
const isInVideo = (target: EventTarget | null) =>
  target instanceof Element && !!target.closest('video');

/**
 * Keyboard and swipe navigation for the lightbox. The arrow keys step to the previous or next
 * item, Home and End jump to the first and last. Returns pointer handlers for the element a swipe
 * starts on: a drag of at least {@link SWIPE_DISTANCE} pixels, more sideways than up or down,
 * steps in the direction the content moves, with a finger, a pen or the mouse.
 */
export const useLightboxNavigation = () => {
  const { goToIndex, goToNext, goToPrevious, itemCount } = useGalleryContext();
  const swipeStart = useRef<{ x: number; y: number }>(undefined);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInVideo(event.target)) return;
      const step = {
        ArrowLeft: goToPrevious,
        ArrowRight: goToNext,
        End: () => goToIndex(itemCount - 1),
        Home: () => goToIndex(0),
      }[event.key];
      if (!step) return;
      event.preventDefault();
      step();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [goToIndex, goToNext, goToPrevious, itemCount]);

  return {
    onPointerCancel: () => {
      swipeStart.current = undefined;
    },
    onPointerDown: (event: PointerEvent) => {
      // A drag on a video's timeline seeks; it isn't a swipe.
      if (isInVideo(event.target)) return;
      swipeStart.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent) => {
      const start = swipeStart.current;
      swipeStart.current = undefined;
      if (!start) return;
      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaX) <= Math.abs(deltaY))
        return;
      if (deltaX < 0) goToNext();
      else goToPrevious();
    },
  };
};
