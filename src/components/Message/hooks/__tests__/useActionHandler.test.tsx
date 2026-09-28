import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { handleActionWarning, useActionHandler } from '../useActionHandler';

import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

// MERGE-RECONCILE (test migration): the master merge removed ChannelActionContext.
// `useActionHandler` now reads the channel from ChannelInstanceContext (useChannel) and the
// paginator from useMessagePaginator. It sends the action through `channel.sendAction` and then
// either ingests the returned message into the paginator (`messagePaginator.ingestItem`) or
// removes the local message (`messagePaginator.removeItem`) — replacing the removed context
// `updateMessage`/`removeMessage` handlers. The wrapper uses the real <Chat>/<Channel>
// providers and assertions spy on `channel.sendAction` and the paginator methods.

let channel: ChannelType;
let client: StreamChat;

const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

function renderUseHandleActionHook(message: any = generateMessage()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  const { result } = renderHook(() => useActionHandler(message), { wrapper });
  return result.current;
}

describe('useHandleAction custom hook', () => {
  beforeEach(async () => {
    const {
      channels: [ch],
      client: c,
    } = await initClientWithChannels();
    channel = ch;
    client = c;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return function that handles actions', async () => {
    const handleAction = await renderUseHandleActionHook();
    expect(typeof handleAction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleAction = await renderUseHandleActionHook(null);
    await act(async () => {
      await handleAction('action', 'value', mouseEventMock);
    });
    expect(warnSpy).toHaveBeenCalledWith(handleActionWarning);
  });

  it('should ingest the updated message into the paginator after an action', async () => {
    const currentMessage = generateMessage();
    const updatedMessage = generateMessage();
    const action = {
      name: 'action',
      value: 'value',
    };
    const sendActionSpy = vi
      .spyOn(channel, 'sendAction')
      .mockResolvedValue(fromPartial({ message: updatedMessage }));
    const ingestSpy = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const handleAction = await renderUseHandleActionHook(currentMessage);
    await act(async () => {
      await handleAction(action.name, action.value, mouseEventMock);
    });
    expect(sendActionSpy).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(ingestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: updatedMessage.id }),
    );
  });

  it('should remove the local message from the paginator after an action fails', async () => {
    const currentMessage = generateMessage();
    const action = {
      name: 'action',
      value: 'value',
    };
    const sendActionSpy = vi
      .spyOn(channel, 'sendAction')
      .mockResolvedValue(fromPartial(undefined));
    const removeSpy = vi.spyOn(channel.messagePaginator, 'removeItem');
    const handleAction = await renderUseHandleActionHook(currentMessage);
    await act(async () => {
      await handleAction(action.name, action.value, mouseEventMock);
    });
    expect(sendActionSpy).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(removeSpy).toHaveBeenCalledWith({
      item: expect.objectContaining({ id: currentMessage.id }),
    });
  });
});
