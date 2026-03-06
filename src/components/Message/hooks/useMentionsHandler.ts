import type React from 'react';
import type { LocalMessage, UserResponse } from 'stream-chat';

import type { ReactEventHandler } from '../types';

export type CustomMentionHandler = (
  event: React.BaseSyntheticEvent,
  mentioned_users: UserResponse[],
) => void;

export type MentionedUserEventHandler = (
  event: React.BaseSyntheticEvent,
  mentionedUsers: UserResponse[],
) => void;

function createEventHandler(
  fn?: CustomMentionHandler,
  message?: LocalMessage,
): ReactEventHandler {
  return (event) => {
    if (typeof fn !== 'function' || !message?.mentioned_users?.length) {
      return;
    }
    fn(event, message.mentioned_users);
  };
}

export const useMentionsHandler = (
  message?: LocalMessage,
  customMentionHandler?: {
    onMentionsClick?: CustomMentionHandler;
    onMentionsHover?: CustomMentionHandler;
  },
) => {
  const onMentionsClick = customMentionHandler?.onMentionsClick || (() => null);
  const onMentionsHover = customMentionHandler?.onMentionsHover || (() => null);

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};
