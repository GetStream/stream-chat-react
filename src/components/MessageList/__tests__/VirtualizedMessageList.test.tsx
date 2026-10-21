import React, { act } from 'react';
import { cleanup, render, type RenderResult } from '@testing-library/react';
import { nanoid } from 'nanoid';

import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import { usePrependedMessagesCount } from '../hooks';
import { VirtualizedMessageList } from '../VirtualizedMessageList';

import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { useComponentContext, WithComponents } from '../../../context';
import { ThreadProvider } from '../../Threads';

import { StateStore } from '@stream-io/state-store';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Thread, ThreadState } from 'stream-chat';

const threadWithParentMessage = () =>
  fromPartial<Thread>({
    id: 'virtualized-list-thread',
    state: new StateStore<ThreadState>(
      fromPartial<ThreadState>({ parentMessage: generateMessage() }),
    ),
  });

// Records the props `VirtualizedMessageList` hands to Virtuoso and routes the imperative handle
// through a spy, so the scroll target is assertable. The overrides keep the real Virtuoso
// renderable under jsdom, which reports every element as 0px.
const { scrollToIndexSpy, virtuosoProps } = vi.hoisted(() => ({
  scrollToIndexSpy: vi.fn(),
  virtuosoProps: [] as Record<string, any>[],
}));

vi.mock('react-virtuoso', async (importOriginal) => {
  const { Virtuoso } = await importOriginal<typeof import('react-virtuoso')>();
  const { forwardRef, useImperativeHandle, useRef } = await import('react');
  return {
    Virtuoso: forwardRef((props: any, ref: any) => {
      virtuosoProps.push(props);
      const innerRef = useRef<any>(null);
      useImperativeHandle(
        ref,
        () => ({
          autoscrollToBottom: (...args: any[]) =>
            innerRef.current?.autoscrollToBottom(...args),
          scrollBy: (...args: any[]) => innerRef.current?.scrollBy(...args),
          scrollIntoView: (...args: any[]) => innerRef.current?.scrollIntoView(...args),
          scrollTo: (...args: any[]) => innerRef.current?.scrollTo(...args),
          scrollToIndex: (...args: any[]) => {
            scrollToIndexSpy(...args);
            return innerRef.current?.scrollToIndex(...args);
          },
        }),
        [],
      );
      return (
        <Virtuoso
          ref={innerRef}
          {...props}
          fixedItemHeight={30}
          initialTopMostItemIndex={0}
          overscan={0}
        />
      );
    }),
  };
});

vi.mock('../../Loading', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../Loading')>()),
  LoadingIndicator: vi.fn(() => <div>LoadingIndicator</div>),
}));

vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeView: 'channels',
      setActiveView: vi.fn(),
    })),
    useThreadsViewContext: vi.fn(() => ({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    })),
  };
});

vi.mock('nanoid', () => ({
  nanoid: vi.fn(),
}));

async function createChannel(empty = false) {
  const user1 = generateUser();
  const user2 = generateUser();
  const mockedChannel = generateChannel({
    members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    messages: empty
      ? []
      : ' '
          .repeat(20)
          .split(' ')
          .map((_v, i) => generateMessage({ user: i % 3 ? user1 : user2 })),
  });
  const client = await getTestClientWithUser({ id: 'id' });
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channelManager.ensure({
    id: mockedChannel.channel.id,
    type: 'messaging',
  });
  await channel.watch();

  return { channel, client };
}

// Virtuoso relies heavily on document height, which jsdom does not support, so tests stay simple.
describe('VirtualizedMessageList', () => {
  afterEach(cleanup);
  beforeEach(vi.clearAllMocks);

  it('should render the list without any message', async () => {
    const { channel, client } = await createChannel(true);
    vi.mocked(nanoid).mockReturnValue('mockedId');

    let result: RenderResult;
    await act(() => {
      result = render(
        <Chat client={client}>
          <Channel channel={channel}>
            <VirtualizedMessageList />
          </Channel>
        </Chat>,
      );
    });
    expect(result.container).toMatchSnapshot();
  });

  // The `VirtualMessage` override has to beat `MessageUI`, but only for messages rendered by this
  // list. The list applies it by overriding `MessageUI` for its own subtree, so these assert on
  // what `useComponentContext()` resolves to inside vs. outside the list. Virtuoso renders no
  // items under jsdom (it measures document height), so the thread head is the in-subtree probe
  // point: the list renders it, in the same provider subtree as the items, whenever a thread is in
  // context.
  describe('VirtualMessage override', () => {
    const CustomMessageUI = () => <div />;
    const CustomVirtualMessage = () => <div />;

    const ResolvedMessageUIProbe = ({ label }: { label: string }) => {
      const { MessageUI } = useComponentContext();
      return (
        <div
          data-probe={label}
          data-resolved={(MessageUI as { name?: string } | undefined)?.name ?? 'none'}
        />
      );
    };

    const resolvedAt = (container: HTMLElement, label: string) =>
      container.querySelector(`[data-probe="${label}"]`)?.getAttribute('data-resolved') ??
      null;

    const renderWithOverrides = async (
      overrides: Parameters<typeof WithComponents>[0]['overrides'],
    ) => {
      overrides = {
        ...overrides,
        ThreadHead: () => <ResolvedMessageUIProbe label='inside' />,
      };
      const { channel, client } = await createChannel();
      vi.mocked(nanoid).mockReturnValue('mockedId');

      let result: RenderResult;
      await act(() => {
        result = render(
          <Chat client={client}>
            <Channel channel={channel}>
              <WithComponents overrides={overrides}>
                <ResolvedMessageUIProbe label='outside' />
                <ThreadProvider thread={threadWithParentMessage()}>
                  <VirtualizedMessageList />
                </ThreadProvider>
              </WithComponents>
            </Channel>
          </Chat>,
        );
      });

      return result!.container;
    };

    it('takes precedence over MessageUI for messages rendered by the list', async () => {
      const container = await renderWithOverrides({
        MessageUI: CustomMessageUI,
        VirtualMessage: CustomVirtualMessage,
      });

      expect(resolvedAt(container, 'inside')).toBe('CustomVirtualMessage');
    });

    it('does not leak outside the list', async () => {
      const container = await renderWithOverrides({
        MessageUI: CustomMessageUI,
        VirtualMessage: CustomVirtualMessage,
      });

      expect(resolvedAt(container, 'outside')).toBe('CustomMessageUI');
    });

    it('leaves the MessageUI override in place when unset', async () => {
      const container = await renderWithOverrides({ MessageUI: CustomMessageUI });

      expect(resolvedAt(container, 'inside')).toBe('CustomMessageUI');
      expect(resolvedAt(container, 'outside')).toBe('CustomMessageUI');
    });
  });

  // A bare index means align: 'start', which parks the last row's top at the viewport top and
  // clips its bottom whenever that row is taller than the list, visible in a short panel. jsdom has
  // no layout, so these assert the scroll target rather than the clipping.
  describe('scroll anchoring', () => {
    const MESSAGE_COUNT = 20;

    let scrollToBottom: (() => Promise<void>) | undefined;

    // `TypingIndicator` is the simplest overridable seam that receives the list's `scrollToBottom`.
    const TypingIndicatorProbe = (props: { scrollToBottom: () => Promise<void> }) => {
      scrollToBottom = props.scrollToBottom;
      return null;
    };

    const renderList = async ({ hasMoreHead = false, listProps = {} } = {}) => {
      const user1 = generateUser();
      const user2 = generateUser();
      // The file-wide nanoid mock collapses generated IDs, which would dedupe the messages down
      // to one and let an off-by-one pass.
      const mockedChannel = generateChannel({
        members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
        messages: Array.from({ length: MESSAGE_COUNT }, (_v, i) =>
          generateMessage({ id: `anchor-msg-${i}`, user: i % 2 ? user1 : user2 }),
        ),
      });
      const client = await getTestClientWithUser({ id: 'id' });
      useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
      const channel = client.channelManager.ensure({
        id: mockedChannel.channel.id,
        type: 'messaging',
      });
      await channel.watch();
      // With newer pages still to load, scrollToBottom jumps to the latest message set instead of
      // scrolling, so pin it to the branch that targets a Virtuoso index.
      vi.spyOn(channel.messagePaginator, 'hasMoreHead', 'get').mockReturnValue(
        hasMoreHead,
      );

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <WithComponents overrides={{ TypingIndicator: TypingIndicatorProbe }}>
                <VirtualizedMessageList {...listProps} />
              </WithComponents>
            </Channel>
          </Chat>,
        );
      });
      return virtuosoProps[virtuosoProps.length - 1];
    };

    beforeEach(() => {
      virtuosoProps.length = 0;
      scrollToBottom = undefined;
    });

    it('anchors the initial scroll to the end of the last item', async () => {
      const props = await renderList();

      expect(props.totalCount).toBe(MESSAGE_COUNT);
      expect(props.initialTopMostItemIndex).toEqual({
        align: 'end',
        index: MESSAGE_COUNT - 1,
      });
    });

    // The thresholds and the true-bottom check are only honest while these callbacks reach the
    // viewport hook, so an integrator override has to compose with them rather than replace them.
    it('still measures the viewport when a scrollerRef is supplied', async () => {
      const scrollerRefFromProps = vi.fn();
      const props = await renderList({
        listProps: { additionalVirtuosoProps: { scrollerRef: scrollerRefFromProps } },
      });

      // Ours is what Virtuoso receives, not the caller's.
      expect(props.scrollerRef).not.toBe(scrollerRefFromProps);

      const scroller = document.createElement('div');
      act(() => {
        props.scrollerRef(scroller);
      });

      // The caller still gets the element...
      expect(scrollerRefFromProps).toHaveBeenCalledWith(scroller);
      // ...and the hook measured it, so the threshold is no longer the unmeasured default.
      const measured = virtuosoProps[virtuosoProps.length - 1];
      expect(measured.atBottomThreshold).not.toBe(100);
      expect(measured.atBottomThreshold).toBe(measured.atTopThreshold);

      // Virtuoso passes null on teardown; the caller has to see that too.
      act(() => {
        props.scrollerRef(null);
      });
      expect(scrollerRefFromProps).toHaveBeenCalledWith(null);
    });

    it('still remeasures when a totalListHeightChanged is supplied', async () => {
      const totalListHeightChangedFromProps = vi.fn();
      const props = await renderList({
        listProps: {
          additionalVirtuosoProps: {
            totalListHeightChanged: totalListHeightChangedFromProps,
          },
        },
      });

      expect(props.totalListHeightChanged).not.toBe(totalListHeightChangedFromProps);

      act(() => {
        props.totalListHeightChanged(1234);
      });

      expect(totalListHeightChangedFromProps).toHaveBeenCalledWith(1234);
    });

    // Virtuoso's window-scroll path never calls the supplied scrollerRef, so unless the hook is fed
    // directly the list is never measured and the true-bottom check always answers "yes".
    describe('window scrolling', () => {
      // Virtuoso's own window-viewport hook needs a ResizeObserver, which jsdom does not
      // provide. mock-builders' ResizeObserverMock has no `unobserve`, which Virtuoso calls.
      const OriginalResizeObserver = globalThis.ResizeObserver;

      beforeEach(() => {
        globalThis.ResizeObserver = class implements ResizeObserver {
          disconnect = vi.fn();
          observe = vi.fn();
          unobserve = vi.fn();
        };
      });

      afterEach(() => {
        globalThis.ResizeObserver = OriginalResizeObserver;
      });

      it.each([
        ['useWindowScroll', { useWindowScroll: true }],
        ['customScrollParent', { customScrollParent: document.createElement('div') }],
      ])('measures the viewport with %s', async (_label, virtuosoProp) => {
        const props = await renderList({
          listProps: { additionalVirtuosoProps: virtuosoProp },
        });

        expect(props.atBottomThreshold).not.toBe(100);
        expect(props.atBottomThreshold).toBe(props.atTopThreshold);
      });
    });

    it('anchors scrollToBottom to the end of the last item', async () => {
      const props = await renderList();

      await act(async () => {
        await scrollToBottom?.();
      });

      expect(props.totalCount).toBe(MESSAGE_COUNT);
      expect(scrollToIndexSpy).toHaveBeenCalledWith({
        align: 'end',
        index: MESSAGE_COUNT - 1,
      });
    });
  });
});

describe('usePrependedMessagesCount', () => {
  const TestCase = ({ messages }) => {
    const prependCount = usePrependedMessagesCount(messages, false);
    return <div data-prepend-count={prependCount} id='prepend-counter' />;
  };

  const expectPrependCount = (count, container) => {
    expect(container.querySelector('#prepend-counter')).toHaveAttribute(
      'data-prepend-count',
      count.toString(),
    );
  };

  it('determines 0 prepended messages for empty message list', async () => {
    const { container } = await render(<TestCase messages={[]} />);
    expectPrependCount(0, container);
  });

  const messageBatch = (ids, status) => ids.map((id) => ({ id, status }));
  const firstBatch = (status) => messageBatch(['a'], status);
  const secondBatch = (status) => messageBatch(['c', 'b'], status);
  const thirdBatch = (status) => messageBatch(['e', 'd'], status);

  const testPrependCount = async (status, first, second, third) => {
    const firstMessage = firstBatch(status);
    const secondMsgBatch = secondBatch(status);
    const thirdMsgBatch = thirdBatch(status);

    const { container, rerender } = await render(<TestCase messages={[]} />);

    await act(async () => {
      await rerender(<TestCase messages={[...firstMessage]} />);
    });
    expectPrependCount(first, container);

    await act(async () => {
      await rerender(<TestCase messages={[...secondMsgBatch, ...firstMessage]} />);
    });
    expectPrependCount(second, container);

    await act(async () => {
      await rerender(
        <TestCase messages={[...thirdMsgBatch, ...secondMsgBatch, ...firstMessage]} />,
      );
    });
    expectPrependCount(third, container);
  };

  it('calculates the prepended count for messages of status "received"', async () => {
    await testPrependCount('received', 0, 2, 4);
  });

  it('ignores the messages of status "sending" from the prepended messages count', async () => {
    await testPrependCount('sending', 0, 0, 0);
  });

  it('ignores the messages of status "failed" from the prepended messages count', async () => {
    await testPrependCount('failed', 0, 0, 0);
  });

  it('calculates the prepended messages count for the messages of status undefined', async () => {
    await testPrependCount(undefined, 0, 2, 4);
  });
});
