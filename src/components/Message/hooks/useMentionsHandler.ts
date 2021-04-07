import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type { MouseEvent } from 'react';
import type { UserResponse } from 'stream-chat';

import type { MouseEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

export type CustomMentionHandler<Us extends DefaultUserType<Us> = DefaultUserType> = (
  event: MouseEvent<HTMLElement>,
  mentioned_users: UserResponse<Us>[],
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
  fn?: CustomMentionHandler<Us>,
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
): MouseEventHandler {
  return (event) => {
    if (typeof fn !== 'function' || !message?.mentioned_users?.length) {
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
    onMentionsClick: contextOnMentionsClick,
    onMentionsHover: contextOnMentionsHover,
  } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();

  const onMentionsClick =
    customMentionHandler?.onMentionsClick || contextOnMentionsClick || (() => null);

  const onMentionsHover =
    customMentionHandler?.onMentionsHover || contextOnMentionsHover || (() => null);

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};
