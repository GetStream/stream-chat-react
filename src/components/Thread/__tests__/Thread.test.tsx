import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  TranslationProvider,
} from '../../../context';

import {
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import { Message as MessageMock } from '../../Message/Message';
import { MessageComposer as MessageInputMock } from '../../MessageComposer/MessageComposer';
import { MessageList as MessageListMock } from '../../MessageList';
import { Thread } from '../Thread';

vi.mock('../../Message/Message', () => ({
  Message: vi.fn(() => <div />),
}));
vi.mock('../../MessageList/MessageList', () => ({
  MessageList: vi.fn(() => <div />),
}));
vi.mock('../../MessageList/VirtualizedMessageList', () => ({
  VirtualizedMessageList: vi.fn(() => <div />),
}));
vi.mock('../../MessageComposer/MessageComposer', () => ({
  MessageComposer: vi.fn(() => <div />),
}));
vi.mock('../../Threads', () => ({
  useThreadContext: vi.fn(() => undefined),
}));
vi.mock('../../ChatView', () => ({
  useChatViewContext: vi.fn(() => ({
    activeChatView: 'channels',
    setActiveChatView: vi.fn(),
  })),
}));

let chatClient;
const alice = generateUser({ id: 'alice', name: 'alice' });
const bob = generateUser({ id: 'bob', name: 'bob' });
const parentMessage = generateMessage({ reply_count: 2, user: alice });
const reply1 = generateMessage({ parent_id: parentMessage.id, user: bob });
const reply2 = generateMessage({ parent_id: parentMessage.id, user: alice });

const mockedChannel = {
  getClient: () => ({ userID: alice.id }),
  off: vi.fn(),
  state: {
    members: {},
  },
};
const channelStateContextMock = {
  channel: mockedChannel,
  thread: parentMessage,
  threadHasMore: true,
  threadLoadingMore: false,
  threadMessages: [reply1, reply2],
};

const channelActionContextMock = {
  closeThread: vi.fn(),
  loadMoreThread: vi.fn(() => Promise.resolve()),
};

const i18nMock = vi.fn((key, props) => {
  if (key === 'replyCount' && props.count === 1) return '1 reply';
  else if (key === 'replyCount' && props.count > 1) return '2 replies';
  return key;
});

const renderComponent = ({
  channelActionOverrides = {},
  channelStateOverrides = {},
  chatClient,
  componentOverrides = {},
  threadProps = {},
}: any) =>
  render(
    <ChatProvider value={{ client: chatClient, latestMessageDatesByChannels: {} } as any}>
      <ChannelStateProvider
        value={{ ...channelStateContextMock, ...channelStateOverrides } as any}
      >
        <ChannelActionProvider
          value={{ ...channelActionContextMock, ...channelActionOverrides } as any}
        >
          <ComponentProvider value={{ ...componentOverrides } as any}>
            <TranslationProvider value={{ t: i18nMock } as any}>
              <Thread {...threadProps} />
            </TranslationProvider>
          </ComponentProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
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
    vi.clearAllMocks();
  });

  it('should render the MessageList component with the correct props without date separators', () => {
    const additionalMessageListProps = {
      loadingMore: false,
      loadMore: (channelActionContextMock as any).threadLoadingMore,
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
        hasMore: channelStateContextMock.threadHasMore,
        head: expect.objectContaining({
          type: expect.objectContaining({ name: 'ThreadHead' }),
        }),
        loadingMore: (channelActionContextMock as any).threadLoadingMore,
        loadMore: (channelStateContextMock as any).loadMoreThread,
        Message: MessageMock,
        messages: channelStateContextMock.threadMessages,
        threadList: true,
        ...additionalMessageListProps,
      }),
      undefined,
    );
  });

  it('should render the MessageList component with date separators if enabled', () => {
    const additionalMessageListProps = {
      loadingMore: false,
      loadMore: (channelActionContextMock as any).threadLoadingMore,
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
        hasMore: channelStateContextMock.threadHasMore,
        head: expect.objectContaining({
          type: expect.objectContaining({ name: 'ThreadHead' }),
        }),
        loadingMore: (channelActionContextMock as any).threadLoadingMore,
        loadMore: (channelStateContextMock as any).loadMoreThread,
        Message: MessageMock,
        messages: channelStateContextMock.threadMessages,
        threadList: true,
        ...additionalMessageListProps,
      }),
      undefined,
    );
  });

  it('should render the MessageComposer with correct default props', () => {
    const props = {
      additionalMessageComposerProps: { propName: 'value' },
      autoFocus: true,
    };
    renderComponent({
      chatClient,
      threadProps: props,
    });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: props.autoFocus,
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageComposerProps,
      }),
      undefined,
    );
  });

  it('should pass additionalMessageComposerProps to MessageComposer', () => {
    const props = {
      additionalMessageComposerProps: {
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
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageComposerProps,
      }),
      undefined,
    );
  });

  it('should render a custom ThreadHeader if it is passed as a prop', async () => {
    const CustomThreadHeader = vi.fn(() => <div data-testid='custom-thread-header' />);

    const { getByTestId } = renderComponent({
      chatClient,
      componentOverrides: { ThreadHeader: CustomThreadHeader },
    });

    await waitFor(() => {
      expect(getByTestId('custom-thread-header')).toBeInTheDocument();
      expect(CustomThreadHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          closeThread: channelActionContextMock.closeThread,
          thread: parentMessage,
        }),
        undefined,
      );
    });
  });

  it('should call the closeThread callback if the button is pressed', () => {
    const { getByTestId } = renderComponent({ chatClient });

    fireEvent.click(getByTestId('close-thread-button'));

    expect(channelActionContextMock.closeThread).toHaveBeenCalledTimes(1);
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

  it('should call the loadMoreThread callback on mount if the thread start has a non-zero reply count', () => {
    renderComponent({ chatClient });

    expect(channelActionContextMock.loadMoreThread).toHaveBeenCalledTimes(1);
  });

  it('should render null if replies is disabled', async () => {
    const client = await getTestClientWithUser();
    const ch = generateChannel({ getConfig: () => ({ replies: false }) } as any);
    const channelConfig = (ch as any).getConfig();
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', (ch as any).id);
    await channel.watch();

    const { container } = render(
      <ChannelStateProvider
        value={{ ...channelStateContextMock, channel, channelConfig } as any}
      >
        <Thread />
      </ChannelStateProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
