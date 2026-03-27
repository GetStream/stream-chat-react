import type React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { generateMessage, generateUser } from 'mock-builders';
import type { LocalMessage } from 'stream-chat';
import { useUserHandler } from '../useUserHandler';
import type { UserEventHandler } from '../useUserHandler';

const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

function renderUseUserHandlerHook(
  message: LocalMessage | undefined = generateMessage(),
  eventHandlers?: {
    onUserClickHandler?: UserEventHandler;
    onUserHoverHandler?: UserEventHandler;
  },
) {
  const { result } = renderHook(() => useUserHandler(message, eventHandlers));
  return result.current;
}

describe('useUserHandler custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should return a handlers for mouse events on the Avatar child component', () => {
    const handleUserEvents = renderUseUserHandlerHook();
    expect(handleUserEvents).toStrictEqual({
      onUserClick: expect.any(Function),
      onUserHover: expect.any(Function),
    });
  });

  it('should call user click handler with user message', () => {
    const user = generateUser();
    const message = generateMessage({ user });
    const customUserClickHandler = vi.fn();
    const { onUserClick } = renderUseUserHandlerHook(message, {
      onUserClickHandler: customUserClickHandler,
    });
    onUserClick(mouseEventMock);
    expect(customUserClickHandler).toHaveBeenCalledWith(mouseEventMock, user);
  });

  it('should call user hover handler with user message', () => {
    const user = generateUser();
    const message = generateMessage({ user });
    const customUserHoverHandler = vi.fn();
    const { onUserHover } = renderUseUserHandlerHook(message, {
      onUserHoverHandler: customUserHoverHandler,
    });
    onUserHover(mouseEventMock);
    expect(customUserHoverHandler).toHaveBeenCalledWith(mouseEventMock, user);
  });

  it('should not throw if no custom handler is set and handler is called', () => {
    const user = generateUser();
    const message = generateMessage({ user });
    const { onUserClick, onUserHover } = renderUseUserHandlerHook(message);
    expect(() => onUserClick(mouseEventMock)).not.toThrow();
    expect(() => onUserHover(mouseEventMock)).not.toThrow();
  });
});
