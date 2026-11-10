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

const makePaginator = () => {
  const scheduleMessageFocusSignalClear = vi.fn();
  return {
    messagePaginator: fromPartial<MessagePaginator>({ scheduleMessageFocusSignalClear }),
    scheduleMessageFocusSignalClear,
  };
};

const setup = ({
  container,
  isMessageInList = true,
  messageFocusSignal,
  scrollElement,
}: {
  container: HTMLElement | null;
  isMessageInList?: boolean;
  messageFocusSignal: MessageFocusSignal | null;
  scrollElement: HTMLElement | Window | null;
}) => {
  const { messagePaginator, scheduleMessageFocusSignalClear } = makePaginator();
  const containerRef = { current: container };
  const hook = renderHook((props) => useMessageFocusSignalViewed(props), {
    initialProps: {
      containerRef,
      isMessageInList,
      messageFocusSignal,
      messagePaginator,
      scrollElement,
    },
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
    const messageFocusSignal = signal('m-2', 7);
    const { hook, scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal,
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
    expect(hook.result.current.current).toBe(messageFocusSignal);
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
      isMessageInList: true,
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
      isMessageInList: true,
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
      isMessageInList: true,
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

  it('watches a jump of a new paginator that reuses the token of a viewed one', () => {
    // Tokens count per paginator, so channel B's first jump can carry channel A's last token.
    const { container, scroller } = makeList(['a-1', 'b-1']);
    const { containerRef, hook, scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal('a-1', 1),
      scrollElement: scroller,
    });
    viewObserver().report(container.querySelector("[data-message-id='a-1']")!, {
      ratio: 1,
    });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 1 });

    const next = makePaginator();
    const nextSignal = signal('b-1', 1);
    hook.rerender({
      containerRef,
      isMessageInList: true,
      messageFocusSignal: nextSignal,
      messagePaginator: next.messagePaginator,
      scrollElement: scroller,
    });
    // Not viewed yet, so the list re-centers on it.
    expect(hook.result.current.current).not.toBe(nextSignal);
    const target = container.querySelector("[data-message-id='b-1']")!;
    expect(viewObserver().observed).toEqual([target]);

    viewObserver().report(target, { ratio: 1 });
    expect(next.scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 1 });
    expect(hook.result.current.current).toBe(nextSignal);
  });

  it('starts the countdown at once when the focused message is not in the list', () => {
    const { container, scroller } = makeList(['m-1']);
    const { hook, scheduleMessageFocusSignalClear } = setup({
      container,
      isMessageInList: false,
      messageFocusSignal: signal('m-deleted', 5),
      scrollElement: scroller,
    });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 5 });
    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(hook.result.current.current).toBeNull();
  });

  it('starts the countdown when the focused message leaves the list', () => {
    const { container, scroller } = makeList(['m-1']);
    const messageFocusSignal = signal('m-1', 6);
    const { containerRef, hook, messagePaginator, scheduleMessageFocusSignalClear } =
      setup({ container, messageFocusSignal, scrollElement: scroller });
    expect(scheduleMessageFocusSignalClear).not.toHaveBeenCalled();
    const observer = viewObserver();

    hook.rerender({
      containerRef,
      isMessageInList: false,
      messageFocusSignal,
      messagePaginator,
      scrollElement: scroller,
    });
    expect(observer.disconnect).toHaveBeenCalled();
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledWith({ token: 6 });
  });

  it('finds a message whose ID would break a selector', () => {
    const messageId = `it's a "custom" \\ id]`;
    const { container, scroller } = makeList(['m-1', messageId]);
    const { scheduleMessageFocusSignalClear } = setup({
      container,
      messageFocusSignal: signal(messageId),
      scrollElement: scroller,
    });
    const target = [...container.querySelectorAll('[data-message-id]')].find(
      (element) => element.getAttribute('data-message-id') === messageId,
    )!;
    expect(viewObserver().observed).toEqual([target]);
    viewObserver().report(target, { ratio: 1 });
    expect(scheduleMessageFocusSignalClear).toHaveBeenCalledTimes(1);
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
