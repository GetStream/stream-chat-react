import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Notification } from '../Notification';
import { useNotificationApi } from '../hooks/useNotificationApi';
import { TranslationProvider } from '../../../context';
import { mockTranslationContextValue } from '../../../mock-builders';

import type { Notification as NotificationModel } from 'stream-chat';

vi.mock('../hooks/useNotificationApi', () => ({
  useNotificationApi: vi.fn(),
}));

const mockedUseNotificationApi = vi.mocked(useNotificationApi);

const mockTranslation = (key: string, options?: Record<string, unknown>) => {
  if (typeof options?.value === 'string') {
    return options.value;
  }

  const interpolated = Object.entries(options || {}).reduce((value, [name, arg]) => {
    if (name === 'value') return value;
    return value.replace(`{{ ${name} }}`, String(arg));
  }, key);

  return interpolated.startsWith('aria/')
    ? interpolated.replace('aria/', '')
    : interpolated;
};

describe('Notification', () => {
  const removeNotification = vi.fn();

  beforeEach(() => {
    mockedUseNotificationApi.mockReturnValue({
      addNotification: vi.fn(),
      addSystemNotification: vi.fn(),
      removeNotification,
      startNotificationTimeout: vi.fn(),
    });
    removeNotification.mockClear();
  });

  const baseNotification: NotificationModel = {
    actions: undefined,
    createdAt: Date.now(),
    id: 'n1',
    message: 'Hello',
    origin: { emitter: 'test' },
    severity: 'info',
  };

  it('removes by id when dismiss is triggered without onDismiss', () => {
    render(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <Notification
          notification={{ ...baseNotification, duration: undefined }}
          showClose
        />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(removeNotification).toHaveBeenCalledWith('n1');
  });

  it('renders action buttons and invokes handler', () => {
    const handler = vi.fn();
    render(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <Notification
          notification={{
            ...baseNotification,
            actions: [{ handler, label: 'Retry' }],
            severity: 'warning',
          }}
        />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when provided instead of removeNotification', () => {
    const onDismiss = vi.fn();
    render(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <Notification
          notification={{ ...baseNotification, duration: undefined }}
          onDismiss={onDismiss}
          showClose
        />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(removeNotification).not.toHaveBeenCalled();
  });

  it('uses severity-aware live region semantics for notification messages', () => {
    const { rerender } = render(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <Notification notification={baseNotification} />
      </TranslationProvider>,
    );

    const politeMessage = screen.getByText('Hello');
    expect(politeMessage).toHaveAttribute('aria-live', 'polite');
    expect(politeMessage).toHaveAttribute('aria-atomic', 'true');
    expect(politeMessage).toHaveAttribute('role', 'status');
    expect(screen.getByTestId('notification')).not.toHaveAttribute('aria-live');

    rerender(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <Notification notification={{ ...baseNotification, severity: 'error' }} />
      </TranslationProvider>,
    );

    const assertiveMessage = screen.getByText('Hello');
    expect(assertiveMessage).toHaveAttribute('aria-live', 'assertive');
    expect(assertiveMessage).toHaveAttribute('role', 'alert');
  });
});
