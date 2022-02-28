import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type React from 'react';
import type { UserResponse } from 'stream-chat';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type CustomMentionHandler<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (event: React.BaseSyntheticEvent, mentioned_users: UserResponse<StreamChatGenerics>[]) => void;

export type MentionedUserEventHandler<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (event: React.BaseSyntheticEvent, mentionedUsers: UserResponse<StreamChatGenerics>[]) => void;

function createEventHandler<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  fn?: CustomMentionHandler<StreamChatGenerics>,
  message?: StreamMessage<StreamChatGenerics>,
): ReactEventHandler {
  return (event) => {
    if (typeof fn !== 'function' || !message?.mentioned_users?.length) {
      return;
    }
    fn(event, message.mentioned_users);
  };
}

export const useMentionsHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
  customMentionHandler?: {
    onMentionsClick?: CustomMentionHandler<StreamChatGenerics>;
    onMentionsHover?: CustomMentionHandler<StreamChatGenerics>;
  },
) => {
  const {
    onMentionsClick: contextOnMentionsClick,
    onMentionsHover: contextOnMentionsHover,
  } = useChannelActionContext<StreamChatGenerics>('useMentionsHandler');

  const onMentionsClick =
    customMentionHandler?.onMentionsClick || contextOnMentionsClick || (() => null);

  const onMentionsHover =
    customMentionHandler?.onMentionsHover || contextOnMentionsHover || (() => null);

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};
