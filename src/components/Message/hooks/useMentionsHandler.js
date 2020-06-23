// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @typedef {React.EventHandler<React.SyntheticEvent>} Handler
 * @type {(message: import('stream-chat').MessageResponse | undefined) => { onMentionsClick: Handler, onMentionsHover: Handler }}
 */
export const useMentionsHandler = (message) => {
  /**
   * @type{import('types').ChannelContextValue}
   */
  const { onMentionsClick, onMentionsHover } = useContext(ChannelContext);

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick: (e) => {
      if (typeof onMentionsClick !== 'function' || !message?.mentioned_users) {
        return;
      }
      onMentionsClick(e, message.mentioned_users);
    },
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover: (e) => {
      if (typeof onMentionsHover !== 'function' || !message?.mentioned_users) {
        return;
      }

      onMentionsHover(e, message.mentioned_users);
    },
  };
};
