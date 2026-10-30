import React from 'react';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { nowNs } from 'stream-chat';
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
// rolls back only the pin fields when the request fails, and rethrows so callers (the Pin
// message action) can show an error notification instead of a success one.

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

// Keeps the pin/unpin request pending; the returned function rejects it.
const mockPendingRequest = (method: 'pinMessage' | 'unpinMessage') => {
  let rejectRequest: (error: Error) => void = () => {};
  vi.spyOn(client, method).mockReturnValue(
    new Promise((_, reject) => {
      rejectRequest = reject;
    }),
  );
  return rejectRequest;
};

// Starts `handlePin` without awaiting it, so assertions can run while the request is pending.
const startHandlePin = (handlePin: ReturnType<typeof usePinHandler>['handlePin']) => {
  let pending: ReturnType<typeof handlePin> = undefined;
  act(() => {
    pending = handlePin(mouseEventMock);
  });
  return pending;
};

const getStoredMessage = (id: string) => channel.messagePaginator.getItem(id);

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

  it.each([
    { method: 'pinMessage', pinned: false },
    { method: 'unpinMessage', pinned: true },
  ] as const)(
    'should update the message optimistically when $method succeeds',
    async ({ method, pinned }) => {
      const requestSpy = vi.spyOn(client, method).mockResolvedValue(fromPartial({}));
      const message = generateMessage({ cid: channel.cid, pinned }) as LocalMessage;
      const { handlePin } = await renderUsePinHandler(message);
      await act(async () => {
        await handlePin(mouseEventMock);
      });
      expect(requestSpy).toHaveBeenCalledWith(message);
      expect(getStoredMessage(message.id)).toEqual(
        expect.objectContaining({ pinned: !pinned }),
      );
    },
  );

  it.each([
    { method: 'pinMessage', pinned: false },
    { method: 'unpinMessage', pinned: true },
  ] as const)(
    'should roll back and throw when $method fails',
    async ({ method, pinned }) => {
      const rejectRequest = mockPendingRequest(method);
      const message = generateMessage({ cid: channel.cid, pinned }) as LocalMessage;
      const { handlePin } = await renderUsePinHandler(message);
      const pending = startHandlePin(handlePin);
      expect(getStoredMessage(message.id)).toEqual(
        expect.objectContaining({ pinned: !pinned }),
      );
      await act(async () => {
        rejectRequest(new Error('request failed'));
        await expect(pending).rejects.toThrow('request failed');
      });
      expect(getStoredMessage(message.id)).toEqual(expect.objectContaining({ pinned }));
    },
  );

  it('should keep updates that arrived while the request was pending when rolling back', async () => {
    const rejectRequest = mockPendingRequest('pinMessage');
    const message = generateMessage({
      cid: channel.cid,
      pinned: false,
      text: 'original',
    }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    const pending = startHandlePin(handlePin);
    act(() => {
      channel.messagePaginator.ingestItem({
        ...getStoredMessage(message.id)!,
        text: 'edited while pinning',
      });
    });
    await act(async () => {
      rejectRequest(new Error('pin failed'));
      await expect(pending).rejects.toThrow('pin failed');
    });
    expect(getStoredMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: false, text: 'edited while pinning' }),
    );
  });

  it('should keep a pin state that changed while the request was pending', async () => {
    const rejectRequest = mockPendingRequest('unpinMessage');
    const originalPinner = generateUser();
    const newerPinner = generateUser();
    const message = generateMessage({
      cid: channel.cid,
      pinned: true,
      pinned_by: originalPinner,
    }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    const pending = startHandlePin(handlePin);
    act(() => {
      channel.messagePaginator.ingestItem({
        ...getStoredMessage(message.id)!,
        pinned: true,
        pinned_by: newerPinner,
      });
    });
    await act(async () => {
      rejectRequest(new Error('unpin failed'));
      await expect(pending).rejects.toThrow('unpin failed');
    });
    expect(getStoredMessage(message.id)?.pinned_by).toEqual(newerPinner);
  });

  it('should keep a newer pin with the same pinned value that arrived while pinning', async () => {
    const rejectRequest = mockPendingRequest('pinMessage');
    const newerPinner = generateUser();
    const newerPinnedAt = nowNs();
    const message = generateMessage({ cid: channel.cid, pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message);
    const pending = startHandlePin(handlePin);
    act(() => {
      channel.messagePaginator.ingestItem({
        ...getStoredMessage(message.id)!,
        pinned: true,
        pinned_at: newerPinnedAt,
        pinned_by: newerPinner,
      });
    });
    await act(async () => {
      rejectRequest(new Error('pin failed'));
      await expect(pending).rejects.toThrow('pin failed');
    });
    expect(getStoredMessage(message.id)).toEqual(
      expect.objectContaining({
        pinned: true,
        pinned_at: newerPinnedAt,
        pinned_by: newerPinner,
      }),
    );
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

  it('should roll back even when the notify callback throws', async () => {
    vi.spyOn(client, 'pinMessage').mockRejectedValue(new Error('pin failed'));
    const message = generateMessage({ cid: channel.cid, pinned: false }) as LocalMessage;
    const { handlePin } = await renderUsePinHandler(message, {
      notify: () => {
        throw new Error('notify failed');
      },
    });
    await act(async () => {
      await expect(handlePin(mouseEventMock)).rejects.toThrow('notify failed');
    });
    expect(getStoredMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: false }),
    );
  });
});
