// @ts-check
import React, { useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

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

/** @param {import("types").InfiniteScrollProps} props */
const InfiniteScroll = ({
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
  listenToScroll,
  ...elementProps
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const scrollComponent = useRef(/** @type {HTMLElement | null} */ (null));

  const scrollListener = useCallback(() => {
    const el = scrollComponent.current;
    if (!el) return;
    const { parentElement } = el;

    let offset = 0;
    let reverseOffset = 0;
    if (useWindow) {
      const doc =
        document.documentElement || document.body.parentNode || document.body;
      const scrollTop =
        window.pageYOffset !== undefined ? window.pageYOffset : doc.scrollTop;
      offset = calculateOffset(el, scrollTop);
      reverseOffset = scrollTop;
    } else if (parentElement) {
      offset =
        el.scrollHeight - parentElement.scrollTop - parentElement.clientHeight;
      reverseOffset = parentElement.scrollTop;
    }
    if (listenToScroll) listenToScroll(offset, reverseOffset);

    // Here we make sure the element is visible as well as checking the offset
    if (
      (isReverse ? reverseOffset : offset) < Number(threshold) &&
      el.offsetParent !== null &&
      typeof loadMore === 'function'
    ) {
      loadMore();
    }
  }, [useWindow, isReverse, threshold, listenToScroll, loadMore]);

  useEffect(() => {
    const scrollEl = useWindow ? window : scrollComponent.current?.parentNode;
    if (!hasMore || isLoading || !scrollEl) {
      return () => {};
    }

    scrollEl.addEventListener('scroll', scrollListener, useCapture);
    scrollEl.addEventListener('resize', scrollListener, useCapture);

    if (initialLoad) {
      scrollListener();
    }

    return () => {
      scrollEl.removeEventListener('scroll', scrollListener, useCapture);
      scrollEl.removeEventListener('resize', scrollListener, useCapture);
    };
  }, [hasMore, initialLoad, isLoading, scrollListener, useCapture, useWindow]);

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

  const attributes = {
    ...elementProps,
    /** @param {HTMLElement} e */
    ref: (e) => {
      scrollComponent.current = e;
    },
  };

  const childrenArray = [children];
  if (isLoading && loader) {
    if (isReverse) {
      childrenArray.unshift(loader);
    } else {
      childrenArray.push(loader);
    }
  }
  return React.createElement(element, attributes, childrenArray);
};

InfiniteScroll.propTypes = {
  element: PropTypes.elementType,
  hasMore: PropTypes.bool,
  initialLoad: PropTypes.bool,
  isReverse: PropTypes.bool,
  loader: PropTypes.node,
  loadMore: PropTypes.func.isRequired,
  pageStart: PropTypes.number,
  isLoading: PropTypes.bool,
  threshold: PropTypes.number,
  useCapture: PropTypes.bool,
  useWindow: PropTypes.bool,
};

export default InfiniteScroll;
