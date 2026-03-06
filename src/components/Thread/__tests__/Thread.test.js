import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';

import {
  ChannelInstanceProvider,
  ChatProvider,
  ComponentProvider,
  TranslationProvider,
} from '../../../context';

import {
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

import { Message as MessageMock } from '../../Message/Message';
import { MessageInput as MessageInputMock } from '../../MessageInput/MessageInput';
import { MessageList as MessageListMock } from '../../MessageList';
import { ThreadProvider } from '../../Threads';
import { Thread } from '../Thread';

jest.mock('../../Message/Message', () => ({
  Message: jest.fn(() => <div />),
}));
jest.mock('../../MessageList/MessageList', () => ({
  MessageList: jest.fn(() => <div />),
}));
jest.mock('../../MessageList/VirtualizedMessageList', () => ({
  VirtualizedMessageList: jest.fn(() => <div />),
}));
jest.mock('../../MessageInput/MessageInput', () => ({
  MessageInput: jest.fn(() => <div />),
}));

let chatClient;
const alice = generateUser({ id: 'alice', name: 'alice' });
const bob = generateUser({ id: 'bob', name: 'bob' });
const parentMessage = generateMessage({ reply_count: 2, user: alice });
const reply1 = generateMessage({ parent_id: parentMessage.id, user: bob });
const reply2 = generateMessage({ parent_id: parentMessage.id, user: alice });

const mockedChannel = {
  cid: 'messaging:test',
  configState: {
    getLatestValue: () => ({}),
    partialNext: jest.fn(),
  },
  getClient: () => ({ deleteMessage: jest.fn(), updateMessage: jest.fn() }),
  getConfig: () => ({ replies: true }),
  off: jest.fn(),
  sendMessage: jest.fn(),
  state: {
    members: {},
  },
};
const channelActionContextMock = {
  closeThread: jest.fn(),
  loadMoreThread: jest.fn(),
  threadLoadingMore: false,
};
const channelStateContextMock = {
  channel: mockedChannel,
  thread: parentMessage,
  threadHasMore: true,
  threadLoadingMore: false,
  threadMessages: [reply1, reply2],
};

const i18nMock = jest.fn((key, props) => {
  if (key === 'replyCount' && props.count === 1) return '1 reply';
  else if (key === 'replyCount' && props.count > 1) return '2 replies';
  return key;
});

const makeThread = ({
  channel = mockedChannel,
  messagePaginatorState = {},
  thread = parentMessage,
} = {}) =>
  thread
    ? {
        channel,
        configState: {
          getLatestValue: () => ({}),
          partialNext: jest.fn(),
        },
        deactivate: jest.fn(),
        id: `thread-${thread.id}`,
        messagePaginator: {
          state: {
            getLatestValue: () => ({
              hasMoreHead: false,
              hasMoreTail: false,
              isLoading: false,
              items: undefined,
              ...messagePaginatorState,
            }),
            subscribeWithSelector: () => () => null,
          },
        },
        reload: jest.fn(),
        state: {
          getLatestValue: () => ({ isStateStale: false, parentMessage: thread }),
          subscribeWithSelector: () => () => null,
        },
      }
    : null;

const renderComponent = ({
  channelStateOverrides = {},
  chatClient,
  componentOverrides = {},
  threadInstance,
  threadProps = {},
}) =>
  render(
    <ChatProvider value={{ client: chatClient, latestMessageDatesByChannels: {} }}>
      <ChannelInstanceProvider
        value={{
          channel: channelStateOverrides.channel ?? channelStateContextMock.channel,
        }}
      >
        <ComponentProvider value={{ ...componentOverrides }}>
          <TranslationProvider value={{ t: i18nMock }}>
            <ThreadProvider
              thread={
                threadInstance ??
                makeThread({
                  channel:
                    channelStateOverrides.channel ?? channelStateContextMock.channel,
                  thread:
                    channelStateOverrides.thread === undefined
                      ? channelStateContextMock.thread
                      : channelStateOverrides.thread,
                })
              }
            >
              <Thread {...threadProps} />
            </ThreadProvider>
          </TranslationProvider>
        </ComponentProvider>
      </ChannelInstanceProvider>
    </ChatProvider>,
  );

describe('Thread', () => {
  beforeAll(async () => {
    chatClient = await getTestClientWithUser();
  });

  // Note: testing actual scroll behavior is not feasible because jsdom does not implement
  // e.g. scrollTop, scrollHeight, etc.

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    chatClient?.threads?.resetState?.();
  });

  it('should render the MessageList component with the correct props without date separators', () => {
    const additionalMessageListProps = {
      loadingMore: false,
      loadMore: channelActionContextMock.threadLoadingMore,
      propName: 'value',
      read: {},
    };
    renderComponent({
      chatClient,
      threadProps: {
        additionalMessageListProps,
        Message: MessageMock,
      },
    });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        disableDateSeparator: true,
        head: expect.objectContaining({
          type: expect.objectContaining({ name: 'ThreadHead' }),
        }),
        Message: MessageMock,
        ...additionalMessageListProps,
      }),
      undefined,
    );
  });

  it('should render the MessageList component with date separators if enabled', () => {
    const additionalMessageListProps = {
      loadingMore: false,
      loadMore: channelActionContextMock.threadLoadingMore,
      propName: 'value',
      read: {},
    };
    renderComponent({
      chatClient,
      threadProps: {
        additionalMessageListProps,
        enableDateSeparator: true,
        Message: MessageMock,
      },
    });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        disableDateSeparator: false,
        head: expect.objectContaining({
          type: expect.objectContaining({ name: 'ThreadHead' }),
        }),
        Message: MessageMock,
        ...additionalMessageListProps,
      }),
      undefined,
    );
  });

  it('should render the default MessageInput if nothing was passed into the prop', () => {
    const props = {
      additionalMessageInputProps: { propName: 'value' },
      autoFocus: true,
    };
    renderComponent({
      chatClient,
      threadProps: props,
    });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: props.autoFocus,
        Input: expect.any(Function),
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageInputProps,
      }),
      undefined,
    );
  });

  it('should render a custom MessageInput if it is passed as a prop', () => {
    const CustomMessageInputMock = jest.fn();
    const CustomMessageInputMockAdditional = jest.fn();
    const props = {
      additionalMessageInputProps: {
        Input: CustomMessageInputMockAdditional,
        propName: 'value',
      },
      autoFocus: true,
      Input: CustomMessageInputMock,
    };

    renderComponent({
      chatClient,
      threadProps: props,
    });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: props.autoFocus,
        Input: CustomMessageInputMock,
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageInputProps,
      }),
      undefined,
    );
  });

  it('should render a custom MessageInput from additional props', () => {
    const CustomMessageInputMockAdditional = jest.fn();
    const props = {
      additionalMessageInputProps: {
        Input: CustomMessageInputMockAdditional,
        propName: 'value',
      },
      autoFocus: true,
    };

    renderComponent({
      chatClient,
      threadProps: props,
    });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: props.autoFocus,
        Input: CustomMessageInputMockAdditional,
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageInputProps,
      }),
      undefined,
    );
  });

  it('should render a custom ThreadHeader if it is passed as a prop', async () => {
    const CustomThreadHeader = jest.fn(() => <div data-testid='custom-thread-header' />);

    const { getByTestId } = renderComponent({
      chatClient,
      componentOverrides: { ThreadHeader: CustomThreadHeader },
    });

    await waitFor(() => {
      expect(getByTestId('custom-thread-header')).toBeInTheDocument();
      expect(CustomThreadHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          closeThread: expect.any(Function),
          thread: parentMessage,
        }),
        undefined,
      );
    });
  });

  it('should deactivate thread instance if the close button is pressed', () => {
    const threadInstance = makeThread();
    const { getByTestId } = renderComponent({ chatClient, threadInstance });

    fireEvent.click(getByTestId('close-button'));

    expect(threadInstance.deactivate).toHaveBeenCalledTimes(1);
  });

  it('should pass messageActions prop to the used messageList', () => {
    const messageActions = ['edit', 'reply', 'delete'];
    renderComponent({
      chatClient,
      threadProps: {
        messageActions,
      },
    });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messageActions,
      }),
      undefined,
    );
  });

  it('should assign str-chat__thread--virtualized class to the root in virtualized mode', () => {
    const { container } = renderComponent({
      chatClient,
      threadProps: { virtualized: true },
    });
    expect(container.querySelector('.str-chat__thread--virtualized')).toBeInTheDocument();
  });

  it('should not assign str-chat__thread--virtualized class to the root in non-virtualized mode', () => {
    const { container } = renderComponent({
      chatClient,
      threadProps: { virtualized: false },
    });
    expect(
      container.querySelector('.str-chat__thread--virtualized'),
    ).not.toBeInTheDocument();
  });

  it('should not render anything if the thread in context is falsy', () => {
    const { container } = renderComponent({
      channelStateOverrides: { thread: null },
      chatClient,
    });

    expect(container.querySelector('.str-chat__thread')).not.toBeInTheDocument();
  });

  it('should reload unmanaged thread instance on mount when paginator has not loaded yet', () => {
    const threadInstance = makeThread();
    chatClient.threads.resetState();
    renderComponent({ chatClient, threadInstance });

    expect(threadInstance.reload).toHaveBeenCalledTimes(1);
  });

  it('should not reload thread instance on mount when the thread is already managed', () => {
    const threadInstance = makeThread();
    chatClient.threads.state.next((current) => ({
      ...current,
      threads: [threadInstance],
    }));

    renderComponent({ chatClient, threadInstance });

    expect(threadInstance.reload).not.toHaveBeenCalled();
  });

  it('should register an unmanaged thread in ThreadManager after first page load', () => {
    const threadInstance = makeThread({
      messagePaginatorState: {
        items: [],
      },
    });

    chatClient.threads.resetState();
    renderComponent({ chatClient, threadInstance });

    const { threads } = chatClient.threads.state.getLatestValue();
    expect(threads.some((thread) => thread.id === threadInstance.id)).toBe(true);
  });

  it('should render null if replies is disabled', () => {
    const channel = {
      ...mockedChannel,
      getConfig: () => ({ replies: false }),
    };

    const { container } = render(
      <ChatProvider value={{ client: chatClient, latestMessageDatesByChannels: {} }}>
        <ChannelInstanceProvider value={{ channel }}>
          <ThreadProvider
            thread={makeThread({ channel, thread: channelStateContextMock.thread })}
          >
            <Thread />
          </ThreadProvider>
        </ChannelInstanceProvider>
      </ChatProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
