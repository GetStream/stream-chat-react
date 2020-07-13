import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { generateUser, generateMessage } from 'mock-builders';
import { ChannelContext } from '../../../../context';
import {
  useMentionsHandler,
  useMentionsUIHandler,
} from '../useMentionsHandler';

const onMentionsClickMock = jest.fn();
const onMentionsHoverMock = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

function generateHookHandler(hook) {
  return (
    message,
    hookOptions,
    onMentionsClick = onMentionsClickMock,
    onMentionsHover = onMentionsHoverMock,
  ) => {
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
    const { result } = renderHook(() => hook(message, hookOptions), {
      wrapper,
    });
    return result.current;
  };
}

const renderUseMentionsHandlerHook = generateHookHandler(useMentionsHandler);

describe('useMentionsHandler custom hooks', () => {
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
    const { onMentionsClick } = renderUseMentionsHandlerHook(message, {}, null);
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
      {},
      onMentionsClickMock,
      null,
    );
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });

  it('should not call onMentionsHover when message has no mentioned users set', () => {
    const message = generateMessage({ mentioned_users: null });
    const { onMentionsHover } = renderUseMentionsHandlerHook(message);
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });

  it('should call the custom mention hover handler when one is set', () => {
    const bob = generateUser();
    const mentioned_users = [bob];
    const message = generateMessage({ mentioned_users });
    const onMentionsHoverHandler = jest.fn();
    const { onMentionsHover } = renderUseMentionsHandlerHook(message, {
      onMentionsHover: onMentionsHoverHandler,
    });
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverHandler).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });

  it('should call the custom mention click handler when one is set', () => {
    const bob = generateUser();
    const mentioned_users = [bob];
    const message = generateMessage({ mentioned_users });
    const onMentionsClickHandler = jest.fn();
    const { onMentionsClick } = renderUseMentionsHandlerHook(message, {
      onMentionsClick: onMentionsClickHandler,
    });
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickHandler).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
});

const renderUseMentionsUIHandlerHook = generateHookHandler(
  useMentionsUIHandler,
);

describe('useMentionsUIHandler', () => {
  afterEach(jest.clearAllMocks);
  it('should return a function', () => {
    const handleMentions = renderUseMentionsUIHandlerHook();
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
    const { onMentionsClick } = renderUseMentionsUIHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });

  it("should call onMentionsHover with message's mentioned users when user hovers on a mention", () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsHover } = renderUseMentionsUIHandlerHook(message);
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });

  it('should call the custom message mention click processor when one is set', () => {
    const bob = generateUser();
    const mentioned_users = [bob];
    const message = generateMessage({ mentioned_users });
    const customMentionClickHandler = jest.fn();
    const { onMentionsClick } = renderUseMentionsUIHandlerHook(message, {
      onMentionsClick: customMentionClickHandler,
    });
    onMentionsClick(mouseEventMock);
    expect(customMentionClickHandler).toHaveBeenCalledWith(mouseEventMock);
  });

  it('should call the custom message mention hover handler when one is set', () => {
    const bob = generateUser();
    const mentioned_users = [bob];
    const message = generateMessage({ mentioned_users });
    const customMentionsHover = jest.fn();
    const { onMentionsHover } = renderUseMentionsUIHandlerHook(message, {
      onMentionsHover: customMentionsHover,
    });
    onMentionsHover(mouseEventMock);
    expect(customMentionsHover).toHaveBeenCalledWith(mouseEventMock);
  });
});
