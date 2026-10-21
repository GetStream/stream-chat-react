import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import type { Channel as ChannelType, OperationParams, StreamChat } from 'stream-chat';

import { useRetryHandler } from '../useRetryHandler';

import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

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
      .spyOn(channel.messageOperations, 'retry')
      .mockResolvedValue(undefined);
    const handleRetry = await renderUseRetryHandlerHook();
    const params = {
      localMessage: generateMessage(),
    } as unknown as Omit<OperationParams<'retry'>, 'message'>;
    await act(async () => {
      await handleRetry(params);
    });
    expect(retrySpy).toHaveBeenCalledWith(params);
  });
});
