// @ts-check
/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 *
 * @type {(func: Function, args: any) => null | string}
 */
export const validateAndGetMessage = (func, args) => {
  if (!func || typeof func !== 'function') return null;

  const returnValue = func(...args);

  if (typeof returnValue !== 'string') return null;

  return returnValue;
};

/**
 * Tell if the owner of the current message is muted
 *
 * @type {(message?: import('stream-chat').MessageResponse, mutes?: import('stream-chat').Mute[]) => boolean}
 */
export const isUserMuted = (message, mutes) => {
  if (!mutes || !message) {
    return false;
  }

  const userMuted = mutes.filter(
    /** @type {(el: import('stream-chat').Mute) => boolean} Typescript syntax */
    (el) => el.target.id === message.user?.id,
  );
  return !!userMuted.length;
};
