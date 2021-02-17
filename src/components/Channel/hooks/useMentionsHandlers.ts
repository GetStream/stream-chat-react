import { MouseEvent, useCallback } from 'react';
import type { UserResponse } from 'stream-chat';

import type { DefaultUserType, UnknownType } from '../../../../types/types';

type OnMentionAction<Us extends UnknownType = DefaultUserType> = (
  event: MouseEvent<HTMLElement>,
  user?: UserResponse<Us>,
) => void;

const useMentionsHandlers = <Us extends UnknownType = DefaultUserType>(
  onMentionsHover: OnMentionAction<Us>,
  onMentionsClick: OnMentionAction<Us>,
) =>
  useCallback(
    (event: MouseEvent<HTMLElement>, mentioned_users: UserResponse<Us>[]) => {
      if (!onMentionsHover && !onMentionsClick) return;

      const target = event.target;
      // @ts-expect-error
      const tagName = target?.tagName?.toLowerCase() as string;
      // @ts-expect-error
      const textContent = target?.innerHTML?.replace('*', '') as string;

      if (tagName === 'strong' && textContent[0] === '@') {
        const userName = textContent.replace('@', '');
        const user = mentioned_users.find(
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

export default useMentionsHandlers;
