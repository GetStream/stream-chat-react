import React from 'react';
import { renderHook } from '@testing-library/react';

import { useOpenThreadHandler } from '../useOpenThreadHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { generateMessage } from '../../../../mock-builders';

const openThreadMock = vi.fn();
const mouseEventMock = {
  preventDefault: vi.fn(() => {}),
};

function renderUseOpenThreadHandlerHook(
  message: any = generateMessage(),
  openThread: any = openThreadMock,
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChannelActionProvider value={{ openThread } as any}>
      {children}
    </ChannelActionProvider>
  );

  const { result } = renderHook(() => useOpenThreadHandler(message), { wrapper });

  return result.current;
}

describe('useOpenThreadHandler custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should return a function', () => {
    const handleOpenThread = renderUseOpenThreadHandlerHook();
    expect(typeof handleOpenThread).toBe('function');
  });

  it('should allow user to open a thread', () => {
    const message = generateMessage();
    const handleOpenThread = renderUseOpenThreadHandlerHook(message);
    handleOpenThread(mouseEventMock as any);
    expect(openThreadMock).toHaveBeenCalledWith(message, mouseEventMock);
  });

  it('should warn user if it is called without a message', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(null);
    handleOpenThread(mouseEventMock as any);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should warn user if it open thread is not defined in the channel context', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(generateMessage(), null);
    handleOpenThread(mouseEventMock as any);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should allow user to open a thread with a custom thread handler if one is set', () => {
    const message = generateMessage();
    const customThreadHandler = vi.fn();
    const handleOpenThread = renderUseOpenThreadHandlerHook(message, customThreadHandler);
    handleOpenThread(mouseEventMock as any);
    expect(customThreadHandler).toHaveBeenCalledWith(message, mouseEventMock);
    expect(openThreadMock).not.toHaveBeenCalled();
  });
});
