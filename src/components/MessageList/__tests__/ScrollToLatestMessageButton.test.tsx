import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StateStore } from 'stream-chat';
import type { Channel, StreamChat, Thread, UserResponse } from 'stream-chat';

import { ScrollToLatestMessageButton } from '../ScrollToLatestMessageButton';
import { Chat } from '../../Chat';
import { Channel as ChannelComponent } from '../../Channel';
import { ThreadProvider } from '../../Threads';
import {
  createClientWithChannel,
  dispatchMessageNewEvent,
  dispatchMessageUpdatedEvent,
  generateMessage,
} from '../../../mock-builders';

// MERGE-RECONCILE (test migration): ScrollToLatestMessageButton no longer reads the thread from
// the removed ChannelStateContext, nor accepts a `threadList` prop. It resolves the client via
// useChatContext, the channel via useChannel, and the thread via useThreadContext
// (Threads/ThreadContext) reading `thread.state.parentMessage`. The test now renders inside the
// real <Chat>/<Channel> providers and provides a thread via <ThreadProvider>. The thread stub
// exposes a real StateStore holding the parent message so useStateStore resolves it.

const BUTTON_TEST_ID = 'scroll-to-latest-message-button';
const NEW_MESSAGE_COUNTER_TEST_ID = 'unread-message-notification-counter';

const mainList = 'the main message list';
const threadList = 'a thread';

let client: StreamChat;
let channel: Channel;
let users: UserResponse[];
let containerIsThread: boolean;
let anotherUser;
let parentMsg;
let thread: Thread | undefined;

const onClick = vi.fn();

const makeThread = (parentMessage) =>
  ({
    state: new StateStore({ parentMessage }),
  }) as unknown as Thread;

// The button under test defaults to the main-list button (no thread context), which observes
// `message.new`. Original tests rendered it without the (now removed) `threadList` prop even in
// the "a thread" variant; a thread being open only mattered for the dedicated thread-list button
// exercised by the last test, which wraps its button in <ThreadProvider>.
const renderButton = (ui: React.ReactNode) =>
  render(
    <Chat client={client}>
      <ChannelComponent channel={channel}>{ui}</ChannelComponent>
    </Chat>,
  );

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
])('ScrollToLatestMessageButton in %s', (containerMsgList, otherMsgList) => {
  beforeEach(async () => {
    const result = await createClientWithChannel();
    client = result.client;
    channel = result.channel;
    users = result.users;
    containerIsThread = containerMsgList === threadList;
    anotherUser = Object.values(channel.state.members).find(
      (u) => u.user_id !== client.user.id,
    );
    parentMsg = { ...channel.messagePaginator.headItems[0], reply_count: 0 };
    thread = makeThread(parentMsg);
  });

  afterEach(vi.clearAllMocks);

  it(`is not rendered if ${containerMsgList} scrolled to the bottom`, () => {
    renderButton(
      <ScrollToLatestMessageButton isMessageListScrolledToBottom onClick={onClick} />,
    );
    expect(screen.queryByTestId(BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('is rendered if scrolled above the threshold', () => {
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
    );
    expect(screen.queryByTestId(BUTTON_TEST_ID)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Jump to latest message' }),
    ).toBeInTheDocument();
  });

  it('calls the onclick callback', async () => {
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
    );

    await act(() => {
      fireEvent.click(screen.queryByTestId(BUTTON_TEST_ID));
    });

    await waitFor(() => {
      expect(onClick).toHaveBeenCalled();
    });
  });

  it('does not increase the unread count if already scrolled at the bottom', async () => {
    const newMessage = generateMessage({ user: anotherUser });
    renderButton(
      <ScrollToLatestMessageButton isMessageListScrolledToBottom onClick={onClick} />,
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
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
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
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
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
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
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

    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
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
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom={false}
        onClick={onClick}
      />,
    );

    for (let i = 1; i <= 2; i++) {
      const newMessage = generateMessage({ user: anotherUser });
      await act(() => {
        dispatchMessageEvents({
          channel,
          client,
          newMessage,
          parentMsg,
          user: anotherUser,
        });
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
      <Chat client={client}>
        <ChannelComponent channel={channel}>
          <div id={mainListId}>
            <ScrollToLatestMessageButton
              isMessageListScrolledToBottom={false}
              onClick={onClick}
            />
          </div>
          <div id={threadListId}>
            <ThreadProvider thread={thread}>
              <ScrollToLatestMessageButton
                isMessageListScrolledToBottom={false}
                onClick={onClick}
              />
            </ThreadProvider>
          </div>
        </ChannelComponent>
      </Chat>,
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

    const [containerMsgListCounterSelector, otherMsgListCounterSelector] =
      containerIsThread
        ? [threadListCounterSelector, mainListCounterSelector]
        : [mainListCounterSelector, threadListCounterSelector];

    await waitFor(() => {
      expect(
        container.querySelector(containerMsgListCounterSelector),
      ).toBeInTheDocument();
      expect(
        container.querySelector(otherMsgListCounterSelector),
      ).not.toBeInTheDocument();
    });
  });
});
