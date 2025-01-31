import React from 'react';
import { renderHook } from '@testing-library/react';

import { reactionHandlerWarning, useReactionHandler } from '../useReactionHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

const getConfig = jest.fn();
const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const updateMessage = jest.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUseReactionHandlerHook(params = {}) {
  const {
    channelContextProps = {},
    channelStateContextOverrides = {},
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

  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider
        value={{
          channel,
          channelCapabilities: { 'send-reaction': true },
          ...channelStateContextOverrides,
        }}
      >
        <ChannelActionProvider value={{ updateMessage }}>
          {children}
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useReactionHandler(message), { wrapper });
  return result.current;
}

describe('useReactionHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles reactions', async () => {
    const handleReaction = await renderUseReactionHandlerHook();
    expect(typeof handleReaction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleReaction = await renderUseReactionHandlerHook({ message: null });
    await handleReaction();
    expect(console.warn).toHaveBeenCalledWith(reactionHandlerWarning);
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction();
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

  it('should send reaction', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook({ message });
    await handleReaction(reaction.type);
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      type: reaction.type,
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
