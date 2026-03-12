import { renderHook } from '@testing-library/react';

import { useNotificationTarget } from '../useNotificationTarget';
import { useThreadContext } from '../../../Threads';

jest.mock('../../../Threads/ThreadContext', () => ({
  useThreadContext: jest.fn(),
}));

const mockedUseThreadContext = jest.mocked(useThreadContext);

describe('useNotificationTarget', () => {
  beforeEach(() => {
    mockedUseThreadContext.mockReturnValue(undefined);
  });

  afterEach(() => {
    mockedUseThreadContext.mockReset();
  });

  it('defaults to channel when no thread context is available', () => {
    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('channel');
  });

  it('returns thread when thread context exists', () => {
    mockedUseThreadContext.mockReturnValue({});

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('thread');
  });

  it('prefers explicit target over inferred context', () => {
    mockedUseThreadContext.mockReturnValue({});

    const { result } = renderHook(() => useNotificationTarget({ target: 'thread-list' }));

    expect(result.current).toBe('thread-list');
  });
});
