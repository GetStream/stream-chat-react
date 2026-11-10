import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { MessageFocusSignal, MessagePaginator } from 'stream-chat';

import { useMessageFocusSignalViewed } from '../useMessageFocusSignalViewed';

// jsdom has no IntersectionObserver: a fake records what it observes and lets a test report entries.
class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  observed: Element[] = [];
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    IntersectionObserverMock.instances.push(this);
  }
  disconnect = vi.fn(() => {
    this.observed = [];
  });
  observe = vi.fn((element: Element) => {
    this.observed.push(element);
  });
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn((element: Element) => {
    this.observed = this.observed.filter((observed) => observed !== element);
  });

  report(
    target: Element,
    {
      height = 0,
      isIntersecting = true,
      ratio = 1,
    }: { height?: number; isIntersecting?: boolean; ratio?: number },
  ) {
    this.callback(
      [
        fromPartial<IntersectionObserverEntry>({
          intersectionRatio: ratio,
          intersectionRect: fromPartial<DOMRectReadOnly>({ height }),
          isIntersecting,
          target,
        }),
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

const viewObserver = () =>
  IntersectionObserverMock.instances[IntersectionObserverMock.instances.length - 1];

// MutationObserver callbacks run in a microtask.
const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

const signal = (messageId: string, token = 1): MessageFocusSignal =>
  fromPartial<MessageFocusSignal>({
    createdAt: Date.now(),
    messageId,
    reason: 'jump-to-message',
    token,
    ttlMs: 3000,
  });

// The list wrapper holds Virtuoso's item list, which holds one item per rendered message.
const makeList = (messageIds: string[] = []) => {
  const container = document.createElement('div');
  const scroller = document.createElement('div');
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 400 });
  const itemList = document.createElement('div');
  itemList.setAttribute('data-testid', 'virtuoso-item-list');
  scroller.appendChild(itemList);
  container.appendChild(scroller);
  document.body.appendChild(container);
  const addItem = (id: string) => {
    const item = document.createElement('div');
    item.setAttribute('data-message-id', id);
    itemList.appendChild(item);
    return item;
  };
  messageIds.forEach(addItem);
  return { addItem, container, itemList, scroller };
};

const setup = ({
  container,
  messageFocusSignal,
  scrollElement,
}: {
  container: HTMLElement | null;
  messageFocusSignal: MessageFocusSignal | null;
  scrollElement: HTMLElement | Window | null;
}) => {
  const scheduleMessageFocusSignalClear = vi.fn();
  const messagePaginator = fromPartial<MessagePaginator>({
    scheduleMessageFocusSignalClear,
  });
  const containerRef = { current: container };
  const hook = renderHook((props) => useMessageFocusSignalViewed(props), {
    initialProps: { containerRef, messageFocusSignal, messagePaginator, scrollElement },
  });
  return { containerRef, hook, messagePaginator, scheduleMessageFocusSignalClear };
};

describe('useMessageFocusSignalViewed', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeEach(() => {
    IntersectionObserverMock.instances = [];
    window.IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    document.body.innerHTML = '';
  });

  it('does nothing without a focus signal', () => {
    const { container, scroller } = makeList(['m-1']);
    const { scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: null,
      scrollElement: scroller,
    });
    expect(scheduleMessageFocusSignalClear).not.toHaveBeenCalled();
    expect(IntersectionObserverMock.instances).toHaveLength(0);
  });

  it('starts the countdown once the focused message is viewed, not before', () => {
    const { container, scroller } = makeList(['m-1', 'm-2']);
    const { hook, scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal('m-2', 7),
      scrollElement: scroller,
    });
    const target = container.querySelector("[data-message-id='m-2']")!;
    const observer = viewObserver();
    expect(observer.options?.root).toBe(scroller);
    expect(observer.observed).toEqual([target]);
    expect(scheduleMessageFocusSignalClear).not.toHaveBeenCalled();

    observer.report(target, { height: 20, ratio: 0.2 });
    expect(scheduleMessageFocusSignalClear).not.toHaveBeenCalled();
    expect(hook.result.current.current).toBeNull();

    observer.report(target, { height: 60, ratio: 0.5 });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 7 });
    expect(hook.result.current.current).toBe(7);
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('counts a message taller than half the viewport as viewed when it fills half of it', () => {
    const { container, scroller } = makeList(['tall']);
    const { scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal('tall'),
      scrollElement: scroller,
    });
    const target = container.querySelector("[data-message-id='tall']")!;
    viewObserver().report(target, { height: 200, ratio: 0.2 });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 1 });
  });

  it('observes the focused message once Virtuoso renders it', async () => {
    const { addItem, container, scroller } = makeList(['m-1']);
    const { scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal('m-50'),
      scrollElement: scroller,
    });
    const observer = viewObserver();
    expect(observer.observed).toEqual([]);

    const target = addItem('m-50');
    await flushMutations();
    expect(observer.observed).toEqual([target]);

    // Scrolled out of the rendered range and back: a new element for the same message.
    target.remove();
    const rerendered = addItem('m-50');
    await flushMutations();
    expect(observer.observed).toEqual([rerendered]);

    observer.report(rerendered, { ratio: 1 });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);
  });

  it('counts nothing as viewed while react-virtuoso 4 keeps the list hidden', async () => {
    const { container, itemList, scroller } = makeList(['m-1']);
    itemList.style.visibility = 'hidden';
    const { scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal('m-1'),
      scrollElement: scroller,
    });
    const target = container.querySelector("[data-message-id='m-1']")!;
    const observer = viewObserver();
    observer.report(target, { ratio: 1 });
    expect(scheduleMessageFocusSignalClear).not.toHaveBeenCalled();

    // Revealing does not move the item, so the hook re-observes it for a fresh report.
    observer.observe.mockClear();
    itemList.style.visibility = '';
    await flushMutations();
    expect(observer.observe).toHaveBeenCalledWith(target);
    observer.report(target, { ratio: 1 });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);
  });

  it('uses the viewport as the root in the window-scroll mode', () => {
    const { container } = makeList(['m-1']);
    setup({ container, messageFocusSignal: signal('m-1'), scrollElement: window });
    expect(viewObserver().options?.root).toBeNull();
  });

  it('waits for the scroller before observing', () => {
    const { container, scroller } = makeList(['m-1']);
    const { containerRef, hook, messagePaginator, scheduleMessageFocusSignalClear } =
      setup({ container, messageFocusSignal: signal('m-1'), scrollElement: null });
    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(scheduleMessageFocusSignalClear).not.toHaveBeenCalled();

    hook.rerender({
      containerRef,
      messageFocusSignal: signal('m-1'),
      messagePaginator,
      scrollElement: scroller,
    });
    expect(viewObserver().observed).toHaveLength(1);
  });

  it('does not restart the countdown when the list remounts after the message was viewed', () => {
    const { container, scroller } = makeList(['m-1']);
    const messageFocusSignal = signal('m-1', 3);
    const { containerRef, hook, messagePaginator, scheduleMessageFocusSignalClear } =
      setup({ container, messageFocusSignal, scrollElement: scroller });
    viewObserver().report(container.querySelector("[data-message-id='m-1']")!, {
      ratio: 1,
    });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);

    const { scroller: newScroller } = makeList(['m-1']);
    const observersBefore = IntersectionObserverMock.instances.length;
    hook.rerender({
      containerRef,
      messageFocusSignal,
      messagePaginator,
      scrollElement: newScroller,
    });
    expect(IntersectionObserverMock.instances).toHaveLength(observersBefore);
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);
  });

  it('watches the message of a new jump', () => {
    const { container, scroller } = makeList(['m-1', 'm-2']);
    const { containerRef, hook, messagePaginator, scheduleMessageFocusSignalClear } =
      setup({ container, messageFocusSignal: signal('m-1', 1), scrollElement: scroller });
    const first = viewObserver();

    hook.rerender({
      containerRef,
      messageFocusSignal: signal('m-2', 2),
      messagePaginator,
      scrollElement: scroller,
    });
    expect(first.disconnect).toHaveBeenCalled();
    const target = container.querySelector("[data-message-id='m-2']")!;
    viewObserver().report(target, { ratio: 1 });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 2 });
  });

  it('starts the countdown at once where "viewed" cannot be observed', () => {
    // @ts-expect-error -- removed to emulate an environment without it
    delete window.IntersectionObserver;
    const { container, scroller } = makeList(['m-1']);
    const { hook, scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal('m-1', 4),
      scrollElement: scroller,
    });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 4 });
    // Not seen viewed, so the list keeps re-centering until the signal clears.
    expect(hook.result.current.current).toBeNull();
  });
});
