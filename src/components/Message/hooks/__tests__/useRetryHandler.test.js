import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { generateMessage } from 'mock-builders';
import { ChannelContext } from '../../../../context';
import { useRetryHandler } from '../useRetryHandler';

const retrySendMessage = jest.fn();

function renderUseRetryHandlerHook() {
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        retrySendMessage,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useRetryHandler(), { wrapper });
  return result.current;
}

describe('useReactionHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate a function that handles retrying a failed message', () => {
    const handleRetry = renderUseRetryHandlerHook();
    expect(typeof handleRetry).toBe('function');
  });

  it('should retry send message when called', () => {
    const handleRetry = renderUseRetryHandlerHook();
    const message = generateMessage();
    handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });
});
