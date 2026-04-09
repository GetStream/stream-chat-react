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
      <TranslationProvider
        value={mockTranslationContextValue({ t: (_k, opts) => opts?.value ?? _k })}
      >
        <Notification
          notification={{ ...baseNotification, duration: undefined }}
          showClose
        />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(removeNotification).toHaveBeenCalledWith('n1');
  });

  it('renders action buttons and invokes handler', () => {
    const handler = vi.fn();
    render(
      <TranslationProvider
        value={mockTranslationContextValue({ t: (_k, opts) => opts?.value ?? _k })}
      >
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
      <TranslationProvider
        value={mockTranslationContextValue({ t: (_k, opts) => opts?.value ?? _k })}
      >
        <Notification
          notification={{ ...baseNotification, duration: undefined }}
          onDismiss={onDismiss}
          showClose
        />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(removeNotification).not.toHaveBeenCalled();
  });
});
