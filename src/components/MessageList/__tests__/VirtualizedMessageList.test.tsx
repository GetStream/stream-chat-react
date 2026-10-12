import React, { act } from 'react';
import { cleanup, render } from '@testing-library/react';
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
import { useVirtualizedMessageListContext, WithComponents } from '../../../context';

// Records the props VML hands to Virtuoso and routes the imperative handle through a spy, so the
// scroll target is assertable. The overrides keep the real Virtuoso renderable under jsdom, which
// reports every element as 0px.
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
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
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
  const channel = client.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  return { channel, client };
}

// simple test since Virtuoso heavily relies on document height and jsdom doesn't support it
describe('VirtualizedMessageList', () => {
  afterEach(cleanup);
  beforeEach(vi.clearAllMocks);

  it('should render the list without any message', async () => {
    const { channel, client } = await createChannel(true);
    vi.mocked(nanoid).mockReturnValue('mockedId');

    const { container, findByText } = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <VirtualizedMessageList />
        </Channel>
      </Chat>,
    );

    const emptyStateText = await findByText('Send a message to start the conversation');
    const virtualList = container.querySelector('.str-chat__virtual-list');
    expect(virtualList).toBeInTheDocument();
    expect(virtualList).toContainElement(emptyStateText);
  });

  // A bare index means align: 'start', which parks the last row's top at the viewport top and
  // clips its bottom whenever that row is taller than the list -- visible in a short panel.
  // jsdom has no layout, so these assert the scroll target rather than the clipping.
  describe('scroll anchoring', () => {
    let scrollToBottom: (() => Promise<void>) | undefined;

    // scrollToBottom is published on a context VML opens around its own subtree, so the probe
    // has to sit inside it. MessageListMainPanel is the outermost overridable slot in there.
    const MainPanelProbe = ({ children }: React.PropsWithChildren) => {
      scrollToBottom = useVirtualizedMessageListContext().scrollToBottom;
      return <div>{children}</div>;
    };

    const MESSAGE_COUNT = 20;

    const renderList = async ({ listProps = {} } = {}) => {
      const user1 = generateUser();
      const user2 = generateUser();
      const mockedChannel = generateChannel({
        members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
        messages: Array.from({ length: MESSAGE_COUNT }, (_v, i) =>
          generateMessage({ id: `anchor-msg-${i}`, user: i % 2 ? user1 : user2 }),
        ),
      });
      const client = await getTestClientWithUser({ id: 'id' });
      useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
      const channel = client.channel('messaging', mockedChannel.channel.id);
      await channel.watch();

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <WithComponents overrides={{ MessageListMainPanel: MainPanelProbe }}>
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
      expect(props.initialTopMostItemIndex).toEqual({
        align: 'end',
        index: props.totalCount - 1,
      });
    });

    // The thresholds and the true-bottom check are only honest while these callbacks reach the
    // viewport hook, so an integrator override has to compose with them rather than replace them.
    it('still measures the viewport when a scrollerRef is supplied', async () => {
      const scrollerRefFromProps = vi.fn();
      const props = await renderList({
        listProps: { additionalVirtuosoProps: { scrollerRef: scrollerRefFromProps } },
      });

      expect(props.scrollerRef).not.toBe(scrollerRefFromProps);

      const scroller = document.createElement('div');
      act(() => {
        props.scrollerRef(scroller);
      });

      expect(scrollerRefFromProps).toHaveBeenCalledWith(scroller);
      const measured = virtuosoProps[virtuosoProps.length - 1];
      expect(measured.atBottomThreshold).not.toBe(100);
      expect(measured.atBottomThreshold).toBe(measured.atTopThreshold);
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
