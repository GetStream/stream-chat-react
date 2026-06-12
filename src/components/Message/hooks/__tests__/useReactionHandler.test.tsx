import React from 'react';
import { renderHook } from '@testing-library/react';
import type { LocalMessage } from 'stream-chat';

import { reactionHandlerWarning, useReactionHandler } from '../useReactionHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import { ComponentProvider } from '../../../../context/ComponentContext';
import { emojiToUnicode } from '../../../Reactions/reactionOptions';
import {
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';

const getConfig = vi.fn();
const sendAction = vi.fn();
const sendReaction = vi.fn();
const deleteReaction = vi.fn();
const updateMessage = vi.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUseReactionHandlerHook(
  params: {
    channelContextProps?: Record<string, unknown>;
    channelStateContextOverrides?: Record<string, unknown>;
    componentContext?: Record<string, unknown>;
    message?: LocalMessage | null;
  } = {},
) {
  const {
    channelContextProps = {},
    channelStateContextOverrides = {},
    componentContext = {},
    message = generateMessage(),
  } = params;

  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    deleteReaction,
    getConfig,
    sendAction,
    sendReaction,
    ...channelContextProps,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelStateProvider
        value={mockChannelStateContext({
          channel,
          channelCapabilities: { 'send-reaction': true },
          ...channelStateContextOverrides,
        })}
      >
        <ChannelActionProvider value={mockChannelActionContext({ updateMessage })}>
          <ComponentProvider value={componentContext}>{children}</ComponentProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useReactionHandler(message ?? undefined), {
    wrapper,
  });
  return result.current;
}

describe('useReactionHandler custom hook', () => {
  afterEach(vi.clearAllMocks);
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
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction with emoji_code derived from the default reaction options', async () => {
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction('love');
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      emoji_code: '❤️',
      type: 'love',
    });
  });

  it('should send reaction without emoji_code when the type has no unicode', async () => {
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction('unsupported-reaction-type');
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      type: 'unsupported-reaction-type',
    });
  });

  it('should derive emoji_code from custom reaction options provided via context', async () => {
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

  it('should stamp emoji_code on the optimistic reaction preview', async () => {
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction('love');
    const optimisticMessage = updateMessage.mock.calls[0][0];
    expect(optimisticMessage.latest_reactions[0]).toMatchObject({
      emoji_code: '❤️',
      type: 'love',
    });
  });

  it('should not send reaction without permission', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({
      channelStateContextOverrides: { channelCapabilities: { 'send-reaction': false } },
      message,
    });
    await handleReaction(reaction.type);
    expect(sendReaction).not.toHaveBeenCalled();
  });

  it('should rollback reaction if channel update fails', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    sendReaction.mockImplementationOnce(() => Promise.reject());
    await handleReaction(reaction.type);
    expect(updateMessage).toHaveBeenCalledWith(message);
  });
});
