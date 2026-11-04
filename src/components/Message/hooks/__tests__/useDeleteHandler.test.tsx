import React from 'react';
import { renderHook, type RenderHookResult } from '@testing-library/react';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { useDeleteHandler } from '../useDeleteHandler';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';
import { act } from '@testing-library/react';

// `useDeleteHandler` deletes through `messageOperations.delete` of the thread or channel, falling
// back to `client.deleteMessage` plus `messagePaginator.ingestItem`. The wrapper uses real
// <Chat>/<Channel> providers and assertions spy on `channel.messageOperations.delete`.

let channel: ChannelType;
let client: StreamChat;
const testMessage = generateMessage();

async function renderUseDeleteHandler(
  message = testMessage,
  notifications?: Parameters<typeof useDeleteHandler>[1],
) {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  let rendered: RenderHookResult<ReturnType<typeof useDeleteHandler>, unknown>;
  await act(async () => {
    rendered = await renderHook(() => useDeleteHandler(message, notifications), {
      wrapper,
    });
  });

  return rendered!.result.current;
}

describe('useDeleteHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(generateUser());
    const channelData = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
    channel = client.channel('messaging', channelData.channel.id);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate function that handles message deletion', async () => {
    const handleDelete = await renderUseDeleteHandler();
    expect(typeof handleDelete).toBe('function');
  });

  it('should throw without deleting when the message has no id', async () => {
    const deleteSpy = vi.spyOn(channel.messageOperations, 'delete');
    const handleDelete = await renderUseDeleteHandler(
      generateMessage({ id: undefined }) as typeof testMessage,
    );
    await act(async () => {
      await expect(handleDelete()).rejects.toThrow(
        'useDeleteHandler was called but it is missing one or more necessary parameters.',
      );
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should delete a message without options via the channel local-update path', async () => {
    const deleteSpy = vi
      .spyOn(channel.messageOperations, 'delete')
      .mockResolvedValue(undefined);
    const handleDelete = await renderUseDeleteHandler();
    await act(async () => {
      await handleDelete();
    });
    expect(deleteSpy).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({ id: testMessage.id }),
      options: undefined,
    });
  });

  it('should delete a message with options via the channel local-update path', async () => {
    const deleteSpy = vi
      .spyOn(channel.messageOperations, 'delete')
      .mockResolvedValue(undefined);
    const message = generateMessage();
    const deleteMessageOptions = { deleteForMe: true, hard: false };
    const handleDelete = await renderUseDeleteHandler(message);
    await act(async () => {
      await handleDelete(deleteMessageOptions);
    });
    expect(deleteSpy).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({ id: message.id }),
      options: deleteMessageOptions,
    });
  });

  it('should notify and throw when the delete request fails', async () => {
    vi.spyOn(channel.messageOperations, 'delete').mockRejectedValue(
      new Error('delete failed'),
    );
    const notify = vi.fn();
    const handleDelete = await renderUseDeleteHandler(testMessage, { notify });
    await act(async () => {
      await expect(handleDelete()).rejects.toThrow('delete failed');
    });
    expect(notify).toHaveBeenCalledWith('Error deleting message', 'error');
  });

  it('should throw when the delete request fails without notifications configured', async () => {
    vi.spyOn(channel.messageOperations, 'delete').mockRejectedValue(
      new Error('delete failed'),
    );
    const handleDelete = await renderUseDeleteHandler(testMessage);
    await act(async () => {
      await expect(handleDelete()).rejects.toThrow('delete failed');
    });
  });
});
