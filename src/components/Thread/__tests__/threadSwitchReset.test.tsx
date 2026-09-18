// What survives a thread change and what does not.
//
// `Thread` used to key its whole subtree on the thread, so a switch destroyed everything below it,
// including parts that hold no per-thread state. The reset now lives where the state does: the
// message list keys itself on what it renders -- the thread when there is one, the channel
// otherwise -- while the surrounding subtree is re-rendered rather than rebuilt.
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

// The list element, not the panel: the panel is rendered above the message list's key so the
// notification area it holds survives a switch, which makes it a poor witness to the rebuild. This
// one is inside the key, and it is what carries the scroll state the key exists to reset.
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

  // Two threads of the SAME channel -- the case a channel-scoped key cannot tell apart. Each needs
  // a real paginator, since that is what the list reads.
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
