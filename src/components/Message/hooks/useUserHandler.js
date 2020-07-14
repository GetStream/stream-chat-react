// @ts-check
/**
 * @typedef {React.EventHandler<React.SyntheticEvent>} Handler
 * @typedef {(e: React.MouseEvent, user: import('stream-chat').User) => void} UserEventHandler
 * @type {(message: import('stream-chat').MessageResponse | undefined, eventHandlers: {onUserClickHandler?: UserEventHandler, onUserHoverHandler?: UserEventHandler}) => { onUserClick: Handler, onUserHover: Handler }}
 */
export const useUserHandler = (message, eventHandlers) => {
  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onUserClick: (e) => {
      if (
        typeof eventHandlers?.onUserClickHandler !== 'function' ||
        !message?.user
      ) {
        return;
      }
      eventHandlers.onUserClickHandler(e, message.user);
    },
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onUserHover: (e) => {
      if (
        typeof eventHandlers?.onUserHoverHandler !== 'function' ||
        !message?.user
      ) {
        return;
      }

      eventHandlers.onUserHoverHandler(e, message.user);
    },
  };
};
