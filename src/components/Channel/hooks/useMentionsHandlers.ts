import type React from 'react';
import { useCallback } from 'react';
import type { LocalMessage, UserResponse } from 'stream-chat';

export type OnMentionAction = (
  event: React.BaseSyntheticEvent,
  /**
   * @deprecated Use the third `message` argument to access mention metadata instead.
   * FIXME: Remove this argument in the next major release.
   */
  user?: UserResponse,
  message?: LocalMessage,
) => void;

export const useMentionsHandlers = (
  onMentionsHover?: OnMentionAction,
  onMentionsClick?: OnMentionAction,
) =>
  useCallback(
    (
      event: React.BaseSyntheticEvent,
      mentioned_users: UserResponse[],
      message?: LocalMessage,
    ) => {
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
          if (message) {
            onMentionsHover(event, user, message);
          } else {
            onMentionsHover(event, user);
          }
        }

        if (
          onMentionsClick &&
          event.type === 'click' &&
          typeof onMentionsClick === 'function'
        ) {
          if (message) {
            onMentionsClick(event, user, message);
          } else {
            onMentionsClick(event, user);
          }
        }
      }
    },
    [onMentionsClick, onMentionsHover],
  );
