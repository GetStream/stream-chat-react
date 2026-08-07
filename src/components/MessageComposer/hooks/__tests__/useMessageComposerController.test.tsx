import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  type Channel,
  type LocalMessage,
  MessageComposer as MessageComposerController,
  type StreamChat,
  type Thread,
} from 'stream-chat';

import { useMessageComposerController } from '../useMessageComposerController';
import { Chat } from '../../../Chat';
import { Channel as ChannelComponent } from '../../../Channel';
import { LegacyThreadContext } from '../../../Thread/LegacyThreadContext';
import { ThreadContext } from '../../../Threads';
import { MessageComposerControllerProvider } from '../../MessageComposer';
import {
  generateMessage,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { generateChannel } from '../../../../mock-builders/generator';

const buildStandaloneComposer = (
  client: StreamChat,
  channel: Channel,
): MessageComposerController =>
  new MessageComposerController({ client, compositionContext: channel });

const buildStubThreadInstance = (composer: MessageComposerController): Thread =>
  fromPartial<Thread>({ messageComposer: composer });

type SetupOptions = {
  channel: Channel;
  client: StreamChat;
  legacyThread?: LocalMessage;
  overrideComposer?: MessageComposerController;
  threadInstance?: Thread;
};

const setup = async ({
  channel,
  client,
  legacyThread,
  overrideComposer,
  threadInstance,
}: SetupOptions) => {
  const wrapper = ({ children }: PropsWithChildren) => {
    let content: React.ReactNode = children;

    if (overrideComposer !== undefined) {
      content = (
        <MessageComposerControllerProvider messageComposerController={overrideComposer}>
          {content}
        </MessageComposerControllerProvider>
      );
    }

    if (threadInstance !== undefined) {
      content = (
        <ThreadContext.Provider value={threadInstance}>{content}</ThreadContext.Provider>
      );
    }

    if (legacyThread !== undefined) {
      content = (
        <LegacyThreadContext.Provider value={{ legacyThread }}>
          {content}
        </LegacyThreadContext.Provider>
      );
    }

    return (
      <Chat client={client}>
        <ChannelComponent channel={channel}>{content}</ChannelComponent>
      </Chat>
    );
  };

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

  describe('retrieval hierarchy', () => {
    it('returns channel.messageComposer when no override, thread instance, or legacy thread is present', async () => {
      const { result } = await setup({ channel, client });
      expect(result.current).toBe(channel.messageComposer);
    });

    it('returns the override composer when MessageComposerControllerProvider supplies one', async () => {
      const overrideComposer = buildStandaloneComposer(client, channel);
      const { result } = await setup({ channel, client, overrideComposer });
      expect(result.current).toBe(overrideComposer);
      expect(result.current).not.toBe(channel.messageComposer);
    });

    it('override composer takes precedence over a thread instance', async () => {
      const overrideComposer = buildStandaloneComposer(client, channel);
      const threadComposer = buildStandaloneComposer(client, channel);
      const threadInstance = buildStubThreadInstance(threadComposer);

      const { result } = await setup({
        channel,
        client,
        overrideComposer,
        threadInstance,
      });
      expect(result.current).toBe(overrideComposer);
    });

    it('override composer takes precedence over a legacy thread parent message', async () => {
      const overrideComposer = buildStandaloneComposer(client, channel);
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;

      const { result } = await setup({
        channel,
        client,
        legacyThread,
        overrideComposer,
      });
      expect(result.current).toBe(overrideComposer);
    });

    it('returns threadInstance.messageComposer when a thread instance is provided', async () => {
      const threadComposer = buildStandaloneComposer(client, channel);
      const threadInstance = buildStubThreadInstance(threadComposer);

      const { result } = await setup({ channel, client, threadInstance });
      expect(result.current).toBe(threadComposer);
      expect(result.current).not.toBe(channel.messageComposer);
    });

    it('thread instance takes precedence over a legacy thread parent message', async () => {
      const threadComposer = buildStandaloneComposer(client, channel);
      const threadInstance = buildStubThreadInstance(threadComposer);
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;

      const { result } = await setup({
        channel,
        client,
        legacyThread,
        threadInstance,
      });
      expect(result.current).toBe(threadComposer);
    });

    it('legacy thread parent takes precedence over the channel composer', async () => {
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;
      const { result } = await setup({ channel, client, legacyThread });
      expect(result.current).not.toBe(channel.messageComposer);
      expect(result.current.contextType).toBe('legacy_thread');
    });
  });

  describe('legacy thread composer', () => {
    it('creates a new composer for a legacy thread parent when the cache is empty', async () => {
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;
      const { result } = await setup({ channel, client, legacyThread });

      expect(result.current).toBeInstanceOf(MessageComposerController);
      expect(result.current.contextType).toBe('legacy_thread');
      expect(result.current.tag).toBe(
        MessageComposerController.constructTag({
          ...legacyThread,
          legacyThreadId: legacyThread.id,
        }),
      );
    });

    it('adds the created legacy-thread composer to the client message composer cache', async () => {
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;
      const { result } = await setup({ channel, client, legacyThread });

      expect(client.messageComposerCache.peek(result.current.tag)).toBe(result.current);
    });

    it('reuses an already-cached composer for the same legacy thread parent id', async () => {
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;
      const compositionContext = {
        ...legacyThread,
        legacyThreadId: legacyThread.id,
      };
      const preExistingComposer = new MessageComposerController({
        client,
        compositionContext,
      });
      client.messageComposerCache.add(
        MessageComposerController.constructTag(compositionContext),
        preExistingComposer,
      );

      const { result } = await setup({ channel, client, legacyThread });
      expect(result.current).toBe(preExistingComposer);
    });

    it('returns a stable composer reference across re-renders for the same legacy thread parent id', async () => {
      const legacyThread = generateMessage({
        cid: channel.cid,
      }) as unknown as LocalMessage;
      const { rerender, result } = await setup({ channel, client, legacyThread });

      const first = result.current;
      await act(() => {
        rerender();
      });
      expect(result.current).toBe(first);
    });
  });

  describe('cache membership', () => {
    it('does not add the channel composer to the cache', async () => {
      const { result } = await setup({ channel, client });
      expect(result.current.contextType).toBe('channel');
      expect(client.messageComposerCache.peek(result.current.tag)).toBeUndefined();
    });

    it('does not add a thread-instance composer to the cache', async () => {
      const threadComposer = buildStandaloneComposer(client, channel);
      const threadInstance = buildStubThreadInstance(threadComposer);

      const { result } = await setup({ channel, client, threadInstance });
      expect(client.messageComposerCache.peek(result.current.tag)).toBeUndefined();
    });
  });

  describe('subscriptions', () => {
    it('registers subscriptions on the resolved composer and unsubscribes on unmount', async () => {
      const unsubscribe = vi.fn();
      const registerSpy = vi
        .spyOn(channel.messageComposer, 'registerSubscriptions')
        .mockReturnValue(unsubscribe);

      const { unmount } = await setup({ channel, client });
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(unsubscribe).not.toHaveBeenCalled();

      unmount();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('registers subscriptions on the override composer when one is supplied', async () => {
      const overrideComposer = buildStandaloneComposer(client, channel);
      const registerSpy = vi
        .spyOn(overrideComposer, 'registerSubscriptions')
        .mockReturnValue(vi.fn());

      await setup({ channel, client, overrideComposer });
      expect(registerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
