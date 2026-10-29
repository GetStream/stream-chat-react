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

// Reads the message back from the channel's paginator, so assertions see the stored state
// rather than only the calls made to it.
const getHeldMessage = (id: string) =>
  channel.messagePaginator.items?.find((item) => item.id === id);

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
    const message = generateMessage({ cid: channel.cid, pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    await act(async () => {
      await handlePin(mouseEventMock);
    });
    expect(pinSpy).toHaveBeenCalledWith(message);
    expect(getHeldMessage(message.id)).toEqual(expect.objectContaining({ pinned: true }));
  });

  it('should roll back and throw when pinning fails', async () => {
    let rejectRequest: (error: Error) => void = () => {};
    vi.spyOn(client, 'pinMessage').mockReturnValue(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );
    const message = generateMessage({ cid: channel.cid, pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    let pending: ReturnType<typeof handlePin>;
    act(() => {
      pending = handlePin(mouseEventMock);
    });
    expect(getHeldMessage(message.id)).toEqual(expect.objectContaining({ pinned: true }));
    await act(async () => {
      rejectRequest(new Error('pin failed'));
      await expect(pending).rejects.toThrow('pin failed');
    });
    expect(getHeldMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: false }),
    );
  });

  it('should unpin the message and update it optimistically', async () => {
    const unpinSpy = vi.spyOn(client, 'unpinMessage').mockResolvedValue(fromPartial({}));
    const message = generateMessage({ cid: channel.cid, pinned: true }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    await act(async () => {
      await handlePin(mouseEventMock);
    });
    expect(unpinSpy).toHaveBeenCalledWith(message);
    expect(getHeldMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: false }),
    );
  });

  it('should roll back and throw when unpinning fails', async () => {
    let rejectRequest: (error: Error) => void = () => {};
    vi.spyOn(client, 'unpinMessage').mockReturnValue(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );
    const message = generateMessage({ cid: channel.cid, pinned: true }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    let pending: ReturnType<typeof handlePin>;
    act(() => {
      pending = handlePin(mouseEventMock);
    });
    expect(getHeldMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: false }),
    );
    await act(async () => {
      rejectRequest(new Error('unpin failed'));
      await expect(pending).rejects.toThrow('unpin failed');
    });
    expect(getHeldMessage(message.id)).toEqual(expect.objectContaining({ pinned: true }));
  });

  it('should notify and throw when pinning fails with notifications configured', async () => {
    vi.spyOn(client, 'pinMessage').mockRejectedValue(new Error('pin failed'));
    const notify = vi.fn();
    const message = generateMessage({ cid: channel.cid, pinned: false }) as LocalMessage;
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
