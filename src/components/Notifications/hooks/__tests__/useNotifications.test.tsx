import React from 'react';
import { renderHook } from '@testing-library/react';
import { StateStore } from 'stream-chat';

import { useNotifications } from '../useNotifications';
import { NotificationConfigurationProvider } from '../../NotificationConfigurationContext';
import { ChatProvider } from '../../../../context';
import { mockChatContext } from '../../../../mock-builders';

import type { Notification, NotificationManagerState } from 'stream-chat';

const notification = (overrides: Partial<Notification> = {}): Notification =>
  ({
    createdAt: 1,
    id: 'n-1',
    message: 'First',
    origin: { emitter: 'test' },
    severity: 'info',
    ...overrides,
  }) as Notification;

const renderUseNotifications = ({
  displayFilter,
  notifications,
  options,
}: {
  displayFilter?: React.ComponentProps<
    typeof NotificationConfigurationProvider
  >['displayFilter'];
  notifications: Notification[];
  options?: Parameters<typeof useNotifications>[0];
}) => {
  const store = new StateStore<NotificationManagerState>({ notifications });
  const client = { notifications: { store } };
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>
      <NotificationConfigurationProvider displayFilter={displayFilter}>
        {children}
      </NotificationConfigurationProvider>
    </ChatProvider>
  );

  return renderHook(() => useNotifications(options), { wrapper });
};

describe('useNotifications', () => {
  it('returns routed notifications that pass the configured display filter', () => {
    const result = renderUseNotifications({
      displayFilter: ({ panel }) => panel === 'modal',
      notifications: [notification({ tags: ['target:modal'] })],
      options: { applyDisplayFilter: true, panel: 'modal' },
    });

    expect(result.result.current).toHaveLength(1);
  });

  it('filters routed notifications rejected by the configured display filter', () => {
    const result = renderUseNotifications({
      displayFilter: ({ panel }) => panel === 'modal',
      notifications: [notification({ tags: ['target:channel'] })],
      options: { applyDisplayFilter: true, panel: 'channel' },
    });

    expect(result.result.current).toHaveLength(0);
  });

  it('runs the configured display filter before the local filter', () => {
    const localFilter = vi.fn(() => true);
    const displayFilter = vi.fn(() => false);
    const threadNotification = notification({ tags: ['target:thread'] });

    const result = renderUseNotifications({
      displayFilter,
      notifications: [threadNotification],
      options: {
        applyDisplayFilter: true,
        fallbackPanel: 'thread',
        filter: localFilter,
        panel: 'thread',
      },
    });

    expect(displayFilter).toHaveBeenCalledWith({
      fallbackPanel: 'thread',
      filter: localFilter,
      notification: threadNotification,
      panel: 'thread',
    });
    expect(localFilter).not.toHaveBeenCalled();
    expect(result.result.current).toHaveLength(0);
  });
});
