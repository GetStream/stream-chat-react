import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useOpenThreadHandler } from '../useOpenThreadHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { generateMessage, mockChannelActionContext } from '../../../../mock-builders';
import type { LocalMessage } from 'stream-chat';

const openThreadMock = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

function renderUseOpenThreadHandlerHook(
  message: LocalMessage | null | undefined = generateMessage(),
  openThread:
    | ((message: LocalMessage, event: React.BaseSyntheticEvent) => void)
    | null
    | undefined = openThreadMock,
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChannelActionProvider value={mockChannelActionContext({ openThread })}>
      {children}
    </ChannelActionProvider>
  );

  const { result } = renderHook(() => useOpenThreadHandler(message ?? undefined), {
    wrapper,
  });

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
    handleOpenThread(mouseEventMock);
    expect(openThreadMock).toHaveBeenCalledWith(message, mouseEventMock);
  });

  it('should warn user if it is called without a message', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(null);
    handleOpenThread(mouseEventMock);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should warn user if it open thread is not defined in the channel context', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(generateMessage(), null);
    handleOpenThread(mouseEventMock);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should allow user to open a thread with a custom thread handler if one is set', () => {
    const message = generateMessage();
    const customThreadHandler = vi.fn();
    const handleOpenThread = renderUseOpenThreadHandlerHook(message, customThreadHandler);
    handleOpenThread(mouseEventMock);
    expect(customThreadHandler).toHaveBeenCalledWith(message, mouseEventMock);
    expect(openThreadMock).not.toHaveBeenCalled();
  });
});
