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
const deleteMessage = jest.fn(() => Promise.resolve(testMessage));
const updateMessage = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

const ChannelActionContextOverrider = ({ children }) => {
  const context = useChannelActionContext();
  return (
    <ChannelActionProvider value={{ ...context, deleteMessage, updateMessage }}>
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
    rendered = await renderHook(() => useDeleteHandler(message), { wrapper });
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

  afterEach(jest.clearAllMocks);

  it('should generate function that handles message deletion', async () => {
    const handleDelete = await renderUseDeleteHandler();
    expect(typeof handleDelete).toBe('function');
  });

  it('should prevent default mouse click event from bubbling', async () => {
    const handleDelete = await renderUseDeleteHandler();
    await handleDelete(mouseEventMock);
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });

  it('should delete a message by its id', async () => {
    const message = generateMessage();
    const handleDelete = await renderUseDeleteHandler(message);
    await handleDelete(mouseEventMock);
    expect(deleteMessage).toHaveBeenCalledWith(message);
  });

  it('should update the message with the result of deletion', async () => {
    const deleteMessageResponse = generateMessage();
    deleteMessage.mockImplementationOnce(() => Promise.resolve(deleteMessageResponse));
    const handleDelete = await renderUseDeleteHandler(testMessage);
    await act(async () => {
      await handleDelete(mouseEventMock);
    });
    expect(updateMessage).toHaveBeenCalledWith(deleteMessageResponse);
  });
});
