import React from 'react';
import { renderHook } from '@testing-library/react';

import { ChatViewContext } from '../../../ChatView';
import { useChannelListContext, useChannelStateContext } from '../../../../context';
import { useNotificationTarget } from '../useNotificationTarget';
import { useThreadContext } from '../../../Threads/ThreadContext';
import { useLegacyThreadContext } from '../../../Thread';

jest.mock('../../../../context', () => ({
  useChannelListContext: jest.fn(),
  useChannelStateContext: jest.fn(),
}));

jest.mock('../../../Threads/ThreadContext', () => ({
  useThreadContext: jest.fn(),
}));

jest.mock('../../../Thread', () => ({
  useLegacyThreadContext: jest.fn(),
}));

const mockedUseChannelListContext = jest.mocked(useChannelListContext);
const mockedUseChannelStateContext = jest.mocked(useChannelStateContext);
const mockedUseLegacyThreadContext = jest.mocked(useLegacyThreadContext);
const mockedUseThreadContext = jest.mocked(useThreadContext);

const chatViewWrapper = (activeChatView) => {
  const Wrapper = ({ children }) =>
    React.createElement(
      ChatViewContext.Provider,
      { value: { activeChatView, setActiveChatView: jest.fn() } },
      children,
    );
  Wrapper.displayName = 'ChatViewWrapper';
  return Wrapper;
};

describe('useNotificationTarget', () => {
  beforeEach(() => {
    mockedUseChannelListContext.mockReturnValue({});
    mockedUseChannelStateContext.mockReturnValue({});
    mockedUseLegacyThreadContext.mockReturnValue({});
    mockedUseThreadContext.mockReturnValue(undefined);
  });

  afterEach(jest.resetAllMocks);

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
    mockedUseChannelListContext.mockReturnValue({ channels: [] });

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
