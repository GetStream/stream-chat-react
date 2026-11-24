import type { ComponentContextValue } from '../../../../context';
import React, { Profiler, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import type {
  LocalMessage,
  Channel as StreamChannel,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';
import { WithComponents } from '../../../../context';
import { useMessageContext } from '../../../../context/MessageContext';
import { getTestClientWithUser } from '../../../../mock-builders';
import { generateUser } from '../../../../mock-builders/generator';
import { VirtualizedMessageList } from '../../VirtualizedMessageList';
import type { VirtualizedMessageListProps } from '../../VirtualizedMessageList';
import { buildHistory, installFakeBackend } from './fakeBackend';
import { createRng } from './prng';
import type { Rng } from './prng';
import { probe, resetProbe } from './virtuosoProbe';

// ---------------------------------------------------------------------------------------------
// Message heights: the synthetic message UI renders a box of a height looked up here, so item
// geometry is deterministic and can be changed on demand (an image loading, a streamed reply).

type HeightListener = () => void;
const heights = new Map<string, number>();
const heightListeners = new Set<HeightListener>();

export const setMessageHeight = (id: string, height: number) => {
  heights.set(id, height);
  heightListeners.forEach((listener) => listener());
};

const useMessageHeight = (id: string) => {
  const [height, setHeight] = useState(() => heights.get(id) ?? 48);
  useEffect(() => {
    const listener = () => setHeight(heights.get(id) ?? 48);
    heightListeners.add(listener);
    listener();
    return () => {
      heightListeners.delete(listener);
    };
  }, [id]);
  return height;
};

/** How often each message rendered, for the render-count comparison. */
export const renderCounts = new Map<string, number>();

/** Stands in for `MessageUI`: a box of the message's assigned height, tagged with its ID. */
const SyntheticMessage = () => {
  const { message } = useMessageContext();
  const height = useMessageHeight(message.id);
  renderCounts.set(message.id, (renderCounts.get(message.id) ?? 0) + 1);
  return (
    <div
      className='synthetic-message'
      data-message-id={message.id}
      style={{ boxSizing: 'border-box', height, padding: 4 }}
    >
      {message.text}
    </div>
  );
};

// Module-level so the overrides keep one identity across renders, as an app's would.
const NO_OVERRIDES = {};
const SYNTHETIC_OVERRIDES = { VirtualMessage: SyntheticMessage };

// ---------------------------------------------------------------------------------------------
// Mounting

export type MountOptions = {
  /** Total messages on the server. */
  historySize?: number;
  /** Size of the first page and of every following one. */
  pageSize?: number;
  gapMinutes?: number;
  seed?: number;
  listProps?: VirtualizedMessageListProps;
  viewportHeight?: number;
  /** Heights assigned to the messages, by index; a default spread otherwise. */
  heightFor?: (index: number, rng: Rng) => number;
  /** Renders the SDK's own message UI instead of the synthetic boxes. */
  realMessageUI?: boolean;
  /** Further `WithComponents` overrides, over the message UI's. */
  componentOverrides?: Partial<ComponentContextValue>;
  strictMode?: boolean;
  /** Wraps the list, e.g. in a custom scroll parent. */
  wrap?: (list: React.ReactElement) => React.ReactElement;
  /** Runs after the first page loaded and before the list renders, e.g. to jump. */
  beforeRender?: (channel: StreamChannel) => Promise<unknown>;
  /** Counts frames until the first item shows. Off for scenarios that act during those frames. */
  measureMount?: boolean;
};

export type Mounted = Awaited<ReturnType<typeof mountList>>;

export const OWN_USER: UserResponse = {
  id: 'own-user',
  name: 'Own User',
} as UserResponse;

export const mountList = async ({
  beforeRender,
  componentOverrides,
  gapMinutes,
  heightFor = (_index, rng) => rng.pick([40, 48, 64, 96, 140, 220]),
  historySize = 200,
  listProps,
  measureMount = true,
  pageSize = 50,
  realMessageUI = false,
  seed = 1,
  strictMode = false,
  viewportHeight = 600,
  wrap = (list) => list,
}: MountOptions = {}) => {
  resetProbe();
  renderCounts.clear();
  heights.clear();
  const rng = createRng(seed);
  const other = generateUser({ id: 'other-user', name: 'Other User' }) as UserResponse;
  const users = [OWN_USER, other];
  const history = buildHistory({ count: historySize, gapMinutes, rng, users });
  history.forEach((message, index) => heights.set(message.id, heightFor(index, rng)));

  const client = (await getTestClientWithUser(OWN_USER)) as StreamChat;
  const channelId = `virtuoso-${seed}`;
  const backend = installFakeBackend({ channelId, client, history, users });
  const channel = client.channel('messaging', channelId);
  channel.messagePaginator.pageSize = pageSize;
  await channel.watch();
  await beforeRender?.(channel);

  const paginatorCalls: string[] = [];
  const paginator = channel.messagePaginator;
  for (const method of [
    'toTail',
    'toHead',
    'jumpToTheLatestMessage',
    'jumpToMessage',
  ] as const) {
    const original = paginator[method] as (...args: unknown[]) => unknown;
    (paginator as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      paginatorCalls.push(method);
      return original(...args);
    };
  }

  let commits = 0;
  const onRender = () => {
    commits += 1;
  };
  // Builds the tree for the given list props and viewport height, so a test can re-render the list
  // with other props (`rerender`) the way a parent component would.
  const buildTree = (props: VirtualizedMessageListProps | undefined, height: number) => {
    const list = (
      <Profiler id='virtualized-message-list' onRender={onRender}>
        <VirtualizedMessageList {...props} />
      </Profiler>
    );
    const tree = (
      <Chat client={client}>
        <WithComponents
          overrides={{
            ...(realMessageUI ? NO_OVERRIDES : SYNTHETIC_OVERRIDES),
            ...componentOverrides,
          }}
        >
          <Channel channel={channel}>
            <div
              className='str-chat__channel'
              data-testid='list-frame'
              style={{
                display: 'flex',
                flexDirection: 'column',
                height,
                position: 'relative',
                width: 640,
              }}
            >
              {wrap(list)}
            </div>
          </Channel>
        </WithComponents>
      </Chat>
    );
    return strictMode ? <StrictMode>{tree}</StrictMode> : tree;
  };

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const unmount = () => {
    root.unmount();
    container.remove();
    roots.delete(root);
  };
  roots.set(root, unmount);
  let currentProps = listProps;
  let currentHeight = viewportHeight;
  root.render(buildTree(currentProps, currentHeight));
  const rerender = ({
    height = currentHeight,
    props = currentProps,
  }: {
    height?: number;
    props?: VirtualizedMessageListProps;
  }) => {
    currentProps = props;
    currentHeight = height;
    root.render(buildTree(currentProps, currentHeight));
  };
  await waitUntil(
    () => !!container.querySelector('[data-testid="list-frame"]'),
    4000,
    'mount',
  );
  const frame = container.querySelector<HTMLElement>(
    '[data-testid="list-frame"]',
  ) as HTMLElement;

  // Frames from the first render until an item is on screen: the cost of a channel switch.
  let framesUntilFirstItem: number | null = null;
  if (measureMount) {
    for (let frames = 0; frames < 600; frames += 1) {
      if (isListVisible(frame) && readVisibleItems(frame).length > 0) {
        framesUntilFirstItem = frames;
        break;
      }
      await nextFrame();
    }
  }

  return {
    backend,
    channel,
    client,
    commits: () => commits,
    frame,
    framesUntilFirstItem,
    history,
    other,
    paginatorCalls,
    rerender,
    rng,
    unmount,
    users,
  };
};

const roots = new Map<Root, () => void>();

/** Unmounts every list mounted by the current test, as an app does on navigation. */
export const unmountAll = () => {
  Array.from(roots.values()).forEach((unmount) => unmount());
};

// ---------------------------------------------------------------------------------------------
// Driving the list

/** Resolves on the next animation frame. */
export const nextFrame = () =>
  new Promise<number>((resolve) => requestAnimationFrame(resolve));

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const getScroller = (frame: HTMLElement) =>
  frame.querySelector<HTMLElement>('[data-virtuoso-scroller]');

/**
 * What a scroll just done must lead to once the list settles, checked by the scenario runner:
 * - `shift`: the content moved by exactly the scrolled distance. The anchor, the first message on
 *   screen before, sits `applied` pixels further down (up for a positive scroll), whatever Virtuoso
 *   measured or loaded meanwhile.
 * - `bottom`: a scroll to the very bottom stays there while the items it reveals are measured.
 */
export type ScrollExpectation =
  | {
      anchorId: string;
      applied: number;
      expectedTop: number;
      kind: 'shift';
      scrollHeightBefore: number;
    }
  | { kind: 'bottom' };

let pendingExpectation: ScrollExpectation | null = null;

/** Returns the expectation of the last scroll and clears it. */
export const takeScrollExpectation = () => {
  const expectation = pendingExpectation;
  pendingExpectation = null;
  return expectation;
};

const isMessageId = (id: string) => id.startsWith('m-') || id.startsWith('live-');

// A reader's scroll starts with input (a wheel turn, a key, a touch, a scrollbar press), which the
// list may react to before the scroll event; a scroll set from script has none.
const readerInput = (scroller: HTMLElement, deltaY: number) =>
  scroller.dispatchEvent(
    new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY }),
  );

/** Scrolls by `delta` pixels the way a wheel does: the browser fires the scroll event. */

export const scrollBy = async (frame: HTMLElement, delta: number) => {
  const scroller = getScroller(frame);
  if (!scroller) throw new Error('no scroller');
  readerInput(scroller, delta);
  const anchor = readVisibleItems(frame).find((item) => isMessageId(item.id));
  const before = scroller.scrollTop;
  scroller.scrollTop += delta;
  // Setting scrollTop clamps it synchronously: this is the distance the browser scrolled.
  const applied = scroller.scrollTop - before;
  // At an edge the list shows the edge: content above (or below) that measures taller than
  // estimated is not compensated for there, and should not be.
  const atEdge =
    scroller.scrollTop <= 0 ||
    scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1;
  pendingExpectation =
    anchor && Math.abs(applied) >= 1 && !atEdge
      ? {
          anchorId: anchor.id,
          applied,
          expectedTop: anchor.top - applied,
          kind: 'shift',
          scrollHeightBefore: scroller.scrollHeight,
        }
      : null;
  await nextFrame();
};

export const scrollToTop = async (frame: HTMLElement) => {
  const scroller = getScroller(frame);
  if (!scroller) throw new Error('no scroller');
  readerInput(scroller, -scroller.scrollTop);
  scroller.scrollTop = 0;
  pendingExpectation = null;
  await nextFrame();
};

/**
 * Scrolls to the very bottom, as the End key or a scrollbar drag does. Expects the list to stay
 * there unless `expectStaysAtBottom` is false (with `suppressAutoscroll` the list must not move).
 */
export const scrollToBottom = async (
  frame: HTMLElement,
  { expectStaysAtBottom = true }: { expectStaysAtBottom?: boolean } = {},
) => {
  const scroller = getScroller(frame);
  if (!scroller) throw new Error('no scroller');
  readerInput(scroller, scroller.scrollHeight - scroller.scrollTop);
  scroller.scrollTop = scroller.scrollHeight;
  pendingExpectation = expectStaysAtBottom ? { kind: 'bottom' } : null;
  await nextFrame();
};

let messageSequence = 0;

/** `MessagePaginator` coalesces live publishes of its items to one per 500ms. */
const LIVE_PUBLISH_THROTTLE_MS = 500;

/**
 * A message from `user` arriving over the WebSocket, `bodyHeight` pixels tall. Resolves once the
 * paginator published it (live publishes are throttled), unless `awaitIngest` is false.
 */
export const receiveMessage = async (
  mounted: Mounted,
  user: UserResponse,
  bodyHeight = 64,
  { awaitIngest = true }: { awaitIngest?: boolean } = {},
) => {
  messageSequence += 1;
  const last = mounted.history[mounted.history.length - 1];
  const id = `live-${messageSequence}`;
  // Unix nanoseconds, as the generated history carries them: one minute after the last message.
  const createdAt = Number(last?.created_at ?? 0) + 60_000 * 1e6;
  const message = {
    ...last,
    cid: mounted.channel.cid,
    created_at: createdAt,
    id,
    status: 'received',
    text: `live ${messageSequence}`,
    updated_at: createdAt,
    user,
  } as unknown as LocalMessage;
  setMessageHeight(id, bodyHeight);
  mounted.history.push(message);
  mounted.client.dispatchEvent({
    channel_id: mounted.channel.id,
    channel_type: mounted.channel.type,
    cid: mounted.channel.cid,
    message: message as never,
    type: 'message.new',
    user,
  } as never);
  if (awaitIngest) {
    // Shown (after the throttled publish) while the latest window is the active one. An older
    // window open after a jump does not grow, so there is nothing to wait for but the publish delay.
    const paginator = mounted.channel.messagePaginator;
    if (paginator.state.getLatestValue().hasMoreHead) {
      await wait(LIVE_PUBLISH_THROTTLE_MS + 100);
    } else {
      await waitUntil(
        () => !!paginator.items?.some((item) => item.id === id),
        3000,
        `ingest of ${id}`,
      );
    }
  }
  return id;
};

// ---------------------------------------------------------------------------------------------
// Observing the list

export type Geometry = {
  clientHeight: number;
  distanceFromBottom: number;
  scrollHeight: number;
  scrollTop: number;
};

export const readGeometry = (frame: HTMLElement): Geometry | null => {
  const scroller = getScroller(frame);
  if (!scroller) return null;
  return {
    clientHeight: scroller.clientHeight,
    distanceFromBottom:
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight,
    scrollHeight: scroller.scrollHeight,
    scrollTop: scroller.scrollTop,
  };
};

const itemId = (item: Element) => {
  const message = item.querySelector('[data-message-id]');
  if (message) return message.getAttribute('data-message-id') as string;
  const messageRoot = item.querySelector('[data-message-id], .str-chat__message');
  if (messageRoot?.id) return messageRoot.id;
  if (item.querySelector('.str-chat__date-separator')) return 'date-separator';
  return 'item';
};

/** The rendered items in DOM order, with their position relative to the scroller's top. */
export const readRenderedItems = (frame: HTMLElement) => {
  const scroller = getScroller(frame);
  if (!scroller) return [];
  const top = scroller.getBoundingClientRect().top;
  return Array.from(scroller.querySelectorAll('[data-item-index]')).map((item) => {
    const rect = item.getBoundingClientRect();
    return {
      element: item,
      height: rect.height,
      id: itemId(item),
      index: Number(item.getAttribute('data-item-index')),
      top: rect.top - top,
    };
  });
};

/** The items intersecting the viewport. */
export const readVisibleItems = (frame: HTMLElement) => {
  const geometry = readGeometry(frame);
  if (!geometry) return [];
  return readRenderedItems(frame).filter(
    (item) => item.top + item.height > 0.5 && item.top < geometry.clientHeight - 0.5,
  );
};

/** Whether Virtuoso shows its item list (v4 hides it until the initial location is reached). */
export const isListVisible = (frame: HTMLElement) => {
  const scroller = getScroller(frame);
  if (!scroller) return false;
  // A custom `components.List` may render no test ID: the item list is then the viewport's child.
  const list =
    scroller.querySelector<HTMLElement>(
      '[data-testid="virtuoso-item-list"], [data-test-id="virtuoso-item-list"]',
    ) ?? scroller.querySelector<HTMLElement>('[data-viewport-type] > :first-child');
  // An empty list renders the empty placeholder instead of the item list.
  if (!list) return true;
  return getComputedStyle(list).visibility !== 'hidden';
};

/** How long `settle` waits for a hidden list to be revealed before treating it as settled. */
const HIDDEN_LIST_GRACE_MS = 2000;

/**
 * Resolves once the list has been still for `quietFrames` frames in a row: same geometry, same
 * rendered items, visible. Throws after `timeoutMs`.
 */
export const settle = async (
  frame: HTMLElement,
  { minMs = 50, quietFrames = 10, timeoutMs = 4000 } = {},
) => {
  const startedAt = performance.now();
  let previous = '';
  let quiet = 0;
  while (performance.now() - startedAt < timeoutMs) {
    await nextFrame();
    const signature = JSON.stringify({
      geometry: readGeometry(frame),
      items: readRenderedItems(frame).map((item) => [item.id, Math.round(item.top)]),
      visible: isListVisible(frame),
    });
    quiet = signature === previous ? quiet + 1 : 0;
    previous = signature;
    // A hidden list is not at rest: react-virtuoso 4 hides it while it positions it.
    const shown =
      isListVisible(frame) || performance.now() - startedAt > HIDDEN_LIST_GRACE_MS;
    if (shown && quiet >= quietFrames && performance.now() - startedAt >= minMs) return;
  }
  throw new Error(`list did not settle within ${timeoutMs}ms: ${previous}`);
};

/** Waits until `predicate` holds, checking once per frame. */
export const waitUntil = async (
  predicate: () => boolean,
  timeoutMs = 4000,
  label = '',
) => {
  const startedAt = performance.now();
  while (!predicate()) {
    if (performance.now() - startedAt > timeoutMs) {
      throw new Error(`timed out waiting${label ? ` for ${label}` : ''}`);
    }
    await nextFrame();
  }
};

export type FrameSample = {
  anchorTop: number | null;
  blank: boolean;
  distanceFromBottom: number | null;
  visible: boolean;
};

/**
 * Samples the list once per frame while `action` runs and for `framesAfter` frames after it:
 * where `anchorId` sits, whether the viewport shows no item at all, the distance to the bottom.
 */
export const sampleFrames = async (
  frame: HTMLElement,
  action: () => unknown,
  { anchorId, framesAfter = 30 }: { anchorId?: string; framesAfter?: number } = {},
) => {
  const samples: FrameSample[] = [];
  let done = false;
  let remaining = framesAfter;
  const sample = () => {
    const geometry = readGeometry(frame);
    const items = readRenderedItems(frame);
    const anchor = anchorId ? items.find((item) => item.id === anchorId) : undefined;
    samples.push({
      anchorTop: anchor ? anchor.top : null,
      blank:
        !!geometry && geometry.clientHeight > 0 && readVisibleItems(frame).length === 0,
      distanceFromBottom: geometry?.distanceFromBottom ?? null,
      visible: isListVisible(frame),
    });
  };
  const loop = new Promise<void>((resolve) => {
    const tick = () => {
      sample();
      if (done) remaining -= 1;
      if (done && remaining <= 0) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await action();
  done = true;
  await loop;
  return samples;
};

export { probe };

// ---------------------------------------------------------------------------------------------
// Leak tracking

/**
 * Counts the `scroll` / `resize` listeners on long-lived targets (window, document, `<html>`,
 * `<body>`) and the ResizeObservers alive from now on, so a test can check that unmounting releases
 * everything mounting acquired. Listeners on elements are left out: they go with their element, and
 * React's own delegation listeners on a root container are never removed by design. Call
 * `restore()` when done.
 */
export const trackResources = () => {
  type Entry = { stack: string; target: string; type: string };
  const live = new Map<string, Entry>();
  const identities = new WeakMap<object, number>();
  let nextIdentity = 0;
  const identityOf = (value: object) => {
    if (!identities.has(value)) identities.set(value, (nextIdentity += 1));
    return identities.get(value);
  };
  const captureOf = (options: unknown) =>
    typeof options === 'object'
      ? !!(options as AddEventListenerOptions)?.capture
      : !!options;
  const targetName = (target: EventTarget) =>
    target === window
      ? 'window'
      : target === document
        ? 'document'
        : target === document.body
          ? 'body'
          : 'html';
  const isLongLived = (target: EventTarget) =>
    target === window ||
    target === document ||
    target === document.documentElement ||
    target === document.body;
  const entryKey = (
    target: EventTarget,
    type: string,
    listener: object,
    options: unknown,
  ) => `${identityOf(target)}:${type}:${identityOf(listener)}:${captureOf(options)}`;

  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    const stack = new Error().stack ?? '';
    // React delegates events once per root or portal container (here: a portal into <body>) and
    // never removes those listeners by design; they are not owned by any one component.
    const isReactDelegation = stack.includes('listenToAllSupportedEvents');
    if (
      (type === 'scroll' || type === 'resize') &&
      listener &&
      isLongLived(this) &&
      !isReactDelegation
    ) {
      live.set(entryKey(this, type, listener as object, options), {
        stack: stack.split('\n').slice(2, 7).join('\n'),
        target: targetName(this),
        type,
      });
    }
    return originalAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if ((type === 'scroll' || type === 'resize') && listener && isLongLived(this)) {
      live.delete(entryKey(this, type, listener as object, options));
    }
    return originalRemove.call(this, type, listener, options);
  };

  // Observations, not observers: an observer whose elements were all unobserved is released with
  // them even if it is never disconnected.
  const OriginalResizeObserver = globalThis.ResizeObserver;
  let observations = 0;
  globalThis.ResizeObserver = class extends OriginalResizeObserver {
    private observed = new Set<Element>();
    observe(target: Element, options?: ResizeObserverOptions) {
      if (!this.observed.has(target)) observations += 1;
      this.observed.add(target);
      super.observe(target, options);
    }
    unobserve(target: Element) {
      if (this.observed.delete(target)) observations -= 1;
      super.unobserve(target);
    }
    disconnect() {
      observations -= this.observed.size;
      this.observed.clear();
      super.disconnect();
    }
  };

  return {
    counts: () => ({
      longLivedListeners: live.size,
      // Observations of elements still in the document are not leaks.
      resizeObservations: observations,
    }),
    /** Where each listener still registered was added. */
    pending: () => Array.from(live.values()),
    restore: () => {
      EventTarget.prototype.addEventListener = originalAdd;
      EventTarget.prototype.removeEventListener = originalRemove;
      globalThis.ResizeObserver = OriginalResizeObserver;
    },
  };
};
