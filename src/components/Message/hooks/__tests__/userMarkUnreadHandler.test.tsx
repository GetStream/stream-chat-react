import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { useMarkUnreadHandler } from '../useMarkUnreadHandler';
import { ChannelStateProvider, TranslationProvider } from '../../../../context';
import type { TranslationContextValue } from '../../../../context';
import {
  generateMessage,
  mockChannelStateContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import type { LocalMessage } from 'stream-chat';

vi.spyOn(console, 'warn').mockImplementation(() => null);

const event = fromPartial<React.BaseSyntheticEvent>({ preventDefault: vi.fn() });
const t = ((str: string) => str) as TranslationContextValue['t'];
const message = generateMessage() as unknown as LocalMessage;
const channel = fromPartial<{ markUnread: ReturnType<typeof vi.fn> }>({
  markUnread: vi.fn(),
});
function renderUseMarkUnreadHandlerHook({ message }: { message?: LocalMessage } = {}) {
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <TranslationProvider value={mockTranslationContextValue({ t })}>
      <ChannelStateProvider
        value={mockChannelStateContext({
          channel,
        })}
      >
        {children}
      </ChannelStateProvider>
    </TranslationProvider>
  );
  const { result } = renderHook(() => useMarkUnreadHandler(message), {
    wrapper,
  });
  return result.current;
}
describe('useMarkUnreadHandler', () => {
  afterEach(vi.clearAllMocks);
  it('does not call channel.markUnread if no message is provided', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook();
    await handleMarkUnread(event);
    expect(channel.markUnread).not.toHaveBeenCalled();
  });
  it('does not call channel.markUnread if message is missing id', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message: generateMessage({ id: undefined }) as unknown as LocalMessage,
    });
    await handleMarkUnread(event);
    expect(channel.markUnread).not.toHaveBeenCalled();
  });
  it('calls channel.markUnread', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await handleMarkUnread(event);
    expect(channel.markUnread).toHaveBeenCalledWith(
      expect.objectContaining({ message_id: message.id }),
    );
  });
  it('completes without throwing on successful mark unread', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await handleMarkUnread(event);
  });

  it('throws the default error message if mark unread fails', async () => {
    channel.markUnread.mockRejectedValueOnce(new Error('mark unread failed'));
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await expect(handleMarkUnread(event)).rejects.toThrow('mark unread failed');
  });
});
