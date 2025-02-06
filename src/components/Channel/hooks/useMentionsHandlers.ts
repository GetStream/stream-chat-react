import type React from 'react';
import { useCallback } from 'react';
import type { UserResponse } from 'stream-chat';

export type OnMentionAction = (
  event: React.BaseSyntheticEvent,
  user?: UserResponse,
) => void;

export const useMentionsHandlers = (
  onMentionsHover?: OnMentionAction,
  onMentionsClick?: OnMentionAction,
) =>
  useCallback(
    (event: React.BaseSyntheticEvent, mentioned_users: UserResponse[]) => {
      if (
        (!onMentionsHover && !onMentionsClick) ||
        !(event.target instanceof HTMLElement)
      ) {
        return;
      }

      const target = event.target;
      const textContent = target.innerHTML.replace('*', '');

      if (textContent[0] === '@') {
        const userName = textContent.replace('@', '');
        const user = mentioned_users?.find(
          ({ id, name }) => name === userName || id === userName,
        );

        if (
          onMentionsHover &&
          typeof onMentionsHover === 'function' &&
          event.type === 'mouseover'
        ) {
          onMentionsHover(event, user);
        }

        if (
          onMentionsClick &&
          event.type === 'click' &&
          typeof onMentionsClick === 'function'
        ) {
          onMentionsClick(event, user);
        }
      }
    },
    [onMentionsClick, onMentionsHover],
  );
