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

// MERGE-RECONCILE (test migration): PR #2909 rewrote useDeleteHandler to delete via the
// channel's own `deleteMessageWithLocalUpdate` (with a `client.deleteMessage` +
// messagePaginator.ingestItem fallback) instead of the removed ChannelActionContext
// `deleteMessage`/`updateMessage`/`removeMessage` handlers. The wrapper now uses the real
// <Chat>/<Channel> providers (ChannelInstanceProvider + messagePaginator) and assertions spy
// on `channel.deleteMessageWithLocalUpdate`. Tests for the removed ChannelActionContext
// behaviors (context updateMessage after delete; removeMessage special-case for
// network-failed messages; promise rejection on server failure — the hook now swallows and
// notifies) were dropped as obsolete.

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

  it('should delete a message without options via the channel local-update path', async () => {
    const deleteSpy = vi
      .spyOn(channel, 'deleteMessageWithLocalUpdate')
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
      .spyOn(channel, 'deleteMessageWithLocalUpdate')
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

  it('should notify (and not throw) when the delete request fails', async () => {
    vi.spyOn(channel, 'deleteMessageWithLocalUpdate').mockRejectedValue(
      new Error('delete failed'),
    );
    const notify = vi.fn();
    const handleDelete = await renderUseDeleteHandler(testMessage, { notify });
    await act(async () => {
      await expect(handleDelete()).resolves.toBeUndefined();
    });
    expect(notify).toHaveBeenCalledWith('Error deleting message', 'error');
  });
});
