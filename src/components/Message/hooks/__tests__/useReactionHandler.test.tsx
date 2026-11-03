import React from 'react';
import { renderHook, type RenderHookResult } from '@testing-library/react';
import { act } from '@testing-library/react';
import {
  type Channel as ChannelType,
  type LocalMessage,
  type StreamChat,
  Thread,
} from 'stream-chat';

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
import { ThreadProvider } from '../../../Threads';

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

let channel: ChannelType;
let client: StreamChat;

async function renderUseReactionHandlerHook(
  params: {
    componentContext?: Record<string, unknown>;
    message?: LocalMessage | null;
    thread?: Thread;
  } = {},
) {
  const { componentContext = {}, message = generateMessage(), thread } = params;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>
        <ThreadProvider thread={thread}>
          <ComponentProvider value={componentContext}>{children}</ComponentProvider>
        </ThreadProvider>
      </Channel>
    </Chat>
  );

  let rendered: RenderHookResult<
    ReturnType<typeof useReactionHandler>,
    { message?: LocalMessage }
  >;
  await act(async () => {
    const initialProps: { message?: LocalMessage } = { message: message ?? undefined };
    rendered = await renderHook((props) => useReactionHandler(props.message), {
      initialProps,
      wrapper,
    });
  });
  return rendered!;
}

const renderHandler = async (
  params?: Parameters<typeof renderUseReactionHandlerHook>[0],
) => (await renderUseReactionHandlerHook(params)).result.current;

describe('useReactionHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(alice);
    const channelData = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
    channel = client.channel('messaging', channelData.channel.id);
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Runs any pending trailing call while the spies are still in place.
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should generate function that handles reactions', async () => {
    const handleReaction = await renderHandler();
    expect(typeof handleReaction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleReaction = await renderHandler({ message: null });
    await (handleReaction as () => Promise<void>)();
    expect(console.warn).toHaveBeenCalledWith(reactionHandlerWarning);
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    vi.spyOn(channel.messageOperations, 'addReaction').mockResolvedValue();
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderHandler({ message });
    await (handleReaction as () => Promise<void>)();
    expect(console.warn).toHaveBeenCalledWith(
      `message.own_reactions contained reactions from a different user, this indicates a bug`,
    );
  });

  it('should delete own reaction through the channel messageOperations if it was already there', async () => {
    const deleteReaction = vi
      .spyOn(channel.messageOperations, 'deleteReaction')
      .mockResolvedValue();
    const clientDeleteReaction = vi.spyOn(client, 'deleteReaction');
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderHandler({ message });
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith({
      messageId: message.id,
      type: reaction.type,
    });
    expect(clientDeleteReaction).not.toHaveBeenCalled();
  });

  it('should add the reaction through the channel messageOperations with emoji_code derived from the default reaction options', async () => {
    const addReaction = vi
      .spyOn(channel.messageOperations, 'addReaction')
      .mockResolvedValue();
    const clientSendReaction = vi.spyOn(client, 'sendReaction');
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderHandler({ message });
    await handleReaction('love');
    expect(addReaction).toHaveBeenCalledWith({
      messageId: message.id,
      reaction: {
        emoji_code: '❤️',
        type: 'love',
      },
    });
    expect(clientSendReaction).not.toHaveBeenCalled();
  });

  it('should add the reaction without emoji_code when the type has no unicode', async () => {
    const addReaction = vi
      .spyOn(channel.messageOperations, 'addReaction')
      .mockResolvedValue();
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderHandler({ message });
    await handleReaction('unsupported-reaction-type');
    expect(addReaction).toHaveBeenCalledWith({
      messageId: message.id,
      reaction: {
        type: 'unsupported-reaction-type',
      },
    });
  });

  it('should derive emoji_code from custom reaction options provided via context', async () => {
    const addReaction = vi
      .spyOn(channel.messageOperations, 'addReaction')
      .mockResolvedValue();
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderHandler({
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
    expect(addReaction).toHaveBeenCalledWith({
      messageId: message.id,
      reaction: {
        emoji_code: '🚀',
        type: 'rocket',
      },
    });
  });

  it('should apply the reaction optimistically to the stored message and send it', async () => {
    let resolveRequest: (value: never) => void = () => undefined;
    const sendReaction = vi
      .spyOn(client, 'sendReaction')
      .mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)));
    const message = generateMessage({ cid: channel.cid, own_reactions: [] });
    channel.messagePaginator.ingestItem(message as LocalMessage);
    const handleReaction = await renderHandler({ message });

    const pending = handleReaction('love');
    expect(client.messageStore.get(message.id)?.own_reactions).toEqual([
      expect.objectContaining({ emoji_code: '❤️', type: 'love', user_id: alice.id }),
    ]);
    expect(sendReaction).toHaveBeenCalledWith(
      { id: message.id },
      { reaction: { emoji_code: '❤️', type: 'love' } },
    );

    resolveRequest({ message: undefined } as never);
    await pending;
  });

  it('should roll back the optimistic reaction when the request fails', async () => {
    let rejectRequest: (error: Error) => void = () => undefined;
    vi.spyOn(client, 'sendReaction').mockImplementationOnce(
      () => new Promise((_, reject) => (rejectRequest = reject)),
    );
    const message = generateMessage({ cid: channel.cid, own_reactions: [] });
    channel.messagePaginator.ingestItem(message as LocalMessage);
    const handleReaction = await renderHandler({ message });

    const pending = handleReaction('love');
    expect(client.messageStore.get(message.id)?.own_reactions).toHaveLength(1);

    rejectRequest(new Error('fail'));
    await pending;
    expect(client.messageStore.get(message.id)?.own_reactions).toEqual([]);
  });

  it('should route reactions through the thread messageOperations inside a thread', async () => {
    const parentMessage = generateMessage();
    const thread = new Thread({ channel, client, parentMessage });
    const threadAddReaction = vi
      .spyOn(thread.messageOperations, 'addReaction')
      .mockResolvedValue();
    const channelAddReaction = vi.spyOn(channel.messageOperations, 'addReaction');
    const message = generateMessage({ own_reactions: [], parent_id: parentMessage.id });
    const handleReaction = await renderHandler({ message, thread });
    await handleReaction('love');
    expect(threadAddReaction).toHaveBeenCalledWith({
      messageId: message.id,
      reaction: { emoji_code: '❤️', type: 'love' },
    });
    expect(channelAddReaction).not.toHaveBeenCalled();
  });

  it('should delete reactions through the thread messageOperations inside a thread', async () => {
    const parentMessage = generateMessage();
    const thread = new Thread({ channel, client, parentMessage });
    const threadDeleteReaction = vi
      .spyOn(thread.messageOperations, 'deleteReaction')
      .mockResolvedValue();
    const channelDeleteReaction = vi.spyOn(channel.messageOperations, 'deleteReaction');
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({
      own_reactions: [reaction],
      parent_id: parentMessage.id,
    });
    const handleReaction = await renderHandler({ message, thread });
    await handleReaction(reaction.type);
    expect(threadDeleteReaction).toHaveBeenCalledWith({
      messageId: message.id,
      type: reaction.type,
    });
    expect(channelDeleteReaction).not.toHaveBeenCalled();
  });

  it('should not surface a failed reaction request to the caller', async () => {
    vi.spyOn(channel.messageOperations, 'addReaction').mockRejectedValueOnce(
      new Error('fail'),
    );
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => null);
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderHandler({ message });
    await expect(handleReaction('love')).resolves.toBeUndefined();
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('should keep throttling toggles of one reaction across re-renders', async () => {
    const addReaction = vi
      .spyOn(channel.messageOperations, 'addReaction')
      .mockResolvedValue();
    const deleteReaction = vi
      .spyOn(channel.messageOperations, 'deleteReaction')
      .mockResolvedValue();
    const message = generateMessage({ own_reactions: [] });
    const { rerender, result } = await renderUseReactionHandlerHook({ message });

    await result.current('love');
    expect(addReaction).toHaveBeenCalledTimes(1);

    // The message with the reaction applied, as the optimistic update produces, re-renders the hook.
    rerender({
      message: {
        ...message,
        own_reactions: [generateReaction({ type: 'love', user: alice })],
      },
    });
    await result.current('love');
    expect(deleteReaction).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(deleteReaction).toHaveBeenCalledTimes(1);
    expect(deleteReaction).toHaveBeenCalledWith({ messageId: message.id, type: 'love' });
  });

  it('should not hold back a different reaction while one is throttled', async () => {
    const addReaction = vi
      .spyOn(channel.messageOperations, 'addReaction')
      .mockResolvedValue();
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderHandler({ message });

    await handleReaction('love');
    await handleReaction('like');
    await handleReaction('wow');
    expect(addReaction.mock.calls.map(([params]) => params.reaction.type)).toEqual([
      'love',
      'like',
      'wow',
    ]);
  });
});
