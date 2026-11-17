import React from 'react';
import { act, render } from '@testing-library/react';
import type { LocalMessage } from 'stream-chat';

import { UnreadMessagesNotification } from '../UnreadMessagesNotification';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { generateMessage, initClientWithChannels } from '../../../mock-builders';

// Nanosecond timestamps, as `stream-chat` keeps them.
const SECOND_NS = 1_000_000_000;
const lastReadAt = 1_800_000_000 * SECOND_NS;

const renderNotification = async ({
  newestLoadedAt,
  unreadIsBelow,
}: {
  newestLoadedAt: number;
  unreadIsBelow?: boolean;
}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  const result = render(
    <Chat client={client}>
      <Channel channel={channel}>
        <UnreadMessagesNotification unreadIsBelow={unreadIsBelow} />
      </Channel>
    </Chat>,
  );
  act(() => {
    channel.messagePaginator.state.partialNext({
      items: [
        { ...generateMessage(), created_at: newestLoadedAt - SECOND_NS },
        { ...generateMessage(), created_at: newestLoadedAt },
      ] as unknown as LocalMessage[],
    });
    channel.messagePaginator.unreadStateSnapshot.partialNext({
      firstUnreadMessageId: null,
      lastReadAt,
      lastReadMessageId: null,
      unreadCount: 1,
    });
  });
  return result;
};

describe('UnreadMessagesNotification', () => {
  it('points up when the unread messages are above the loaded messages', async () => {
    const { container } = await renderNotification({
      newestLoadedAt: lastReadAt + 10 * SECOND_NS,
    });

    expect(container.querySelector('.str-chat__icon--arrow-up')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__icon--arrow-down'),
    ).not.toBeInTheDocument();
  });

  // After jumping back in history, a message that arrives is newer than everything loaded.
  it('points down when every loaded message is older than the last read one', async () => {
    const { container } = await renderNotification({
      newestLoadedAt: lastReadAt - 10 * SECOND_NS,
    });

    expect(container.querySelector('.str-chat__icon--arrow-down')).toBeInTheDocument();
    expect(container.querySelector('.str-chat__icon--arrow-up')).not.toBeInTheDocument();
  });

  // The unread messages are loaded but the reader scrolled up past the separator: the list tells the
  // notification, and that wins over the loaded-window check.
  it('points down when the list reports the unread messages below the viewport', async () => {
    const { container } = await renderNotification({
      newestLoadedAt: lastReadAt + 10 * SECOND_NS,
      unreadIsBelow: true,
    });

    expect(container.querySelector('.str-chat__icon--arrow-down')).toBeInTheDocument();
    expect(container.querySelector('.str-chat__icon--arrow-up')).not.toBeInTheDocument();
  });
});
