import { MouseEvent, useCallback } from 'react';

import type { UserResponse } from 'stream-chat';

import type { DefaultUserType } from '../../../../types/types';

export type OnMentionAction<Us extends DefaultUserType<Us> = DefaultUserType> = (
  event: MouseEvent<HTMLElement>,
  user?: UserResponse<Us>,
) => void;

export const useMentionsHandlers = <Us extends DefaultUserType<Us> = DefaultUserType>(
  onMentionsHover?: OnMentionAction<Us>,
  onMentionsClick?: OnMentionAction<Us>,
) =>
  useCallback(
    (event: MouseEvent<HTMLElement>, mentioned_users: UserResponse<Us>[]) => {
      if ((!onMentionsHover && !onMentionsClick) || !(event.target instanceof HTMLElement)) {
        return;
      }

      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const textContent = target.innerHTML.replace('*', '');

      if (tagName === 'strong' && textContent[0] === '@') {
        const userName = textContent.replace('@', '');
        const user = mentioned_users.find(({ id, name }) => name === userName || id === userName);

        if (
          onMentionsHover &&
          typeof onMentionsHover === 'function' &&
          event.type === 'mouseover'
        ) {
          onMentionsHover(event, user);
        }

        if (onMentionsClick && event.type === 'click' && typeof onMentionsClick === 'function') {
          onMentionsClick(event, user);
        }
      }
    },
    [onMentionsClick, onMentionsHover],
  );
