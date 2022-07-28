import { useEffect, useRef, useState } from 'react';

interface UseDragScrollingParams {
  enabled: boolean;
  scrolledElement: HTMLDivElement | null;
  scrollLeft: (roundRobinEnabled: boolean) => void;
  scrollRight: (roundRobinEnabled: boolean) => void;
  snapClassName: string;
}

export const useDragScrolling = ({
  enabled,
  scrolledElement,
  scrollLeft,
  scrollRight,
  snapClassName,
}: UseDragScrollingParams) => {
  const [scrollByDragIsActive, setScrollByDragIsActive] = useState(false);
  const [startClickX, setStartClickX] = useState<number>(0);
  const startScrollLeft = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const setScrollSnap = (snap: boolean) => {
      if (!scrolledElement) return;
      if (snap) {
        scrolledElement.classList.add(snapClassName);
      } else {
        scrolledElement.classList.remove(snapClassName);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.buttons !== 1) return;
      setScrollByDragIsActive(true);
      setStartClickX(e.clientX);
      startScrollLeft.current = scrolledElement?.scrollLeft || 0;
      setScrollSnap(false);
    };

    const onMouseActionEnd = (e: MouseEvent) => {
      if (!(scrollByDragIsActive && scrolledElement)) return;
      setScrollByDragIsActive(false);
      setStartClickX(0);

      const roundRobinEnabled = false;
      const dragToLeft = startClickX > e.clientX;
      const dragToRight = startClickX < e.clientX;
      if (dragToLeft) {
        scrollRight(roundRobinEnabled);
      } else if (dragToRight) {
        scrollLeft(roundRobinEnabled);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!(scrollByDragIsActive && scrolledElement)) return;
      e.preventDefault();
      scrolledElement.scrollLeft = startScrollLeft.current + startClickX - e.clientX;
    };

    scrolledElement?.addEventListener('mousedown', handleMouseDown);
    scrolledElement?.addEventListener('mouseup', onMouseActionEnd);
    scrolledElement?.addEventListener('mouseleave', onMouseActionEnd);
    scrolledElement?.addEventListener('mousemove', handleMouseMove);

    return () => {
      scrolledElement?.removeEventListener('mousedown', handleMouseDown);
      scrolledElement?.removeEventListener('mouseup', onMouseActionEnd);
      scrolledElement?.removeEventListener('mouseleave', onMouseActionEnd);
      scrolledElement?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [scrolledElement, scrollByDragIsActive, scrollLeft, scrollRight, startClickX]);
};
