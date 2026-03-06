import { act, renderHook } from '@testing-library/react';

import { useChatContext } from '../../../../context';
import { useThreadList } from '../ThreadList';

jest.mock('../ThreadListItem', () => ({
  ThreadListItem: () => null,
}));

jest.mock('../ThreadListEmptyPlaceholder', () => ({
  ThreadListEmptyPlaceholder: () => null,
}));

jest.mock('../ThreadListUnseenThreadsBanner', () => ({
  ThreadListUnseenThreadsBanner: () => null,
}));

jest.mock('../ThreadListLoadingIndicator', () => ({
  ThreadListLoadingIndicator: () => null,
}));

jest.mock('react-virtuoso', () => ({
  Virtuoso: () => null,
}));

jest.mock('../../../../context', () => ({
  useChatContext: jest.fn(),
}));

const mockedUseChatContext = jest.mocked(useChatContext);

describe('useThreadList', () => {
  let documentVisibilityState: DocumentVisibilityState;

  beforeEach(() => {
    documentVisibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => documentVisibilityState,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reloads first page on mount and reacts to visibility changes', () => {
    const activate = jest.fn();
    const deactivate = jest.fn();
    const reload = jest.fn().mockResolvedValue(undefined);
    const partialNext = jest.fn();
    const getLatestValue = jest.fn(() => ({
      pagination: { isLoading: false, isLoadingNext: false, nextCursor: 'cursor-1' },
    }));

    mockedUseChatContext.mockReturnValue({
      client: {
        threads: {
          activate,
          deactivate,
          reload,
          state: {
            getLatestValue,
            partialNext,
          },
        },
      },
    } as never);

    const { unmount } = renderHook(() => useThreadList());

    expect(getLatestValue).toHaveBeenCalledTimes(1);
    expect(partialNext).toHaveBeenCalledWith({
      isThreadOrderStale: false,
      pagination: { isLoading: false, isLoadingNext: false, nextCursor: null },
      ready: false,
      threads: [],
      unseenThreadIds: [],
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith({ force: true });
    expect(activate).toHaveBeenCalledTimes(1);
    expect(deactivate).toHaveBeenCalledTimes(0);

    act(() => {
      documentVisibilityState = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(deactivate).toHaveBeenCalledTimes(1);

    act(() => {
      documentVisibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(activate).toHaveBeenCalledTimes(2);

    unmount();
    expect(deactivate).toHaveBeenCalledTimes(2);
  });
});
