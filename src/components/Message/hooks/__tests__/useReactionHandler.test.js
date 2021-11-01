import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';

import {
  reactionHandlerWarning,
  useReactionClick,
  useReactionHandler,
} from '../useReactionHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

const getConfig = jest.fn();
const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const updateMessage = jest.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUseReactionHandlerHook(message = generateMessage(), channelContextProps) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    deleteReaction,
    getConfig,
    sendAction,
    sendReaction,
    ...channelContextProps,
  });

  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel }}>
        <ChannelActionProvider value={{ updateMessage }}>{children}</ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
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
  const channel = generateChannel();

  const wrapper = ({ children }) => (
    <ChannelStateProvider value={{ channel }}>
      <ChannelActionProvider>{children}</ChannelActionProvider>
    </ChannelStateProvider>
  );

  const { rerender, result } = renderHook(
    () => useReactionClick(message, reactionListRef, messageWrapperRef),
    { wrapper },
  );
  return { rerender, result };
}

describe('useReactionClick custom hook', () => {
  beforeEach(jest.clearAllMocks);
  it('should initialize a click handler and a flag for showing detailed reactions', async () => {
    const {
      result: { current },
    } = await renderUseReactionClickHook();

    expect(typeof current.onReactionListClick).toBe('function');
    expect(current.showDetailedReactions).toBe(false);
  });

  it('should set show details to true on click', async () => {
    const { result } = await renderUseReactionClickHook();
    expect(result.current.showDetailedReactions).toBe(false);
    act(() => result.current.onReactionListClick());
    expect(result.current.showDetailedReactions).toBe(true);
  });

  it('should return correct value for isReactionEnabled', () => {
    const channel = generateChannel();
    const channelCapabilities = { 'send-reaction': true };
    const channelConfig = { reactions: true };

    const { rerender, result } = renderHook(
      () => useReactionClick(generateMessage(), React.createRef(), React.createRef()),
      {
        // eslint-disable-next-line react/display-name
        wrapper: ({ children }) => (
          <ChannelStateProvider value={{ channel, channelCapabilities, channelConfig }}>
            {children}
          </ChannelStateProvider>
        ),
      },
    );

    expect(result.current.isReactionEnabled).toBe(true);
    channelCapabilities['send-reaction'] = false;
    rerender();
    expect(result.current.isReactionEnabled).toBe(false);
    channelCapabilities['send-reaction'] = true;
    channelConfig['reactions'] = false;
    rerender();
    expect(result.current.isReactionEnabled).toBe(false);
    channelConfig['reactions'] = true;
    rerender();
    expect(result.current.isReactionEnabled).toBe(true);
  });

  it('should set event listener to close reaction list on document click when list is opened', async () => {
    const clickMock = {
      target: document.createElement('div'),
    };
    const { result } = await renderUseReactionClickHook();
    let onDocumentClick;
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation(
      jest.fn((_, fn) => {
        onDocumentClick = fn;
      }),
    );
    act(() => result.current.onReactionListClick());
    expect(result.current.showDetailedReactions).toBe(true);
    expect(document.addEventListener).toHaveBeenCalledTimes(1);
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    act(() => onDocumentClick(clickMock));
    expect(result.current.showDetailedReactions).toBe(false);
    addEventListenerSpy.mockRestore();
  });

  it('should set event listener to message wrapper reference when one is set', async () => {
    const mockMessageWrapperReference = {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    };
    const { result } = await renderUseReactionClickHook(
      generateMessage(),
      React.createRef(),
      mockMessageWrapperReference,
    );
    act(() => result.current.onReactionListClick());
    expect(mockMessageWrapperReference.current.addEventListener).toHaveBeenCalledWith(
      'mouseleave',
      expect.any(Function),
    );
  });

  it('should not close reaction list on document click when click is on the reaction list itself', async () => {
    const message = generateMessage();
    const reactionSelectorEl = document.createElement('div');
    const reactionListElement = document.createElement('div').appendChild(reactionSelectorEl);
    const clickMock = {
      target: reactionSelectorEl,
    };
    const { result } = await renderUseReactionClickHook(message, {
      current: reactionListElement,
    });
    let onDocumentClick;
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation(
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

  it('should remove close click event listeners after reaction list is closed', async () => {
    const clickMock = {
      target: document.createElement('div'),
    };
    const { result } = await renderUseReactionClickHook();
    let onDocumentClick;
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation(
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
    expect(document.removeEventListener).toHaveBeenCalledWith('click', onDocumentClick);
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should remove close click event listeners if message is deleted', async () => {
    const clickMock = {
      target: document.createElement('div'),
    };
    const message = generateMessage();
    let onDocumentClick;
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation(
      jest.fn((_, fn) => {
        onDocumentClick = fn;
      }),
    );
    const removeEventListenerSpy = jest
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(jest.fn());
    const { rerender, result } = await renderUseReactionClickHook(message);
    expect(document.removeEventListener).not.toHaveBeenCalled();
    act(() => result.current.onReactionListClick(clickMock));
    message.deleted_at = new Date();
    rerender();
    expect(document.removeEventListener).toHaveBeenCalledWith('click', onDocumentClick);
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
