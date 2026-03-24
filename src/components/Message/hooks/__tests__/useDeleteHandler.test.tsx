import React from 'react';
import { renderHook } from '@testing-library/react';

import { useDeleteHandler } from '../useDeleteHandler';
import {
  ChannelActionProvider,
  useChannelActionContext,
} from '../../../../context/ChannelActionContext';
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

let channel;
let client;
const testMessage = generateMessage();
const deleteMessage = vi.fn(() => Promise.resolve(testMessage));
const removeMessage = vi.fn();
const updateMessage = vi.fn();

const ChannelActionContextOverrider = ({ children }) => {
  const context = useChannelActionContext();
  return (
    <ChannelActionProvider
      value={{ ...context, deleteMessage, removeMessage, updateMessage }}
    >
      {children}
    </ChannelActionProvider>
  );
};

async function renderUseDeleteHandler(message = testMessage) {
  const wrapper = ({ children }) => (
    <Chat client={client}>
      <Channel channel={channel}>
        <ChannelActionContextOverrider>{children}</ChannelActionContextOverrider>
      </Channel>
    </Chat>
  );
  let rendered;
  await act(async () => {
    rendered = await renderHook(() => useDeleteHandler(message as any), { wrapper });
  });

  return rendered.result.current;
}

describe('useDeleteHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(generateUser());
    const channelData = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
    channel = client.channel('messaging', channelData.channel.id);
  });

  afterEach(vi.clearAllMocks);

  it('should generate function that handles message deletion', async () => {
    const handleDelete = await renderUseDeleteHandler();
    expect(typeof handleDelete).toBe('function');
  });

  it('should delete a message without options', async () => {
    const handleDelete = await renderUseDeleteHandler();
    await handleDelete();
    expect(deleteMessage).toHaveBeenCalledWith(testMessage, undefined);
  });

  it('should delete a message by its id with options', async () => {
    const message = generateMessage();
    const deleteMessageOptions = { deleteForMe: true, hard: false };
    const handleDelete = await renderUseDeleteHandler(message);
    await handleDelete(deleteMessageOptions);
    expect(deleteMessage).toHaveBeenCalledWith(message, deleteMessageOptions);
  });

  it('should update the message with the result of deletion', async () => {
    const deleteMessageResponse = generateMessage();
    deleteMessage.mockImplementationOnce(() => Promise.resolve(deleteMessageResponse));
    const handleDelete = await renderUseDeleteHandler(testMessage);
    await act(async () => {
      await handleDelete();
    });
    expect(updateMessage).toHaveBeenCalledWith(deleteMessageResponse);
  });

  it('should remove local network-failed message without server delete call', async () => {
    const networkFailedMessage = generateMessage({
      error: { status: 0 },
      status: 'failed',
    } as any);

    const handleDelete = await renderUseDeleteHandler(networkFailedMessage);

    await act(async () => {
      await handleDelete();
    });

    expect(removeMessage).toHaveBeenCalledWith(networkFailedMessage);
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it('should reject after notifying when server delete fails', async () => {
    const notify = vi.fn();
    const error = new Error('delete failed');
    deleteMessage.mockRejectedValueOnce(error);

    const wrapper = ({ children }) => (
      <Chat client={client}>
        <Channel channel={channel}>
          <ChannelActionContextOverrider>{children}</ChannelActionContextOverrider>
        </Channel>
      </Chat>
    );

    const { result } = renderHook(
      () => useDeleteHandler(testMessage as any, { notify }),
      {
        wrapper,
      },
    );

    await expect(result.current()).rejects.toThrow('delete failed');
    expect(notify).toHaveBeenCalledWith('Error deleting message', 'error');
  });
});
