import { useLayoutEffect, useRef } from 'react';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Whether two values hold the same data: plain objects and arrays are compared key by key, at
 * every depth, and anything else (functions, class instances, dates) by identity.
 */
const hasSameValues = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((item, index) => hasSameValues(item, b[index]))
    );
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) && hasSameValues(a[key], b[key]),
    )
  );
};

/**
 * Returns the last committed value for as long as new values hold the same data, so an object or
 * array literal created on every render keeps one reference. Use it to feed such a value to a
 * hook dependency list, a memoized component or anything else that compares by identity.
 *
 * Plain objects and arrays are compared key by key, at every depth; functions, class instances
 * and other values by identity, so pass stable functions inside the value. The reference advances
 * only when React commits a render, so a render that React discards cannot replace it.
 *
 * @param value - Value whose reference should only change when its data does.
 * @returns `value`, or the previously committed value when it holds the same data.
 */
export const useSameValuesReference = <T>(value: T): T => {
  const committedRef = useRef(value);
  const next = hasSameValues(committedRef.current, value) ? committedRef.current : value;
  useLayoutEffect(() => {
    committedRef.current = next;
  });
  return next;
};
