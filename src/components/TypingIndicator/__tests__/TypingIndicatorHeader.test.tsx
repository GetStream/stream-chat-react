import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, Thread } from 'stream-chat';

import { TypingIndicatorHeader } from '../TypingIndicatorHeader';
import { ChannelInstanceProvider } from '../../../context/ChannelInstanceContext';
import { ChatProvider } from '../../../context/ChatContext';
import type { ChatContextValue } from '../../../context/ChatContext';
import { ThreadProvider } from '../../Threads/ThreadContext';
import { generateUser, initClientWithChannels } from '../../../mock-builders';

const me = generateUser();
const threadId = 'parent-message';

// Typing in every thread of a channel lands in the channel's state; the header picks the entries
// for the channel itself or, with `threadList`, for the thread in context.
const renderHeader = async ({
  threadList = false,
  typing,
}: {
  threadList?: boolean;
  typing: Channel['state']['typing'];
}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({ customUser: me });
  channel.state.typing = typing;
  const thread = threadList ? fromPartial<Thread>({ channel, id: threadId }) : undefined;

  return render(
    <ChatProvider value={fromPartial<ChatContextValue>({ client })}>
      <ChannelInstanceProvider value={{ channel }}>
        <ThreadProvider thread={thread}>
          <TypingIndicatorHeader threadList={threadList} />
        </ThreadProvider>
      </ChannelInstanceProvider>
    </ChatProvider>,
  );
};

const typingIn = (userId: string, parentId?: string) =>
  fromPartial<Channel['state']['typing'][string]>({
    parent_id: parentId,
    type: 'typing.start',
    user: { id: userId },
  });

describe('TypingIndicatorHeader', () => {
  afterEach(cleanup);

  it('shows another user typing in the channel', async () => {
    await renderHeader({ typing: { bob: typingIn('bob') } });

    expect(screen.getByTestId('typing-indicator-header')).toHaveTextContent(
      'bob is typing',
    );
  });

  it('ignores the current user and typing in threads in channel mode', async () => {
    const { container } = await renderHeader({
      typing: { bob: typingIn('bob', threadId), [me.id]: typingIn(me.id) },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows another user typing in the thread in context', async () => {
    await renderHeader({ threadList: true, typing: { bob: typingIn('bob', threadId) } });

    expect(screen.getByTestId('typing-indicator-header')).toHaveTextContent(
      'bob is typing',
    );
  });

  it('ignores typing in the channel and in other threads in thread mode', async () => {
    const { container } = await renderHeader({
      threadList: true,
      typing: { bob: typingIn('bob'), carol: typingIn('carol', 'other-message') },
    });

    expect(container).toBeEmptyDOMElement();
  });
});
