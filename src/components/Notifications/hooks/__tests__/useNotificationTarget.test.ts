import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChatViewContext, useChatViewContext } from '../../../ChatView';
import { useChannelListContext, useChannelStateContext } from '../../../../context';
import { useNotificationTarget } from '../useNotificationTarget';
import { useThreadContext } from '../../../Threads/ThreadContext';
import { useLegacyThreadContext } from '../../../Thread';

vi.mock('../../../ChatView', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useChatViewContext: vi.fn(),
}));

vi.mock('../../../../context', () => ({
  useChannelListContext: vi.fn(),
  useChannelStateContext: vi.fn(),
}));

vi.mock('../../../Threads/ThreadContext', () => ({
  useThreadContext: vi.fn(),
}));

vi.mock('../../../Thread', () => ({
  useLegacyThreadContext: vi.fn(),
}));

const mockedUseChannelListContext = vi.mocked(useChannelListContext);
const mockedUseChannelStateContext = vi.mocked(useChannelStateContext);
const mockedUseChatViewContext = vi.mocked(useChatViewContext);
const mockedUseLegacyThreadContext = vi.mocked(useLegacyThreadContext);
const mockedUseThreadContext = vi.mocked(useThreadContext);

const chatViewWrapper = (activeChatView) => {
  const Wrapper = ({ children }) =>
    React.createElement(
      ChatViewContext.Provider,
      { value: { activeChatView, setActiveChatView: vi.fn() } },
      children,
    );
  Wrapper.displayName = 'ChatViewWrapper';
  return Wrapper;
};

describe('useNotificationTarget', () => {
  beforeEach(() => {
    mockedUseChannelListContext.mockReturnValue(fromPartial({}));
    mockedUseChannelStateContext.mockReturnValue(fromPartial({}));
    mockedUseChatViewContext.mockReturnValue({
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
    });
    mockedUseLegacyThreadContext.mockReturnValue(fromPartial({}));
    mockedUseThreadContext.mockReturnValue(undefined);
  });

  afterEach(() => {
    mockedUseChannelStateContext.mockReset();
    mockedUseChatViewContext.mockReset();
    mockedUseThreadContext.mockReset();
    mockedUseLegacyThreadContext.mockReset();
  });

  it('returns channel when channel context exists', () => {
    mockedUseChannelStateContext.mockReturnValue(fromPartial({ channel: {} }));

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('channel');
  });

  it('returns thread when thread context exists', () => {
    mockedUseThreadContext.mockReturnValue(fromPartial({}));

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('thread');
  });

  it('returns channel-list for channels view without thread or channel context', () => {
    mockedUseChatViewContext.mockReturnValue({
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
    });
    mockedUseChannelListContext.mockReturnValue(fromPartial({ channels: [] }));

    const { result } = renderHook(() => useNotificationTarget(), {
      wrapper: chatViewWrapper('channels'),
    });

    expect(result.current).toBe('channel-list');
  });

  it('returns thread-list for threads view without thread or channel context', () => {
    const { result } = renderHook(() => useNotificationTarget(), {
      wrapper: chatViewWrapper('threads'),
    });

    expect(result.current).toBe('thread-list');
  });

  it('returns undefined when no context providers are available', () => {
    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBeUndefined();
  });
});
