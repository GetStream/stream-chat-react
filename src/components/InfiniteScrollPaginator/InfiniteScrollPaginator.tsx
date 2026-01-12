import clsx from 'clsx';
import debounce from 'lodash.debounce';
import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD } from '../../constants/limits';

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 */
const mousewheelListener = (event: Event) => {
  if (event instanceof WheelEvent && event.deltaY === 1) {
    event.preventDefault();
  }
};

type InfiniteScrollPaginatorOwnProps = {
  element?: React.ElementType;
  listenToScroll?: (
    distanceFromBottom: number,
    distanceFromTop: number,
    threshold: number,
  ) => void;
  loadNextDebounceMs?: number;
  loadNextOnScrollToBottom?: () => void;
  loadNextOnScrollToTop?: () => void;
  /** Offset from when to start the loadNextPage call */
  threshold?: number;
  useCapture?: boolean;
};

// helper: get the right ref type for a given element/component
type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref'];

// polymorphic props, defaulting to 'div'
export type InfiniteScrollPaginatorProps<C extends React.ElementType = 'div'> =
  PropsWithChildren<
    InfiniteScrollPaginatorOwnProps & {
      element?: C;
    } & Omit<
        React.ComponentPropsWithRef<C>,
        keyof InfiniteScrollPaginatorOwnProps | 'element'
      >
  >;

type InfiniteScrollPaginatorComponent = <C extends React.ElementType = 'div'>(
  props: InfiniteScrollPaginatorProps<C> & {
    ref?: PolymorphicRef<C>;
  },
) => React.ReactNode;

const renderPolymorphic = <C extends React.ElementType>(
  Comp: C,
  props: React.ComponentPropsWithRef<C> & { ref?: PolymorphicRef<C> },
  children?: React.ReactNode,
) => React.createElement(Comp, props, children);

export const InfiniteScrollPaginator = forwardRef(function InfiniteScrollPaginator<
  E extends React.ElementType = 'div',
>(props: InfiniteScrollPaginatorProps<E>, ref: React.ForwardedRef<unknown>) {
  const {
    children,
    className,
    element: Component = 'div' as E,
    listenToScroll,
    loadNextDebounceMs = 500,
    loadNextOnScrollToBottom,
    loadNextOnScrollToTop,
    threshold = DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
    useCapture = false,
    ...componentProps
  } = props;

  const rootRef = useRef<HTMLElement | null>(null);
  const childRef = useRef<HTMLDivElement | null>(null);

  const scrollListener = useMemo(
    () =>
      debounce(() => {
        const root = rootRef.current;
        const child = childRef.current;
        if (!root || root.offsetParent === null || !child) {
          return;
        }

        const distanceFromBottom =
          child.scrollHeight - root.scrollTop - root.clientHeight;
        const distanceFromTop = root.scrollTop;

        if (listenToScroll) {
          listenToScroll(distanceFromBottom, distanceFromTop, threshold);
        }

        if (distanceFromTop < Number(threshold)) {
          loadNextOnScrollToTop?.();
        }

        if (distanceFromBottom < Number(threshold)) {
          loadNextOnScrollToBottom?.();
        }
      }, loadNextDebounceMs),
    [
      listenToScroll,
      loadNextDebounceMs,
      loadNextOnScrollToBottom,
      loadNextOnScrollToTop,
      threshold,
    ],
  );

  useEffect(() => {
    const scrollElement = rootRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', scrollListener, useCapture);

    return () => {
      scrollElement.removeEventListener('scroll', scrollListener, useCapture);
    };
  }, [scrollListener, useCapture]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined' || !scrollListener) return;
    const observer = new ResizeObserver(scrollListener);
    observer.observe(root as Element);

    return () => {
      observer.disconnect();
    };
  }, [scrollListener]);

  useEffect(() => {
    const root = rootRef.current;
    if (root) {
      root.addEventListener('wheel', mousewheelListener, { passive: false });
    }
    return () => {
      if (root) {
        root.removeEventListener('wheel', mousewheelListener, useCapture);
      }
    };
  }, [useCapture]);

  return renderPolymorphic(
    Component as E,
    {
      ...(componentProps as React.ComponentPropsWithRef<E>),
      className: clsx('str-chat__infinite-scroll-paginator', className),
      ref: (node: React.ComponentRef<E> | null) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref && 'current' in ref) {
          (ref as React.RefObject<React.ComponentRef<E> | null>).current = node;
        }
        rootRef.current = node && node instanceof HTMLElement ? node : null;
      },
    },
    React.createElement(
      'div',
      { className: 'str-chat__infinite-scroll-paginator__content', ref: childRef },
      children,
    ),
  );
}) as InfiniteScrollPaginatorComponent;
