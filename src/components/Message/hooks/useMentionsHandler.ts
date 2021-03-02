import { useChannelContext } from '../../../context/ChannelContext';

import type { MouseEvent } from 'react';
import type { MessageResponse, UserResponse } from 'stream-chat';

import type { EventHandlerReturnType } from '../Message';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

export type CustomMentionHandler<Us extends UnknownType = DefaultUserType> = (
  event: MouseEvent<HTMLElement>,
  user: UserResponse<Us>[],
) => void;

export type MentionedUserEventHandler<
  Us extends UnknownType = DefaultUserType
> = (
  event: MouseEvent<HTMLElement>,
  mentionedUsers: UserResponse<Us>[],
) => void;

function createEventHandler<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  fn?: MentionedUserEventHandler<Us>,
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
): EventHandlerReturnType {
  return (event) => {
    if (typeof fn !== 'function' || !message?.mentioned_users) {
      return;
    }
    fn(event, message.mentioned_users);
  };
}

export const useMentionsHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
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
    customMentionHandler?.onMentionsClick ||
    channelOnMentionsClick ||
    (() => null);

  const onMentionsHover =
    customMentionHandler?.onMentionsHover ||
    channelOnMentionsHover ||
    (() => null);

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};

export const useMentionsUIHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
  eventHandlers?: {
    onMentionsClick?: EventHandlerReturnType;
    onMentionsHover?: EventHandlerReturnType;
  },
) => {
  const { onMentionsClick, onMentionsHover } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return {
    onMentionsClick:
      eventHandlers?.onMentionsClick ||
      createEventHandler(onMentionsClick, message),
    onMentionsHover:
      eventHandlers?.onMentionsHover ||
      createEventHandler(onMentionsHover, message),
  };
};
