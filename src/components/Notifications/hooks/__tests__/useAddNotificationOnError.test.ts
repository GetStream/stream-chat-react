import { renderHook } from '@testing-library/react';

import { useAddNotificationOnError } from '../useAddNotificationOnError';
import type { AddNotificationOnErrorParams } from '../useAddNotificationOnError';

const mockAddNotification = vi.fn();

// A new `addNotification` on every render, as the real API returns when its inputs change.
vi.mock('../useNotificationApi', () => ({
  useNotificationApi: () => ({
    addNotification: (...args: unknown[]) => mockAddNotification(...args),
  }),
}));

const params: AddNotificationOnErrorParams = {
  emitter: 'TestList',
  message: 'Failed to load',
  targetPanels: ['channel-list'],
  type: 'api:channel:query:failed',
};

type HookProps = { error?: Error; params: AddNotificationOnErrorParams };

const renderAddNotificationOnError = (error?: Error) =>
  renderHook(({ error, params }: HookProps) => useAddNotificationOnError(error, params), {
    initialProps: { error, params },
  });

describe('useAddNotificationOnError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('publishes an error that occurs while mounted, with the given params', () => {
    const { rerender } = renderAddNotificationOnError();
    expect(mockAddNotification).not.toHaveBeenCalled();

    const error = new Error('query failed');
    rerender({ error, params });

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    expect(mockAddNotification).toHaveBeenCalledWith({
      ...params,
      error,
      severity: 'error',
    });
  });

  it('skips the error already set on mount', () => {
    const error = new Error('query failed');
    const { rerender } = renderAddNotificationOnError(error);

    rerender({ error, params });

    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('does not publish the same error again when the params change', () => {
    const error = new Error('query failed');
    const { rerender } = renderAddNotificationOnError();

    rerender({ error, params });
    rerender({ error, params: { ...params, message: 'Translated message' } });

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('publishes with the params of the render in which the error arrived', () => {
    const { rerender } = renderAddNotificationOnError();
    const translatedParams = { ...params, message: 'Translated message' };

    rerender({ error: undefined, params: translatedParams });
    rerender({ error: new Error('query failed'), params: translatedParams });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Translated message' }),
    );
  });

  it('keeps its own error and severity over ones in the params', () => {
    const { rerender } = renderAddNotificationOnError();
    const error = new Error('query failed');

    rerender({
      error,
      params: {
        ...params,
        error: new Error('other'),
        severity: 'info',
      } as AddNotificationOnErrorParams,
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ error, severity: 'error' }),
    );
  });

  it('publishes every new error, including one after the error cleared', () => {
    const { rerender } = renderAddNotificationOnError();

    rerender({ error: new Error('first'), params });
    rerender({ error: new Error('second'), params });
    rerender({ error: undefined, params });
    rerender({ error: new Error('third'), params });

    expect(mockAddNotification).toHaveBeenCalledTimes(3);
    expect(mockAddNotification.mock.calls.map(([{ error }]) => error.message)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });
});
