import React, { forwardRef, useEffect, useState } from 'react';
import clsx from 'clsx';

export type ImageFallbackProps = React.ComponentProps<'img'>;

const DefaultImageFallback = ({ alt, title }: ImageFallbackProps) => (
  <div
    className='str-chat__image-fallback'
    data-testid='str-chat__image-fallback'
    title={title ?? alt}
  >
    <svg fill='none' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM11.14 8.86L8.14 12.73L6 10.14L3 14H15L11.14 8.86Z'
        fill='#080707'
      />
    </svg>
  </div>
);

export type BaseImageProps = React.ComponentProps<'img'> & {
  ImageFallback?: React.ComponentType<ImageFallbackProps>;
};

export const BaseImage = forwardRef<HTMLImageElement, BaseImageProps>(function BaseImage(
  { ImageFallback = DefaultImageFallback, ...props },
  ref,
) {
  const { className: propsClassName, onError: propsOnError } = props;
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [props.src]);

  if (props.src && !error) {
    return (
      <img
        data-testid='str-chat__base-image'
        {...props}
        className={clsx(propsClassName, 'str-chat__base-image')}
        onError={(e) => {
          setError(true);
          propsOnError?.(e);
        }}
        ref={ref}
      />
    );
  }

  return <ImageFallback {...props} />;
});
