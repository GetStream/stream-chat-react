import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { InfiniteScrollPaginator } from '../InfiniteScrollPaginator';

const THRESHOLD = 100;
const INTERVAL_MS = 500;
const CONTENT_HEIGHT = 2000;
const VIEWPORT_HEIGHT = 400;

/**
 * jsdom has no layout: give the scroll root a viewport, the content a height and a non-null
 * `offsetParent` (a hidden root is not checked), and let `scrollTop` be set per scroll event.
 */
const setUpLayout = () => {
  const root = screen.getByTestId('paginator-root');
  const content = root.firstElementChild as HTMLElement;
  Object.defineProperties(root, {
    clientHeight: { configurable: true, value: VIEWPORT_HEIGHT },
    offsetParent: { configurable: true, value: document.body },
    scrollTop: { configurable: true, value: CONTENT_HEIGHT, writable: true },
  });
  Object.defineProperty(content, 'scrollHeight', {
    configurable: true,
    value: CONTENT_HEIGHT,
  });
  return root;
};

const scrollTo = (root: HTMLElement, scrollTop: number) => {
  root.scrollTop = scrollTop;
  fireEvent.scroll(root);
};

describe('InfiniteScrollPaginator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const renderPaginator = () => {
    const listenToScroll = vi.fn();
    const loadNextOnScrollToBottom = vi.fn();
    const loadNextOnScrollToTop = vi.fn();
    const renderWithLoader = (loader: () => void) => (
      <InfiniteScrollPaginator
        data-testid='paginator-root'
        listenToScroll={listenToScroll}
        loadNextDebounceMs={INTERVAL_MS}
        loadNextOnScrollToBottom={loadNextOnScrollToBottom}
        loadNextOnScrollToTop={loader}
        threshold={THRESHOLD}
      >
        <div>content</div>
      </InfiniteScrollPaginator>
    );
    const { rerender } = render(renderWithLoader(loadNextOnScrollToTop));
    return {
      listenToScroll,
      loadNextOnScrollToBottom,
      loadNextOnScrollToTop,
      replaceLoader: (loader: () => void) => rerender(renderWithLoader(loader)),
      root: setUpLayout(),
    };
  };

  it('loads the next page on the first scroll within the threshold, without waiting for scrolling to stop', () => {
    const { loadNextOnScrollToTop, root } = renderPaginator();

    scrollTo(root, THRESHOLD - 1);

    expect(loadNextOnScrollToTop).toHaveBeenCalledTimes(1);
  });

  it('checks at most once per interval while scrolling, and once more at its end', () => {
    const { loadNextOnScrollToTop, root } = renderPaginator();

    scrollTo(root, 90);
    scrollTo(root, 60);
    scrollTo(root, 30);

    expect(loadNextOnScrollToTop).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });

    expect(loadNextOnScrollToTop).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });

    expect(loadNextOnScrollToTop).toHaveBeenCalledTimes(2);
  });

  it('loads the next page at once when a scroll within the interval reaches the threshold', () => {
    const { loadNextOnScrollToTop, root } = renderPaginator();

    scrollTo(root, 800);
    scrollTo(root, THRESHOLD - 1);

    expect(loadNextOnScrollToTop).toHaveBeenCalledTimes(1);
  });

  it('loads the next page at once when a scroll within the interval reaches the bottom threshold', () => {
    const { loadNextOnScrollToBottom, loadNextOnScrollToTop, root } = renderPaginator();

    scrollTo(root, 800);
    scrollTo(root, CONTENT_HEIGHT - VIEWPORT_HEIGHT - (THRESHOLD - 1));

    expect(loadNextOnScrollToBottom).toHaveBeenCalledTimes(1);
    expect(loadNextOnScrollToTop).not.toHaveBeenCalled();
  });

  it('reports the distances of the first scroll at once', () => {
    const { listenToScroll, root } = renderPaginator();

    scrollTo(root, 800);

    expect(listenToScroll).toHaveBeenCalledWith(
      CONTENT_HEIGHT - 800 - VIEWPORT_HEIGHT,
      800,
      THRESHOLD,
    );
  });

  it('does not load the next page while scrolling outside the threshold', () => {
    const { loadNextOnScrollToTop, root } = renderPaginator();

    scrollTo(root, 800);
    scrollTo(root, 600);
    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });

    expect(loadNextOnScrollToTop).not.toHaveBeenCalled();
  });

  it('does not run a check left for the end of the interval with a replaced loader', () => {
    const { loadNextOnScrollToTop, replaceLoader, root } = renderPaginator();

    scrollTo(root, 90);
    scrollTo(root, 60);
    replaceLoader(vi.fn());
    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });

    expect(loadNextOnScrollToTop).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])(
    'stops preventing wheel events after unmount with useCapture as %s',
    (useCapture) => {
      const { container, unmount } = render(
        <InfiniteScrollPaginator useCapture={useCapture} />,
      );
      const root = container.firstElementChild as HTMLElement;

      const mountedWheelEvent = new WheelEvent('wheel', { cancelable: true, deltaY: 1 });
      root.dispatchEvent(mountedWheelEvent);
      expect(mountedWheelEvent.defaultPrevented).toBe(true);

      unmount();

      const wheelEvent = new WheelEvent('wheel', { cancelable: true, deltaY: 1 });
      root.dispatchEvent(wheelEvent);
      expect(wheelEvent.defaultPrevented).toBe(false);
    },
  );
});
