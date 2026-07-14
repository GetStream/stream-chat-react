import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChatViewContext } from '../../../ChatView';
import { useChannelListContext } from '../../../../context';
import { useChannelInstanceContext } from '../../../../context/ChannelInstanceContext';
import { useNotificationTarget } from '../useNotificationTarget';
import { useThreadContext } from '../../../Threads/ThreadContext';
import { useLegacyThreadContext } from '../../../Thread';

// MERGE-RECONCILE (test migration): the deleted ChannelStateContext is gone; the hook now reads
// channel scope from `useChannelInstanceContext().channel`, channel-list scope from
// `useChannelListContext().paginator`, and the active view from `useContext(ChatViewContext)`.
vi.mock('../../../../context', () => ({
  useChannelListContext: vi.fn(),
}));

vi.mock('../../../../context/ChannelInstanceContext', () => ({
  useChannelInstanceContext: vi.fn(),
}));

vi.mock('../../../Threads/ThreadContext', () => ({
  useThreadContext: vi.fn(),
}));

vi.mock('../../../Thread', () => ({
  useLegacyThreadContext: vi.fn(),
}));

const mockedUseChannelListContext = vi.mocked(useChannelListContext);
const mockedUseChannelInstanceContext = vi.mocked(useChannelInstanceContext);
const mockedUseLegacyThreadContext = vi.mocked(useLegacyThreadContext);
const mockedUseThreadContext = vi.mocked(useThreadContext);

const chatViewWrapper = (activeChatView) => {
  const Wrapper = ({ children }) =>
    React.createElement(
      ChatViewContext.Provider,
      { value: fromPartial({ activeChatView, activeView: activeChatView }) },
      children,
    );
  Wrapper.displayName = 'ChatViewWrapper';
  return Wrapper;
};

describe('useNotificationTarget', () => {
  beforeEach(() => {
    mockedUseChannelListContext.mockReturnValue(fromPartial({}));
    mockedUseChannelInstanceContext.mockReturnValue(fromPartial({}));
    mockedUseLegacyThreadContext.mockReturnValue(fromPartial({}));
    mockedUseThreadContext.mockReturnValue(undefined);
  });

  afterEach(() => {
    mockedUseChannelListContext.mockReset();
    mockedUseChannelInstanceContext.mockReset();
    mockedUseThreadContext.mockReset();
    mockedUseLegacyThreadContext.mockReset();
  });

  it('returns channel when channel context exists', () => {
    mockedUseChannelInstanceContext.mockReturnValue(fromPartial({ channel: {} }));

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('channel');
  });

  it('returns thread when thread context exists', () => {
    mockedUseThreadContext.mockReturnValue(fromPartial({}));

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('thread');
  });

  it('returns channel-list for channels view without thread or channel context', () => {
    mockedUseChannelListContext.mockReturnValue(fromPartial({ paginator: {} }));

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
