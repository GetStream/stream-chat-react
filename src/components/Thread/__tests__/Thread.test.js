import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import renderer from 'react-test-renderer';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  EmojiProvider,
  TranslationProvider,
  useMessageInputContext,
} from '../../../context';

import {
  emojiComponentMock,
  emojiDataMock,
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import { Message as MessageMock } from '../../Message/Message';
import { MessageInputSmall as MessageInputSmallMock } from '../../MessageInput/MessageInputSmall';
import { MessageList as MessageListMock } from '../../MessageList';
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
jest.mock('../../MessageInput/MessageInputSmall', () => ({
  MessageInputSmall: jest.fn(() => <div />),
}));

let chatClient;
const alice = generateUser({ id: 'alice', name: 'alice' });
const bob = generateUser({ id: 'bob', name: 'bob' });
const parentMessage = generateMessage({ reply_count: 2, user: alice });
const reply1 = generateMessage({ parent_id: parentMessage.id, user: bob });
const reply2 = generateMessage({ parent_id: parentMessage.id, user: alice });

const mockedChannel = {
  off: jest.fn(),
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

const emojiContextMock = {
  Emoji: emojiComponentMock.Emoji,
  emojiConfig: emojiDataMock,
  EmojiIndex: emojiComponentMock.EmojiIndex,
  EmojiPicker: emojiComponentMock.EmojiPicker,
};

const channelActionContextMock = {
  closeThread: jest.fn(),
  loadMoreThread: jest.fn(() => Promise.resolve()),
};

const i18nMock = jest.fn((key, props) => {
  if (key === 'replyCount' && props.count === 1) return '1 reply';
  else if (key === 'replyCount' && props.count > 1) return '2 replies';
  return key;
});

const renderComponent = ({
  chatClient,
  threadProps = {},
  channelStateOverrides = {},
  channelActionOverrides = {},
  componentOverrides = {},
}) =>
  render(
    <ChatProvider value={{ client: chatClient, latestMessageDatesByChannels: {} }}>
      <ChannelStateProvider value={{ ...channelStateContextMock, ...channelStateOverrides }}>
        <ChannelActionProvider value={{ ...channelActionContextMock, ...channelActionOverrides }}>
          <EmojiProvider value={emojiContextMock}>
            <ComponentProvider value={{ ...componentOverrides }}>
              <TranslationProvider value={{ t: i18nMock }}>
                <Thread {...threadProps} />
              </TranslationProvider>
            </ComponentProvider>
          </EmojiProvider>
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
    jest.clearAllMocks();
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
        hasMore: channelStateContextMock.threadHasMore,
        head: expect.objectContaining({ type: expect.objectContaining({ name: 'ThreadHead' }) }),
        loadingMore: channelActionContextMock.threadLoadingMore,
        loadMore: channelStateContextMock.loadMoreThread,
        Message: MessageMock,
        messages: channelStateContextMock.threadMessages,
        threadList: true,
        ...additionalMessageListProps,
      }),
      {},
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
        hasMore: channelStateContextMock.threadHasMore,
        head: expect.objectContaining({ type: expect.objectContaining({ name: 'ThreadHead' }) }),
        loadingMore: channelActionContextMock.threadLoadingMore,
        loadMore: channelStateContextMock.loadMoreThread,
        Message: MessageMock,
        messages: channelStateContextMock.threadMessages,
        threadList: true,
        ...additionalMessageListProps,
      }),
      {},
    );
  });

  it('should render the default MessageInput if nothing was passed into the prop', () => {
    const additionalMessageInputProps = { propName: 'value' };
    renderComponent({
      chatClient,
      threadProps: {
        additionalMessageInputProps,
        autoFocus: true,
      },
    });

    expect(MessageInputSmallMock).toHaveBeenCalledWith({}, {});
  });

  it('should render a custom MessageInput if it is passed as a prop', () => {
    const additionalMessageInputProps = { propName: 'value' };
    const messageInputContextConsumerFn = jest.fn();
    const CustomMessageInputMock = jest.fn(() => {
      messageInputContextConsumerFn(useMessageInputContext());
      return <div />;
    });

    renderComponent({
      chatClient,
      threadProps: {
        additionalMessageInputProps,
        autoFocus: true,
        Input: CustomMessageInputMock,
      },
    });

    expect(CustomMessageInputMock).toHaveBeenCalledWith({}, {});
    expect(messageInputContextConsumerFn).toHaveBeenCalledWith(expect.any(Object));
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
          closeThread: channelActionContextMock.closeThread,
          thread: parentMessage,
        }),
        {},
      );
    });
  });

  it('should call the closeThread callback if the button is pressed', () => {
    const { getByTestId } = renderComponent({ chatClient });

    fireEvent.click(getByTestId('close-button'));

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
      expect.anything(), // refOrContext
    );
  });

  it('should assign the str-chat__thread--full modifier class if the fullWidth prop is set to true', () => {
    const { container } = renderComponent({ chatClient, threadProps: { fullWidth: true } });
    expect(container.querySelector('.str-chat__thread--full')).toBeInTheDocument();
  });

  it('should not assign the str-chat__thread--full modifier class if the fullWidth prop is set to false', () => {
    const { container } = renderComponent({ chatClient });
    expect(container.querySelector('.str-chat__thread--full')).not.toBeInTheDocument();
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
    expect(container.querySelector('.str-chat__thread--virtualized')).not.toBeInTheDocument();
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
    const ch = generateChannel({ getConfig: () => ({ replies: false }) });
    const channelConfig = ch.getConfig();
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', ch.id);
    await channel.watch();

    const tree = renderer
      .create(
        <ChannelStateProvider value={{ ...channelStateContextMock, channel, channelConfig }}>
          <Thread />
        </ChannelStateProvider>,
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(`null`);
  });
});
