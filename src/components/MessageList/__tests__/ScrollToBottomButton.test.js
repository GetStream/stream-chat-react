import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ScrollToBottomButton } from '../ScrollToBottomButton';
import { ChannelStateProvider, ChatProvider } from '../../../context';
import { createClientWithChannel } from '../../../mock-builders';

const BUTTON_TEST_ID = 'message-notification';
const NEW_MESSAGE_COUNTER_TEST_ID = 'unread-message-notification-counter';

let client;
let channel;
let containerIsThread;
let channelStateContext;
let parentMsg;

const onClick = jest.fn();

describe('ScrollToBottomButton', () => {
  beforeEach(async () => {
    const result = await createClientWithChannel();
    client = result.client;
    channel = result.channel;
    parentMsg = { ...Object.values(channel.state.messages)[0], reply_count: 0 };
    channelStateContext = {
      thread: containerIsThread ? parentMsg : null,
    };
  });

  afterEach(jest.clearAllMocks);

  it(`is not rendered if the container is scrolled to the bottom`, () => {
    const { container } = render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('is rendered if scrolled above the threshold', () => {
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );
    expect(screen.queryByTestId(BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it('calls the onclick callback', async () => {
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      fireEvent.click(screen.queryByTestId(BUTTON_TEST_ID));
    });

    await waitFor(() => {
      // eslint-disable-next-line jest/prefer-called-with
      expect(onClick).toHaveBeenCalled();
    });
  });

  it('reflects the unread count from props', async () => {
    const { rerender } = render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();

    const unreadCount = 2;
    rerender(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton
            isMessageListScrolledToBottom={false}
            onClick={onClick}
            unreadCount={unreadCount}
          />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await waitFor(() => {
      const counter = screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID);
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent(unreadCount);
    });
  });
});
