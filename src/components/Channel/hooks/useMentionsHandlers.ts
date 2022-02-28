import React, { useCallback } from 'react';

import type { UserResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type OnMentionAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (event: React.BaseSyntheticEvent, user?: UserResponse<StreamChatGenerics>) => void;

export const useMentionsHandlers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  onMentionsHover?: OnMentionAction<StreamChatGenerics>,
  onMentionsClick?: OnMentionAction<StreamChatGenerics>,
) =>
  useCallback(
    (event: React.BaseSyntheticEvent, mentioned_users: UserResponse<StreamChatGenerics>[]) => {
      if ((!onMentionsHover && !onMentionsClick) || !(event.target instanceof HTMLElement)) {
        return;
      }

      const target = event.target;
      const textContent = target.innerHTML.replace('*', '');

      if (textContent[0] === '@') {
        const userName = textContent.replace('@', '');
        const user = mentioned_users?.find(({ id, name }) => name === userName || id === userName);

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
