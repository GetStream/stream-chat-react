import type { MouseEvent } from 'react';
import type { MessageResponse, User } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
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
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  eventHandlers: {
    onUserClickHandler?: UserEventHandler<Us>;
    onUserHoverHandler?: UserEventHandler<Us>;
  },
) => ({
  onUserClick: (event: MouseEvent<HTMLElement>) => {
    if (
      typeof eventHandlers?.onUserClickHandler !== 'function' ||
      !message?.user
    ) {
      return;
    }
    eventHandlers.onUserClickHandler(event, message.user);
  },
  onUserHover: (event: MouseEvent<HTMLElement>) => {
    if (
      typeof eventHandlers?.onUserHoverHandler !== 'function' ||
      !message?.user
    ) {
      return;
    }

    eventHandlers.onUserHoverHandler(event, message.user);
  },
});
