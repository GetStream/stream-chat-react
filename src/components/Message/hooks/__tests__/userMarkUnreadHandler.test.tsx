import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { useMarkUnreadHandler } from '../useMarkUnreadHandler';
import type { MarkUnreadHandlerNotifications } from '../useMarkUnreadHandler';
import { ChannelStateProvider, TranslationProvider } from '../../../../context';
import type { TranslationContextValue } from '../../../../context';
import {
  generateMessage,
  mockChannelStateContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import type { LocalMessage } from 'stream-chat';

vi.spyOn(console, 'warn').mockImplementation(() => null);

const customSuccessString = 'Custom Success';
const customErrorString = 'Custom Error';
const noop = () => null;
const generateSuccessString = () => customSuccessString;
const generateErrorString = () => customErrorString;
const event = fromPartial<React.BaseSyntheticEvent>({ preventDefault: vi.fn() });
const t = ((str: string) => str) as TranslationContextValue['t'];
const message = generateMessage() as unknown as LocalMessage;
const notifications: MarkUnreadHandlerNotifications = {
  notify: vi.fn(),
};
const channel = fromPartial<{ markUnread: ReturnType<typeof vi.fn> }>({
  markUnread: vi.fn(),
});
function renderUseMarkUnreadHandlerHook({
  message,
  notifications,
}: { message?: LocalMessage; notifications?: MarkUnreadHandlerNotifications } = {}) {
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
  const { result } = renderHook(() => useMarkUnreadHandler(message, notifications), {
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
  it('does not register success notification if getSuccessNotification is not available', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message, notifications });
    await handleMarkUnread(event);
    expect(notifications.notify).not.toHaveBeenCalled();
  });
  it('does not register success notification if getSuccessNotification does not generate one', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications: { ...notifications, getSuccessNotification: noop },
    });
    await handleMarkUnread(event);
    expect(notifications.notify).not.toHaveBeenCalled();
  });
  it('registers the success notification if getSuccessNotification generates one', async () => {
    const notificationsWithSuccess = {
      getSuccessNotification: generateSuccessString,
      notify: vi.fn(),
    };
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications: notificationsWithSuccess,
    });
    await handleMarkUnread(event);
    expect(notificationsWithSuccess.notify).toHaveBeenCalledWith(
      customSuccessString,
      'success',
    );
  });

  it('registers the default error notification if getErrorNotification is missing', async () => {
    channel.markUnread.mockRejectedValueOnce(undefined);
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications,
    });
    await handleMarkUnread(event);
    expect(notifications.notify).toHaveBeenCalledWith(
      'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
      'error',
    );
  });
  it('registers the custom error notification if available getErrorNotification generates one', async () => {
    channel.markUnread.mockRejectedValueOnce(undefined);
    const notificationsWithError = {
      getErrorNotification: generateErrorString,
      notify: vi.fn(),
    };
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications: notificationsWithError,
    });
    await handleMarkUnread(event);
    expect(notificationsWithError.notify).toHaveBeenCalledWith(
      customErrorString,
      'error',
    );
  });

  it('does not register the custom error notification if available getErrorNotification does not generate one', async () => {
    channel.markUnread.mockRejectedValueOnce(undefined);
    const notificationsWithError = {
      getErrorNotification: noop,
      notify: vi.fn(),
    };
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications: notificationsWithError,
    });
    await handleMarkUnread(event);
    expect(notificationsWithError.notify).not.toHaveBeenCalled();
  });
});
