import { renderHook } from '@testing-library/react';

import { useQueuedNotifications } from '../useQueuedNotifications';
import { useNotifications } from '../useNotifications';

jest.mock('../useNotifications', () => ({
  useNotifications: jest.fn(),
}));

const mockedUseNotifications = jest.mocked(useNotifications);

const notifications = Array.from({ length: 7 }).map((_, i) => ({
  createdAt: i,
  id: `n-${i}`,
  message: `notification-${i}`,
  origin: { emitter: 'test' },
  severity: 'info',
}));

describe('useQueuedNotifications', () => {
  beforeEach(() => {
    mockedUseNotifications.mockReturnValue(notifications);
  });

  afterEach(() => {
    mockedUseNotifications.mockReset();
  });

  it('splits notifications into visible and queued sections', () => {
    const { result } = renderHook(() => useQueuedNotifications({ maxVisibleCount: 5 }));

    expect(result.current.visible).toHaveLength(5);
    expect(result.current.queued).toHaveLength(2);
    expect(result.current.queuedCount).toBe(2);
  });

  it('returns all notifications as queued when maxVisibleCount is 0', () => {
    const { result } = renderHook(() => useQueuedNotifications({ maxVisibleCount: 0 }));

    expect(result.current.visible).toHaveLength(0);
    expect(result.current.queued).toHaveLength(7);
  });

  it('forwards filtering options to useNotifications', () => {
    const filter = jest.fn(() => true);

    renderHook(() =>
      useQueuedNotifications({
        fallbackPanel: 'channel',
        filter,
        maxVisibleCount: 3,
        panel: 'thread',
      }),
    );

    expect(mockedUseNotifications).toHaveBeenCalledWith({
      fallbackPanel: 'channel',
      filter,
      panel: 'thread',
    });
  });
});
