import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  type Channel,
  MessageComposer as MessageComposerController,
  type StreamChat,
  type Thread,
} from 'stream-chat';

import { useMessageComposerController } from '../useMessageComposerController';
import { Chat } from '../../../Chat';
import { Channel as ChannelComponent } from '../../../Channel';
import { ThreadProvider } from '../../../Threads';
import { MessageComposerControllerProvider } from '../../../../context';
import {
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { generateChannel } from '../../../../mock-builders/generator';

const buildComposer = (client: StreamChat, channel: Channel) =>
  new MessageComposerController({ client, compositionContext: channel });

const stubThread = (messageComposer: MessageComposerController) =>
  fromPartial<Thread>({ messageComposer });

const setup = async ({
  channel,
  client,
  suppliedComposer,
  thread,
}: {
  channel: Channel;
  client: StreamChat;
  suppliedComposer?: MessageComposerController;
  thread?: Thread;
}) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <Chat client={client}>
      <ChannelComponent channel={channel}>
        <ThreadProvider thread={thread}>
          <MessageComposerControllerProvider messageComposerController={suppliedComposer}>
            {children}
          </MessageComposerControllerProvider>
        </ThreadProvider>
      </ChannelComponent>
    </Chat>
  );

  let result!: RenderHookResult<MessageComposerController, unknown>;
  await act(() => {
    result = renderHook(() => useMessageComposerController(), { wrapper });
  });
  return result;
};

describe('useMessageComposerController', () => {
  let client: StreamChat;
  let channel: Channel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
    const mockedChannelData = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(mockedChannelData)]);
    channel = client.channel('messaging', mockedChannelData.channel.id);
    await channel.watch();
  });

  describe('which composer it resolves', () => {
    it("falls back to the channel's own composer", async () => {
      const { result } = await setup({ channel, client });

      expect(result.current).toBe(channel.messageComposer);
    });

    it("prefers the thread's composer over the channel's", async () => {
      const threadComposer = buildComposer(client, channel);

      const { result } = await setup({
        channel,
        client,
        thread: stubThread(threadComposer),
      });

      expect(result.current).toBe(threadComposer);
    });

    it('prefers a supplied composer over the channel', async () => {
      const suppliedComposer = buildComposer(client, channel);

      const { result } = await setup({ channel, client, suppliedComposer });

      expect(result.current).toBe(suppliedComposer);
    });

    it('prefers a supplied composer over a thread', async () => {
      const suppliedComposer = buildComposer(client, channel);

      const { result } = await setup({
        channel,
        client,
        suppliedComposer,
        thread: stubThread(buildComposer(client, channel)),
      });

      expect(result.current).toBe(suppliedComposer);
    });
  });

  describe('subscriptions', () => {
    it('registers them on the resolved composer and releases them on unmount', async () => {
      const unsubscribe = vi.fn();
      const registerSubscriptions = vi
        .spyOn(channel.messageComposer, 'registerSubscriptions')
        .mockReturnValue(unsubscribe);

      const { unmount } = await setup({ channel, client });

      expect(registerSubscriptions).toHaveBeenCalled();
      expect(unsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('registers them on a supplied composer rather than the channel one', async () => {
      const suppliedComposer = buildComposer(client, channel);
      const onSupplied = vi.spyOn(suppliedComposer, 'registerSubscriptions');
      const onChannel = vi.spyOn(channel.messageComposer, 'registerSubscriptions');

      await setup({ channel, client, suppliedComposer });

      expect(onSupplied).toHaveBeenCalled();
      expect(onChannel).not.toHaveBeenCalled();
    });
  });
});
