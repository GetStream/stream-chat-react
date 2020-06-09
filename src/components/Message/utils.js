// @ts-check
/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 *
 * @param func {Function}
 * @param args {any[]} Arguments to be provided to func while executing.
 * @type {(func: Function, args: any) => null | string}
 */
export const validateAndGetMessage = (func, args) => {
  if (!func || typeof func !== 'function') return null;

  const returnValue = func(...args);

  if (typeof returnValue !== 'string') return null;

  return returnValue;
};
