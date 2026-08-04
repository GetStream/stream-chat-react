import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import type {
  Channel as ChannelType,
  RetrySendMessageWithLocalUpdateParams,
  StreamChat,
} from 'stream-chat';

import { useRetryHandler } from '../useRetryHandler';

import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

// MERGE-RECONCILE (test migration): PR #2909 rewrote useRetryHandler. It no longer accepts a
// custom retry callback nor reads `retrySendMessage` from the removed ChannelActionContext.
// The hook now retries through the channel's own `retrySendMessageWithLocalUpdate` (or the
// active thread's). The wrapper uses the real <Chat>/<Channel> providers and assertions spy on
// `channel.retrySendMessageWithLocalUpdate`. The obsolete "custom retry handler" and "do
// nothing if message is not defined" cases were dropped (the hook has neither an override
// argument nor an undefined-message guard now).

let channel: ChannelType;
let client: StreamChat;

function renderUseRetryHandlerHook() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );

  const { result } = renderHook(() => useRetryHandler(), {
    wrapper,
  });

  return result.current;
}

describe('useRetryHandler custom hook', () => {
  beforeEach(async () => {
    const {
      channels: [ch],
      client: c,
    } = await initClientWithChannels();
    channel = ch;
    client = c;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a function that handles retrying a failed message', async () => {
    const handleRetry = await renderUseRetryHandlerHook();
    expect(typeof handleRetry).toBe('function');
  });

  it('should retry send message via the channel local-update path when called', async () => {
    const retrySpy = vi
      .spyOn(channel, 'retrySendMessageWithLocalUpdate')
      .mockResolvedValue(undefined);
    const handleRetry = await renderUseRetryHandlerHook();
    const params = {
      localMessage: generateMessage(),
    } as unknown as RetrySendMessageWithLocalUpdateParams;
    await act(async () => {
      await handleRetry(params);
    });
    expect(retrySpy).toHaveBeenCalledWith(params);
  });
});
