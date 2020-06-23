import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import {
  getTestClientWithUser,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
} from 'mock-builders';
import { ChannelContext } from '../../../../context';
import {
  useReactionHandler,
  reactionHandlerWarning,
} from '../useReactionHandler';

const getConfig = jest.fn();
const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const updateMessage = jest.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUseReactionHandlerHook(
  message = generateMessage(),
  channelContextProps,
) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    getConfig,
    sendAction,
    sendReaction,
    deleteReaction,
    ...channelContextProps,
  });
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        channel,
        client,
        updateMessage,
      }}
    >
      {children}
    </ChannelContext.Provider>
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
    const handleReaction = await renderUseReactionHandlerHook(null);
    await handleReaction();
    expect(console.warn).toHaveBeenCalledWith(reactionHandlerWarning);
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    await handleReaction();
    expect(console.warn).toHaveBeenCalledWith(
      `message.own_reactions contained reactions from a different user, this indicates a bug`,
    );
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    await handleReaction(reaction.type);
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      type: reaction.type,
    });
  });

  it('should rollback reaction if channel update fails', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    sendReaction.mockImplementationOnce(() => Promise.reject());
    await handleReaction(reaction.type);
    expect(updateMessage).toHaveBeenCalledWith(message);
  });
});
