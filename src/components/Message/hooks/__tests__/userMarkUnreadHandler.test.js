import React from 'react';
import { renderHook } from '@testing-library/react';
import { useMarkUnreadHandler } from '../useMarkUnreadHandler';
import { ChannelStateProvider, TranslationProvider } from '../../../../context';
import { generateMessage } from '../../../../mock-builders';

jest.spyOn(console, 'warn').mockImplementation(() => null);

const customSuccessString = 'Custom Success';
const customErrorString = 'Custom Error';
const noop = () => null;
const generateSuccessString = () => customSuccessString;
const generateErrorString = () => customErrorString;
const event = { preventDefault: jest.fn() };
const t = (str) => str;
const message = generateMessage();
const notifications = {
  notify: jest.fn(),
};
const channel = { markUnread: jest.fn() };
function renderUseMarkUnreadHandlerHook({ message, notifications } = {}) {
  const wrapper = ({ children }) => (
    <TranslationProvider value={{ t }}>
      <ChannelStateProvider
        value={{
          channel,
        }}
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
  afterEach(jest.clearAllMocks);
  it('does not call channel.markUnread if no message is provided', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook();
    await handleMarkUnread(event);
    expect(channel.markUnread).not.toHaveBeenCalled();
  });
  it('does not call channel.markUnread if message is missing id', async () => {
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message: generateMessage({ id: undefined }),
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
      notify: jest.fn(),
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
    channel.markUnread.mockRejectedValueOnce();
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
    channel.markUnread.mockRejectedValueOnce();
    const notificationsWithError = {
      getErrorNotification: generateErrorString,
      notify: jest.fn(),
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
    channel.markUnread.mockRejectedValueOnce();
    const notificationsWithError = {
      getErrorNotification: noop,
      notify: jest.fn(),
    };
    const handleMarkUnread = renderUseMarkUnreadHandlerHook({
      message,
      notifications: notificationsWithError,
    });
    await handleMarkUnread(event);
    expect(notificationsWithError.notify).not.toHaveBeenCalled();
  });
});
