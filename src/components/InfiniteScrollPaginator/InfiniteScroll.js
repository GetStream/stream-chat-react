// @ts-check
import React, { useCallback, useRef, useEffect } from 'react';

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 * @param {Event} e
 */
const mousewheelListener = (e) => {
  if (e instanceof WheelEvent && e.deltaY === 1) {
    e.preventDefault();
  }
};

/**
 * @param {HTMLElement | Element | null} el
 * @returns {number}
 */
const calculateTopPosition = (el) => {
  if (el instanceof HTMLElement) {
    return el.offsetTop + calculateTopPosition(el.offsetParent);
  }
  return 0;
};

/**
 * Computes by recursively summing offsetTop until an element without offsetParent is reached
 * @param {HTMLElement} el
 * @param {number} scrollTop
 */
const calculateOffset = (el, scrollTop) => {
  if (!el) {
    return 0;
  }

  return (
    calculateTopPosition(el) +
    (el.offsetHeight - scrollTop - window.innerHeight)
  );
};

/** @type {React.FC<import("types").InfiniteScrollProps>} */
// eslint-disable-next-line sonarjs/cognitive-complexity
const InfiniteScroll = (props) => {
  const {
    children,
    element = 'div',
    hasMore = false,
    initialLoad = true,
    isReverse = false,
    loader,
    loadMore,
    threshold = 250,
    useCapture = false,
    useWindow = true,
    isLoading = false,
    ...elementProps
  } = props;
  /** @type {React.MutableRefObject<HTMLElement | null>} */
  const scrollComponent = useRef(null);

  const scrollListener = useCallback(() => {
    const el = scrollComponent.current;
    if (!el) return;
    const { parentElement } = el;

    const scrollEl = window;

    let offset = 0;
    if (useWindow) {
      const doc =
        document.documentElement || document.body.parentNode || document.body;
      const scrollTop =
        scrollEl.pageYOffset !== undefined
          ? scrollEl.pageYOffset
          : doc.scrollTop;
      offset = isReverse ? scrollTop : calculateOffset(el, scrollTop);
    } else if (parentElement) {
      offset = isReverse
        ? parentElement.scrollTop
        : el.scrollHeight -
          parentElement.scrollTop -
          parentElement.clientHeight;
    }

    // Here we make sure the element is visible as well as checking the offset
    if (
      offset < Number(threshold) &&
      el.offsetParent !== null &&
      typeof loadMore === 'function'
    ) {
      loadMore();
    }
  }, [isReverse, loadMore, threshold, useWindow]);

  const attachListeners = useCallback(() => {
    if (!hasMore || isLoading || !scrollComponent.current?.parentNode) {
      return;
    }

    const scrollEl = useWindow ? window : scrollComponent.current?.parentNode;

    scrollEl.addEventListener('scroll', scrollListener, useCapture);
    scrollEl.addEventListener('resize', scrollListener, useCapture);

    if (initialLoad) {
      scrollListener();
    }
  }, [hasMore, initialLoad, scrollListener, isLoading, useCapture, useWindow]);

  const detachScrollListeners = useCallback(() => {
    const scrollEl = useWindow ? window : scrollComponent.current?.parentNode;
    if (!scrollEl) return;

    scrollEl.removeEventListener('scroll', scrollListener, useCapture);
    scrollEl.removeEventListener('resize', scrollListener, useCapture);
  }, [useCapture, useWindow, scrollListener]);

  useEffect(() => {
    attachListeners();
    return () => {
      detachScrollListeners();
    };
  });

  useEffect(() => {
    const scrollEl = useWindow ? window : scrollComponent.current?.parentNode;
    if (!scrollEl) return () => {};
    scrollEl.addEventListener('mousewheel', mousewheelListener, useCapture);
    return () =>
      scrollEl.removeEventListener(
        'mousewheel',
        mousewheelListener,
        useCapture,
      );
  }, [useCapture, useWindow]);

  /** @param {HTMLElement} e */
  elementProps.ref = (e) => {
    scrollComponent.current = e;
  };

  const childrenArray = [children];
  if (isLoading && loader) {
    if (isReverse) {
      childrenArray.unshift(loader);
    } else {
      childrenArray.push(loader);
    }
  }
  return React.createElement(element, elementProps, childrenArray);
};

export default InfiniteScroll;
