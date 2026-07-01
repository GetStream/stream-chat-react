import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useMentionsHandler } from '../useMentionsHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import {
  generateMessage,
  generateUser,
  mockChannelActionContext,
} from '../../../../mock-builders';

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
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChannelActionProvider
        value={mockChannelActionContext({ onMentionsClick, onMentionsHover })}
      >
        {children}
      </ChannelActionProvider>
    );
    const { result } = renderHook(() => hook(message, hookOptions), {
      wrapper,
    });
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
      message,
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
            created_at: '2026-05-28T00:00:00.000Z',
            id: 'backend-team',
            name: 'Backend Team',
            updated_at: '2026-05-28T00:00:00.000Z',
          }),
        ],
      },
    ],
  ])('should call onMentionsClick with an empty user list for a %s', (_, mention) => {
    const message = generateMessage({
      ...mention,
      mentioned_users: undefined,
    });
    const { onMentionsClick } = renderUseMentionsHandlerHook(message);
    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(mouseEventMock, [], message);
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
      message,
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
    expect(onMentionsHoverHandler).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
      message,
    );
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
    expect(onMentionsClickHandler).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
      message,
    );
  });
});
