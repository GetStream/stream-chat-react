import { renderHook } from '@testing-library/react';

import { useRetryHandler } from '../useRetryHandler';

const mockUseThreadContext = jest.fn();
const mockUseChannel = jest.fn();

jest.mock('../../../Threads', () => ({
  useThreadContext: () => mockUseThreadContext(),
}));

jest.mock('../../../../context', () => ({
  useChannel: () => mockUseChannel(),
}));

const channelRetrySendMessageWithLocalUpdate = jest.fn();
const threadRetrySendMessageWithLocalUpdate = jest.fn();

describe('useRetryHandler custom hook', () => {
  beforeEach(() => {
    mockUseThreadContext.mockReturnValue(undefined);
    mockUseChannel.mockReturnValue({
      retrySendMessageWithLocalUpdate: channelRetrySendMessageWithLocalUpdate,
    });
  });

  afterEach(jest.clearAllMocks);

  it('should generate a function that handles retrying a failed message', () => {
    const { result } = renderHook(() => useRetryHandler());
    expect(typeof result.current).toBe('function');
  });

  it('should call channel retry when thread context is absent', async () => {
    const { result } = renderHook(() => useRetryHandler());
    const params = { localMessage: { id: 'm1' } };

    await result.current(params);

    expect(channelRetrySendMessageWithLocalUpdate).toHaveBeenCalledWith(params);
    expect(threadRetrySendMessageWithLocalUpdate).not.toHaveBeenCalled();
  });

  it('should call thread retry when thread context is present', async () => {
    mockUseThreadContext.mockReturnValue({
      retrySendMessageWithLocalUpdate: threadRetrySendMessageWithLocalUpdate,
    });
    const { result } = renderHook(() => useRetryHandler());
    const params = { localMessage: { id: 'm1' } };

    await result.current(params);

    expect(threadRetrySendMessageWithLocalUpdate).toHaveBeenCalledWith(params);
    expect(channelRetrySendMessageWithLocalUpdate).not.toHaveBeenCalled();
  });
});
