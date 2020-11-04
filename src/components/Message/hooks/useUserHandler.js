// @ts-check
/**
 * @type {import('types').useUserHandler}
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
