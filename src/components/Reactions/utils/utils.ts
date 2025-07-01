import type { ForwardedRef, MutableRefObject } from 'react';

export const isMutableRef = <T>(
  ref: ForwardedRef<T> | null,
): ref is MutableRefObject<T> => {
  if (ref) {
    return (ref as MutableRefObject<T>).current !== undefined;
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

    image.addEventListener('error', () => reject(`Couldn't load image from ${source}`), {
      once: true,
    });

    image.src = source;
  });
