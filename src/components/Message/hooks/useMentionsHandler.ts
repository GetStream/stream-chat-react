import { StreamMessage, useChannelContext } from '../../../context/ChannelContext';

import type React from 'react';
import type { UserResponse } from 'stream-chat';

import type { ReactEventHandler } from '../types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type CustomMentionHandler<Us extends DefaultUserType<Us> = DefaultUserType> = (
  event: React.BaseSyntheticEvent,
  user: UserResponse<Us>[],
) => void;

export type MentionedUserEventHandler<Us extends DefaultUserType<Us> = DefaultUserType> = (
  event: React.BaseSyntheticEvent,
  mentionedUsers: UserResponse<Us>[],
) => void;

function createEventHandler<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  fn?: MentionedUserEventHandler<Us>,
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
): ReactEventHandler {
  return (event) => {
    if (typeof fn !== 'function' || !message?.mentioned_users) {
      return;
    }
    fn(event, message.mentioned_users);
  };
}

export const useMentionsHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  customMentionHandler?: {
    onMentionsClick?: CustomMentionHandler<Us>;
    onMentionsHover?: CustomMentionHandler<Us>;
  },
) => {
  const {
    onMentionsClick: channelOnMentionsClick,
    onMentionsHover: channelOnMentionsHover,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const onMentionsClick =
    customMentionHandler?.onMentionsClick || channelOnMentionsClick || (() => null);

  const onMentionsHover =
    customMentionHandler?.onMentionsHover || channelOnMentionsHover || (() => null);

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};

export const useMentionsUIHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  eventHandlers?: {
    onMentionsClick?: ReactEventHandler;
    onMentionsHover?: ReactEventHandler;
  },
) => {
  const { onMentionsClick, onMentionsHover } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  return {
    onMentionsClick: eventHandlers?.onMentionsClick || createEventHandler(onMentionsClick, message),
    onMentionsHover: eventHandlers?.onMentionsHover || createEventHandler(onMentionsHover, message),
  };
};
