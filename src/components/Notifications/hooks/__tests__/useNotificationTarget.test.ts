import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useChannelListContext, useWorkspaceNavigation } from '../../../../context';
import { useChannelInstanceContext } from '../../../../context/ChannelInstanceContext';
import { useNotificationTarget } from '../useNotificationTarget';
import { useThreadContext } from '../../../Threads/ThreadContext';
import { useLegacyThreadContext } from '../../../Thread';

// MERGE-RECONCILE (test migration): the hook reads channel scope from
// `useChannelInstanceContext().channel`, channel-list scope from `useChannelListContext().paginator`,
// and the active view from the core workspace-navigation adapter (`useWorkspaceNavigation().isThreadsView`).
vi.mock('../../../../context', () => ({
  useChannelListContext: vi.fn(),
  useWorkspaceNavigation: vi.fn(),
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
const mockedUseWorkspaceNavigation = vi.mocked(useWorkspaceNavigation);
const mockedUseLegacyThreadContext = vi.mocked(useLegacyThreadContext);
const mockedUseThreadContext = vi.mocked(useThreadContext);

describe('useNotificationTarget', () => {
  beforeEach(() => {
    mockedUseChannelListContext.mockReturnValue(fromPartial({}));
    mockedUseChannelInstanceContext.mockReturnValue(fromPartial({}));
    mockedUseWorkspaceNavigation.mockReturnValue(fromPartial({ isThreadsView: false }));
    mockedUseLegacyThreadContext.mockReturnValue(fromPartial({}));
    mockedUseThreadContext.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    mockedUseWorkspaceNavigation.mockReturnValue(fromPartial({ isThreadsView: false }));
    mockedUseChannelListContext.mockReturnValue(fromPartial({ paginator: {} }));

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('channel-list');
  });

  it('returns thread-list for threads view without thread or channel context', () => {
    mockedUseWorkspaceNavigation.mockReturnValue(fromPartial({ isThreadsView: true }));

    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBe('thread-list');
  });

  it('returns undefined when no context providers are available', () => {
    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBeUndefined();
  });
});
