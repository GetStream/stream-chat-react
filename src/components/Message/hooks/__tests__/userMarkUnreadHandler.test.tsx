import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { useMarkUnreadHandler } from '../useMarkUnreadHandler';
import type { MarkUnreadHandlerNotifications } from '../useMarkUnreadHandler';
import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

const event = fromPartial<React.BaseSyntheticEvent>({ preventDefault: vi.fn() });
const missingMessageIdError = 'Mark unread handler does not have access to message id';
const message = generateMessage() as unknown as LocalMessage;

let channel: ChannelType;
let client: StreamChat;

function renderUseMarkUnreadHandlerHook({
  message,
  notifications,
}: { message?: LocalMessage; notifications?: MarkUnreadHandlerNotifications } = {}) {
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  const { result } = renderHook(() => useMarkUnreadHandler(message, notifications), {
    wrapper,
  });
  return result.current;
}

describe('useMarkUnreadHandler', () => {
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

  it('throws without calling channel.markUnread if no message is provided', async () => {
    const markUnreadSpy = vi.spyOn(channel, 'markUnread');
    const handleMarkUnread = renderUseMarkUnreadHandlerHook();
    await act(async () => {
      await expect(handleMarkUnread(event)).rejects.toThrow(missingMessageIdError);
    });
    expect(markUnreadSpy).not.toHaveBeenCalled();
  });

  it('throws without calling channel.markUnread if message is missing id', async () => {
    const markUnreadSpy = vi.spyOn(channel, 'markUnread');
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message: generateMessage({ id: undefined }) as unknown as LocalMessage,
    });
    await act(async () => {
      await expect(handleMarkUnread(event)).rejects.toThrow(missingMessageIdError);
    });
    expect(markUnreadSpy).not.toHaveBeenCalled();
  });

  it('calls channel.markUnread', async () => {
    const markUnreadSpy = vi
      .spyOn(channel, 'markUnread')
      .mockResolvedValue(fromPartial({}));
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await act(async () => {
      await handleMarkUnread(event);
    });
    expect(markUnreadSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message_id: message.id }),
    );
  });

  it('completes without throwing on successful mark unread', async () => {
    vi.spyOn(channel, 'markUnread').mockResolvedValue(fromPartial({}));
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await act(async () => {
      await expect(handleMarkUnread(event)).resolves.toBeUndefined();
    });
  });

  it('propagates the error if mark unread fails (caller surfaces the notification)', async () => {
    const error = new Error('mark unread failed');
    vi.spyOn(channel, 'markUnread').mockRejectedValue(error);
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await act(async () => {
      await expect(handleMarkUnread(event)).rejects.toThrow('mark unread failed');
    });
  });
});
