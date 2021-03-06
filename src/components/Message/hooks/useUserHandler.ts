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
  UnknownType,
} from '../../../../types/types';

export type UserEventHandler<Us extends UnknownType = DefaultUserType> = (
  event: MouseEvent<HTMLElement>,
  user: User<Us>,
) => void;

export const useUserHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
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
