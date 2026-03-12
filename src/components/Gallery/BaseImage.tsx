import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { DownloadButton } from '../Attachment';
import { sanitizeUrl } from '@braintree/sanitize-url';

export type BaseImageProps = React.ComponentPropsWithRef<'img'> & {
  showDownloadButtonOnError?: boolean;
};

export const BaseImage = forwardRef<HTMLImageElement, BaseImageProps>(function BaseImage(
  { src, ...props },
  ref,
) {
  const {
    className: propsClassName,
    onError: propsOnError,
    showDownloadButtonOnError = true,
    ...imgProps
  } = props;
  const [error, setError] = useState(false);

  const sanitizedUrl = useMemo(() => sanitizeUrl(src), [src]);
  useEffect(
    () => () => {
      setError(false);
    },
    [sanitizedUrl],
  );

  return (
    <>
      <img
        data-testid='str-chat__base-image'
        {...imgProps}
        className={clsx(propsClassName, 'str-chat__base-image', {
          'str-chat__base-image--load-failed': error,
        })}
        onError={(e) => {
          setError(true);
          propsOnError?.(e);
        }}
        ref={ref}
        src={sanitizedUrl}
      />
      {error && showDownloadButtonOnError && <DownloadButton assetUrl={sanitizedUrl} />}
    </>
  );
});
