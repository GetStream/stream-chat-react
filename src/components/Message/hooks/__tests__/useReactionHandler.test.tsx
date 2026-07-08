import React from 'react';
import { renderHook, type RenderHookResult } from '@testing-library/react';
import { act } from '@testing-library/react';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { reactionHandlerWarning, useReactionHandler } from '../useReactionHandler';

import { ComponentProvider } from '../../../../context/ComponentContext';
import { emojiToUnicode } from '../../../Reactions/reactionOptions';
import {
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

// MERGE-RECONCILE (test migration): PR #2909 rewrote useReactionHandler to send/delete
// reactions through the channel instance (`channel.sendReaction`/`channel.deleteReaction`)
// and to apply optimistic updates via `messagePaginator.ingestItem` — replacing the removed
// ChannelActionContext `updateMessage` and the ChannelStateContext capability check. The
// wrapper now uses the real <Chat>/<Channel> providers and assertions spy on the channel /
// its messagePaginator. The `send-reaction` capability test was dropped (the hook no longer
// gates on capabilities; permission gating lives in the UI layer).

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

let channel: ChannelType;
let client: StreamChat;

async function renderUseReactionHandlerHook(
  params: {
    componentContext?: Record<string, unknown>;
    message?: LocalMessage | null;
  } = {},
) {
  const { componentContext = {}, message = generateMessage() } = params;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>
        <ComponentProvider value={componentContext}>{children}</ComponentProvider>
      </Channel>
    </Chat>
  );

  let rendered: RenderHookResult<ReturnType<typeof useReactionHandler>, unknown>;
  await act(async () => {
    rendered = await renderHook(() => useReactionHandler(message ?? undefined), {
      wrapper,
    });
  });
  return rendered!.result.current;
}

describe('useReactionHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(alice);
    const channelData = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
    channel = client.channel('messaging', channelData.channel.id);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate function that handles reactions', async () => {
    const handleReaction = await renderUseReactionHandlerHook();
    expect(typeof handleReaction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleReaction = await renderUseReactionHandlerHook({ message: null });
    await (handleReaction as () => Promise<void>)();
    expect(console.warn).toHaveBeenCalledWith(reactionHandlerWarning);
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await (handleReaction as () => Promise<void>)();
    expect(console.warn).toHaveBeenCalledWith(
      `message.own_reactions contained reactions from a different user, this indicates a bug`,
    );
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const deleteReaction = vi
      .spyOn(channel, 'deleteReaction')
      .mockResolvedValue({ message: generateMessage() } as never);
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction with emoji_code derived from the default reaction options', async () => {
    const sendReaction = vi
      .spyOn(channel, 'sendReaction')
      .mockResolvedValue({ message: generateMessage() } as never);
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction('love');
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      emoji_code: '❤️',
      type: 'love',
    });
  });

  it('should send reaction without emoji_code when the type has no unicode', async () => {
    const sendReaction = vi
      .spyOn(channel, 'sendReaction')
      .mockResolvedValue({ message: generateMessage() } as never);
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction('unsupported-reaction-type');
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      type: 'unsupported-reaction-type',
    });
  });

  it('should derive emoji_code from custom reaction options provided via context', async () => {
    const sendReaction = vi
      .spyOn(channel, 'sendReaction')
      .mockResolvedValue({ message: generateMessage() } as never);
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({
      componentContext: {
        reactionOptions: {
          quick: {
            rocket: {
              Component: () => null,
              name: 'Rocket',
              unicode: emojiToUnicode('🚀'),
            },
          },
        },
      },
      message,
    });
    await handleReaction('rocket');
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      emoji_code: '🚀',
      type: 'rocket',
    });
  });

  it('should stamp emoji_code on the optimistic reaction preview ingested into the paginator', async () => {
    vi.spyOn(channel, 'sendReaction').mockResolvedValue({
      message: generateMessage(),
    } as never);
    const ingestItem = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction('love');
    const optimisticMessage = ingestItem.mock.calls[0][0] as LocalMessage;
    expect(optimisticMessage.latest_reactions?.[0]).toMatchObject({
      emoji_code: '❤️',
      type: 'love',
    });
  });

  it('should rollback the optimistic reaction if the channel update fails', async () => {
    vi.spyOn(channel, 'sendReaction').mockRejectedValueOnce(new Error('fail'));
    const ingestItem = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction(reaction.type);
    // last ingest reverts to the original message
    const lastIngested = ingestItem.mock.calls.at(-1)?.[0] as LocalMessage;
    expect(lastIngested.id).toBe(message.id);
  });
});
