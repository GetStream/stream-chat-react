import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StateStore } from 'stream-chat';
import { MessageRepliesCountButton } from '../MessageRepliesCountButton';
import {
  ChannelInstanceProvider,
  MessageProvider,
  TranslationProvider,
} from '../../../context';

const onClickMock = jest.fn();
const mockOpenThread = jest.fn();
const defaultSingularText = '1 reply';
const defaultPluralText = '2 replies';

jest.mock('../../ChatView/ChatViewNavigationContext', () => ({
  useChatViewNavigation: () => ({
    openThread: mockOpenThread,
  }),
}));

const i18nMock = (key, { count }) =>
  count > 1 ? defaultPluralText : defaultSingularText;

const getChannel = () => ({
  cid: 'messaging:test-channel',
  messagePaginator: {
    state: new StateStore({ items: [] }),
  },
});

const renderComponent = (props) =>
  render(
    <TranslationProvider value={{ t: i18nMock }}>
      <ChannelInstanceProvider
        value={{
          channel: getChannel(),
        }}
      >
        <MessageRepliesCountButton {...props} onClick={onClickMock} />
      </ChannelInstanceProvider>
    </TranslationProvider>,
  );

describe('MessageRepliesCountButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render the right text when there is one reply, and labelSingle is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 1 });
    const button = getByText(defaultSingularText);
    expect(button).not.toBeDisabled();
  });

  it('should render the right text when there is one reply, and labelSingle is defined', () => {
    const customSingularLabel = 'text';
    const { getByText } = renderComponent({
      labelSingle: customSingularLabel,
      reply_count: 1,
    });

    expect(getByText(`1 ${customSingularLabel}`)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 2 });

    expect(getByText(defaultPluralText)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is defined', () => {
    const customPluralLabel = 'text';
    const { getByText } = renderComponent({
      labelPlural: customPluralLabel,
      reply_count: 2,
    });

    expect(getByText(`2 ${customPluralLabel}`)).toBeInTheDocument();
  });

  it('should call the onClick prop if the button is clicked', () => {
    const { getByTestId } = renderComponent({
      reply_count: 1,
    });
    fireEvent.click(getByTestId('replies-count-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
    expect(mockOpenThread).not.toHaveBeenCalled();
  });

  it('should not render anything if reply_count is 0 or undefined', () => {
    const { queryByTestId } = renderComponent({
      reply_count: 0,
    });

    expect(queryByTestId('replies-count-button')).not.toBeInTheDocument();
  });

  it('should not render ReplyIcon', () => {
    const { queryByTestId } = renderComponent({
      reply_count: 1,
    });
    expect(queryByTestId('reply-icon')).not.toBeInTheDocument();
  });

  it('opens thread by default when custom onClick is not supplied', () => {
    const message = { id: 'message-id' };
    const channel = getChannel();
    const { getByTestId } = render(
      <TranslationProvider value={{ t: i18nMock }}>
        <ChannelInstanceProvider value={{ channel }}>
          <MessageProvider value={{ message }}>
            <MessageRepliesCountButton reply_count={1} />
          </MessageProvider>
        </ChannelInstanceProvider>
      </TranslationProvider>,
    );

    fireEvent.click(getByTestId('replies-count-button'));
    expect(mockOpenThread).toHaveBeenCalledWith({ channel, message });
  });

  it('prefers live reply_count from messagePaginator for the current message', () => {
    const channel = getChannel();
    const messageId = 'message-id';
    channel.messagePaginator.state.next({
      items: [{ id: messageId, reply_count: 3, thread_participants: [] }],
    });

    const { getByText } = render(
      <TranslationProvider value={{ t: i18nMock }}>
        <ChannelInstanceProvider value={{ channel }}>
          <MessageProvider value={{ message: { id: messageId } }}>
            <MessageRepliesCountButton onClick={onClickMock} reply_count={1} />
          </MessageProvider>
        </ChannelInstanceProvider>
      </TranslationProvider>,
    );

    expect(getByText('3 replies')).toBeInTheDocument();
  });
});
