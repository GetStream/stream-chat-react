import { commands } from 'vitest/browser';

import type { FrameSample, Mounted } from './harness';
import { isListVisible, readGeometry, readRenderedItems, renderCounts } from './harness';
import { probe } from './virtuosoProbe';
import type { ProbeEvent } from './virtuosoProbe';

declare module 'vitest/browser' {
  interface BrowserCommands {
    setCpuThrottlingRate: (rate: number) => Promise<boolean>;
    writeVirtuosoTrace: (name: string, json: string) => Promise<void>;
  }
}

declare const VIRTUOSO_TEST_RUNTIME: string;

/** Which react-virtuoso runtime this project bundles: `browser-v2` or `browser-v4`. */
export const RUNTIME =
  typeof VIRTUOSO_TEST_RUNTIME === 'string' ? VIRTUOSO_TEST_RUNTIME : '';

/** Inline style properties whose values follow the content; only their presence is compared. */
const LAYOUT_DEPENDENT_STYLES = new Set([
  'height',
  'margin-top',
  'padding-bottom',
  'padding-top',
  'top',
  'transform',
]);

const describeElement = (element: Element | null | undefined) => {
  if (!element) return null;
  const attributes = Array.from(element.attributes)
    .filter((attribute) => attribute.name !== 'style')
    .map((attribute) =>
      // The item's position and message are compared as `rendered` and `firstVisible`.
      attribute.name.startsWith('data-') && /index|size|message-id/.test(attribute.name)
        ? attribute.name
        : `${attribute.name}=${attribute.value}`,
    )
    .sort();
  const style = (element as HTMLElement).style;
  const styles = Array.from({ length: style?.length ?? 0 }, (_, i) => style[i])
    .map((property) =>
      LAYOUT_DEPENDENT_STYLES.has(property)
        ? property
        : `${property}:${style.getPropertyValue(property)}`,
    )
    .sort();
  return { attributes, styles, tag: element.tagName.toLowerCase() };
};

/** The scroller, viewport and item list Virtuoso renders, without content-dependent values. */
export const describeDom = (frame: HTMLElement) => {
  const scroller = frame.querySelector('[data-virtuoso-scroller]');
  const viewport = scroller?.querySelector('[data-viewport-type]');
  const list = scroller?.querySelector(
    '[data-testid="virtuoso-item-list"], [data-test-id="virtuoso-item-list"]',
  );
  const firstItem = scroller?.querySelector('[data-item-index]');
  return {
    firstItem: describeElement(firstItem),
    list: describeElement(list),
    scroller: describeElement(scroller),
    viewport: describeElement(viewport),
  };
};

export type Checkpoint = {
  label: string;
  geometry: ReturnType<typeof readGeometry>;
  rendered: string[];
  firstVisible: { id: string; top: number } | null;
  visible: boolean;
  /** IDs rendered at the previous checkpoint and now, whose DOM element was replaced. */
  remounted: string[];
  events: ProbeEvent[];
  requests: Mounted['backend']['requests'];
  paginatorCalls: string[];
  commits: number;
  messageRenders: number;
  dom: ReturnType<typeof describeDom>;
  frames?: FrameSummary;
  /** See `StepOptions.timingDependent`. */
  timingDependent?: boolean;
};

export type FrameSummary = {
  blankFrames: number;
  framesUntilVisible: number;
  maxAnchorShift: number | null;
  finalDistanceFromBottom: number | null;
};

export const summarizeFrames = (samples: FrameSample[]): FrameSummary => {
  const anchors = samples.map((sample) => sample.anchorTop).filter((top) => top !== null);
  const reference = anchors[0] ?? null;
  const firstVisible = samples.findIndex((sample) => sample.visible);
  return {
    blankFrames: samples.filter((sample) => sample.visible && sample.blank).length,
    finalDistanceFromBottom: samples[samples.length - 1]?.distanceFromBottom ?? null,
    framesUntilVisible: firstVisible === -1 ? samples.length : firstVisible,
    maxAnchorShift:
      reference === null
        ? null
        : Math.max(
            ...anchors.map((top) => Math.abs((top as number) - (reference as number))),
          ),
  };
};

/**
 * Records a scenario as a sequence of checkpoints. Each checkpoint holds what changed since the
 * previous one (callbacks, requests, paginator calls, renders) and the list's state at that point.
 */
export const createTrace = (scenario: string, mounted: Mounted) => {
  const checkpoints: Checkpoint[] = [];
  let eventCursor = 0;
  let requestCursor = 0;
  let paginatorCursor = 0;
  let commitCursor = 0;
  let renderCursor = 0;
  let elements = new Map<string, Element>();
  const consoleErrors: string[] = [];

  // Capture phase on the window: sees errors even when a later listener stops their propagation.
  const windowErrors: string[] = [];
  const onWindowError = (event: ErrorEvent) => windowErrors.push(event.message);
  window.addEventListener('error', onWindowError, true);

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    consoleErrors.push(args.map(String).join(' ').slice(0, 300));
    originalError(...args);
  };

  const totalRenders = () =>
    Array.from(renderCounts.values()).reduce((sum, n) => sum + n, 0);

  const checkpoint = (label: string, frames?: FrameSummary) => {
    const items = readRenderedItems(mounted.frame);
    const geometry = readGeometry(mounted.frame);
    const remounted = items
      .filter((item) => elements.has(item.id) && elements.get(item.id) !== item.element)
      .map((item) => item.id);
    elements = new Map(items.map((item) => [item.id, item.element]));
    const visibleItems = items.filter(
      (item) => item.top + item.height > 0.5 && item.top < (geometry?.clientHeight ?? 0),
    );
    const point: Checkpoint = {
      commits: mounted.commits() - commitCursor,
      dom: describeDom(mounted.frame),
      events: probe.events.slice(eventCursor),
      firstVisible: visibleItems[0]
        ? { id: visibleItems[0].id, top: Math.round(visibleItems[0].top) }
        : null,
      frames,
      geometry,
      label,
      messageRenders: totalRenders() - renderCursor,
      paginatorCalls: mounted.paginatorCalls.slice(paginatorCursor),
      remounted,
      rendered: items.map((item) => item.id),
      requests: mounted.backend.requests.slice(requestCursor),
      visible: isListVisible(mounted.frame),
    };
    eventCursor = probe.events.length;
    requestCursor = mounted.backend.requests.length;
    paginatorCursor = mounted.paginatorCalls.length;
    commitCursor = mounted.commits();
    renderCursor = totalRenders();
    checkpoints.push(point);
    return point;
  };

  const save = async (extra: Record<string, unknown> = {}) => {
    console.error = originalError;
    window.removeEventListener('error', onWindowError, true);
    await commands.writeVirtuosoTrace(
      scenario,
      JSON.stringify(
        {
          checkpoints,
          consoleErrors,
          ...extra,
          framesUntilFirstItem: mounted.framesUntilFirstItem,
          runtime: RUNTIME,
          scenario,
          windowErrors,
        },
        null,
        2,
      ),
    );
  };

  return { checkpoint, checkpoints, consoleErrors, save, windowErrors };
};
