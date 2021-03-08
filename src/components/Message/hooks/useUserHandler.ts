import type { MouseEvent } from 'react';
import type { User } from 'stream-chat';

import type { MouseEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

export type UserEventHandler<
  Us extends DefaultUserType<Us> = DefaultUserType
> = (event: MouseEvent<HTMLElement>, user: User<Us>) => void;

export const useUserHandler = <
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
    onUserClickHandler?: UserEventHandler<Us>;
    onUserHoverHandler?: UserEventHandler<Us>;
  },
): {
  onUserClick: MouseEventHandler;
  onUserHover: MouseEventHandler;
} => ({
  onUserClick: (event) => {
    if (
      typeof eventHandlers?.onUserClickHandler !== 'function' ||
      !message?.user
    ) {
      return;
    }
    eventHandlers.onUserClickHandler(event, message.user);
  },
  onUserHover: (event) => {
    if (
      typeof eventHandlers?.onUserHoverHandler !== 'function' ||
      !message?.user
    ) {
      return;
    }

    eventHandlers.onUserHoverHandler(event, message.user);
  },
});
