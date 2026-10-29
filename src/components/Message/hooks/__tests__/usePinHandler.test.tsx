import React from 'react';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { usePinHandler } from '../usePinHandler';
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

// `usePinHandler` updates the message optimistically through `messagePaginator.ingestItem`,
// rolls it back when the request fails, and rethrows so callers (the Pin message action) can
// show an error notification instead of a success one.

let channel: ChannelType;
let client: StreamChat;
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUsePinHandler(
  message: LocalMessage,
  notifications?: Parameters<typeof usePinHandler>[1],
) {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  let rendered: RenderHookResult<ReturnType<typeof usePinHandler>, unknown>;
  await act(async () => {
    rendered = await renderHook(() => usePinHandler(message, notifications), {
      wrapper,
    });
  });

  return rendered!.result.current;
}

describe('usePinHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(generateUser());
    const channelData = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
    channel = client.channel('messaging', channelData.channel.id);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should pin the message and update it optimistically', async () => {
    const pinSpy = vi.spyOn(client, 'pinMessage').mockResolvedValue(fromPartial({}));
    const ingestSpy = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const message = generateMessage({ pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    await act(async () => {
      await handlePin(mouseEventMock);
    });
    expect(pinSpy).toHaveBeenCalledWith(message);
    expect(ingestSpy).toHaveBeenCalledTimes(1);
    expect(ingestSpy).toHaveBeenCalledWith(expect.objectContaining({ pinned: true }));
  });

  it('should roll back and throw when pinning fails', async () => {
    vi.spyOn(client, 'pinMessage').mockRejectedValue(new Error('pin failed'));
    const ingestSpy = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const message = generateMessage({ pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    await act(async () => {
      await expect(handlePin(mouseEventMock)).rejects.toThrow('pin failed');
    });
    expect(ingestSpy).toHaveBeenCalledTimes(2);
    expect(ingestSpy).toHaveBeenLastCalledWith(message);
  });

  it('should unpin the message and update it optimistically', async () => {
    const unpinSpy = vi.spyOn(client, 'unpinMessage').mockResolvedValue(fromPartial({}));
    const ingestSpy = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const message = generateMessage({ pinned: true }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    await act(async () => {
      await handlePin(mouseEventMock);
    });
    expect(unpinSpy).toHaveBeenCalledWith(message);
    expect(ingestSpy).toHaveBeenCalledTimes(1);
    expect(ingestSpy).toHaveBeenCalledWith(expect.objectContaining({ pinned: false }));
  });

  it('should roll back and throw when unpinning fails', async () => {
    vi.spyOn(client, 'unpinMessage').mockRejectedValue(new Error('unpin failed'));
    const ingestSpy = vi.spyOn(channel.messagePaginator, 'ingestItem');
    const message = generateMessage({ pinned: true }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    await act(async () => {
      await expect(handlePin(mouseEventMock)).rejects.toThrow('unpin failed');
    });
    expect(ingestSpy).toHaveBeenCalledTimes(2);
    expect(ingestSpy).toHaveBeenLastCalledWith(message);
  });

  it('should notify and throw when pinning fails with notifications configured', async () => {
    vi.spyOn(client, 'pinMessage').mockRejectedValue(new Error('pin failed'));
    const notify = vi.fn();
    const message = generateMessage({ pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message, {
      getErrorNotification: () => 'custom pin error',
      notify,
    });
    await act(async () => {
      await expect(handlePin(mouseEventMock)).rejects.toThrow('pin failed');
    });
    expect(notify).toHaveBeenCalledWith('custom pin error', 'error');
  });
});
