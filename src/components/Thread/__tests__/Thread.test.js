import React from 'react';
import renderer from 'react-test-renderer';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';
import { Message as MessageMock } from '../../Message';
import { MessageList as MessageListMock } from '../../MessageList';
import { MessageInput as MessageInputMock } from '../../MessageInput';
import Thread from '../Thread';
import { ChannelContext, TranslationContext } from '../../../context';

jest.mock('../../Message', () => ({
  Message: jest.fn(() => <div />),
}));
jest.mock('../../MessageList', () => ({
  MessageList: jest.fn(() => <div />),
}));
jest.mock('../../MessageInput', () => ({
  MessageInput: jest.fn(() => <div />),
}));

const alice = generateUser({ id: 'alice', name: 'alice' });
const bob = generateUser({ id: 'bob', name: 'bob' });
const threadStart = generateMessage({ reply_count: 2, user: alice });
const reply1 = generateMessage({ parent_id: threadStart.id, user: bob });
const reply2 = generateMessage({ parent_id: threadStart.id, user: alice });

const channelContextMock = {
  channel: {}, // required prop from context in class-based component, so providing empty object here
  closeThread: jest.fn(),
  loadMoreThread: jest.fn(() => Promise.resolve()),
  thread: threadStart,
  threadHasMore: true,
  threadLoadingMore: false,
  threadMessages: [reply1, reply2],
};

const i18nMock = jest.fn((key) => key);

const renderComponent = (props = {}, channelContextOverrides = {}) =>
  render(
    <TranslationContext.Provider value={{ t: i18nMock }}>
      <ChannelContext.Provider
        value={{ ...channelContextMock, ...channelContextOverrides }}
      >
        <Thread {...props} />
      </ChannelContext.Provider>
    </TranslationContext.Provider>,
  );

describe('Thread', () => {
  // Note: testing actual scroll behavior is not feasible because jsdom does not implement
  // e.g. scrollTop, scrollHeight, etc.

  afterEach(jest.clearAllMocks);

  it('should render the reply count', () => {
    const { getByText } = renderComponent();

    expect(i18nMock).toHaveBeenCalledWith('{{ replyCount }} replies', {
      replyCount: threadStart.reply_count,
    });
    expect(getByText('{{ replyCount }} replies')).toBeInTheDocument();
  });

  it('should render the message that starts the thread', () => {
    renderComponent();

    expect(MessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: threadStart,
      }),
      {},
    );
  });

  it('should render the MessageList component with the correct props', () => {
    const additionalMessageListProps = { propName: 'value' };
    renderComponent({ additionalMessageListProps, Message: MessageMock });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasMore: channelContextMock.threadHasMore,
        loadingMore: channelContextMock.threadLoadingMore,
        loadMore: channelContextMock.loadMoreThread,
        Message: MessageMock,
        messages: channelContextMock.threadMessages,
        threadList: true,
        ...additionalMessageListProps,
      }),
      {},
    );
  });

  it('should render the default MessageInput if nothing was passed into the prop', () => {
    const additionalMessageInputProps = { propName: 'value' };
    renderComponent({ additionalMessageInputProps, autoFocus: true });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: true,
        parent: threadStart,
        ...additionalMessageInputProps,
      }),
      {},
    );
  });

  it('should render a custom MessageInput if it is passed as a prop', () => {
    const additionalMessageInputProps = { propName: 'value' };
    const CustomMessageInputMock = jest.fn(() => <div />);

    renderComponent({
      additionalMessageInputProps,
      autoFocus: true,
      MessageInput: CustomMessageInputMock,
    });
    expect(CustomMessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: true,
        parent: threadStart,
        ...additionalMessageInputProps,
      }),
      {},
    );
  });

  it('should render a custom ThreadHeader if it is passed as a prop', async () => {
    const CustomThreadHeader = jest.fn(() => (
      <div data-testid='custom-thread-header' />
    ));

    const { getByTestId } = renderComponent({
      ThreadHeader: CustomThreadHeader,
    });

    await waitFor(() => {
      expect(getByTestId('custom-thread-header')).toBeInTheDocument();
      expect(CustomThreadHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          closeThread: channelContextMock.closeThread,
          t: i18nMock,
          thread: threadStart,
        }),
        {},
      );
    });
  });

  it('should call the closeThread callback if the button is pressed', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('close-button'));

    expect(channelContextMock.closeThread).toHaveBeenCalledTimes(1);
  });

  it('should assign the str-chat__thread--full modifier class if the fullWidth prop is set to true', () => {
    const { container } = renderComponent({ fullWidth: true });
    expect(
      container.querySelector('.str-chat__thread--full'),
    ).toBeInTheDocument();
  });

  it('should not assign the str-chat__thread--full modifier class if the fullWidth prop is set to false', () => {
    const { container } = renderComponent();
    expect(
      container.querySelector('.str-chat__thread--full'),
    ).not.toBeInTheDocument();
  });

  it('should not render anything if the thread in context is falsy', () => {
    const { container } = renderComponent({}, { thread: null });

    expect(
      container.querySelector('.str-chat__thread'),
    ).not.toBeInTheDocument();
  });

  it('should call the loadMoreThread callback on mount if the thread start has a non-zero reply count', () => {
    renderComponent();

    expect(channelContextMock.loadMoreThread).toHaveBeenCalledTimes(1);
  });

  it('should render null if replies is disabled', async () => {
    const client = await getTestClientWithUser();
    const ch = generateChannel({ config: { replies: false } });
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', ch.id);
    await channel.watch();

    const tree = renderer
      .create(
        <ChannelContext.Provider
          value={{ ...channelContextMock, channel, client }}
        >
          <Thread />
        </ChannelContext.Provider>,
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(`null`);
  });
});
