import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useMessageListScrollManager } from '../';
import type { UseMessageListScrollManagerParams } from '../MessageList/useMessageListScrollManager';

import { ChatProvider } from '../../../../context/ChatContext';
import type { LocalMessage, StreamChat } from 'stream-chat';
import {
  generateUser,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';

const myUserId = 'alice';

const generateMessages = (length, userId = myUserId) =>
  Array.from({ length }, (_, index) => ({ id: index.toString(), userId }));

/** Messages `sim-<from>` to `sim-<to>` from another user, as the server has them. */
const generateWindow = (from: number, to: number) =>
  fromPartial<LocalMessage[]>(
    Array.from({ length: to - from + 1 }, (_, index) => ({
      id: `sim-${from + index}`,
      status: 'received',
      user: { id: 'bob' },
    })),
  );

const unsentMessages = fromPartial<LocalMessage[]>([
  { id: 'failed', status: 'failed', user: { id: myUserId } },
  { id: 'sending', status: 'sending', user: { id: myUserId } },
]);

const defaultInputs: any = {
  loadMoreScrollThreshold: 100,
  messages: [],
  scrollContainerMeasures: () => ({
    offsetHeight: 200,
    scrollHeight: 2000,
    scrollTop: 0,
  }),
  scrolledUpThreshold: 200,
  scrollToBottom: () => {},
  showNewMessages: () => {},
};

const alice = generateUser({ id: myUserId });
let client: StreamChat;

describe('useMessageListScrollManager', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser(alice);
  });
  afterEach(cleanup);

  it('does not emit scroll to bottom on mount', () => {
    const scrollToBottom = vi.fn();
    const Comp = () => {
      useMessageListScrollManager({
        ...defaultInputs,
        scrollToBottom,
      });

      return <div />;
    };

    const { rerender } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp />
      </ChatProvider>,
    );
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp />
      </ChatProvider>,
    );

    expect(scrollToBottom).not.toHaveBeenCalled();
  });

  it('emits scrollTop delta when messages are prepended', () => {
    const onScrollBy = vi.fn();
    const Comp = (props: any) => {
      useMessageListScrollManager(
        fromPartial<UseMessageListScrollManagerParams>({
          ...defaultInputs,
          messages: props.messages,
          onScrollBy,
          scrollContainerMeasures: () => ({
            scrollHeight: props.scrollHeight,
          }),
          scrollToBottom: () => {},
        }),
      );

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages} scrollHeight={400} />
      </ChatProvider>,
    );

    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={generateMessages(10).concat(messages)} scrollHeight={600} />
      </ChatProvider>,
    );

    expect(onScrollBy).toHaveBeenCalledWith(200);
  });

  it('emits scroll to bottom when new messages arrive', () => {
    const scrollToBottom = vi.fn();
    const Comp = (props: any) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          offsetHeight: 100,
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom,
      });

      updateScrollTop(300);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages} scrollHeight={400} />
      </ChatProvider>,
    );

    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages.concat(generateMessages(10))} scrollHeight={600} />
      </ChatProvider>,
    );

    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('does not emit scroll to bottom when new messages arrive and user has scrolled up', () => {
    const showNewMessages = vi.fn();
    const Comp = (props: any) => {
      const updateScrollTop = useMessageListScrollManager(
        fromPartial<UseMessageListScrollManagerParams>({
          ...defaultInputs,
          messages: props.messages,
          scrollContainerMeasures: () => ({
            scrollHeight: props.scrollHeight,
          }),
          showNewMessages,
        }),
      );

      updateScrollTop(props.scrollTop);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />
      </ChatProvider>,
    );

    // simulate scrolled up
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    // add new messages
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp
          messages={messages.concat(generateMessages(10))}
          offsetHeight={100}
          scrollHeight={600}
          scrollTop={200}
        />
      </ChatProvider>,
    );

    expect(showNewMessages).toHaveBeenCalledTimes(1);
  });

  it('emits scroll to bottom when new own message is posted, regardless of scroll position', () => {
    const scrollToBottom = vi.fn();
    const Comp = (props: any) => {
      const updateScrollTop = useMessageListScrollManager(
        fromPartial<UseMessageListScrollManagerParams>({
          ...defaultInputs,
          messages: props.messages,
          scrollContainerMeasures: () => ({
            scrollHeight: props.scrollHeight,
          }),
          scrollToBottom,
        }),
      );

      updateScrollTop(props.scrollTop);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={300} />
        ,
      </ChatProvider>,
    );

    // simulate scrolled up
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    // add new messages
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp
          messages={messages.concat(
            fromPartial<LocalMessage[]>([{ id: '100', user: { id: client.userID } }]),
          )}
          offsetHeight={100}
          scrollHeight={600}
          scrollTop={200}
        />
      </ChatProvider>,
    );

    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('does not emit scroll to bottom when suppressAutoscroll is enabled', () => {
    const scrollToBottom = vi.fn();
    const showNewMessages = vi.fn();
    const Comp = (props) => {
      const updateScrollTop = useMessageListScrollManager({
        ...defaultInputs,
        messages: props.messages,
        scrollContainerMeasures: () => ({
          scrollHeight: props.scrollHeight,
        }),
        scrollToBottom,
        showNewMessages,
        suppressAutoscroll: true,
      });

      updateScrollTop(props.scrollTop);

      return <div />;
    };

    const messages = generateMessages(20);
    const { rerender } = render(
      <ChatProvider value={{ client }}>
        <Comp messages={messages} offsetHeight={100} scrollHeight={400} scrollTop={200} />
      </ChatProvider>,
    );

    rerender(
      <ChatProvider value={{ client }}>
        <Comp
          messages={messages.concat([{ id: '100', user: { id: client.userID } }])}
          offsetHeight={100}
          scrollHeight={600}
          scrollTop={200}
        />
      </ChatProvider>,
    );

    expect(scrollToBottom).not.toHaveBeenCalled();
    expect(showNewMessages).toHaveBeenCalledTimes(1);
  });

  describe('when another window replaces the rendered messages', () => {
    const renderWindowSwitch = ({
      focusedMessageId,
      hasMoreNewer,
      newMessages,
      prevMessages,
    }: {
      focusedMessageId?: string;
      hasMoreNewer: boolean;
      newMessages: LocalMessage[];
      prevMessages: LocalMessage[];
    }) => {
      const scrollToBottom = vi.fn();
      const Comp = (props: {
        focusedMessageId?: string;
        hasMoreNewer: boolean;
        messages: LocalMessage[];
      }) => {
        const updateScrollTop = useMessageListScrollManager(
          fromPartial<UseMessageListScrollManagerParams>({
            ...defaultInputs,
            focusedMessageId: props.focusedMessageId,
            hasMoreNewer: props.hasMoreNewer,
            messages: props.messages,
            scrollToBottom,
          }),
        );
        // scrolled up far from the bottom, so no append rule would scroll
        updateScrollTop(0);
        return <div />;
      };

      const { rerender } = render(
        <ChatProvider value={mockChatContext({ client })}>
          <Comp hasMoreNewer={false} messages={prevMessages} />
        </ChatProvider>,
      );
      rerender(
        <ChatProvider value={mockChatContext({ client })}>
          <Comp
            focusedMessageId={focusedMessageId}
            hasMoreNewer={hasMoreNewer}
            messages={newMessages}
          />
        </ChatProvider>,
      );

      return { scrollToBottom };
    };

    it('scrolls to the bottom when the new window holds the newest messages', () => {
      const { scrollToBottom } = renderWindowSwitch({
        hasMoreNewer: false,
        newMessages: generateWindow(94, 120),
        prevMessages: generateWindow(36, 60),
      });

      expect(scrollToBottom).toHaveBeenCalledTimes(1);
    });

    it('scrolls to the bottom when only unsent messages are kept across the switch', () => {
      const { scrollToBottom } = renderWindowSwitch({
        hasMoreNewer: false,
        newMessages: [...generateWindow(94, 120), ...unsentMessages],
        prevMessages: [...generateWindow(36, 60), ...unsentMessages],
      });

      expect(scrollToBottom).toHaveBeenCalledTimes(1);
    });

    it('does not scroll to the bottom when the new window is older than the newest messages', () => {
      const { scrollToBottom } = renderWindowSwitch({
        hasMoreNewer: true,
        newMessages: generateWindow(1, 25),
        prevMessages: generateWindow(94, 120),
      });

      expect(scrollToBottom).not.toHaveBeenCalled();
    });

    it('leaves the list to a jump that focuses a message in the newest window', () => {
      const { scrollToBottom } = renderWindowSwitch({
        focusedMessageId: 'sim-100',
        hasMoreNewer: false,
        newMessages: generateWindow(94, 120),
        prevMessages: generateWindow(1, 25),
      });

      expect(scrollToBottom).not.toHaveBeenCalled();
    });

    it('scrolls to the bottom when the focused message of an earlier jump is not in the new window', () => {
      const { scrollToBottom } = renderWindowSwitch({
        focusedMessageId: 'sim-5',
        hasMoreNewer: false,
        newMessages: generateWindow(94, 120),
        prevMessages: generateWindow(1, 25),
      });

      expect(scrollToBottom).toHaveBeenCalledTimes(1);
    });

    it('does not treat a window that keeps a message the user was reading as a switch', () => {
      const { scrollToBottom } = renderWindowSwitch({
        hasMoreNewer: false,
        // the oldest message pruned and a newer one added: sim-37 to sim-60 stay rendered
        newMessages: generateWindow(37, 61),
        prevMessages: generateWindow(36, 60),
      });

      expect(scrollToBottom).not.toHaveBeenCalled();
    });
  });

  it('keeps the message the user was looking at in place when an older page loads from the very top', () => {
    const anchor = { id: 'sim-36', offsetTop: 0 };
    const captureAnchor = vi.fn(() => anchor);
    const onScrollBy = vi.fn();
    const restoreAnchor = vi.fn();
    const Comp = (props: {
      loadingMore: boolean;
      messages: LocalMessage[];
      scrollHeight: number;
    }) => {
      const updateScrollTop = useMessageListScrollManager(
        fromPartial<UseMessageListScrollManagerParams>({
          ...defaultInputs,
          captureAnchor,
          loadingMore: props.loadingMore,
          messages: props.messages,
          onScrollBy,
          restoreAnchor,
          scrollContainerMeasures: () => ({
            offsetHeight: 200,
            scrollHeight: props.scrollHeight,
            scrollTop: 0,
          }),
        }),
      );
      updateScrollTop(0);
      return <div />;
    };

    const loadedWindow = generateWindow(36, 60);
    const { rerender } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp loadingMore={false} messages={loadedWindow} scrollHeight={2000} />
      </ChatProvider>,
    );
    // loading the older page starts with the list scrolled to the very top
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp loadingMore={true} messages={loadedWindow} scrollHeight={2000} />
      </ChatProvider>,
    );
    rerender(
      <ChatProvider value={mockChatContext({ client })}>
        <Comp
          loadingMore={false}
          messages={[...generateWindow(11, 35), ...loadedWindow]}
          scrollHeight={4000}
        />
      </ChatProvider>,
    );

    expect(restoreAnchor).toHaveBeenCalledWith(anchor);
    expect(onScrollBy).not.toHaveBeenCalled();
  });
});
