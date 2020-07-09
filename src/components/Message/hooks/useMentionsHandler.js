// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/** @type {(fn: Function | undefined, message: import('stream-chat').MessageResponse | undefined) => Handler} * */
function createEventHandler(fn, message) {
  return (e) => {
    if (typeof fn !== 'function' || !message?.mentioned_users) {
      return;
    }
    fn(e, message.mentioned_users);
  };
}

/**
 * @typedef {React.EventHandler<React.SyntheticEvent>} Handler
 * @typedef { import('stream-chat').MessageResponse | undefined } Message
 * @typedef { (event: React.MouseEvent, user: import('stream-chat').UserResponse[] ) => void } CustomMentionHandler
 * @type {(
 *   message: Message,
 *   customMentionHandler?: {
 *     onMentionsClick?: CustomMentionHandler,
 *     onMentionsHover?: CustomMentionHandler
 *   }
 * ) => { onMentionsClick: Handler, onMentionsHover: Handler }}
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
 * @type {(
 *   message: Message,
 *   eventHandlers?: {
 *     onMentionsClick?: Handler,
 *     onMentionsHover?: Handler,
 *   },
 * ) => { onMentionsClick: Handler, onMentionsHover: Handler }}
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
