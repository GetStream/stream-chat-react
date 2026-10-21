import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import type {
  Channel,
  LocalMessage,
  StreamChat,
  Thread,
  UserResponse,
} from 'stream-chat';

import { ScrollToLatestMessageButton } from '../ScrollToLatestMessageButton';
import { Chat } from '../../Chat';
import { Channel as ChannelComponent } from '../../Channel';
import { ThreadProvider } from '../../Threads';
import {
  createClientWithChannel,
  dispatchMessageNewEvent,
  dispatchMessageReadEvent,
  dispatchMessageUpdatedEvent,
  dispatchNotificationMarkUnread,
  generateChannel,
  generateMessage,
  getOrCreateChannelApi,
  useMockedApis,
} from '../../../mock-builders';

// The button resolves the client via useChatContext, the channel via useChannel and the thread via
// useThreadContext, so it renders inside the real <Chat>/<Channel> providers. A thread is provided
// through <ThreadProvider> with a stub exposing a real StateStore that holds the parent message.

const BUTTON_TEST_ID = 'scroll-to-latest-message-button';
const COUNTER_TEST_ID = 'unread-message-notification-counter';

let client: StreamChat;
let channel: Channel;
let users: UserResponse[];
let otherUser: UserResponse;
let parentMessage: LocalMessage;
let thread: Thread;

const onClick = vi.fn();

const makeThread = (parent: LocalMessage) =>
  ({
    state: new StateStore({ parentMessage: parent }),
  }) as unknown as Thread;

const renderInChannel = (ui: React.ReactNode) =>
  render(
    <Chat client={client}>
      <ChannelComponent channel={channel}>{ui}</ChannelComponent>
    </Chat>,
  );

const renderInThread = (ui: React.ReactNode) =>
  renderInChannel(<ThreadProvider thread={thread}>{ui}</ThreadProvider>);

const ScrolledUpButton = () => (
  <ScrollToLatestMessageButton isMessageListScrolledToBottom={false} onClick={onClick} />
);

const ownUnreadCount = () => channel.state.read[client.user.id]?.unread_messages;

const dispatchNewMessageFrom = async (user: UserResponse, target = channel) => {
  await act(() => {
    dispatchMessageNewEvent(client, generateMessage({ user }), target);
  });
};

/** A reply to the thread arrives: the server re-sends the parent with a grown reply count. */
const dispatchParentReplyCountUpdate = async (replyCount: number, user = otherUser) => {
  await act(() => {
    dispatchMessageUpdatedEvent(
      client,
      { ...parentMessage, reply_count: replyCount },
      channel,
      user,
    );
  });
};

/**
 * Re-queries the channel with a response whose read state carries `unreadCount` for the current
 * user, the way a reconnect reload brings in messages that never arrive as `message.new` events.
 */
const requeryWithOwnUnreadCount = async (unreadCount: number) => {
  // `useMockedApis` is a mock-builder, not a React hook.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [
    getOrCreateChannelApi(
      generateChannel({
        channel: { id: channel.id, type: channel.type },
        members: Object.values(channel.state.members),
        read: [
          {
            last_read: new Date(0).toISOString(),
            unread_messages: unreadCount,
            user: client.user,
          },
        ],
      }),
    ),
  ]);
  await act(async () => {
    await channel.watch();
  });
};

const expectCounter = async (text: string | null) => {
  await waitFor(() => {
    const counter = screen.queryByTestId(COUNTER_TEST_ID);
    if (text === null) {
      expect(counter).not.toBeInTheDocument();
    } else {
      expect(counter).toHaveTextContent(text);
    }
  });
};

beforeEach(async () => {
  const result = await createClientWithChannel();
  client = result.client;
  channel = result.channel;
  users = result.users;
  otherUser = users.find((user) => user.id !== client.user.id);
  parentMessage = { ...channel.messagePaginator.items[0], reply_count: 0 };
  thread = makeThread(parentMessage);
});

afterEach(vi.clearAllMocks);

describe.each([
  ['a channel', renderInChannel],
  ['a thread', renderInThread],
])('ScrollToLatestMessageButton visibility in %s', (_, renderButton) => {
  it('is not rendered if scrolled to the bottom of the latest message set', () => {
    renderButton(
      <ScrollToLatestMessageButton isMessageListScrolledToBottom onClick={onClick} />,
    );
    expect(screen.queryByTestId(BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('is rendered if scrolled to the bottom of an older message set', () => {
    renderButton(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom
        isNotAtLatestMessageSet
        onClick={onClick}
      />,
    );
    expect(screen.queryByTestId(BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it('is rendered if scrolled above the threshold', () => {
    renderButton(<ScrolledUpButton />);
    expect(screen.queryByTestId(BUTTON_TEST_ID)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Jump to latest message' }),
    ).toBeInTheDocument();
  });

  it('calls the onclick callback', async () => {
    renderButton(<ScrolledUpButton />);

    await act(() => {
      fireEvent.click(screen.queryByTestId(BUTTON_TEST_ID));
    });

    await waitFor(() => {
      expect(onClick).toHaveBeenCalled();
    });
  });
});

describe('ScrollToLatestMessageButton in a channel', () => {
  it('shows no number while the channel has no unread messages', async () => {
    renderInChannel(<ScrolledUpButton />);
    expect(ownUnreadCount()).toBe(0);
    await expectCounter(null);
  });

  it('shows the unread count the channel already had when the button mounted', async () => {
    await requeryWithOwnUnreadCount(7);
    renderInChannel(<ScrolledUpButton />);
    await expectCounter('7');
  });

  it('shows the unread count of a reload that brought messages in without message.new events', async () => {
    renderInChannel(<ScrolledUpButton />);
    await expectCounter(null);

    await requeryWithOwnUnreadCount(110);

    await expectCounter('110');
  });

  it('adds live messages from other users to the unread count of a reload', async () => {
    renderInChannel(<ScrolledUpButton />);
    await requeryWithOwnUnreadCount(110);

    for (let i = 0; i < 3; i++) {
      await dispatchNewMessageFrom(otherUser);
    }

    expect(ownUnreadCount()).toBe(113);
    await expectCounter('113');
  });

  it('increases the number with each new message from another user', async () => {
    renderInChannel(<ScrolledUpButton />);

    for (let i = 1; i <= 2; i++) {
      await dispatchNewMessageFrom(otherUser);
      await expectCounter(i.toString());
    }
  });

  it('hides the number once the channel is read', async () => {
    renderInChannel(<ScrolledUpButton />);
    await requeryWithOwnUnreadCount(5);
    await expectCounter('5');

    await act(() => {
      dispatchMessageReadEvent(client, client.user, channel);
    });

    expect(ownUnreadCount()).toBe(0);
    await expectCounter(null);
  });

  it('shows the unread count set by marking the channel unread', async () => {
    renderInChannel(<ScrolledUpButton />);

    await act(() => {
      dispatchNotificationMarkUnread({
        channel,
        client,
        payload: { unread_messages: 4 },
        user: client.user,
      });
    });

    await expectCounter('4');
  });

  it('shows the unread count at the bottom of an older message set', async () => {
    await requeryWithOwnUnreadCount(3);
    renderInChannel(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom
        isNotAtLatestMessageSet
        onClick={onClick}
      />,
    );

    await expectCounter('3');
  });

  it('does not count own messages', async () => {
    renderInChannel(<ScrolledUpButton />);
    await dispatchNewMessageFrom(client.user);
    await expectCounter(null);
  });

  it('does not count messages arriving to another channel', async () => {
    const { channel: otherChannel } = await createClientWithChannel({
      existingClient: client,
      existingUsers: users,
    });
    renderInChannel(<ScrolledUpButton />);

    await dispatchNewMessageFrom(otherUser, otherChannel);
    await dispatchNewMessageFrom(client.user, otherChannel);

    await expectCounter(null);
  });

  it('does not count thread replies', async () => {
    renderInChannel(<ScrolledUpButton />);

    await act(() => {
      dispatchMessageNewEvent(
        client,
        generateMessage({ parent_id: parentMessage.id, user: otherUser }),
        channel,
      );
    });

    await expectCounter(null);
  });
});

describe('ScrollToLatestMessageButton in a thread', () => {
  it('shows the number of replies other users posted while scrolled up', async () => {
    renderInThread(<ScrolledUpButton />);

    await dispatchParentReplyCountUpdate(1);
    await expectCounter('1');

    await dispatchParentReplyCountUpdate(2);
    await expectCounter('2');
  });

  it('does not count replies while scrolled to the bottom', async () => {
    renderInThread(
      <ScrollToLatestMessageButton
        isMessageListScrolledToBottom
        isNotAtLatestMessageSet
        onClick={onClick}
      />,
    );

    await dispatchParentReplyCountUpdate(1);

    await expectCounter(null);
  });

  it('counts only replies posted after the user was last at the bottom', async () => {
    const { rerender } = renderInThread(<ScrolledUpButton />);
    await dispatchParentReplyCountUpdate(2);
    await expectCounter('2');

    // At the bottom the user has seen the parent's 2 replies.
    await act(() => {
      thread.state.next({ parentMessage: { ...parentMessage, reply_count: 2 } });
    });
    const rerenderAt = (isMessageListScrolledToBottom: boolean) =>
      rerender(
        <Chat client={client}>
          <ChannelComponent channel={channel}>
            <ThreadProvider thread={thread}>
              <ScrollToLatestMessageButton
                isMessageListScrolledToBottom={isMessageListScrolledToBottom}
                isNotAtLatestMessageSet
                onClick={onClick}
              />
            </ThreadProvider>
          </ChannelComponent>
        </Chat>,
      );
    rerenderAt(true);
    await expectCounter(null);

    rerenderAt(false);
    await dispatchParentReplyCountUpdate(3);

    await expectCounter('1');
  });

  it('ignores updates to messages other than the parent', async () => {
    renderInThread(<ScrolledUpButton />);

    await act(() => {
      dispatchMessageUpdatedEvent(
        client,
        { ...channel.messagePaginator.items[1], reply_count: 4 },
        channel,
        otherUser,
      );
    });

    await expectCounter(null);
  });

  it('does not count own replies', async () => {
    renderInThread(<ScrolledUpButton />);
    await dispatchParentReplyCountUpdate(1, client.user);
    await expectCounter(null);
  });

  it("does not show the channel's unread count", async () => {
    await requeryWithOwnUnreadCount(5);
    renderInThread(<ScrolledUpButton />);

    await dispatchNewMessageFrom(otherUser);

    expect(ownUnreadCount()).toBe(6);
    await expectCounter(null);
  });
});

describe('ScrollToLatestMessageButton in a channel and its thread side by side', () => {
  const [channelListId, threadListId] = ['channel-msg-list', 'thread-msg-list'];
  const counterIn = (container: HTMLElement, listId: string) =>
    container.querySelector(`#${listId} [data-testid="${COUNTER_TEST_ID}"]`);

  const renderBoth = () =>
    render(
      <Chat client={client}>
        <ChannelComponent channel={channel}>
          <div id={channelListId}>
            <ScrolledUpButton />
          </div>
          <div id={threadListId}>
            <ThreadProvider thread={thread}>
              <ScrolledUpButton />
            </ThreadProvider>
          </div>
        </ChannelComponent>
      </Chat>,
    );

  it('shows a new channel message only in the channel list', async () => {
    const { container } = renderBoth();

    await dispatchNewMessageFrom(otherUser);

    await waitFor(() => {
      expect(counterIn(container, channelListId)).toHaveTextContent('1');
      expect(counterIn(container, threadListId)).not.toBeInTheDocument();
    });
  });

  it('shows a new thread reply only in the thread list', async () => {
    const { container } = renderBoth();

    await act(() => {
      dispatchMessageNewEvent(
        client,
        generateMessage({ parent_id: parentMessage.id, user: otherUser }),
        channel,
      );
    });
    await dispatchParentReplyCountUpdate(1);

    await waitFor(() => {
      expect(counterIn(container, threadListId)).toHaveTextContent('1');
      expect(counterIn(container, channelListId)).not.toBeInTheDocument();
    });
  });
});
