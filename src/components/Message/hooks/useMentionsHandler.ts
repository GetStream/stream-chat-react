import { MouseEvent, useContext } from 'react';
import { ChannelContext } from '../../../context';
import type { MessageResponse } from 'stream-chat';
import type { CustomMentionHandler } from 'types';

export type MentionedUserEventHandler<Me extends MessageResponse> = (
  e: MouseEvent<HTMLElement>,
  mentionedUsers: Exclude<Me['mentioned_users'], undefined>,
) => void;
function createEventHandler<Me extends MessageResponse>(
  fn?: MentionedUserEventHandler<Me>,
  message?: Me,
): React.EventHandler<MouseEvent<HTMLElement>> {
  return (e) => {
    if (typeof fn !== 'function' || !message?.mentioned_users) {
      return;
    }
    fn(e, message.mentioned_users as Exclude<Me['mentioned_users'], undefined>);
  };
}

export const useMentionsHandler = <Me extends MessageResponse>(
  message?: Me,
  customMentionHandler?: {
    onMentionsClick?: CustomMentionHandler;
    onMentionsHover?: CustomMentionHandler;
  },
) => {
  const {
    onMentionsClick: channelOnMentionsClick,
    onMentionsHover: channelOnMentionsHover,
  } = useContext(ChannelContext);

  const onMentionsClick =
    customMentionHandler?.onMentionsClick ||
    channelOnMentionsClick ||
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (() => {});

  const onMentionsHover =
    customMentionHandler?.onMentionsHover ||
    channelOnMentionsHover ||
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (() => {});

  return {
    onMentionsClick: createEventHandler(onMentionsClick, message),
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};

export const useMentionsUIHandler = <Me extends MessageResponse>(
  message?: Me,
  eventHandlers?: {
    onMentionsClick?: React.EventHandler<React.SyntheticEvent>;
    onMentionsHover?: React.EventHandler<React.SyntheticEvent>;
  },
) => {
  const { onMentionsClick, onMentionsHover } = useContext(ChannelContext);

  return {
    onMentionsClick:
      eventHandlers?.onMentionsClick ||
      createEventHandler(onMentionsClick, message),
    onMentionsHover:
      eventHandlers?.onMentionsHover ||
      createEventHandler(onMentionsHover, message),
  };
};
