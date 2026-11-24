import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ComponentType } from 'react';

import type { RenderedMessage } from '../../utils';

/** One call Virtuoso made into the SDK, or the SDK made into Virtuoso. */
export type ProbeEvent = { name: string; value: unknown };

type AnyProps = Record<string, any>;

/**
 * Deliberate breakages injected between the SDK and Virtuoso, to prove the trace comparison
 * notices a behavior change (see "mutation checks" in the upgrade plan). Selected with the
 * `VIRTUOSO_MUTATION` environment variable.
 */
export type VirtuosoMutation =
  | 'atTopThresholdZero'
  | 'computeItemKeyIndex'
  | 'dropFirstRenderedItem'
  | 'firstItemIndexFrozen'
  | 'followOutputUndefined'
  | 'increaseViewportTop'
  | 'noInitialTopMostItemIndex';

declare const VIRTUOSO_TEST_MUTATION: string;

export const activeMutation = (
  typeof VIRTUOSO_TEST_MUTATION === 'string' ? VIRTUOSO_TEST_MUTATION : ''
) as VirtuosoMutation | '';

type ProbeState = {
  events: ProbeEvent[];
  /** The props Virtuoso received on its latest render. */
  lastProps: AnyProps | null;
  frozenFirstItemIndex: number | null;
};

export const probe: ProbeState = {
  events: [],
  frozenFirstItemIndex: null,
  lastProps: null,
};

export const resetProbe = () => {
  probe.events = [];
  probe.frozenFirstItemIndex = null;
  probe.lastProps = null;
};

const record = (name: string, value: unknown) => probe.events.push({ name, value });

/** A JSON copy of a call argument, as it was when the call was made. */
const snapshot = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'function') return 'function';
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, v) => (typeof v === 'function' ? 'function' : v)),
    );
  } catch {
    return String(value);
  }
};

const scrollerKind = (element: unknown) => {
  if (element === null) return 'null';
  if (typeof window !== 'undefined' && element === window) return 'window';
  if (element instanceof HTMLElement) {
    return element.hasAttribute('data-virtuoso-scroller') ? 'scroller' : 'element';
  }
  return typeof element;
};

const renderedIds = (
  items: { originalIndex?: number }[],
  context: AnyProps | undefined,
) => {
  const messages: RenderedMessage[] = context?.processedMessages ?? [];
  return items.map((item) =>
    item.originalIndex === undefined ? '?' : (messages[item.originalIndex]?.id ?? '?'),
  );
};

const wrappers = new WeakMap<object, unknown>();

/** The recording wrapper of `original`, created once per function; `undefined` stays `undefined`. */
function wrap<T>(original: T, make: (original: any) => unknown): T {
  if (typeof original !== 'function') return original;
  if (!wrappers.has(original)) wrappers.set(original, make(original));
  return wrappers.get(original) as T;
}

/**
 * Wraps a Virtuoso component so every callback crossing the SDK ↔ Virtuoso boundary is recorded
 * with its arguments (and, for `followOutput`, its return value), without changing what either
 * side sees. The wrapper adds no DOM, so both runtimes lay out exactly as in an app.
 */
export const wrapVirtuoso = (Virtuoso: ComponentType<AnyProps>) =>
  forwardRef<unknown, AnyProps>(function ProbedVirtuoso(props, ref) {
    const innerRef = useRef<AnyProps | null>(null);
    const contextRef = useRef<AnyProps | undefined>(undefined);
    useImperativeHandle(
      ref,
      () =>
        new Proxy(
          {},
          {
            get: (_target, key: string) => {
              const value = innerRef.current?.[key];
              if (typeof value !== 'function') return value;
              return (...args: unknown[]) => {
                // A copy: react-virtuoso 2 adds defaults to the location object it is given.
                record(`handle.${key}`, snapshot(args[0]));
                return value(...args);
              };
            },
          },
        ),
      [],
    );

    const next: AnyProps = { ...props };

    // Each wrapper is cached per wrapped function, so its identity changes exactly when the SDK's
    // own callback does: Virtuoso must not see a prop change the SDK did not make.
    next.atBottomStateChange = wrap(
      props.atBottomStateChange,
      (original) => (value: boolean) => {
        record('atBottomStateChange', value);
        original(value);
      },
    );
    next.atTopStateChange = wrap(
      props.atTopStateChange,
      (original) => (value: boolean) => {
        record('atTopStateChange', value);
        original(value);
      },
    );
    next.followOutput = wrap(props.followOutput, (original) => (isAtBottom: boolean) => {
      let result = original(isAtBottom);
      if (activeMutation === 'followOutputUndefined' && result === false)
        result = undefined;
      record('followOutput', {
        isAtBottom,
        result: result === undefined ? 'undefined' : result,
      });
      return result;
    });
    next.itemsRendered = wrap(
      props.itemsRendered,
      (original) => (items: { originalIndex?: number }[]) => {
        record('itemsRendered', renderedIds(items, contextRef.current));
        const forwarded =
          activeMutation === 'dropFirstRenderedItem'
            ? items.filter((item) => item.originalIndex !== 0)
            : items;
        original(forwarded);
      },
    );
    next.scrollerRef = wrap(props.scrollerRef, (original) => (element: unknown) => {
      record('scrollerRef', scrollerKind(element));
      original(element);
    });
    next.totalListHeightChanged = wrap(
      props.totalListHeightChanged,
      (original) => (height: number) => {
        record('totalListHeightChanged', Math.round(height));
        original(height);
      },
    );
    contextRef.current = props.context;

    if (activeMutation === 'atTopThresholdZero') next.atTopThreshold = 0;
    if (activeMutation === 'computeItemKeyIndex')
      next.computeItemKey = (index: number) => index;
    if (activeMutation === 'increaseViewportTop')
      next.increaseViewportBy = { bottom: 200, top: 200 };
    if (activeMutation === 'noInitialTopMostItemIndex')
      delete next.initialTopMostItemIndex;
    if (
      activeMutation === 'firstItemIndexFrozen' &&
      typeof props.firstItemIndex === 'number'
    ) {
      probe.frozenFirstItemIndex ??= props.firstItemIndex;
      next.firstItemIndex = probe.frozenFirstItemIndex;
    }

    probe.lastProps = props;
    return <Virtuoso {...next} ref={innerRef} />;
  });
