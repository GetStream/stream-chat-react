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

// MERGE-RECONCILE (test migration): the master merge removed ChannelStateContext.
// `useMarkUnreadHandler` reads the channel from ChannelInstanceContext (useChannel). The wrapper
// uses the real <Chat>/<Channel> providers and assertions spy on `channel.markUnread`. The hook
// now *propagates* request failures (it no longer swallows them) so the caller — e.g. MessageActions'
// MarkUnread control, which wraps the handler in try/catch and reports via useNotificationApi — can
// surface the error; the optional `notify` bridge is only used for a success toast.

vi.spyOn(console, 'warn').mockImplementation(() => null);

const event = fromPartial<React.BaseSyntheticEvent>({ preventDefault: vi.fn() });
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

  it('does not call channel.markUnread if no message is provided', async () => {
    const markUnreadSpy = vi.spyOn(channel, 'markUnread');
    const handleMarkUnread = renderUseMarkUnreadHandlerHook();
    await act(async () => {
      await handleMarkUnread(event);
    });
    expect(markUnreadSpy).not.toHaveBeenCalled();
  });

  it('does not call channel.markUnread if message is missing id', async () => {
    const markUnreadSpy = vi.spyOn(channel, 'markUnread');
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message: generateMessage({ id: undefined }) as unknown as LocalMessage,
    });
    await act(async () => {
      await handleMarkUnread(event);
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
