import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Thread } from 'stream-chat';

// Imported through the package entry: the hook is public API.
import { useMessagePaginator } from '../../index';

import { Chat } from '../../components/Chat';
import { Channel } from '../../components/Channel';
import { ThreadProvider } from '../../components/Threads';
import { initClientWithChannels } from '../../mock-builders';

describe('useMessagePaginator', () => {
  it("returns the channel's paginator inside Channel", async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();

    const { result } = renderHook(() => useMessagePaginator(), {
      wrapper: ({ children }) => (
        <Chat client={client}>
          <Channel channel={channel}>{children}</Channel>
        </Chat>
      ),
    });

    expect(result.current).toBe(channel.messagePaginator);
  });

  it("prefers the thread's paginator inside a thread", async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    const thread = fromPartial<Thread>({
      messagePaginator: fromPartial({}),
    });

    const { result } = renderHook(() => useMessagePaginator(), {
      wrapper: ({ children }) => (
        <Chat client={client}>
          <Channel channel={channel}>
            <ThreadProvider thread={thread}>{children}</ThreadProvider>
          </Channel>
        </Chat>
      ),
    });

    expect(result.current).toBe(thread.messagePaginator);
  });
});
