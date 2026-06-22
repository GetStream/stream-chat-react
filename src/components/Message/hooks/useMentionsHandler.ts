import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type React from 'react';
import type { LocalMessage, UserResponse } from 'stream-chat';

import type { ReactEventHandler } from '../types';

export type CustomMentionHandler = (
  event: React.BaseSyntheticEvent,
  /**
   * @deprecated Use the third `message` argument to access mention metadata instead.
   * FIXME: Remove this argument in the next major release.
   */
  mentioned_users: UserResponse[],
  message: LocalMessage,
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
    const hasMentions = Boolean(
      message?.mentioned_users?.length ||
      message?.mentioned_channel ||
      message?.mentioned_here ||
      message?.mentioned_roles?.length ||
      message?.mentioned_groups?.length,
    );

    if (typeof fn !== 'function' || !message || !hasMentions) {
      return;
    }
    fn(event, message?.mentioned_users ?? [], message);
  };
}

export const useMentionsHandler = (
  message?: LocalMessage,
  customMentionHandler?: {
    onMentionsClick?: CustomMentionHandler;
    onMentionsHover?: CustomMentionHandler;
  },
) => {
  const {
    onMentionsClick: contextOnMentionsClick,
    onMentionsHover: contextOnMentionsHover,
  } = useChannelActionContext('useMentionsHandler');

  const onMentionsClick =
    customMentionHandler?.onMentionsClick || contextOnMentionsClick || (() => null);

  const onMentionsHover =
    customMentionHandler?.onMentionsHover || contextOnMentionsHover || (() => null);

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};
