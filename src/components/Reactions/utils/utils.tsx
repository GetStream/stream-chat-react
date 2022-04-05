export const isMutableRef = <T,>(
  ref: React.ForwardedRef<T> | null,
): ref is React.MutableRefObject<T> => {
  if (ref) {
    return (ref as React.MutableRefObject<T>).current !== undefined;
  }
  return false;
};
