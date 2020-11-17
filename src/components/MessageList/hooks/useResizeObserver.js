import { useRef, useCallback } from 'react';

export default function useResizeObserver() {
  const targetList = useRef(
    /** @type { Map<HTMLElement, (height: number) => void> } */ (new Map()),
  );

  const resizeObserver = useRef(
    new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const callback = targetList.current.get(entry.target);
        if (callback) callback(entry.contentRect.height);
      });
    }),
  );

  /** @type {{ (targetElement:HTMLElement, onResizeCallback: (height: number) => void) => void}} */
  const observe = useCallback((targetElement, onResizeCallback) => {
    targetList.current.set(targetElement, onResizeCallback);
    resizeObserver.current.observe(targetElement);
  }, []);

  /** @type {{ (targetElement:HTMLElement) => void}} */
  const unobserve = useCallback((targetElement) => {
    targetList.current.delete(targetElement);
    resizeObserver.current.unobserve(targetElement);
  }, []);

  return {
    observe,
    unobserve,
  };
}
