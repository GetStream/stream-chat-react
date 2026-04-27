import React from 'react';
import { act, render, screen } from '@testing-library/react';

import {
  type NotificationAnnouncementBuilder,
  type NotificationAnnouncementFilter,
  NotificationAnnouncer,
} from '../NotificationAnnouncer';
import { useNotifications } from '../../Notifications/hooks/useNotifications';
import { TranslationProvider } from '../../../context';
import { mockTranslationContextValue } from 'mock-builders';

import type { Notification } from '../../../../../stream-chat-js/src';

vi.mock('../../components/Notifications/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

const mockedUseNotifications = vi.mocked(useNotifications);

const notificationBase: Notification = {
  createdAt: Date.now(),
  id: 'notification-id',
  message: 'Notification message',
  origin: { emitter: 'test' },
  severity: 'info',
};

const mockTranslation = (key: string, options?: Record<string, unknown>) => {
  if (
    key === 'translationBuilderTopic/notification' &&
    typeof options?.value === 'string'
  ) {
    return options.value;
  }

  return key;
};

type RenderNotificationAnnouncerProps = {
  buildNotificationAnnouncement?: NotificationAnnouncementBuilder;
  notificationFilter?: NotificationAnnouncementFilter;
};

const renderNotificationAnnouncer = (props: RenderNotificationAnnouncerProps = {}) =>
  render(
    <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
      <NotificationAnnouncer {...props} />
    </TranslationProvider>,
  );

describe('NotificationAnnouncer', () => {
  let currentNotifications: Notification[];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    currentNotifications = [];
    mockedUseNotifications.mockImplementation(() => currentNotifications);
  });

  afterEach(() => {
    vi.useRealTimers();
    mockedUseNotifications.mockReset();
  });

  it('consumes notifications without passing a filter', () => {
    renderNotificationAnnouncer();

    expect(mockedUseNotifications).toHaveBeenCalledWith();
  });

  it('announces system-tagged notifications in the polite live region', () => {
    const { rerender } = renderNotificationAnnouncer();

    currentNotifications = [
      {
        ...notificationBase,
        id: 'system-1',
        message: 'Waiting for network...',
        tags: ['system'],
      },
    ];

    rerender(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <NotificationAnnouncer />
      </TranslationProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Info notification: Waiting for network...',
    );
  });

  it('announces error notifications in the assertive live region', () => {
    const { rerender } = renderNotificationAnnouncer();

    currentNotifications = [
      {
        ...notificationBase,
        id: 'error-1',
        message: 'Request failed',
        severity: 'error',
      },
    ];

    rerender(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <NotificationAnnouncer />
      </TranslationProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error notification: Request failed',
    );
  });

  it('does not announce notifications already present on mount', () => {
    currentNotifications = [
      {
        ...notificationBase,
        id: 'existing-1',
        message: 'Existing notification',
      },
    ];

    renderNotificationAnnouncer();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('status')).not.toHaveTextContent(
      'Info notification: Existing notification',
    );
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('allows customizing announcement message building', () => {
    const buildNotificationAnnouncement = vi
      .fn<NotificationAnnouncementBuilder>()
      .mockImplementation(({ notification, translatedMessage }) => {
        if (notification.severity === 'error') {
          return `Custom error announcement: ${translatedMessage}`;
        }

        return `Custom notification: ${translatedMessage}`;
      });
    const { rerender } = renderNotificationAnnouncer({ buildNotificationAnnouncement });

    currentNotifications = [
      {
        ...notificationBase,
        id: 'custom-1',
        message: 'Custom message',
      },
    ];

    rerender(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <NotificationAnnouncer
          buildNotificationAnnouncement={buildNotificationAnnouncement}
        />
      </TranslationProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(buildNotificationAnnouncement).toHaveBeenCalledWith({
      defaultMessage: 'Info notification: Custom message',
      notification: expect.objectContaining({ id: 'custom-1' }),
      translatedMessage: 'Custom message',
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Custom notification: Custom message',
    );
  });

  it('allows filtering notifications before announcement', () => {
    const notificationFilter = vi
      .fn<NotificationAnnouncementFilter>()
      .mockImplementation((notification) => notification.severity === 'error');
    const { rerender } = renderNotificationAnnouncer({ notificationFilter });

    currentNotifications = [
      {
        ...notificationBase,
        id: 'info-1',
        message: 'Informational message',
        severity: 'info',
      },
      {
        ...notificationBase,
        id: 'error-2',
        message: 'Error message',
        severity: 'error',
      },
    ];

    rerender(
      <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
        <NotificationAnnouncer notificationFilter={notificationFilter} />
      </TranslationProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(notificationFilter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'info-1' }),
    );
    expect(notificationFilter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'error-2' }),
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error notification: Error message',
    );
  });
});
