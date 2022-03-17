import type { User } from 'stream-chat';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type UserEventHandler<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (event: React.BaseSyntheticEvent, user: User<StreamChatGenerics>) => void;

export const useUserHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
  eventHandlers?: {
    onUserClickHandler?: UserEventHandler<StreamChatGenerics>;
    onUserHoverHandler?: UserEventHandler<StreamChatGenerics>;
  },
): {
  onUserClick: ReactEventHandler;
  onUserHover: ReactEventHandler;
} => ({
  onUserClick: (event) => {
    if (typeof eventHandlers?.onUserClickHandler !== 'function' || !message?.user) {
      return;
    }
    eventHandlers.onUserClickHandler(event, message.user);
  },
  onUserHover: (event) => {
    if (typeof eventHandlers?.onUserHoverHandler !== 'function' || !message?.user) {
      return;
    }

    eventHandlers.onUserHoverHandler(event, message.user);
  },
});
