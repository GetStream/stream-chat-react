import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ScrollToBottomButton } from '../ScrollToBottomButton';
import { ChannelStateProvider, ChatProvider } from '../../../context';
import {
  createClientWithChannel,
  dispatchMessageNewEvent,
  dispatchMessageUpdatedEvent,
  generateMessage,
} from '../../../mock-builders';

const BUTTON_TEST_ID = 'message-notification';
const NEW_MESSAGE_COUNTER_TEST_ID = 'unread-message-notification-counter';

const mainList = 'the main message list';
const threadList = 'a thread';

let client;
let channel;
let users;
let containerIsThread;
let anotherUser;
let channelStateContext;
let parentMsg;

const onClick = jest.fn();

const dispatchMessageEvents = ({ channel, client, newMessage, parentMsg, user }) => {
  if (containerIsThread) {
    dispatchMessageUpdatedEvent(
      client,
      { ...parentMsg, reply_count: parentMsg.reply_count + 1 },
      channel,
      user,
    );
  }
  dispatchMessageNewEvent(client, newMessage, channel);
};

describe.each([
  [mainList, threadList],
  [threadList, mainList],
])('ScrollToBottomButton in %s', (containerMsgList, otherMsgList) => {
  beforeEach(async () => {
    const result = await createClientWithChannel();
    client = result.client;
    channel = result.channel;
    users = result.users;
    containerIsThread = containerMsgList === threadList;
    anotherUser = Object.values(channel.state.members).find((u) => u.id !== client.user.id);
    parentMsg = { ...Object.values(channel.state.messages)[0], reply_count: 0 };
    channelStateContext = {
      thread: containerIsThread ? parentMsg : null,
    };
  });

  afterEach(jest.clearAllMocks);

  it(`is not rendered if ${containerMsgList} scrolled to the bottom`, () => {
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

  it('does not increase the unread count if already scrolled at the bottom', async () => {
    const newMessage = generateMessage({ user: anotherUser });
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      dispatchMessageEvents({
        channel,
        client,
        newMessage,
        parentMsg,
        user: anotherUser,
      });
    });

    await waitFor(() => {
      const counter = screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID);
      expect(counter).not.toBeInTheDocument();
    });
  });

  it('shows the count unread if new message arrives to active channel from another user', async () => {
    const newMessage = generateMessage({ user: anotherUser });
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      dispatchMessageEvents({
        channel,
        client,
        newMessage,
        parentMsg,
        user: anotherUser,
      });
    });

    await waitFor(() => {
      const counter = screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID);
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('1');
    });
  });

  it('does not show unread count for own arriving messages', async () => {
    const newMessage = generateMessage({ user: client.user });
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      dispatchMessageEvents({
        channel,
        client,
        newMessage,
        parentMsg,
        user: client.user,
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();
    });
  });

  it('does not show unread count for messages from others arriving to non-active channel', async () => {
    const newMessage = generateMessage({ user: anotherUser });
    const { channel: nonActiveChannel } = await createClientWithChannel({
      existingClient: client,
      existingUsers: users,
    });
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      dispatchMessageEvents({
        channel: nonActiveChannel,
        client,
        newMessage,
        parentMsg,
        user: anotherUser,
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();
    });
  });

  it('does not show unread count for messages arriving from me to non-active channel', async () => {
    const newMessage = generateMessage({ user: client.user });
    const { channel: nonActiveChannel } = await createClientWithChannel({
      existingClient: client,
      existingUsers: users,
    });

    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      dispatchMessageEvents({
        channel: nonActiveChannel,
        client,
        newMessage,
        parentMsg,
        user: client.user,
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();
    });
  });

  it('increases the count unread with each new message arrival', async () => {
    render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
        </ChannelStateProvider>
      </ChatProvider>,
    );

    for (let i = 1; i <= 2; i++) {
      const newMessage = generateMessage({ user: anotherUser });
      await act(() => {
        dispatchMessageEvents({ channel, client, newMessage, parentMsg, user: anotherUser });
      });
      const counter = screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID);
      await waitFor(() => {
        expect(counter).toHaveTextContent(i.toString());
      });
    }
  });

  it(`does not show the count unread of ${containerMsgList} in ${otherMsgList}`, async () => {
    const [mainListId, threadListId] = ['main-msg-list', 'thread-msg-list'];
    const [mainListCounterSelector, threadListCounterSelector] = [
      `#${mainListId} [data-testid="${NEW_MESSAGE_COUNTER_TEST_ID}"]`,
      `#${threadListId} [data-testid="${NEW_MESSAGE_COUNTER_TEST_ID}"]`,
    ];

    const messagePayload = containerIsThread
      ? { parent_id: parentMsg.id, user: anotherUser }
      : { user: anotherUser };
    const newMessage = generateMessage(messagePayload);

    const { container } = render(
      <ChatProvider value={{ channel, client }}>
        <ChannelStateProvider value={channelStateContext}>
          <div id={mainListId}>
            <ScrollToBottomButton isMessageListScrolledToBottom={false} onClick={onClick} />
          </div>
          <div id={threadListId}>
            <ScrollToBottomButton
              isMessageListScrolledToBottom={false}
              onClick={onClick}
              threadList
            />
          </div>
        </ChannelStateProvider>
      </ChatProvider>,
    );

    await act(() => {
      dispatchMessageEvents({ channel, client, newMessage, parentMsg, user: anotherUser });
    });

    const [containerMsgListCounterSelector, otherMsgListCounterSelector] = containerIsThread
      ? [threadListCounterSelector, mainListCounterSelector]
      : [mainListCounterSelector, threadListCounterSelector];

    await waitFor(() => {
      expect(container.querySelector(containerMsgListCounterSelector)).toBeInTheDocument();
      expect(container.querySelector(otherMsgListCounterSelector)).not.toBeInTheDocument();
    });
  });
});
