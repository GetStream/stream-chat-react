import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { generateMessage } from 'mock-builders';
import { ChannelContext } from '../../../../context';
import { useOpenThreadHandler } from '../useOpenThreadHandler';

const openThreadMock = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

function renderUseOpenThreadHandlerHook(
  message = generateMessage(),
  openThread = openThreadMock,
) {
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        openThread,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useOpenThreadHandler(message), {
    wrapper,
  });
  return result.current;
}

describe('useOpenThreadHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should return a function', () => {
    const handleOpenThread = renderUseOpenThreadHandlerHook();
    expect(typeof handleOpenThread).toBe('function');
  });

  it('should allow user to open a thread', () => {
    const message = generateMessage();
    const handleOpenThread = renderUseOpenThreadHandlerHook(message);
    handleOpenThread(mouseEventMock);
    expect(openThreadMock).toHaveBeenCalledWith(message, mouseEventMock);
  });

  it('should warn user if it is called without a message', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(null);
    handleOpenThread(mouseEventMock);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should warn user if it open thread is not defined in the channel context', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(
      generateMessage(),
      null,
    );
    handleOpenThread(mouseEventMock);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
