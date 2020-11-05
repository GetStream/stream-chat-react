// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/** @type {(fn: Function | undefined, message: import('stream-chat').MessageResponse | undefined) => React.EventHandler<React.SyntheticEvent>} * */
function createEventHandler(fn, message) {
  return (e) => {
    if (typeof fn !== 'function' || !message?.mentioned_users) {
      return;
    }
    fn(e, message.mentioned_users);
  };
}

/**
 * @type {import('types').useMentionsHandler}
 */
export const useMentionsHandler = (message, customMentionHandler) => {
  /**
   * @type{import('types').ChannelContextValue}
   */
  const {
    onMentionsClick: channelOnMentionsClick,
    onMentionsHover: channelOnMentionsHover,
  } = useContext(ChannelContext);
  const onMentionsClick =
    customMentionHandler?.onMentionsClick ||
    channelOnMentionsClick ||
    (() => {});
  const onMentionsHover =
    customMentionHandler?.onMentionsHover ||
    channelOnMentionsHover ||
    (() => {});

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick: createEventHandler(onMentionsClick, message),
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};

/**
 * @type {import('types').useMentionsUIHandler}
 */
export const useMentionsUIHandler = (message, eventHandlers) => {
  /**
   * @type{import('types').ChannelContextValue}
   */
  const { onMentionsClick, onMentionsHover } = useContext(ChannelContext);

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick:
      eventHandlers?.onMentionsClick ||
      createEventHandler(onMentionsClick, message),
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover:
      eventHandlers?.onMentionsHover ||
      createEventHandler(onMentionsHover, message),
  };
};
