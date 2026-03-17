import { renderHook } from '@testing-library/react';

import { useChatViewContext } from '../../../ChatView';
import { useChannelStateContext } from '../../../../context';
import { useNotificationTarget } from '../useNotificationTarget';
import { useThreadContext } from '../../../Threads/ThreadContext';

jest.mock('../../../ChatView', () => ({
  useChatViewContext: jest.fn(),
}));

jest.mock('../../../../context', () => ({
  useChannelStateContext: jest.fn(),
}));

jest.mock('../../../Threads/ThreadContext', () => ({
  useThreadContext: jest.fn(),
}));

const mockedUseChannelStateContext = jest.mocked(useChannelStateContext);
const mockedUseChatViewContext = jest.mocked(useChatViewContext);
const mockedUseThreadContext = jest.mocked(useThreadContext);

describe('useNotificationTarget', () => {
  beforeEach(() => {
    mockedUseChannelStateContext.mockReturnValue({});
    mockedUseChatViewContext.mockReturnValue({
      activeChatView: 'channels',
      setActiveChatView: jest.fn(),
    });
    mockedUseThreadContext.mockReturnValue(undefined);
  });

  afterEach(() => {
    mockedUseChannelStateContext.mockReset();
    mockedUseChatViewContext.mockReset();
    mockedUseThreadContext.mockReset();
  });

  it('returns channel when channel context exists', () => {
    mockedUseChannelStateContext.mockReturnValue({ channel: {} });

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('channel');
  });

  it('returns thread when thread context exists', () => {
    mockedUseThreadContext.mockReturnValue({});

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('thread');
  });

  it('returns channel-list for channels view without thread or channel context', () => {
    mockedUseChatViewContext.mockReturnValue({
      activeChatView: 'channels',
      setActiveChatView: jest.fn(),
    });

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('channel-list');
  });

  it('returns thread-list for threads view without thread or channel context', () => {
    mockedUseChatViewContext.mockReturnValue({
      activeChatView: 'threads',
      setActiveChatView: jest.fn(),
    });

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('thread-list');
  });

  it('throws when chat view context is missing', () => {
    mockedUseChatViewContext.mockImplementation(() => {
      throw new Error(
        'The useChatViewContext hook was called outside of the ChatView provider.',
      );
    });

    expect(() => renderHook(() => useNotificationTarget())).toThrow(
      'The useChatViewContext hook was called outside of the ChatView provider.',
    );
  });
});
