import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useMentionsHandler } from '../useMentionsHandler';

import { generateMessage, generateUser } from '../../../../mock-builders';
import { convertDateToTimestamp } from '../../../../mock-builders';

// Both handlers are supplied through the hook's `customMentionHandler` (second) argument.

const onMentionsClickMock = vi.fn();
const onMentionsHoverMock = vi.fn();
const mouseEventMock = {
  preventDefault: vi.fn(() => {}),
};

function generateHookHandler(hook: any) {
  return (
    message?: any,
    hookOptions?: any,
    onMentionsClick: any = onMentionsClickMock,
    onMentionsHover: any = onMentionsHoverMock,
  ) => {
    const { result } = renderHook(() =>
      hook(message, { onMentionsClick, onMentionsHover, ...hookOptions }),
    );
    return result.current;
  };
}

const renderUseMentionsHandlerHook = generateHookHandler(useMentionsHandler);

describe('useMentionsHandler custom hooks', () => {
  afterEach(vi.clearAllMocks);
  it('should return a function', () => {
    const handleMentions = renderUseMentionsHandlerHook();
    expect(handleMentions).toStrictEqual({
      onMentionsClick: expect.any(Function),
      onMentionsHover: expect.any(Function),
    });
  });

  it('should call onMentionsClick with the message when user clicks on a mention', () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(mouseEventMock, message);
  });

  it('should return no click handler when onMentionsClick is not set', () => {
    const message = generateMessage({ mentioned_users: [generateUser()] });
    const { onMentionsClick, onMentionsHover } = renderUseMentionsHandlerHook(
      message,
      {},
      null,
    );
    expect(onMentionsClick).toBeUndefined();
    expect(onMentionsHover).toEqual(expect.any(Function));
  });

  it('should not call onMentionsClick when it message has no mentioned users set', () => {
    const message = generateMessage({ mentioned_users: undefined });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).not.toHaveBeenCalled();
  });

  it.each([
    ['channel mention', { mentioned_channel: true }],
    ['here mention', { mentioned_here: true }],
    ['role mention', { mentioned_roles: ['admin'] }],
    [
      'user-group mention',
      {
        mentioned_groups: [
          fromPartial({
            created_at: convertDateToTimestamp('2026-05-28T00:00:00.000Z'),
            id: 'backend-team',
            name: 'Backend Team',
            updated_at: convertDateToTimestamp('2026-05-28T00:00:00.000Z'),
          }),
        ],
      },
    ],
  ])('should call onMentionsClick for a %s', (_, mention) => {
    const message = generateMessage({
      ...mention,
      mentioned_users: undefined,
    });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(mouseEventMock, message);
  });

  it('should call onMentionsHover with the message when user hovers on a mention', () => {
    const alice = generateUser();
    const bob = generateUser();
    const mentioned_users = [alice, bob];
    const message = generateMessage({ mentioned_users });
    const { onMentionsHover } = renderUseMentionsHandlerHook(message);
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).toHaveBeenCalledWith(mouseEventMock, message);
  });

  it('should return no hover handler when onMentionsHover is not set', () => {
    const message = generateMessage({ mentioned_users: [generateUser()] });
    const { onMentionsClick, onMentionsHover } = renderUseMentionsHandlerHook(
      message,
      {},
      onMentionsClickMock,
      null,
    );
    expect(onMentionsHover).toBeUndefined();
    expect(onMentionsClick).toEqual(expect.any(Function));
  });

  it('should not call onMentionsHover when message has no mentioned users set', () => {
    const message = generateMessage({ mentioned_users: undefined });
    const { onMentionsHover } = renderUseMentionsHandlerHook(message);
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });

  it('should call the custom mention hover handler when one is set', () => {
    const bob = generateUser();
    const mentioned_users = [bob];
    const message = generateMessage({ mentioned_users });
    const onMentionsHoverHandler = vi.fn();
    const { onMentionsHover } = renderUseMentionsHandlerHook(message, {
      onMentionsHover: onMentionsHoverHandler,
    });
    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverHandler).toHaveBeenCalledWith(mouseEventMock, message);
  });

  it('should call the custom mention click handler when one is set', () => {
    const bob = generateUser();
    const mentioned_users = [bob];
    const message = generateMessage({ mentioned_users });
    const onMentionsClickHandler = vi.fn();
    const { onMentionsClick } = renderUseMentionsHandlerHook(message, {
      onMentionsClick: onMentionsClickHandler,
    });
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickHandler).toHaveBeenCalledWith(mouseEventMock, message);
  });

  it('should keep its handlers stable and call the latest custom handlers with the latest message', () => {
    const message = generateMessage({ mentioned_users: [generateUser()] });
    const nextMessage = generateMessage({ mentioned_users: [generateUser()] });
    const event = fromPartial<React.BaseSyntheticEvent>(mouseEventMock);
    const firstClick = vi.fn();
    const nextClick = vi.fn();
    const nextHover = vi.fn();
    const { rerender, result } = renderHook(
      ({ handlers, message }) => useMentionsHandler(message, handlers),
      {
        initialProps: {
          handlers: { onMentionsClick: firstClick, onMentionsHover: onMentionsHoverMock },
          message,
        },
      },
    );
    const before = result.current;

    rerender({
      handlers: { onMentionsClick: nextClick, onMentionsHover: nextHover },
      message: nextMessage,
    });
    before.onMentionsClick?.(event);
    before.onMentionsHover?.(event);

    expect(result.current.onMentionsClick).toBe(before.onMentionsClick);
    expect(result.current.onMentionsHover).toBe(before.onMentionsHover);
    expect(firstClick).not.toHaveBeenCalled();
    expect(nextClick).toHaveBeenCalledWith(event, nextMessage);
    expect(nextHover).toHaveBeenCalledWith(event, nextMessage);
  });
});
