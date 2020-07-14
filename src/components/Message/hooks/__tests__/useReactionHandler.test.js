import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  getTestClientWithUser,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
} from 'mock-builders';
import { ChannelContext } from '../../../../context';
import {
  useReactionHandler,
  useReactionClick,
  reactionHandlerWarning,
} from '../useReactionHandler';

const getConfig = jest.fn();
const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const updateMessage = jest.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUseReactionHandlerHook(
  message = generateMessage(),
  channelContextProps,
) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    getConfig,
    sendAction,
    sendReaction,
    deleteReaction,
    ...channelContextProps,
  });
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        channel,
        client,
        updateMessage,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useReactionHandler(message), { wrapper });
  return result.current;
}

describe('useReactionHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles reactions', async () => {
    const handleReaction = await renderUseReactionHandlerHook();
    expect(typeof handleReaction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleReaction = await renderUseReactionHandlerHook(null);
    await handleReaction();
    expect(console.warn).toHaveBeenCalledWith(reactionHandlerWarning);
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    await handleReaction();
    expect(console.warn).toHaveBeenCalledWith(
      `message.own_reactions contained reactions from a different user, this indicates a bug`,
    );
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    await handleReaction(reaction.type);
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      type: reaction.type,
    });
  });

  it('should rollback reaction if channel update fails', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const handleReaction = await renderUseReactionHandlerHook(message);
    sendReaction.mockImplementationOnce(() => Promise.reject());
    await handleReaction(reaction.type);
    expect(updateMessage).toHaveBeenCalledWith(message);
  });
});

function renderUseReactionClickHook(
  message = generateMessage(),
  reactionListRef = React.createRef(),
  messageWrapperRef = React.createRef(),
) {
  const wrapper = ({ children }) => {
    return <div>{children}</div>;
  };
  const { result, rerender } = renderHook(
    () => useReactionClick(message, reactionListRef, messageWrapperRef),
    { wrapper },
  );
  return { result, rerender };
}

describe('useReactionClick custom hook', () => {
  beforeEach(jest.clearAllMocks);
  it('should initialize a click handler and a flag for showing detailed reactions', () => {
    const {
      result: { current },
    } = renderUseReactionClickHook();
    expect(typeof current.onReactionListClick).toBe('function');
    expect(current.showDetailedReactions).toBe(false);
  });

  it('should set show details to true on click', () => {
    const { result } = renderUseReactionClickHook();
    expect(result.current.showDetailedReactions).toBe(false);
    act(() => result.current.onReactionListClick());
    expect(result.current.showDetailedReactions).toBe(true);
  });

  it('should set event listener to close reaction list on document click when list is opened', () => {
    const clickMock = {
      target: document.createElement('div'),
    };
    const { result } = renderUseReactionClickHook();
    let onDocumentClick;
    const addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn((_, fn) => {
          onDocumentClick = fn;
        }),
      );
    act(() => result.current.onReactionListClick());
    expect(result.current.showDetailedReactions).toBe(true);
    expect(document.addEventListener).toHaveBeenCalledTimes(2);
    expect(document.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function),
    );
    act(() => onDocumentClick(clickMock));
    expect(result.current.showDetailedReactions).toBe(false);
    addEventListenerSpy.mockRestore();
  });

  it('should set event listener to message wrapper reference when one is set', () => {
    const mockMessageWrapperReference = {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    };
    const { result } = renderUseReactionClickHook(
      generateMessage(),
      React.createRef(),
      mockMessageWrapperReference,
    );
    act(() => result.current.onReactionListClick());
    expect(
      mockMessageWrapperReference.current.addEventListener,
    ).toHaveBeenCalledWith('mouseleave', expect.any(Function));
  });

  it('should not close reaction list on document click when click is on the reaction list itself', () => {
    const message = generateMessage();
    const reactionSelectorEl = document.createElement('div');
    const reactionListElement = document
      .createElement('div')
      .appendChild(reactionSelectorEl);
    const clickMock = {
      target: reactionSelectorEl,
    };
    const { result } = renderUseReactionClickHook(message, {
      current: reactionListElement,
    });
    let onDocumentClick;
    const addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn((_, fn) => {
          onDocumentClick = fn;
        }),
      );
    act(() => result.current.onReactionListClick());
    expect(result.current.showDetailedReactions).toBe(true);
    act(() => onDocumentClick(clickMock));
    expect(result.current.showDetailedReactions).toBe(true);
    addEventListenerSpy.mockRestore();
  });

  it('should remove close click event listeners after reaction list is closed', () => {
    const clickMock = {
      target: document.createElement('div'),
    };
    const { result } = renderUseReactionClickHook();
    let onDocumentClick;
    const addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn((_, fn) => {
          onDocumentClick = fn;
        }),
      );
    const removeEventListenerSpy = jest
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(jest.fn());
    act(() => result.current.onReactionListClick());
    expect(result.current.showDetailedReactions).toBe(true);
    act(() => onDocumentClick(clickMock));
    expect(result.current.showDetailedReactions).toBe(false);
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'click',
      onDocumentClick,
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'touchend',
      onDocumentClick,
    );
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should remove close click event listeners if message is deleted', () => {
    const clickMock = {
      target: document.createElement('div'),
    };
    const message = generateMessage();
    let onDocumentClick;
    const addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn((_, fn) => {
          onDocumentClick = fn;
        }),
      );
    const removeEventListenerSpy = jest
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(jest.fn());
    const { result, rerender } = renderUseReactionClickHook(message);
    expect(document.removeEventListener).not.toHaveBeenCalled();
    act(() => result.current.onReactionListClick(clickMock));
    message.deleted_at = new Date();
    rerender();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'click',
      onDocumentClick,
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'touchend',
      onDocumentClick,
    );
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
