import React, { forwardRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import { DownloadButton } from '../Attachment';

export type BaseImageProps = React.ComponentPropsWithRef<'img'>;

export const BaseImage = forwardRef<HTMLImageElement, BaseImageProps>(function BaseImage(
  { ...props },
  ref,
) {
  const { className: propsClassName, onError: propsOnError } = props;
  const [error, setError] = useState(false);

  useEffect(
    () => () => {
      setError(false);
    },
    [props.src],
  );

  return (
    <>
      <img
        data-testid='str-chat__base-image'
        {...props}
        className={clsx(propsClassName, 'str-chat__base-image', {
          'str-chat__base-image--load-failed': error,
        })}
        onError={(e) => {
          setError(true);
          propsOnError?.(e);
        }}
        ref={ref}
      />
      {/* todo: should we keep the download button?*/}
      {error && <DownloadButton assetUrl={props.src} />}
    </>
  );
});
