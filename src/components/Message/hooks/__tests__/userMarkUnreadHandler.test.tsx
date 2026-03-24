import React from 'react';
import { renderHook } from '@testing-library/react';
import { useMarkUnreadHandler } from '../useMarkUnreadHandler';
import { ChannelStateProvider, TranslationProvider } from '../../../../context';
import {
  generateMessage,
  mockChannelStateContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';

vi.spyOn(console, 'warn').mockImplementation(() => null);

const customSuccessString = 'Custom Success';
const customErrorString = 'Custom Error';
const noop = () => null;
const generateSuccessString = () => customSuccessString;
const generateErrorString = () => customErrorString;
const event = { preventDefault: vi.fn() };
const t = ((str: any) => str) as any;
const message = generateMessage();
const notifications = {
  notify: vi.fn(),
};
const channel = { markUnread: vi.fn() } as any;
function renderUseMarkUnreadHandlerHook({ message, notifications }: any = {}) {
  const wrapper = ({ children }: any) => (
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
    await handleMarkUnread(event as any);
    expect(channel.markUnread).not.toHaveBeenCalled();
  });
  it('does not call channel.markUnread if message is missing id', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message: generateMessage({ id: undefined }),
    });
    await handleMarkUnread(event as any);
    expect(channel.markUnread).not.toHaveBeenCalled();
  });
  it('calls channel.markUnread', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message });
    await handleMarkUnread(event as any);
    expect(channel.markUnread).toHaveBeenCalledWith(
      expect.objectContaining({ message_id: message.id }),
    );
  });
  it('does not register success notification if getSuccessNotification is not available', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({ message, notifications });
    await handleMarkUnread(event as any);
    expect(notifications.notify).not.toHaveBeenCalled();
  });
  it('does not register success notification if getSuccessNotification does not generate one', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications: { ...notifications, getSuccessNotification: noop },
    });
    await handleMarkUnread(event as any);
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
    await handleMarkUnread(event as any);
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
    await handleMarkUnread(event as any);
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
    await handleMarkUnread(event as any);
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
    await handleMarkUnread(event as any);
    expect(notificationsWithError.notify).not.toHaveBeenCalled();
  });
});
