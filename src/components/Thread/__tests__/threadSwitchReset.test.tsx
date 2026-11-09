// What survives a thread change and what does not.
//
// The message list keys itself on what it renders (the thread when there is one, the channel
// otherwise), so a switch rebuilds the list and its scroll state while the surrounding subtree is
// re-rendered, not rebuilt.
//
// Companion file: ../../MessageList/__tests__/messageSourceKey.test.ts, for the key itself.

import React from 'react';
import { render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { MessageList } from '../../MessageList';
import { ThreadProvider } from '../../Threads';
import { initClientWithChannels } from '../../../mock-builders';

import type { Channel as ChannelType, StreamChat, Thread } from 'stream-chat';

// The list element, not the panel: the panel sits above the message list's key, so the
// notification area it holds survives a switch and cannot witness the rebuild. The list element
// carries the scroll state the key resets.
const messageListElement = () => document.querySelector('.str-chat__message-list');

const renderThread = ({
  channel,
  client,
  thread,
}: {
  channel: ChannelType;
  client: StreamChat;
  thread: Thread;
}) => (
  <Chat client={client}>
    <Channel channel={channel}>
      <ThreadProvider thread={thread}>
        <MessageList />
      </ThreadProvider>
    </Channel>
  </Chat>
);

const setup = async () => {
  const {
    channels: [channel, other],
    client,
  } = await initClientWithChannels({
    channelsData: [
      { channel: { id: 'channel-a', type: 'messaging' } },
      { channel: { id: 'channel-b', type: 'messaging' } },
    ],
  });

  // Two threads of the same channel, which a channel-scoped key cannot tell apart. Each needs a
  // real paginator because the list reads it.
  const threadA = fromPartial<Thread>({
    id: 'parent-a',
    messageComposer: channel.messageComposer,
    messagePaginator: channel.messagePaginator,
  });
  const threadB = fromPartial<Thread>({
    id: 'parent-b',
    messageComposer: other.messageComposer,
    messagePaginator: other.messagePaginator,
  });

  return { channel, client, threadA, threadB };
};

describe('switching threads within one channel', () => {
  it('rebuilds the message list, so its scroll state does not carry over', async () => {
    const { channel, client, threadA, threadB } = await setup();

    const { rerender } = render(renderThread({ channel, client, thread: threadA }));
    const listBefore = messageListElement();

    rerender(renderThread({ channel, client, thread: threadB }));

    expect(messageListElement()).not.toBe(listBefore);
  });

  it('keeps the message list intact when the same thread re-renders', async () => {
    const { channel, client, threadA } = await setup();

    const { rerender } = render(renderThread({ channel, client, thread: threadA }));
    const listBefore = messageListElement();

    rerender(renderThread({ channel, client, thread: threadA }));

    expect(messageListElement()).toBe(listBefore);
  });

  it('does not rebuild the channel subtree around the thread', async () => {
    const { channel, client, threadA, threadB } = await setup();

    const { rerender } = render(renderThread({ channel, client, thread: threadA }));
    const containerBefore = document.querySelector('.str-chat__channel');

    rerender(renderThread({ channel, client, thread: threadB }));

    expect(document.querySelector('.str-chat__channel')).toBe(containerBefore);
  });
});
