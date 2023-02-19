export const isMutableRef = <T,>(
  ref: React.ForwardedRef<T> | null,
): ref is React.MutableRefObject<T> => {
  if (ref) {
    return (ref as React.MutableRefObject<T>).current !== undefined;
  }
  return false;
};

export const getImageDimensions = (source: string) =>
  new Promise<[number, number]>((resolve, reject) => {
    const image = new Image();

    image.addEventListener(
      'load',
      () => {
        resolve([image.width, image.height]);
      },
      { once: true },
    );

    image.addEventListener('error', reject, { once: true });

    image.src = source;
  });
