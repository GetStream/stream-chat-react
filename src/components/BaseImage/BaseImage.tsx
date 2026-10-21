import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useComponentContext } from '../../context/ComponentContext';
import { DownloadButton } from '../Attachment';
import { ImagePlaceholder as DefaultImagePlaceholder } from './ImagePlaceholder';
import { sanitizeUrl } from '@braintree/sanitize-url';

export type BaseImageProps = React.ComponentPropsWithRef<'img'> & {
  showDownloadButtonOnError?: boolean;
};

export const BaseImage = forwardRef<HTMLImageElement, BaseImageProps>(function BaseImage(
  { src, ...props },
  ref,
) {
  const {
    alt: propsAlt,
    className: propsClassName,
    onError: propsOnError,
    showDownloadButtonOnError = false,
    ...imgProps
  } = props;
  // Stores the failed URL rather than a boolean, so a new `src` clears the error during render
  // without a one-frame flash of the error placeholder.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { ImagePlaceholder: ImagePlaceholderComponent = DefaultImagePlaceholder } =
    useComponentContext();

  const sanitizedUrl = useMemo(() => sanitizeUrl(src), [src]);
  const error = failedSrc === sanitizedUrl;

  useEffect(
    () => () => {
      setFailedSrc(null);
    },
    [sanitizedUrl],
  );

  if (error) {
    return (
      <>
        <ImagePlaceholderComponent
          className={clsx(propsClassName, 'str-chat__base-image--load-failed')}
        />
        {showDownloadButtonOnError && <DownloadButton assetUrl={sanitizedUrl} />}
      </>
    );
  }

  return (
    <img
      data-testid='str-chat__base-image'
      {...imgProps}
      alt={propsAlt ?? ''}
      className={clsx(propsClassName, 'str-chat__base-image')}
      onError={(e) => {
        setFailedSrc(sanitizedUrl);
        propsOnError?.(e);
      }}
      ref={ref}
      src={sanitizedUrl}
    />
  );
});
