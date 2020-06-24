import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { generateUser, generateMessage } from 'mock-builders';
import { ChannelContext } from '../../../../context';
import { useMentionsHandler } from '../useMentionsHandler';

const onMentionsClickMock = jest.fn();
const onMentionsHoverMock = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

function renderUseMentionsHandlerHook(
  message = generateMessage(),
  onMentionsClick = onMentionsClickMock,
  onMentionsHover = onMentionsHoverMock,
) {
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        onMentionsClick,
        onMentionsHover,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useMentionsHandler(message), {
    wrapper,
  });
  return result.current;
}

describe('useMentionsHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should return a function', () => {
    const handleMentions = renderUseMentionsHandlerHook();
    expect(handleMentions).toStrictEqual({
      onMentionsClick: expect.any(Function),
      onMentionsHover: expect.any(Function),
    });
  });

  it("should call onMentionsClick with message's mentioned users when user clicks on a mention", () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });

  it('should not call onMentionsClick when it is not defined', () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message, null);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).not.toHaveBeenCalled();
  });

  it('should not call onMentionsClick when it message has no mentioned users set', () => {
    const message = generateMessage({ mentioned_users: null });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).not.toHaveBeenCalled();
  });

  it("should call onMentionsHover with message's mentioned users when user hovers on a mention", () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsHover } = renderUseMentionsHandlerHook(message);
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });

  it('should not call onMentionsHover when it is not defined', () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsHover } = renderUseMentionsHandlerHook(
      message,
      onMentionsClickMock,
      null,
    );
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });

  it('should not call onMentionsHover when it message has no mentioned users set', () => {
    const message = generateMessage({ mentioned_users: null });
    const { onMentionsHover } = renderUseMentionsHandlerHook(message);
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });
});
